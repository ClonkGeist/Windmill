
var MODULE_LIST = [], MODULE_DEF_LIST = [];

$(window).ready(function() {
	loadModules(_sc.chpath + "/content/modules");
});

//Hilfsfunktion zum loggen
function log(str) {
	dump(str + "\n");
}

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
	//modules-Ordner
	var f = _sc.file(path);
	if(!f.exists() || !f.isDirectory())
		return;
	
	//Verzeichnisse einzelnd untersuchen
	var entries = f.directoryEntries;
	while(entries.hasMoreElements()) {
		var entry = entries.getNext().QueryInterface(Ci.nsIFile);
		if(entry.isDirectory()) //Unterverzeichnisse untersuchen
			loadModules(entry.path);
		else if(entry.leafName == "module.ini") //Modulinformationen auslesen
			readModuleInfo(entry.path);
	}
}

function readModuleInfo(path) {
	var module = new _module();
	var f = _sc.file(path);
	var parser = _sc.inifact().createINIParser(f);
	//Module-Keys
	var keys = parser.getKeys("Module");
	while(keys && keys.hasMore()) {
		var key = keys.getNext();
		module[key.toLowerCase()] = parser.getString("Module", key);
	}
	
	//Custom-Keys
	keys = parser.getKeys("Custom");
	while(keys && keys.hasMore()) {
		var key = keys.getNext();
		module.custom[key.toLowerCase()] = parser.getString("Custom", key);
	}
	
	//Modulpfad und relativer Pfad speichern
	if(OS_TARGET == "WINNT") {
		module.path = path.replace(/\\[^\\]+$/, ""); 
		module.relpath = module.path.replace(RegExp((_sc.chpath.replace(/\//, "\\")+"\\content\\").replace(/\\/g, "\\\\")), "");
	}
	else {
		module.path = path.replace(/\/[^\/]+$/, "");
		module.relpath = module.path.replace(RegExp((_sc.chpath+"/content/").replace(/\\/g, "\\\\")), "");
	}

	MODULE_DEF_LIST[module.name] = module;
	
	return module;
}

var MODULE_CNT = 0;

function createModule(name, obj, fClearParent, fHide, options = {}, wdw) {
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
	
	return false;
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
		return false;

	if(fElement)
		return MODULE_LIST[id];
	
	return $(MODULE_LIST[id]);
}