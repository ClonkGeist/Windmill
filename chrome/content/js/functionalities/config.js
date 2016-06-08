
class ConfigEntry extends WindmillObject {
	constructor(sect, key, value = "", type = typeof value, { readOnly, alwaysSave, runTimeOnly } = {}) {
		super();
		log(`Initialize Config Entry: ${sect}::${key}=${value} {${type}}`);
		this.sect = sect;
		this.key = key;
		this.type = type;
		this.defaultvalue = this.tempvalue = this.value = value;
		this.readOnly = readOnly;
		this.alwaysSave = alwaysSave;
		this.runTimeOnly = runTimeOnly;
	}
	
	apply() { this._value = this.tempvalue };
	reset(apply) {
		this.tempvalue = this.defaultvalue;
		if(apply)
			this.apply();
	}

	get type() { return this._type; }
	set type(type) { this._type = type.toLowerCase(); }

	get stringvalue() {
		switch(this.type) {
			case "array":
			case "object":
				return JSON.stringify(this.value);
		}

		return this.value;
	}
	get value() {
		execHook("onReadingAccess");

		switch(this.type) {
			case "boolean":
			case "bool":
				let valup;
				if(typeof this.tempvalue == "string")
					valup = this.tempvalue.toUpperCase();
				else 
					return this.tempvalue;
				if(valup != "FALSE" && valup != "UNDEFINED" && valup != "NULL" && valup != "0" && valup.length)
					return true;
				return false;

			case "path":
				return formatPath(this.tempvalue);

			case "int":
			case "integer":
			case "number":
				return parseInt(this.tempvalue);

			default:
				return this.tempvalue;
		}
	}
	set value(val) {
		if(this.readOnly) {
			throw "Error: Attempted to set read-only config value";
			return;
		}

		execHook("onWritingAccess", val);
		if(typeof val == "string" && this.type != "string" && this.type) {
			var valup = val.toUpperCase();
			switch(this.type) {
				case "path":
					val = formatPath(val);
					break;

				case "boolean":
				case "bool":
					if(valup != "FALSE" && valup != "UNDEFINED" && valup != "NULL" && valup != "0" && valup.length)
						val = true;
					else
						val = false;
					break;

				case "array":
				case "object":
					val = JSON.parse(val);
					break;

				case "int":
				case "integer":
				case "number":
					val = parseInt(val);
					break;
			}
		}

		this.tempvalue = val;
		if(this.alwaysSave)
			this.apply();
	}
}

var CONFIG = [], CONFIG_BACKUP = [], CONFIG_FIRSTSTART = false;
let clonkpath_id;

function setClonkPath(val = 0) {
	let paths = getConfigData("Global", "ClonkDirectories");
	if(typeof val == "string") {
		for(var i = 0; i < paths.length; i++) {
			if(paths[i].active)
				paths[i].active = false;
			if(formatPath(paths[i].path) == val) {
				paths[i].active = true;
				clonkpath_id = i;
			}
		}
	}
	else if(typeof val == "number") {
		if(paths[clonkpath_id])
			paths[clonkpath_id].active = false;
		clonkpath_id = val;
		if(paths[val])
			paths[val].active = true;
	}

	execHook("onClonkPathChange");
	setConfigData("Global", "ClonkDirectories", paths, true);
	return;
}

//Shortcut hinzufügen
_sc.clonkpath = function(index = 0, findnext = true) {
	let clonkdirs = getConfigData("Global", "ClonkDirectories");
	if(clonkpath_id === undefined) {
		for(var i = 0; i < clonkdirs.length; i++)
			if(clonkdirs[i].active) {
				setClonkPath(i);
				break;
			}
	}
	index = (clonkpath_id+index)%clonkdirs.length;
	if(findnext && (!clonkdirs || !clonkdirs[index]))
		for(var i = 0; i < clonkdirs.length; i++) {
			let new_index = (index+i)%clonkdirs.length;
			if(clonkdirs[new_index]) {
				setClonkPath(new_index);
				index = new_index;
				break;
			}
		}
	if(clonkdirs[index])
		return formatPath(clonkdirs[index].path);
};
_sc.clonkpathlength = function() { return getConfigData("Global", "ClonkDirectories").length; }

function addConfigString(section, key, defaultval, ...pars) {
	if(!CONFIG[section])
		CONFIG[section] = [];

	CONFIG[section][key] = new ConfigEntry(section, key, defaultval, ...pars);

	if(getModuleByName("modmanager") && name != "modmanager" && getModuleByName("modmanager").contentWindow.onConfigChange)
		getModuleByName("modmanager").contentWindow.onConfigChange(section, key, defaultval);
	return CONFIG[section][key];
}

function getConfig() { return CONFIG; }

function initializeConfig() {
	addConfigString("Global", "DevMode", false);
	addConfigString("Global", "ClonkDirectories", "[]", "array").hook("onWritingAccess", function(val) {
		if(!this.value.length && val instanceof Array) {
			for(var i = 0; i < val.length; i++)
				if(val[i].active)
					setClonkPath(i);
		}
	});
	addConfigString("Global", "FirstStartDevTest", false);
	addConfigString("Global", "Version", "0.2");
	addConfigString("Global", "Language", "en-US");
	addConfigString("Global", "ShowHiddenLogs", false);

	//CBridge

	//ShowGame
	addConfigString("ShowGame", "Notifications", "[]", "array");
	addConfigString("ShowGame", "PortScan", true);
	addConfigString("ShowGame", "NotificationsShowEmpty", false);
	addConfigString("ShowGame", "MasterserverURL", "http://league.clonkspot.org/");

	//HostGame
	addConfigString("HostGame", "PasswordActivated", false);
	addConfigString("HostGame", "Password", "");
	addConfigString("HostGame", "Comment", "");
	addConfigString("HostGame", "League", false);
	addConfigString("HostGame", "Fullscreen", true);
	addConfigString("HostGame", "RunTimeJoin", false);
	addConfigString("HostGame", "SignUp", true);
	addConfigString("HostGame", "Network", false);

	//StartGame
	addConfigString("StartGame", "Record", true);
	addConfigString("StartGame", "GamePort", 11111);

	//CIDE
	addConfigString("CIDE", "HideUnsupportedFiles", true);
	addConfigString("CIDE", "AlwaysUseExternalProg", false);
	addConfigString("CIDE", "ExtProg_Script", "");
	addConfigString("CIDE", "ExtProg_Text", "");
	addConfigString("CIDE", "ExtProg_GraphicsPNG", "");
	addConfigString("CIDE", "ExtProg_GraphicsBMP", "");
	addConfigString("CIDE", "ExtProg_Audio", "");
	addConfigString("CIDE", "AU_Script", false);
	addConfigString("CIDE", "AU_Text", false);
	addConfigString("CIDE", "AU_GraphicsPNG", false);
	addConfigString("CIDE", "AU_GraphicsBMP", false);
	addConfigString("CIDE", "AU_Audio", false);
	addConfigString("CIDE", "EditorTheme", "rocking-horse");
	addConfigString("CIDE", "CommandLineParameters", "--editor --nonetwork %SCENARIO%"); 
	addConfigString("CIDE", "WorkspaceParentDirectory", "", "path");
	addConfigString("CIDE", "FileProtection", true);
	addConfigString("CIDE", "RejectScenarioBackup", true);

	//Audiomodule
	addConfigString("Audiomodule", "Volume", 100);
	addConfigString("Audiomodule", "Loop", false);
	addConfigString("Audiomodule", "Autoplay", false);

	//Scripteditor
	addConfigString("Scripteditor", "Completers", 2);
	addConfigString("Scripteditor", "ParameterList", true);

	//ScenarioSettings
	addConfigString("ScenarioSettings", "AlwaysUseScenarioSettings", true);
	addConfigString("ScenarioSettings", "UseModuleCache", false);

	//BMP-Editor
	addConfigString("BMPEditor", "HideUnusedMat", true);
	addConfigString("BMPEditor", "ScaleCanvas", true);
	addConfigString("BMPEditor", "SaveTexMapBehaviour", 1);

	return true;
}

function loadConfig() {
	let path = _sc.profd+"/config.ini";
	let promise = OS.File.read(path, {encoding: "utf-8"});
	promise.then(function(text) {
		let cfgini = parseINI2(text), elm;
		while(elm = cfgini.next().value) {
			if(typeof elm == "string") {
				if(!CONFIG[elm])
					CONFIG[elm] = [];
			}
			else
				setConfigData(elm.sect, elm.key, elm.val).apply();
		}

		if(CONFIG["Global"]["Version"].defaultvalue != CONFIG["Global"]["Version"].value)
			configVersionUpdate(CONFIG["Global"]["Version"].value);
	}, function(reason) {
		//In den ersten Start-Modus setzen
		CONFIG_FIRSTSTART = true;
		return;
	});
	return promise;
}

function saveConfig(special) {
	var text = "";
	
	//Config-Inhalt in String einsetzen
	for(var sect in CONFIG) {
		if(!CONFIG.hasOwnProperty(sect))
			continue;

		if(sect)
			text += "\r\n["+sect+"]\r\n";

		for(var key in CONFIG[sect]) {
			var filtered = !!special;

			//Format:
			// ["SectA", "SectB"]
			// - Speichert die komplette Section
			//
			// [["SectA", "Key1", "Key2"], ["SectB", "Key2"]]
			// - Speichert nur die angegebenen Keys pro Section
			//
			// Kann auch gemischt angegeben werden, e.g. ["SectA", ["SectB", "Key1", "Key2"]]
			if(special)
				for(var i = 0; i < special.length; i++) {
					if(typeof special[i] == "object") {
						if(special[i][0] == sect) {
							if(special[i].length == 1)
								filtered = false;
							else if(special[i].indexOf(key) > 0)
								filtered = false;
								
						}
					}
					else if(typeof special[i] == "string" && special[i] == sect)
						filtered = false;
				}

			if(CONFIG[sect].hasOwnProperty(key) && CONFIG[sect][key]) {
				if(!filtered)
					CONFIG[sect][key].apply();

				if(!CONFIG[sect][key].runTimeOnly)
					text += key+"="+CONFIG[sect][key].stringvalue+"\r\n";
			}
		}
	}

	if(getModuleByName("modmanager") && name != "modmanager" && getModuleByName("modmanager").contentWindow.onConfigSave)
		getModuleByName("modmanager").contentWindow.onConfigSave();
	return OS.File.writeAtomic(_sc.profd+"/config.ini", text, { encoding: "utf-8" });
}

function getConfigData(sect, key, cfgobject) {
	if(!CONFIG[sect])
		return;
	if(!CONFIG[sect][key])
		return;

	if(cfgobject)
		return CONFIG[sect][key];
	
	var type = CONFIG[sect][key].type;
	var val = CONFIG[sect][key].value;
	if(type && type != typeof val && typeof val == "string") {
		switch(type.toLowerCase()) {
			case "bool":
			case "boolean":
				if(val == "true")
					val = true;
				if(val == "false")
					val = false;
				break;
		}
	}
	return val;
}

function setConfigData(sect, key, val, save, ...pars) {
	if(!CONFIG[sect])
		CONFIG[sect] = [];

	if(!CONFIG[sect][key])
		CONFIG[sect][key] = new ConfigEntry(sect, key, val, ...pars);
	else {
		CONFIG[sect][key].value = val;
		if(save)
			saveConfig([[sect, key]]);
	}

	if(getModuleByName("modmanager") && name != "modmanager" && getModuleByName("modmanager").contentWindow.onConfigChange)
		getModuleByName("modmanager").contentWindow.onConfigChange(sect, key, val);

	return CONFIG[sect][key];
}

//Updates bei Versionswechsel

function configVersionUpdate(version) {
	var removedEntries = [];
	switch(version) {
		case "0.1":
			if(getConfigData("Global", "ClonkPath")) {
				setConfigData("Global", "ClonkDirectories", [getConfigData("Global", "ClonkPath")]);
				removedEntries.push(["Global", "ClonkPath"]);
			}
			//cases sollen nicht mit break abgebrochen werden, damit aeltere Versionen Veraenderungen von neueren Versionen mitnehmen koennen.
		
		case "0.12":
			removedEntries.push(["CIDE", "AU_RTF"], ["CIDE", "ExtProg_RTF"]);
		case "0.15":
			if(getConfigData("Global", "ClonkDirectories")) {
				let clonkdirs = getConfigData("Global", "ClonkDirectories");
				for(var i = 0; i < clonkdirs.length; i++)
					if(clonkdirs[i])
						clonkdirs[i] = { path: clonkdirs[i], active: !i};

				setConfigData("Global", "ClonkDirectories", clonkdirs);
			}
	}
	
	//Veraltete Eintraege loeschen
	for(var i = 0; i < removedEntries.length; i++) {
		if(typeof removedEntries[i] == "string")
			delete CONFIG[removedEntries[i]];
		else
			delete CONFIG[removedEntries[i][0]][removedEntries[i][1]];
	}
	
	//Version updaten
	CONFIG["Global"]["Version"].reset(true);
}

registerInheritableObject("addConfigString");
