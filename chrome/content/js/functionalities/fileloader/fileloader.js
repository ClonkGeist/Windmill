const FILEPRIORITY_High = 3;
const FILEPRIORITY_Medium = 2;
const FILEPRIORITY_Low = 1;

class FileLoadingTask extends WindmillObject {
	constructor(pattern, container, workenvs, priority = FILEPRIORITY_High, options = {}) {
		super();
		this.pattern = pattern;
		this.container = container;
		this.workenvs = workenvs;
		this.priority = priority;
		this.options = options;
		this.promises = [];
		this.matches = [];
	}

	makePromise() {
		let promise = new Promise((success, rejected) => {
			if(this.fulfilled)
				success(this);
			else
				this.promises.push({success, rejected});
		});
		return promise;
	}

	defaultChecks(str1, str2, fn) {
		if(typeof str2 == "string")
			return (str1 == str2);
		if(str2 instanceof RegExp)
			return str2.test(str1);
		if(str2 instanceof Array) {
			for(var i = 0; i < str2.length; i++)
				if(this.fn(str1, str2[i]))
					return true;
		}
	}

	checkWorkpath(path, workenv = this.workenvs) {
		//Standardmaessig global suchen
		if(!workenv)
			return true;
		//Ansonsten sind Strings, WorkEnvironments, regulaere Ausdruecke und Arrays mit den genannten Sachen erlaubt
		if(workenv instanceof WorkEnvironment)
			return (path == workenv.path);
		
		return this.defaultChecks(path, workenv, checkWorkpath);
	}

	checkContainer(name) {
		return this.defaultChecks(name, this.container);
	}
	
	checkFile(filename) {
		return this.defaultChecks(filename, this.pattern);
	}

	updateFulfillmentStatus(info, data = this.workenvs, container = false, __rec) {
		if(typeof data == "string") {
			if(container) {
				if(!__rec && info.directory == data)
					this.fulfillment_status = 1;
				return true;
			}
			else if(info.workpath == data) {
				if(updateFulfillmentStatus(info, this.container, true, __rec))
					this.fulfillment_status = 1;
			}
		}
		else if(data instanceof Array) {
			for(var i = 0; i < data.length; i++) {
				if(updateFulfillmentStatus(info, data[i], true, true))
					data.splice(i, 1);
			}
			if(!data.length) {
				if(!__rec)
					this.fulfillment_status = 1;
				return true;
			}
		}
	}
	
	store(info) {
		this.matches.push(info);
		this.updateFulfillmentStatus(info);
	}
	
	fulfill() {
		this.fulfilled = true;
		for(var i = 0; i < this.promises.length; i++)
			this.promises[i].success(this);
	}
}

class FileLoadingInfo extends WindmillObject {
	constructor(path, content, directory, workpath) {
		super();
		path = formatPath(path);
		this.path = path;
		this.name = path.split("/").pop();
		if(this.name.split(".") > 1)
			this.fileextension = this.name.split(".").pop();
		this.isqueued = false;
		this.content = content;
		this.directory = directory;
		this.workpath = workpath;
	}
}

let FileStoringObject = {};

class FileSearchProcess extends WindmillObject {
	constructor(task) {
		super();
		this.tasklist = [task];
		this.queue = [];
		this.priorityMode = -1;
		this.filehistory = [];
		this.filequeue = [];
		this.currentState = {
			path: "",
			directory: "",
			workpath: "",
			prev_workpaths: [],
			taskamount: this.tasklist.length
		}
		if(task)
			this.runSearchProcess();
	}

	runSearchProcess() {
		if(!this.tasklist)
			return;

		let sp = this;
		this.running = true;
		let task = Task.spawn(function*() {
			let {path, directory, workpath, taskamount, prev_workpaths} = sp.currentState;
			//Pruefen ob neue Auftraege hinzugekommen sind
			if(taskamount >= sp.tasklist.length) {
				//In dem Falle ggf. jene neue Auftraege nochmal durchgehen
			}
			
			//Workpaths durchsuchen
			function* processWorkpaths() {
				let current_tasks;
				if(!workpath) {
					let workenvs = getWorkEnvironments();
					for(var i = 0; i < workenvs.length; i++)
						if(prev_workpaths.indexOf(workenvs[i].path) == -1) {
							if(current_tasks = sp.taskMatchingWorkpath(workenvs[i].path)) {
								workpath = workenvs[i].path;
								break;
							}
							else {
								sp.currentState.prev_workpaths.push(workenvs[i].path);
								current_tasks = undefined;
							}
						}
					//Keine uebrigen Workpaths? Suchprozess abschliessen.
					if(!workpath)
						return;
				}

				if(!current_tasks)
					return;
				workpath = formatPath(workpath);
				let iterator = new OS.File.DirectoryIterator(workpath);
				while(true) {
					let entry;
					try { entry = yield iterator.next(); } catch(e) {
						if(e == StopIteration)
							break;
						throw e;
					}
					if(sp.filehistory.indexOf(entry.path) != -1 && entry.path != directory)
						continue;

					if(entry.isDir || OCGRP_FILEEXTENSIONS.indexOf(entry.name.split(".").pop()) != -1) {
						//Im Verlauf aufzeichnen
						sp.filehistory.push(entry.path);

						//Einzelne Verzeichnisse durchsuchen
						let cnttasks;
						if((cnttasks = sp.taskMatchingContainer(entry.name, current_tasks)).length) {
							function* processDirectory(path) {
								// An dieser Stelle werden sehr oft Verzeichnisse durchsucht und DirectoryIterator ist etwas langsam.
								// Um lange Ladezeiten zu ueberbruecken (und damit ist eine Verachtfachung und groesser gemeint) wird auf ein
								// nsIFile-Hybrid mit directoryEntries zurueckgegriffen. Dies trifft nur auf die High-Priority-Suche zu.
								let filestack = _sc.file(path).directoryEntries;
								if(!FileStoringObject[path])
									FileStoringObject[path] = [];

								while(filestack.hasMoreElements()) {
									let {leafName, subpath} = entries.getNext().QueryInterface(Ci.nsIFile);
									subpath = formatPath(subpath);
									sp.filehistory.push(subpath);
									
									//Auftraege durchsuchen
									let matched_tasks;
									if((matched_tasks = sp.taskMatchingFiles(leafName, cnttasks)).length) {
										//Falls kein Auftrag mit HighPriority vorhanden ist, in die Warteschlange verschieben
										if(!sp.hasHighPriorityTasks(matched_tasks))
											sp.filequeue.push(subpath);
										//Ansonsten sofort bearbeiten
										else {
											//Unterverzeichnisse durchsuchen
											if((yield OS.File.stat(subpath)).isDir) {
												yield* processDirectory(subpath);
											}
											else {
												//Bei bekannten Textdatei-Endungen die Ausgabe in ein brauchbares Format umwandeln
												let ext = leafName.split(".").pop(), encoding;
												if(ext != leafName && ["txt", "c", "cfg", "ini"].indexOf(leafName) != -1)
													encoding = "utf-8";
												let content = yield OS.File.read(subpath, {encoding});
												let fileinfo = new FileLoadingInfo(formatPath(subpath), content, path, workpath);
												FileStoringObject[path].push(fileinfo);
												sp.storeInTask(matched_tasks, fileinfo);
											}
										}
									}
								}
							}
							yield* processDirectory(entry.path);
							//Auftraege abschliessen
							if(this.fulfillTasks(cnttasks) == 2)
								return;
						}
					}

					if(this.fulfillTasks(current_tasks) == 2)
						return;
					return true;
				}
			}
			
			while(yield* processWorkpaths()) {}
		});
	}

	fulfillTasks(tasks) {
		let deletedtasks = 0;
		for(var i = 0; i < this.tasklist.length; i++)
			if(tasks.indexOf(this.tasklist[i]) != -1 && this.tasklist[i].fulfillment_status) {
				this.tasklist[i].fulfill();
				delete this.tasklist[i];
				deletedtasks++;
			}
		//Falls keine Auftraege mehr uebrig sind..
		if(deletedtasks == tasks.length)
			return 2;
		return true;
	}

	storeInTask(tasks, info) {
		tasks.store(info);
	}
	
	hasHighPriorityTasks(tasks) {
		for(var i = 0; i < tasks.length; i++)
			if(tasks[i] && tasks[i].priority == FILEPRIORITY_High)
				return true;
		return false;
	}
	
	taskMatchingWorkpath(path) {
		let tasks = [];
		for(var i = 0; i < this.tasklist.length; i++)
			if(this.tasklist[i] && this.tasklist[i].checkWorkpath(path))
				tasks.push(this.tasklist[i]);
		return tasks;
	}

	taskMatchingContainer(name, tasklist = this.tasklist) {
		let tasks = [];
		for(var i = 0; i < tasklist.length; i++)
			if(tasklist[i] && tasklist[i].checkContainer(name))
				tasks.push(tasklist[i]);
		return tasks;
	}

	taskMatchingFiles(name, tasklist = this.tasklist) {
		let tasks = [];
		for(var i = 0; i < tasklist.length; i++)
			if(tasklist[i] && tasklist[i].checkFile(name))
				tasks.push(tasklist[i]);
		return tasks;
	}
	
	addTask(task) {
		this.tasklist.push(task);
		if(!this.running)
			this.runSearchProcess();
	}
}

function createFileTask(...pars) {
	let task = new FileLoadingTask(...pars);

	return task;
}

let searchprocess;

function startSearchProcess(task) {
	if(!searchprocess)
		searchprocess = new FileSearchProcess(task);
	else
		searchprocess.addTask(task);
	return sp;
}