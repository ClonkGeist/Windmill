/*-- Default Cide Module Functionality --*/

var CM_ACTIVEID = 0;
class WindmillCideAliases {
	constructor() {
		
	}

	get path() {
		if(window.CM_PATHALIAS)
			return window.CM_PATHALIAS;
		return "path";
	}
	get active_id() {
		if(window.alternativeActiveId)
			return window.alternativeActiveId();
		return CM_ACTIVEID;
	}
}
let cda = new WindmillCideAliases(), unsavedChanges;

function TabManager() {}

function onFileUnchanged(index) {
	unsavedChanges = false;
	if(parent && parent.onFileStatusChange)
		parent.onFileStatusChange(false, index, TabManager()[index][cda.path]);

	return true;
}

function onFileChanged(index) {
	unsavedChanges = true;
	if(parent && parent.onFileStatusChange)
		parent.onFileStatusChange(true, index, TabManager()[index][cda.path]);

	return true;
}

function saveTab(index, ...pars) {
	if(index == -1)
		index = cda.active_id;

	if(!checkSavingPermissions(index))
		return warn("$FileProtectionError$", "CIDE");
	onFileUnchanged(index);
	saveTabContent(index, ...pars);
}

function checkSavingPermissions(index) {
	return parent.onCideModuleSavingPermissions(formatPath(TabManager()[index][cda.path]));
}

function onCideModuleSavingPermissions(...pars) { parent.onCideModuleSavingPermissions(...pars); }

function getUnsavedFiles() {
	if(!window.checkIfTabIsUnsaved)
		return [];

	let tabs = TabManager();
	var files = [];
	for(var id in tabs)
		if(tabs[id])
			if(checkIfTabIsUnsaved(id) || unsavedChanges)
				files.push({ filepath: tabs[cda.active_id][cda.path], index: id, module: window });

	return files;
}

function saveFileByPath(path) {
	let tabs = TabManager();
	for(var id in tabs)
		if(tabs[id])
			if(tabs[id][cda.path] == path)
				return saveTab(id);
	
	return -1;
}

function fileLoaded(path) {
	let tabs = TabManager();
	for(var id in tabs)
		if(tabs[id])
			if(tabs[id][cda.path] == path)
				return id;

	return -1;
}

function hasOpenedSessions() {
	let tabs = TabManager()
	for(var id in tabs)
		if(tabs[id])
			return true;
	return false;
}

function frameWindowTitle() {
	if(TabManager()[cda.active_id]) {
		let substrlength = _sc.workpath(cda.active_id, true).length;
		//Um bei externen Dateien den vollen Dateipfad einschliesslich Laufwerk anzuzeigen
		if(substrlength)
			substrlength++; //Nimmt das letzte Slash mit
		let path = formatPath(TabManager()[cda.active_id][cda.path]).substr(substrlength);
		if(path.length > 100) {
			let splitted = path.split("/");
			if(splitted.length > 1) {
				let beginning = splitted[0]+"/"+splitted[1]+"/";
				let ending = "";
				for(var i = splitted.length-1; i > 1; i--) {
					ending = splitted[i] + (ending?"/":"") + ending;
					if((beginning+ending).length > 100) {
						if(i != 2)
							ending = ".../" + ending;
						break;
					}
				}
				path = beginning + ending;
			}
		}
		return path;
	}
}

function _createCideToolbar(...pars) {
	if(!window.HideExternalProgramToolbarButton || !window.HideExternalProgramToolbarButton())
		if(getConfigData("CIDE", "ExtProg_"+getExtProgId()))
			addCideToolbarButton("icon-open-external", function() { OpenTabInProgram(); });

	if(window.createCideToolbar)
		window.createCideToolbar(...pars);
}

function getExtProgId(id = cda.active_id) {
	if(!TabManager()[id])
		return;
	let path = TabManager()[id][cda.path], extprogid;
	if(window.GetExternalProgramId)
		extprogid = window.GetExternalProgramId(TabManager()[id]);
	if(!extprogid) {
		let fileext = path.split(".").pop();
		switch(fileext) {
			case "c":
				extprogid = "Script";
				break;

			case "png":
				extprogid = "GraphicsPNG";
				break;

			case "bmp":
				extprogid = "GraphicsBMP";
				break;

			case "wav":
			case "ogg":
			case "mp3":
				extprogid = "Audio";
				break;

			default:
				extprogid = "Text";
		}
	}
	return extprogid;
}

function OpenTabInProgram(id = cda.active_id) {
	let path = TabManager()[id][cda.path];

	let extprogstr = getConfigData("CIDE", "ExtProg_"+getExtProgId(id));
	//Es wurde kein Programm angegeben
	if(!extprogstr)
		return warn("$err_no_external_program$", "CIDE");

	var args = [path];

	var f = new _sc.file(extprogstr);
	var process = _sc.process(f);
	process.run(false, args, args.length);

	return true;
}