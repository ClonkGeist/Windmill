
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

	set type(type) { this._type = type.toLowerCase(); }

	get value() {
		execHook("onReadingAccess");

		/*var valup = this._value.toUpperCase();
		switch(this.type) {
			case "boolean":
			case "bool":
				if(valup != "FALSE" && valup != "UNDEFINED" && valup != "NULL" && valup != "0" && valup.length)
					return true;
				return false;

			case "path":
				return formatPath(this._value);

			case "array":
			case "object":
				return JSON.parse(this._value);

			case "int":
			case "integer":
			case "number":
				return parseInt(this._value);

			default:
				return this._value;
		}*/
		return this.tempvalue;
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
						val= true;
					val = false;
					break;

				case "array":
				case "object":
					val = JSON.parse(val);

				case "int":
				case "integer":
				case "number":
					val = parseInt(val);
			}
		}
		//Nur Temporaer, soll wieder raus wenn alles umgestellt ist
		if(typeof val == "object")
			val = JSON.stringify(val);

		this.tempvalue = val;
		if(this.alwaysSave)
			this.apply();
	}
}

var MODULE_LIST = [], MODULE_DEF_LIST = [], CONFIG = [], CONFIG_BACKUP = [], CONFIG_FIRSTSTART = false;

initializeConfig(); //Standardwerte
loadConfig(); //Configdatei laden
saveConfig(); //Configdatei speichern (falls nicht existiert)

var clonkpath_id = 0;
function setClonkPath(val = 0) {
	if(typeof val == "string") {
		var paths = JSON.parse(getConfigData("Global", "ClonkDirectories"));
		for(var i = 0; i < paths.length; i++)
			if(formatPath(paths[i]) == val)
				return clonkpath_id = i;
	}
	else if(typeof val == "number")
		clonkpath_id = val;
	
	execHook("onClonkPathChange");
	return;
}

//Shortcut hinzufügen
_sc.clonkpath = function(index = clonkpath_id, findnext = true) {
	var clonkdirs = JSON.parse(getConfigData("Global", "ClonkDirectories"));
	if(findnext && (!clonkdirs || !clonkdirs[index]))
		for(var i = 0; i < clonkdirs.length; i++)
			if(clonkdirs[i]) {
				if(index == clonkpath_id)
					setClonkPath(i);
				index = i;
				break;
			}

	return formatPath(clonkdirs[index]);
};

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
	addConfigString("Global", "ClonkDirectories", "[]");
	addConfigString("Global", "FirstStartDevTest", "false");
	addConfigString("Global", "Version", "0.15");
	addConfigString("Global", "Language", "en-US");
	addConfigString("Global", "DevMode", true);
	addConfigString("Global", "ShowHiddenLogs", false);
	
	//CBridge
	
	//ShowGame
	addConfigString("ShowGame", "Notifications", "");
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
	addConfigString("CIDE", "ExtProg_Script", false);
	addConfigString("CIDE", "ExtProg_Text", false);
	addConfigString("CIDE", "ExtProg_GraphicsPNG", false);
	addConfigString("CIDE", "ExtProg_GraphicsBMP", false);
	addConfigString("CIDE", "ExtProg_Audio", false);
	addConfigString("CIDE", "AU_Script", false);
	addConfigString("CIDE", "AU_Text", false);
	addConfigString("CIDE", "AU_GraphicsPNG", false);
	addConfigString("CIDE", "AU_GraphicsBMP", false);
	addConfigString("CIDE", "AU_Audio", false);
	addConfigString("CIDE", "EditorTheme", "chrome");
	addConfigString("CIDE", "CommandLineParameters", "--editor --nonetwork %SCENARIO%"); 
	addConfigString("CIDE", "WorkspaceParentDirectory", "", "path");
	
	//Audiomodule
	addConfigString("Audiomodule", "Volume", 100);
	addConfigString("Audiomodule", "Loop", false);
	addConfigString("Audiomodule", "Autoplay", false);

	//ScenarioSettings
	addConfigString("ScenarioSettings", "AlwaysUseScenarioSettings", true);
	
	//BMP-Editor
	addConfigString("BMPEditor", "HideUnusedMat", true);
	addConfigString("BMPEditor", "ScaleCanvas", true);
	addConfigString("BMPEditor", "SaveTexMapBehaviour", 1);
	
	return true;
}

function loadConfig() {
	var f = _sc.file(_sc.profd+"/config.ini");
	
	//Existiert die Datei?
	if(!f.exists() || !f.isFile()) {
		//In den ersten Start-Modus setzen
		CONFIG_FIRSTSTART = true;
		return;
	}

	var parser = _sc.inifact().createINIParser(f);
	var sections = parser.getSections();
	
	//Sections + Keys laden und in CONFIG speichern
	while(sections && sections.hasMore()) {
		var sect = sections.getNext();

		if(!CONFIG[sect])
			CONFIG[sect] = [];
		
		var keys = parser.getKeys(sect);
		
		while(keys && keys.hasMore()) {
			var key = keys.getNext();
			var value =  parser.getString(sect, key);

			if(value.toLowerCase() == "false")
				value = false;
			else if(value.toLowerCase() == "true")
				value = true;
			
			setConfigData(sect, key, value, true);
		}
	}

	if(CONFIG["Global"]["Version"].defaultvalue != CONFIG["Global"]["Version"].value)
		configVersionUpdate(CONFIG["Global"]["Version"].value);

	return true;
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

			/*if(filtered && CONFIG[sect].hasOwnProperty(key))
				text += key+"="+CONFIG_BACKUP[sect][key]+"\r\n";
			else */
			if(CONFIG[sect].hasOwnProperty(key) && CONFIG[sect][key]) {
				if(!filtered)
					CONFIG[sect][key].apply();

				if(!CONFIG[sect][key].runTimeOnly)
					text += key+"="+CONFIG[sect][key].value+"\r\n";
			}
		}
	}
	
	var f = _sc.file(_sc.profd+"/config.ini");
	
	if(!f.exists())
		f.create(f.NORMAL_FILE_TYPE, 0o777);
	
	//File-/Converterstream
	var fstr = _sc.ofstream(f, _scc.PR_WRONLY|_scc.PR_TRUNCATE, 0x200);
	var cstr = _sc.costream();
	
	cstr.init(fstr, "utf-8", text.length, Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
	cstr.writeString(text);
	
	cstr.close();
	fstr.close();
	
	if(getModuleByName("modmanager") && name != "modmanager" && getModuleByName("modmanager").contentWindow.onConfigSave)
		getModuleByName("modmanager").contentWindow.onConfigSave();
	
	return true;
}

function getConfigData(sect, key, cfgobject) {
	if(!CONFIG[sect])
		return;
	if(!CONFIG[sect][key])
		return;

	if(cfgobject)
		return CONFIG[sect][key];
	return CONFIG[sect][key].value;
}

function setConfigData(sect, key, val, save) {
	if(!CONFIG[sect])
		CONFIG[sect] = [];

	if(!CONFIG[sect][key])
		CONFIG[sect][key] = new ConfigEntry(sect, key, val);
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
	if(version == "0.12") {
		var f = _sc.file(_sc.profd+"/config.ini");
		f.copyTo(f.parent, "config_v0.12.backup.ini");
	}
	
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
