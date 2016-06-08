
var MODULE_LIST = [], MODULE_DEF_LIST = [];

//Modulobjekt
class _module {
	constructor() {
		this.name = "";
		this.modulename = "";
		this.description = "";
		this.path = "";
		this.mainfile = "";
		this.keyb_conflictedmodules = "";
		
		this.custom = {};
	}
}

function loadModules(path) {
	var iterator;
	let task = Task.spawn(function*() {
		iterator = new OS.File.DirectoryIterator(path);
		while(true) {
			let entry = yield iterator.next();
			try {
				if(entry.isDir) //Unterverzeichnisse untersuchen
					yield loadModules(entry.path);
				else if(entry.name == "module.ini") //Modulinformationen einlesen
					yield readModuleInfo(entry.path);
			} catch(e) {}
		}
	});
	task.then(null, function(reason) {
		iterator.close();
		if(!reason != StopIteration)
			throw reason;
	});
	return task;
}

function readModuleInfo(path) {
	var module = new _module();
	let promise = OS.File.read(path, {encoding: "utf-8"});
	promise.then(function(text) {
		let moduleini = parseINI2(text, { matchEmptyValues: true }), elm, config = [], keybindings = [];
		while(elm = moduleini.next().value) {
			if(typeof elm != "string") {
				if(elm.sect == "Module") 
					module[elm.key.toLowerCase()] = elm.val;
				else if(elm.sect == "Custom")
					module[elm.key.toLowerCase()] = elm.val;
				else if(elm.sect == "Config")
					config.push([elm.key, elm.val]);
				else if(elm.sect == "KeyBindings")
					keybindings.push([elm.key, elm.val]);
			}
		}
		let sect = module.configsectionname || module.modulename || module.name, cfg = getConfig();
		if(!sect)
			return log("An error has occured while trying to load a module: No name was specified.", "error");
		else {
			for(let item of config) {
				let type = "string", key = item[0], val = item[1];
				type = val.match(/^[a-zA-Z]+(?=\:)/)
				if(!type) {
					val = val.replace(/^([a-zA-Z]+)\\\:/, "$1:");
					if(/^[0-9.]+$/.test(val))
						type = "number";
					else {
						switch(val.toLowerCase()) {
							case "true":
							case "false":
								type = "boolean";
								break;

							default:
								type = "string";
								break;
						}
					}
				}
				else {
					val = val.replace(/^[a-zA-Z]+\:/, "");
					type = type[0];
				}

				if(!cfg[sect] || !cfg[sect][key])
					addConfigString(sect, key, val, type);
				else
					log(`Module loading warning: The specified config entry "${sect}::${key}" is already used by another module. (${module.modulename})`, "warning");
			}
		}
		if(!module.languageprefix)
			return log(`An error has occured while trying to load the module "${module.modulename}": No language prefix was specified`, "error");
		if(!customKeyBindings)
			customKeyBindings = []
		for(let kb of keybindings) {
			let name = module.languageprefix + "_" + kb[0];
			if(!customKeyBindings[name])
				customKeyBindings[name] = kb[1];
		}

		//Modulpfad und relativer Pfad speichern
		module.path = formatPath(path);
		module.relpath = module.path.replace(RegExp(formatPath(_sc.chpath+"/content/")), "").replace(/\/module.ini/, "");

		MODULE_DEF_LIST[module.name] = module;
	});
	return promise;
}

var MODULE_CNT = 0;

function createModule(name, obj, fClearParent, fHide, options = {}) {
	var mod = getModuleDef(name);
	
	if(!mod)
		return alert("Could not load module " + name + ": Module does not exist");

	/* container aufräumen? 
		TODO: Not so fine, weil nav Element bestehen bleiben - 
		extra funktion basteln die die nav-elemente danach aufräumt
	*/
	if(fClearParent)
		$(obj).html("");

	// als Element grabben - selektor würde Probleme bereiten
	var path = formatPath("chrome://windmill/content/"+mod.relpath+"/"+mod.mainfile);
	MODULE_LIST[MODULE_CNT] = $('<iframe src="'+path+'" id="module-'+MODULE_CNT+'" class="'+name+'" name="'+name+'" flex="1" />')[0];
	if(options.prepend)
		$(MODULE_LIST[MODULE_CNT]).prependTo(obj);
	else
		$(MODULE_LIST[MODULE_CNT]).appendTo(obj);
	
	if(fHide)
		$(MODULE_LIST[MODULE_CNT]).css("display", "none");	
	
	var mmgr = getModuleByName("modmanager");
	if(mmgr && name != "modmanager" && mmgr.contentWindow && mmgr.contentWindow.onModuleAdded)
		getModuleByName("modmanager").contentWindow.onModuleAdded(mod, MODULE_LIST[MODULE_CNT]);

	MODULE_CNT++;
	 
	// module id zurückgeben
	return MODULE_CNT - 1;
}

function getModuleDefByPrefix(prefix) {
	for(var mname in MODULE_DEF_LIST) {
		var obj = MODULE_DEF_LIST[mname];
		if(!obj)
			continue;
		
		if(obj.languageprefix == prefix)
			return obj;
	}
	
	return undefined;
}

function getModulesByName(name) {
	var rv = [];
	for(var i = 0; i < MODULE_LIST.length; i++) {
		var obj = MODULE_LIST[i];
		if(!obj)
			continue;
		
		if(!$(obj).parent()[0])
			delete MODULE_LIST[i];	
		else if($(obj).hasClass(name))
			rv[rv.length] = MODULE_LIST[i];
	}
	
	return rv;
}

function getModuleByName(name, index) {
	if(!index)
		index = 0;

	return getModulesByName(name)[index];
}

function getModulesIdByName(name) {
	var rv = [];
	for(var i = 0; i < MODULE_LIST.length; i++) {
		var obj = MODULE_LIST[i];
		if(!obj)
			continue;
		
		if(!$(obj).parent()[0])
			delete MODULE_LIST[i];	
		else if($(obj).hasClass(name))
			rv[rv.length] = i;
	}
	
	return rv;
}

function getModuleIdByName(name, index = 0) {
	return getModulesIdByName(name)[index];
}

function getModuleDef(name) {
	return MODULE_DEF_LIST[name];
}

function getModule(id, fElement) {
	if(id < 0)
		return undefined;

	if(fElement)
		return MODULE_LIST[id];
	
	return $(MODULE_LIST[id]);
}