class FileLoadingTask extends WindmillObject {
	constructor(pattern, container, workenvs, priority = 0, options = {}) {
		super();
		this.pattern = pattern;
		this.container = container;
		this.workenvs = workenvs;
		this.priority = priority;
		this.options = options;
		this.promises = [];
	}

	makePromise() {
		let promise = new Promise(function(success, rejected) {
			this.promises.push({success, rejected});
		});
		return promise;
	}

	checkWorkpath(path, workenv = this.workenvs) {
		//Standardmaessig global suchen
		if(!workenv)
			return true;
		//Ansonsten sind Strings, WorkEnvironments, regulaere Ausdruecke und Arrays mit den genannten Sachen erlaubt
		if(typeof workenv == "string")
			return (path == workenv);
		if(workenv instanceof WorkEnvironment)
			return (path == workenv.path);
		if(workenv instanceof RegExp)
			return workenv.test(path);
		if(workenv instanceof Array) {
			for(var i = 0; i < workenv.length; i++)
				if(this.checkWorkpath(path, workenv[i]))
					return true;
		}
		return false;
	}

	checkContainer(name) {
		
	}
}

class FileLoadingInfo extends WindmillObject {
	constructor(path) {
		super();
		path = formatPath(path);
		this.path = path;
		this.name = path.split("/").pop();
		if(this.name.split(".") > 1)
			this.fileextension = this.name.split(".").pop();
	}
}

class FileSearchProcess extends WindmillObject {
	constructor() {
		super();
		this.tasklist = [];
		this.queue = [];
		this.priorityMode = -1;
		this.filehistory = [];
		this.currentState = {
			path: "",
			directory: "",
			workpath: "",
			prev_workpaths = [],
			taskamount: this.tasklist.length
		}
	}

	runSearchProcess() {
		if(!this.tasklist)
			return;

		let sp = this;
		let task = Task.spawn(function*() {
			let {path, directory, workpath, taskamount, prev_workpaths} = sp.currentState;
			//Pruefen ob neue Auftraege hinzugekommen sind
			if(taskamount >= sp.tasklist.length) {
				//In dem Falle ggf. jene neue Auftraege nochmal durchgehen
			}
			
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
				let iterator = new OS.File.DirectoryIterator(workpath);
				while(true) {
					let entry;
					try { entry = yield iterator.next(); } catch(e) {
						if(e == StopIteration)
							break;
						throw e;
					}

					if(entry.isDir || OCGRP_FILEEXTENSIONS.indexOf(entry.name.split(".").pop()) != -1) {
						//Im Verlauf aufzeichnen
						sp.filehistory.push(entry.path);

						//
						let cnttasks;
						if(cnttasks = sp.taskMatchingContainer(entry.name, current_tasks)) {
							
						}
					}
				}
			}
			
			while(yield* processWorkpaths()) {}
		});
	}
	
	taskMatchingWorkpath(path) {
		let tasks = [];
		for(var i = 0; i < this.tasklist.length; i++)
			if(this.tasklist[i].checkWorkpath(path))
				tasks.push(this.tasklist[i]);
		return tasks;
	}

	taskMatchingContainer(name, tasklist = this.tasklist) {
		let tasks = [];
		for(var i = 0; i < tasklist.length; i++)
			if(tasklist[i].checkContainer(name))
				tasks.push(tasklist[i]);
		return tasks;
	}
}

function createFileTask(...pars) {
	let task = new FileLoadingTask(...pars);

	return task;
}


function startSearchProcess() {
	
}