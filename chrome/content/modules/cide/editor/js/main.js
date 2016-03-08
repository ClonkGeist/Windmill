var defaultTheme = getConfigData("CIDE", "EditorTheme") || "chrome";

// set the toolbar up
hook("load", function() {
	var el = $("#tool-save").mousedown(function(e) {
		e.preventDefault();
		saveDocument(-1);
	}).get(0);
	tooltip(el, Locale("$save_label$"), "html");
	
	
	el = $("#tool-search").mousedown(function(e) {
		e.preventDefault();
	}).get(0);
	
	tooltip(el, Locale("$search_label$"), "html");
	
	el = $("#tool-snippet").click(window["showSnippetPanel"]).get(0);
	tooltip(el, Locale("$add_snipped_desc$"), "html");

});

function createCideToolbar() {}

/**
			Editor management
*/

var editors = {},
	editorData = [],
	dumpedEditorIds = [],
	activeId,
	a_E;

function addScript(text, highlightMode, id, path, fShow) {

	if(!ace)
		return err("Could not initialize Scripteditor Module because ace is unavailable.");

	$("#editor-container").append("<div stlye=\"display: none\" id=\"editor-"+id+"\" class=\"main-editor\">"+text+"</div>");
	
	editors[id] = ace.edit("editor-"+id);
	
	var _e = editors[id];
	
	_e.setTheme("ace/theme/" + defaultTheme);
	
	if(highlightMode)
		editors[id].getSession().setMode("ace/mode/" + highlightMode);
	
	_e.commands.addCommand({
		name: "showKeyboardShortcuts",
		bindKey: {win: "Ctrl-Alt-h", mac: "Command-Alt-h"},
		exec: function(editor) {
			ace.config.loadModule("ace/ext/keybinding_menu", function(module) {
				module.init(editor);
				editor.showKeyboardShortcuts()
			})
		}
	});
	
	// remove local completer
	var langTools = ace.require("ace/ext/language_tools");
	langTools.setCompleters([langTools.keyWordCompleter, langTools.snippetCompleter]);
	
	if(highlightMode == "ocscript")
		initOCEditorBehaviour(id);
	
	if(highlightMode == "ocscript" || highlightMode == "c4landscape") {		
		_e.setOptions({
			enableBasicAutocompletion: true,
			enableSnippets: true,
			enableLiveAutocompletion: true,
		});
	}
	
	// right click handler
	$("#editor-"+id).on("contextmenu", function(e) {
		var x = e.clientX,
			y = e.clientY;
			
		var s = $(this).find(".ace_selection");
		
		// check wether click is on top of any selection
		var fClickOntoSelection = false;
		
		for(var i = 0; i < s.length; i++) {
			var p = $(s.get(i)).offset();
			
			if(	x > p.left && 
				y > p.top &&
				x < $(s.get(i)).width() + p.left &&
				y < $(s.get(i)).height() + p.top) {
				
				fClickOntoSelection = true;
				break;
			}	
		}
		
		initEditorContextMenu(x, y, id, fClickOntoSelection);
	});
	
	// commands
	_e.commands.addCommand({
		name: 'ShiftFieldsets',
		bindKey: {win: 'Tab',  mac: 'Tab'},
		exec: function(editor) {
			if(!editor.snptMode)
				return false;
			
			editor.snptMode.findNext();
			// remove if end reached
			if(!editor.snptMode.hasOpen())
				editor.snptMode = null;
		},
		readOnly: false
	});
	
	var s = addEditorDataSet(id);
	
	s.filePath = path;
	
	editors[id].dataSet = s;
	
	if(fShow || !$(".visible").length)
		showDeckItem(id);
}

function addEditorDataSet(editorId) {
	var id = editorData.length;
	editorData[id] = {
		id: editorId,
		activeSearch: false,
		"searchProps": {
			needle: "",
			wrap: false,
			caseSensitive: false,
			backwards: false,
			wholeWord: false,
		},
	};
	
	return editorData[id];
}

function clearDataSet(id) {
	editors[id].dataSet = false;
}

function getDataSet(id) {
	return editors[id].dataSet;
}

function getEditorFilePath(id) {
	return editors[id].dataSet.filePath;
}

function fileLoaded(path) {
	for(var id in editors)
		if(editors[id])
			if(editors[id].dataSet.filePath == path)
				return id;
	
	return -1;
}

function saveFileByPath(path) {
	for(var id in editors)
		if(editors[id])
			if(editors[id].dataSet.filePath == path)
				return saveDocument(id);
	
	return -1;
}

function showDeckItem(id) {
	$(".visible").removeClass("visible");
	$("#editor-"+id).addClass("visible");
	activeId = id;
	
	// set pointer
	a_E = editors[activeId];
	a_E.focus();
	
	hideParamlist();
	
	updateSearchProps();
	
	if(a_E.dataSet.activeSearch)
		$('#searchBar').addClass("visible");
		
	frameUpdateWindmillTitle();	
}

function frameWindowTitle() {
	if(editors[activeId])
		return formatPath(getEditorFilePath(activeId)).substr(_sc.workpath(activeId, true).length+1);
}

function removeDeckItem(id) {
	$("#editor-" + id).remove();
	
	// remove dataset
	clearDataSet(id);
	
	if(activeId == id)
		activeId = undefined;
	
	editors[id] = null;
}

function applyTheme(themeName) {

	defaultTheme = themeName;
	
	for(var id in editors)
		editors[id].setTheme("ace/theme/" + themeName);
}

function saveDocument(id) {
	if(id === -1)
		id = activeId;
	
	if(!editors[id])
		return false;
	
	editors[id].getSession().getUndoManager().markClean();
	writeFile(getEditorFilePath(id), editors[id].getValue());
	EventInfo("$EI_Saved$", -1);
}

function getDocumentValue(id) {
	return editors[id].getSession().getDocument().getValue();
}

function setDocumentValue(id, text) {
	return editors[id].getSession().getDocument().setValue(text);
}

// ------------ Search

function triggerReplaceInput() {
	$("#replace-wrapper").toggleClass("enabled");
}

function searchNext() {
	editors[activeId].findNext();
}

function searchPrevious() {
	editors[activeId].findPrevious();
}

function openSearchDialog() {
	$('#searchBar').addClass("visible");
	$("#search-needle").focus();
	
	a_E.dataSet.activeSearch = true;
}

function closeSearchDialog() {
	$("#searchBar").removeClass("visible");
	
	a_E.dataSet.activeSearch = false;
}

function toggleSearchProp(propName, elButton) {
	$(elButton).toggleClass("enabled");
	getDataSet(activeId).searchProps[propName] = $(elButton).hasClass("enabled");
}

function updateSearchProps(id) {
	var v = getDataSet(id || activeId).searchProps;
	
	if(v.backwards != $("#search-backwards").hasClass("enabled"))
		$("#search-backwards").toggleClass("enabled");
	
	if(v.wholeWord != $("#search-wholeWorld").hasClass("enabled"))
		$("#search-wholeWorld").toggleClass("enabled");
	
	if(v.caseSensitive != $("#search-csense").hasClass("enabled"))
		$("#search-csense").toggleClass("enabled");
	
	if(v.wrap != $("#search-wrap").hasClass("enabled"))
		$("#search-wrap").toggleClass("enabled");
	
	$("#search-needle").val(v.needle);
}

function doSearch(needle) {
	var props = getDataSet(activeId).searchProps;
	props.regExp = needle instanceof RegExp;
	
	a_E.find(needle, props);
}

//----------------- TabData

function getTabData(tabid) {
	var e = editors[tabid], es = e.getSession();
	var data = {
		path: getEditorFilePath(tabid),
		text: es.getValue(),
		lang: es.getMode().$id.replace("ace/mode/", ""),
		scrollx: es.getScrollLeft(),
		scrolly: es.getScrollTop()
	};
	
	return data;
}

function dropTabData(data, tabid) {
	addScript(data.text, data.lang, tabid, data.path, true);
	
	editors[tabid].getSession().setScrollLeft(data.scrollx);
	editors[tabid].getSession().setScrollTop(data.scrolly);
	
	return true;
}

function initEditorContextMenu(x, y, editorId, fOnSelectionClicked) {
	
}

function getUnsavedFiles() {
	//Soll einen Array mit Objekten in folgendem Format zurueckgeben:
	// { filepath: canvasArray[id].f.path, index: id, module: window }
	//So ein Objekt fuer jede Datei.

	//Aus Testgruenden mach ich hier einfach irgendwas hin.
	var files = [];
	for(var id in editors)
		if(editors[id])
			if(!editors[id].getSession().getUndoManager().isClean()) //Check ob ungespeicherte Aenderungen vorhanden sind
				files.push({ filepath: editors[id].dataSet.filePath, index: id, module: window });
	err(files);
	return files;
}

// space