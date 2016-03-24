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
let cda = new WindmillCideAliases();

function TabManager() {}

function onFileUnchanged(index) {
	
}

function onFileChanged(index) {
	
}

// !Review:: functionality
function getUnsavedFiles() {
	if(!window.checkIfTabIsUnsaved)
		return [];

	let tabs = TabManager();
	var files = [];
	for(var id in tabs)
		if(tabs[id])
			if(checkIfTabIsUnsaved(id))
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
				return saveTabContent(id);
	
	return -1;
}

function frameWindowTitle() {
	if(TabManager()[cda.active_id])
		return formatPath(TabManager()[cda.active_id][cda.path]).substr(_sc.workpath(cda.active_id, true).length+1);
}