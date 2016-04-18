var WORKENV_TYPE_ClonkPath = 1, WORKENV_TYPE_Workspace = 2;
var WORKENV_Repository_Git = 1;

class WorkEnvironment {
	constructor(path = _sc.clonkpath(), Type = WORKENV_TYPE_ClonkPath, id = -1, options = {}) {
		this._path = this.truepath = formatPath(path);
		this.id = id;
		this.header = { Workspace: {
			Type,
			Unloaded: false
		}};
		this.setOptions(options);
		this.workEnvChildren = [];
	}
	
	setOptions(options) {
		var {unloaded} = options;
		this.options = options;
		if(this.options.secured) {
			this.options.rejectDeletion = true;
			this.options.rejectRename = true;
			this.options.rejectMove = true;
		}
		if(unloaded)
			this.header.Workspace.Unloaded = unloaded;
	}
	isValid(path = this.path, options = {}) {
		path = formatPath(path);
		if(path.search(_sc.clonkpath()) != -1)
			return false;

		var env = getWorkEnvironments();
		for(var i = 0; i < env.length; i++) {
			if(env[i] == this)
				continue;

			if(env[i].path && (env[i].path.search(path) != -1 || path.search(env[i].path) != -1))
				if(env[i] != options.parent)
					return false;
		}

		return true;
	}

	setupWorkEnvironment(filelist, options = {}) {
		if(!this.isValid(undefined, options))
			return;

		if(options.parent) {
			this.parent = options.parent;
			this.isChildWorkEnv = true;
			this.parent.addChildWorkEnv(this);
		}
		if(this.type == WORKENV_TYPE_Workspace) {
			let _this = this;
			return Task.spawn(function*() {
				yield OS.File.makeDir(_this.path);
				if(options.repository) {
					_this.header.Workspace.Repository = options.repository;
					_this.header.Repository = {CloneURL: options.cloneurl};
					_this.userinfo = options.userinfo;
					var git = getAppByID("git");
					lockModule("$MDMSGRepositoryCloning$", true);
					git.create(["clone", _this.cloneurl, _this.path], 0x1, (exitCode) => { 
						if(!exitCode) {
							if(options.success)
								options.success(_this);

							unlockModule();
							git.create(["config", "-f", _this.path+"/.git/config", "user.name", options.userconfig.username], 0x2);
							git.create(["config", "-f", _this.path+"/.git/config", "user.email", options.userconfig.email], 0x2);

							_this.saveHeader();
						}
						else //TODO: ExitValue-Verarbeitung
							options.rejected();
					}, function(data) {
						logToGitConsole(data);
					});
					return;
				}
				else {
					let source = options.sourcedir;
					if(!source)
						source = _sc.clonkpath();
					_this.header.Workspace.SourceDir = source;

					for(let i = 0; i < filelist.length; i++) {
						let src = source+"/"+filelist[i], dest = formatPath(_this.path+"/"+filelist[i]);						
						let stat = yield OS.File.stat(src);
						let {file} = yield OSFileRecursive(src, dest, function(name, entrypath) {
							if(getModuleByName("cide-explorer").contentWindow)
								getModuleByName("cide-explorer").contentWindow
								.updateCreateWorkEnvInfo("Creating: <"+_this._path.split("/").pop()+">", "Copying " + filelist[i]);
						});
						if(!file.isDirectory() && OCGRP_FILEEXTENSIONS.indexOf(filelist[i].split(".").pop() != -1)) {
							let c4group = _sc.file(getC4GroupPath());
							let process = new _ws.pr(c4group);
							yield process.createPromise(["-x", src, dest]);
						}
					}
					
					if(options.success)
						options.success(_this);

					if(getModuleByName("cide-explorer").contentWindow)
						getModuleByName("cide-explorer").contentWindow.updateCreateWorkEnvInfo();
					_this.saveHeader();
					return true;
				}
			});
		}

		execHook("onWorkenvSetup", this);
	}

	loadHeader() {
		try { var f = new _sc.file(this.truepath + "/.windmillheader"); }
		catch(err) {
			log(err);
			log(err.stack);
			return;
		}
		if(!f.exists())
			return;

		var text = parseINIArray(readFile(f));
		for(var sect in text) {
			for(var key in text[sect]) {
				if(!this.header[sect])
					this.header[sect] = {};

				this.header[sect][key] = text[sect][key];
			}
		}

		if(text["Workspace"]) {
			this.unloaded = parseINIValue(text["Workspace"]["Unloaded"], "boolean", this.unloaded);
			if(this.unloaded)
				return;

			this.type = parseINIValue(text["Workspace"]["WorkspaceType"], "int", this.type);
			this.alwaysexplode = parseINIValue(text["Workspace"]["AlwaysExplode"], "boolean", this.alwaysexplode);
			this.linkedTo = parseINIValue(text["Workspace"]["LinkedTo"], "string", "");
			this.index = parseINIValue(text["Workspace"]["Index"], "int", -1);
			if(this.type != WORKENV_TYPE_ClonkPath)
				this.sourcedir = parseINIValue(text["Workspace"]["SourceDir"], "string", _sc.clonkpath());
			else
				this.sourcedir = this.path;
		}

		if(this.repository) {
			let git = getAppByID("git");
			git.create(["config", "-f", this.path+"/.git/config", "--get", "remote.origin.url"], 0x2, null, (data) => {
				let matches = data.match(/https:\/\/(.+?):(.+?)@/);
				if(!matches)
					return;

				let username = matches[1], password = matches[2];
				this.userinfo = { username, password };
			});
			
		}
	}

	saveHeader() {
		var f = new _sc.file(this.truepath + "/.windmillheader");
		if(!f.exists() || f.isDirectory())
			f.create(Ci.nsIFile.NORMAL_FILE_TYPE, 0o777);

		var text = '';
		for(var sect in this.header) {
			if(sect == "0")
				continue;

			if(text.length)
				text += "\r\n";

			text += '['+sect+']\r\n';
			for(var key in this.header[sect])
				if(key != "0")
					text += key+'='+this.header[sect][key]+'\r\n';
		}

		writeFile(f, text);
	}

	unload() {
		if(this.type == WORKENV_TYPE_ClonkPath) {
			var clonkdirs = JSON.parse(getConfigData("Global", "ClonkDirectories")), temp = [];
			for(var i = 0; i < clonkdirs.length; i++) {
				if(formatPath(clonkdirs[i].path) != this.path)
					temp.push(clonkdirs[i]);
				else if(i < clonkpath_id)
					clonkpath_id--;
			}

			setConfigData("Global", "ClonkDirectories", temp, true);
		}
		else {
			this.unloaded = true;
			this.saveHeader();
		}

		delete WORKENV_List[this.id];

		execHook("onWorkenvUnloaded", this);
	}

	addChildWorkEnv(workenv) {
		this.workEnvChildren.push(workenv);
	}

	getWorkEnvChildren() {
		let children = [];
		for(var i = 0; i < this.workEnvChildren.length; i++)
			if(this.workEnvChildren[i])
				children.push(this.workEnvChildren[i]);
		return children;
	}

	set path(path) {
		if(this.type == WORKENV_TYPE_ClonkPath) { 
			var dirs = JSON.parse(getConfigData("Global", "ClonkDirectories")) || [];
			for(var i = 0; i < dirs.length; i++)
				if(formatPath(dirs[i]) == this._path)
					dirs[i] = path;

			setConfigData("Global", "ClonkDirectories", dirs, true);
		}

		this._path = formatPath(path);
		if(!this.linkedTo || !this.linkedTo.length)
			this.truepath = formatPath(path);
	}
	get path() { return this._path; }
	get title() { 
		if(this.options.alternativeTitle)
			return Locale(this.options.alternativeTitle);
		return this._path.split("/").pop();
	}
	set type(type) { this.header.Workspace.Type = type; }
	get type() { return this.header.Workspace.Type; }
	set alwaysexplode(val) { this.header.Workspace.AlwaysExplode = val; }
	get alwaysexplode() { return this.header.Workspace.AlwaysExplode; }
	set unloaded(val) { this.header.Workspace.Unloaded = val; }
	get unloaded() { return this.header.Workspace.Unloaded; }
	set repository(val) { 
		this.header.Workspace.Repository = val;
		if(val)
			this.header.Repository = {};
	}
	get repository() { return this.header.Workspace.Repository; }
	set linkedTo(val) { 
		this.header.Workspace.LinkedTo = val;
		if(val && val.length > 0) {
			if(this.isValid(val))
				this.path = val;
			else {
				this.unload();
				warn("The workspace linking to " + val + " could not be loaded and is now deactivated.");
			}
		}
	}
	get linkedTo() { return this.header.Workspace.LinkedTo; }
	get cloneurl() { 
		if(!this.header.Repository)
			return "";
		var url = this.header.Repository.CloneURL;
		if(this.userinfo) {
			if(url.search(/https:\/\//) != -1)
				url = url.slice(0, 8)+this.userinfo.username+":"+this.userinfo.password+"@"+url.slice(8);
		}

		return url;
	}
	set cloneurl(url) { this.header.Repository.CloneURL = url; }
	get rawCloneUrl() { return this.header.Repository.CloneURL; }
	get index() { return this.header.Workspace.Index; }
	set index(index) { this.header.Workspace.Index = index; }
	
	get icon() {
		let img = "chrome://windmill/content/img/icon-workenvironment-ws.png";
		if(this.type == WORKENV_TYPE_ClonkPath)
			img = "chrome://windmill/content/img/icon-workenvironment-clonkdir.png";
		if(this.repository)
			img = "chrome://windmill/content/img/icon-workenvironment-git.png";
		if(this.options.identifier == "UserData")
			img = "chrome://windmill/content/img/icon-workenvironment-user.png";
		return img;
	}
}

var WORKENV_List = [], WORKENV_Current;

function loadWorkEnvironment() {
	if(OS_TARGET == "WINNT")
		createWorkEnvironment(formatPath(_sc.env.get("APPDATA")+"/OpenClonk"), WORKENV_TYPE_Workspace, 0,
		{readOnly: true, unloaded: false, secured: true, alternativeTitle: "$WEUserData$", identifier: "UserData"});

	//Clonkverzeichnisse laden und ggf. leere Eintraege loeschen
	let clonkdirs = JSON.parse(getConfigData("Global", "ClonkDirectories")), temp = [];
	if(clonkdirs) {
		for(var i = 0; i < clonkdirs.length; i++) {
			if(clonkdirs[i] && clonkdirs[i].path) {
				createWorkEnvironment(clonkdirs[i].path, WORKENV_TYPE_ClonkPath);
				temp.push(clonkdirs[i]);
			}
			else if(i < clonkpath_id)
				clonkpath_id--;
		}

		setConfigData("Global", "ClonkDirectories", temp, true);
	}

	var wsdir = getConfigData("CIDE", "WorkspaceParentDirectory");
	if(!wsdir)
		return;

	function* loadWorkEnvironmentChildren(workenv) {
		let childiterator = new OS.File.DirectoryIterator(workenv.path);
		while(true) {
			let entry;
			try { entry = yield childiterator.next(); } catch(e) { break; }
			if(!entry.isDir) //Unterverzeichnisse untersuchen
				continue;

			if(!(yield OS.File.exists(entry.path+"/.windmillheader")))
				continue;

			let subworkenv = createWorkEnvironment(entry.path, WORKENV_TYPE_Workspace);
			if(!subworkenv)
				continue;

			workenv.addChildWorkEnv(subworkenv);
			subworkenv.parentWorkEnv = workenv;
			subworkenv.isChildWorkEnv = true;
		}
		childiterator.close();
	}
	var iterator;
	let task = Task.spawn(function*() {
		iterator = new OS.File.DirectoryIterator(wsdir);
		while(true) {
			let entry = yield iterator.next();
			if(!entry.isDir) //Unterverzeichnisse untersuchen
				continue;
			
			if(!(yield OS.File.exists(entry.path+"/.windmillheader")))
				continue;

			let workenv = createWorkEnvironment(entry.path, WORKENV_TYPE_Workspace);
			if(workenv)
				yield* (loadWorkEnvironmentChildren(workenv));
		}
	});
	task.then(null, function(reason) {
		iterator.close();
		if(reason != StopIteration)
			throw reason;
	});
	return task;
}

function saveWorkEnvironment(id) {
	//Falls keine id definiert, alle Arbeitsumgebungen speichern
	if(id === undefined) {
		for(var i = 0; i < WORKENV_List.length; i++)
			if(WORKENV_List[i])
				saveWorkEnvironment(i);

		return;
	}
}

function createWorkEnvironment(path, type, forceload, options) { 
	var env = new WorkEnvironment(formatPath(path), type, WORKENV_List.length, options);
	env.loadHeader();
	if(env.unloaded && !forceload)
		return;

	WORKENV_List.push(env);
	if(!getCurrentWorkEnvironment())
		setCurrentWorkEnvironment(env);

	execHook("onWorkenvCreated", env);
	return env;
}

function createNewWorkEnvironment(path, type, options = {}) {
	path = formatPath(path);
	var env = createWorkEnvironment(path, type);
	env.setupWorkEnvironment(options.migrate_files, options);
	return env;
}

function getWorkEnvironmentByPath(path) { 
	if(!path)
		return;

	for(var i = 0; i < WORKENV_List.length; i++)
		if(WORKENV_List[i] && WORKENV_List[i].path == formatPath(path))
			return WORKENV_List[i];

	return;
}

function setCurrentWorkEnvironment(work_env) { WORKENV_Current = work_env; }
function getCurrentWorkEnvironment() { return WORKENV_Current; }
function getWorkEnvironments() {
	var result = [];
	//Garantieren dass keine undefined WorkEnvironments zurueckgegeben werden
	for(var i = 0; i < WORKENV_List.length; i++) {
		if(WORKENV_List[i])
			result.push(WORKENV_List[i]);
	}

	return result;
}

_sc.workpath = function(by) {
	//Erweiterte angepasste Implementationen in deck.js und explorer.js

	if(by instanceof Ci.nsIFile)
		by = by.path;

	//Raw Path
	if(typeof by == "string") {
		by = formatPath(by);
		let match = "";

		for(var i = 0; i < WORKENV_List.length; i++) {
			if(!WORKENV_List[i])
				continue;

			if(by.search(RegExp("^"+WORKENV_List[i].path+"(\/|$)")) != -1 && WORKENV_List[i].path.length > match.length)
				match = WORKENV_List[i].path;
		}
		return match;
	}
	else if(getCurrentWorkEnvironment && getCurrentWorkEnvironment())
		return getCurrentWorkEnvironment().path;
}

function inheritFuncs() { return ["getWorkEnvironments", "getCurrentWorkEnvironment", "setCurrentWorkEnvironment", "createNewWorkEnvironment", "createWorkEnvironment"]; }

registerInheritableObject("getWorkEnvironmentByPath");

