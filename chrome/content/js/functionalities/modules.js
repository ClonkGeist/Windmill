
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
	return Task.spawn(function*() {
		let text = yield OS.File.read(path, {encoding: "utf-8"});
		let moduleini = parseINI2(text, { matchEmptyValues: true }), elm, config = [], keybindings = [], matchinggroup = [];
		module.settings = {};
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
				else if(/^MatchingGroup/.test(elm.sect))
					matchinggroup[matchinggroup.length-1][elm.key.toLowerCase()] = elm.val;
				else if(elm.sect = "Settings")
					module.settings[elm.key.toLowerCase()] = elm.val;
			}
			else if(/^MatchingGroup/.test(elm))
				matchinggroup.push({priority: 0});
		}
		module.matchinggroup = matchinggroup;
		let sect = module.configsectionname || module.modulename || module.name, cfg = getConfig();
		if(!sect)
			return log(`Module Loading Error (${path}): No name was specified.`, "error");
		else {
			addConfigString("Modules", module.name+"_State", 0);
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
					log(`Module Loading Warning (${module.modulename}): The specified config entry "${sect}::${key}" is already used by another module.`, "warning");
			}
		}
		if(!module.languageprefix)
			return log(`Module Loading Error (${module.modulename}): No language prefix was specified`, "error");
		if(!customKeyBindings)
			customKeyBindings = []
		for(let kb of keybindings) {
			let name = module.languageprefix + "_" + kb[0];
			if(!customKeyBindings[name])
				customKeyBindings[name] = kb[1];
		}

		//Modulpfad und relativer Pfad speichern
		module.path = formatPath(path);
		module.dir = formatPath(module.path).replace(/\/module.ini/, "");
		module.relpath = module.path.replace(RegExp(formatPath(_sc.chpath+"/content/")), "").replace(/\/module.ini/, "");

		//Read module stylesheet definitions
		if(module.stylesheetdef) {
			if(/\.json/.test(module.stylesheetdef)) {
				let stylesheet_def;
				//Don't let wrong module configuration crash Windmill.
				try {
					stylesheet_def = yield OS.File.read(formatPath(module.dir+"/"+module.stylesheetdef), { encoding: "utf-8" });
				}
				catch(e) {
					log(`Module Loading Error (${module.modulename}): Could not load stylesheet definitions.`, "error")
					log(e.message, "error");
					log(e.stack, "error");
				}
				if(stylesheet_def) {
					try {
						module.stylesheets = JSON.parse(stylesheet_def.replace(/%MODULEPATH%/g, "content/"+module.relpath));
					}
					catch(e) {
						log(`Module Loading Error (${module.modulename}): An error has occured while trying to parse the stylesheet definitions.`, "error");
						log(e.message, "error");
						log(e.stack, "error");
					}
					if(module.stylesheets && module.stylesheets.constructor.name != "Array")
						log(`Module Loading Error (${module.modulename}): The given stylesheets definitions are not wrapped in an array.`, "error");
				}
			}
			else
				log(`Module Loading Error (${module.modulename}): Stylesheet definitions need to be saved as a JSON object.`, "error");
		}

		MODULE_DEF_LIST[module.name] = module;
	});
}

var MODULE_CNT = 0;

function createModule(name, obj, fClearParent, fHide, options = {}) {
	var mod = getModuleDef(name);

	if(!mod) {
		log("Module Creation Error: Module does not exist.", "error");
		return alert("Could not load module " + name + ": Module does not exist.");
	}

	if(getConfigData("Modules", name+"_State") == 2) {
		log("Module Creation Error: Module is deactivated.", "error");
		return alert("Could not load module " + name + ": Module is deactivated.");
	}

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

function getModuleDefs() { return MODULE_DEF_LIST; }

registerInheritableObject("getModuleDefs");