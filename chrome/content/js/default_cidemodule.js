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

	onFileUnchanged(index);
	saveTabContent(index, ...pars);
}

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

function fileLoaded(path) {
	let tabs = TabManager();
	for(var id in tabs)
		if(tabs[id])
			if(tabs[id][cda.path] == path)
				return id;

	return -1;
}

function saveFileByPath(path) {
	let tabs = TabManager();
	for(var id in tabs)
		if(tabs[id])
			if(tabs[id][cda.path] == path)
				return saveTab(id);
	
	return -1;
}

function frameWindowTitle() {
	if(TabManager()[cda.active_id])
		return formatPath(TabManager()[cda.active_id][cda.path]).substr(_sc.workpath(cda.active_id, true).length+1);
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