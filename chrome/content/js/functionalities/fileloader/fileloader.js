const FILEPRIORITY_High = 3;
const FILEPRIORITY_Medium = 2;
const FILEPRIORITY_Low = 1;

class FileLoadingTask extends WindmillObject {
	constructor(pattern, container, workenvs, priority = FILEPRIORITY_High, options = {}) {
		super();
		if(!pattern)
			throw "No searching pattern specified";
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
		
		return this.defaultChecks(path, workenv, this.checkWorkpath);
	}

	checkContainer(name) {
		if(!this.container)
			return true;
		return this.defaultChecks(name, this.container, this.checkContainer);
	}
	
	checkFile(filename) {
		return this.defaultChecks(filename, this.pattern, this.checkFile);
	}

	updateFulfillmentStatus(info, data = this.workenvs, container = false, __rec) {
		if(typeof data == "string") {
			if(container) {
				if(!__rec && info.directory == data)
					this.fulfillment_status = 1;
				return true;
			}
			else if(info.workpath == data) {
				if(this.updateFulfillmentStatus(info, this.container, true, __rec))
					this.fulfillment_status = 1;
			}
		}
		else if(data instanceof Array) {
			for(var i = 0; i < data.length; i++) {
				if(this.updateFulfillmentStatus(info, data[i], true, true))
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

			//Workpaths durchsuchen
			function* processWorkpaths(wp, current_tasks) {
				if(!wp) {
					if(!workpath) {
						let workenvs = getWorkEnvironments();
						for(var i = 0; i < workenvs.length; i++) {
							if(prev_workpaths.indexOf(workenvs[i].path) == -1) {
								if(current_tasks = sp.taskMatchingWorkpath(workenvs[i].path)) {
									workpath = workenvs[i].path;
									sp.filehistory[workpath] = [];
									break;
								}
								else {
									sp.currentState.prev_workpaths.push(workenvs[i].path);
									current_tasks = undefined;
								}
							}
						}
						//Keine uebrigen Workpaths? Suchprozess abschliessen.
						if(!workpath)
							return;
					}

					if(!current_tasks)
						return;
				}
				else
					workpath = wp;
				
				function* processFileEntry(path, subpath, filehistoryparent, cnttasks) {
					let matched_tasks, leafName = subpath.split("/").pop();
					//Unterverzeichnisse durchsuchen
					let stat = yield OS.File.stat(subpath);
					if(stat.isDir) {
						filehistoryparent[subpath] = [];
						yield* processDirectory(subpath, filehistoryparent);
					}
					//Auftraege durchsuchen
					else if((matched_tasks = sp.taskMatchingFiles(leafName, cnttasks)).length) {
						filehistoryparent[subpath] = [];
						//Falls kein Auftrag mit HighPriority vorhanden ist, in die Warteschlange verschieben
						if(!sp.hasHighPriorityTasks(matched_tasks))
							sp.filequeue.push(subpath);
						//Ansonsten sofort bearbeiten
						else {
							//Bei bekannten Textdatei-Endungen die Ausgabe in ein brauchbares Format umwandeln
							let ext = leafName.split(".").pop(), options;
							if(ext != leafName && ["txt", "c", "cfg", "ini"].indexOf(ext) != -1)
								options = { encoding: "utf-8" };

							//Text einlesen
							let content = yield OS.File.read(subpath, options);

							//Infoobjekt speichern und an Tasks weiterleiten
							let fileinfo = new FileLoadingInfo(subpath, content, path, workpath);
							FileStoringObject[path][subpath] = fileinfo;
							sp.storeInTask(matched_tasks, fileinfo);
						}
					}
				}
				
				//Durchsuchen von Unterverzeichnissen
				function* processDirectory(path, filehistoryparent, cnttasks) {
					// An dieser Stelle werden sehr oft Verzeichnisse durchsucht und DirectoryIterator ist etwas langsam.
					// Um lange Ladezeiten zu ueberbruecken (und damit ist eine Verachtfachung und groesser gemeint) wird auf ein
					// nsIFile-Hybrid mit directoryEntries zurueckgegriffen. Dies trifft nur auf die High-Priority-Suche zu.
					let filestack = _sc.file(path).directoryEntries;
					if(!FileStoringObject[path])
						FileStoringObject[path] = [];

					while(filestack.hasMoreElements()) {
						let fileobj = filestack.getNext().QueryInterface(Ci.nsIFile);
						let leafName = fileobj.leafName, subpath = fileobj.path;
						subpath = formatPath(subpath);
						if(sp.filehistory.indexOf(subpath) == -1) {
							sp.filehistory.push(subpath);
							filehistoryparent.push(subpath);
						}
						if(leafName == ".git")
							continue;

						yield* processFileEntry(path, subpath, filehistoryparent, cnttasks);
					}
				}

				//Pruefen ob neue Auftraege hinzugekommen sind
				if(wp) {
					function* processFileHistory(path, filehistory, parentpath, cnttasks) {
						let filehistoryparent = filehistory[parentpath];
						if(!filehistoryparent || !filehistoryparent.length) {
							if(!FileStoringObject[parentpath])
								FileStoringObject[parentpath] = [];
							yield* processFileEntry(parentpath, path, filehistory);
						}
						else {
							//In dem Falle ggf. jene neue Auftraege nochmal durchgehen
							for(var i = 0; i < filehistoryparent.length; i++) {
								if(filehistoryparent[filehistoryparent[i]])
									yield* processFileHistory(filehistoryparent[i], filehistoryparent, path, cnttasks);
								else
									yield* processDirectory(filehistoryparent[i], filehistoryparent[filehistoryparent[i]], cnttasks);
							}
						}
					}
					for(var i = 0; i < sp.filehistory[workpath].length; i++) {
						let filepath = sp.filehistory[workpath][i], cnttasks;
						if((cnttasks = sp.taskMatchingContainer(filepath.split("/").pop(), current_tasks)).length)
							yield* processFileHistory(sp.filehistory[workpath][i], sp.filehistory[workpath], filepath, cnttasks);
					}

					sp.currentState.taskamount = sp.tasklist.length;
				}
				else {
					workpath = formatPath(workpath);
					let iterator = new OS.File.DirectoryIterator(workpath);
					while(true) {
						let entry;
						try { entry = yield iterator.next(); } catch(e) {
							if(e == StopIteration)
								break;
							throw e;
						}
						if(sp.filehistory.indexOf(entry.path) != -1 || (directory && entry.path != directory))
							continue;
						if(entry.isDir || OCGRP_FILEEXTENSIONS.indexOf(entry.name.split(".").pop()) != -1) {
							//Im Verlauf aufzeichnen
							if(sp.filehistory.indexOf(entry.path) == -1) {
								sp.filehistory.push(entry.path);
								sp.filehistory[workpath].push(entry.path);
								sp.filehistory[workpath][entry.path] = [];
							}

							//Einzelne Verzeichnisse durchsuchen
							let cnttasks;
							if((cnttasks = sp.taskMatchingContainer(entry.name, current_tasks)).length) {
								yield* processDirectory(entry.path, sp.filehistory[workpath][entry.path], cnttasks);
								//Auftraege abschliessen
								if(sp.fulfillTasks(cnttasks) == 2)
									return;
							}
						}
						else {
							//TODO: Dateien im Hauptverzeichnis einlesen...
						}
					}
					iterator.close();
				}

				if(sp.fulfillTasks(current_tasks) == 2)
					return;

				if(!wp)
					prev_workpaths.push(workpath);
				workpath = undefined;
				return true;
			}
			
			while(yield* processWorkpaths()) {
				//Pruefen ob neue Auftraege hinzugekommen sind
				if(sp.tasks_added && sp.hasHighPriorityTasks(sp.tasklist.slice(taskamount))) {
					//In dem Falle ggf. jene neue Auftraege nochmal durchgehen
					for(var i = 0; i < prev_workpaths.length; i++)
						if(sp.taskMatchingWorkpath(prev_workpaths[i], sp.tasklist.slice(taskamount)).length)
							yield* processWorkpaths(prev_workpaths[i], sp.tasklist.slice(taskamount));

					sp.currentState.taskamount = taskamount = sp.tasklist.length;
					sp.tasks_added = false;
				}
			}
			sp.fulfillTasks(sp.tasklist, true);
		}).then(function() {
			sp.ended = true;
		}, function(reason) {
			log("An error occured during a file searching process:");
			log("*************************************************");
			log(reason);
			log(reason.stack);
		});
	}

	fulfillTasks(tasks, fulfill_all) {
		let deletedtasks = 0;
		for(var i = 0; i < this.tasklist.length; i++)
			if(tasks.indexOf(this.tasklist[i]) != -1 && (this.tasklist[i].fulfillment_status || fulfill_all)) {
				this.tasklist[i].fulfill();
				log("fulfilled: " + this.tasklist[i].fulfillment_status + " | " + fulfill_all);
				delete this.tasklist[i];
				deletedtasks++;
			}
		this.currentState.taskamount = this.tasklist.length
		//Falls keine Auftraege mehr uebrig sind..
		if(deletedtasks == tasks.length)
			return 2;
		return true;
	}

	storeInTask(tasks, info) {
		for(var i = 0; i < tasks.length; i++)
			if(tasks[i])
				tasks[i].store(info);
	}
	
	hasHighPriorityTasks(tasks) {
		for(var i = 0; i < tasks.length; i++)
			if(tasks[i] && tasks[i].priority == FILEPRIORITY_High)
				return true;
		return false;
	}
	
	taskMatchingWorkpath(path, tasklist = this.tasklist) {
		let tasks = [];
		for(var i = 0; i < tasklist.length; i++)
			if(tasklist[i] && tasklist[i].checkWorkpath(path))
				tasks.push(tasklist[i]);
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
		else
			this.tasks_added = true;
	}
}

function createFileTask(...pars) {
	let task = new FileLoadingTask(...pars);

	return task;
}

let searchprocess;

function startSearchProcess(task) {
	if(!searchprocess || searchprocess.ended)
		searchprocess = new FileSearchProcess(task);
	else
		searchprocess.addTask(task);
	return searchprocess;
}