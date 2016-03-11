var defaultTheme = getConfigData("CIDE", "EditorTheme") || "chrome";

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
	
	remapKeybindings(_e);
	
	_e.setTheme("ace/theme/" + defaultTheme);
	
	if(highlightMode)
		editors[id].getSession().setMode("ace/mode/" + highlightMode);
	
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
	
	_e.__id = id;
	_e.__scope = highlightMode;
	_e.__filePath = path;
	
	if(fShow || !$(".visible").length)
		showDeckItem(id);
}


function getEditorFilePath(id) {
	return editors[id].__filePath;
}

function fileLoaded(path) {
	for(var id in editors)
		if(editors[id])
			if(editors[id].__filePath == path)
				return id;
	
	return -1;
}

function saveFileByPath(path) {
	for(var id in editors)
		if(editors[id])
			if(editors[id].__filePath == path)
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
		
	frameUpdateWindmillTitle();	
}

function frameWindowTitle() {
	if(editors[activeId])
		return formatPath(getEditorFilePath(activeId)).substr(_sc.workpath(activeId, true).length+1);
}

function removeDeckItem(id) {
	$("#editor-" + id).remove();
		
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

/* !Feature:: {
		insert snippet,
		copy,
		paste,
		cut-out,
		...
	}
	*/
function initEditorContextMenu(x, y, editorId, fOnSelectionClicked) {
	
}


// !Review:: functionality
function getUnsavedFiles() {
	
	var files = [];
	for(var id in editors)
		if(editors[id])
			if(!editors[id].getSession().getUndoManager().isClean())
				files.push({ filepath: editors[id].__filePath, index: id, module: window });
	
	return files;
}

function createCideToolbar(startup) {
	addCideToolbarButton("icon-save", function() { saveDocument(-1); });
	addCideToolbarButton("icon-search", function() {  a_E.execCommand("search"); });
	addCideToolbarButton("icon-snippet", function() { showSnippetDialog(a_E.__scope); });
	
	return true;
}


function remapKeybindings(editor) {
	var commandsToRemove = [
		"selectall",
		"showSettingsMenu",
		"centerselection",
		"gotoline",
		"undo",
		"redo",
		"find"
	];
	
	
	var list = editor.commands.byName,
		newList = {};
	
	for(var i = 0; i < commandsToRemove.length; i++)
		newList[commandsToRemove[i]] = list[commandsToRemove[i]];
	
	editor.commands.removeCommands(newList);
	
	for(var i = 0; i < commandsToRemove.length; i++)
		delete newList[commandsToRemove[i]].bindKey;
		
	editor.commands.addCommand(newList)
}

hook("load", function() {
	
	bindKeyToObj(new KeyBinding("Save", "Ctrl-S", function() { saveDocument(-1); }));
	bindKeyToObj(new KeyBinding("OpenSnippetDialog", "Ctrl-Alt-S", function() { showSnippetDialog(a_E.__scope); }));
	bindKeyToObj(new KeyBinding("Select All", "Ctrl-A", function() { a_E.selectAll(); }));
	bindKeyToObj(new KeyBinding("Undo", "Ctrl-Z", function() { a_E.undo(); }));
	bindKeyToObj(new KeyBinding("Redo", "Ctrl-Y", function() { a_E.redo(); }));
	bindKeyToObj(new KeyBinding("RemoveRight", "Delete", function() { a_E.remove("right"); }));
	bindKeyToObj(new KeyBinding("RemoveLeft", "Backspace", function() { a_E.remove("left"); }));
	bindKeyToObj(new KeyBinding("Find", "Ctrl-F", function() { 
		config.loadModule("ace/ext/searchbox", function(e) {
			e.Search(a_E)
		});
		
		var kb = editor.searchBox.$searchBarKb;
		var command = kb.commands["Ctrl-f|Command-f|Ctrl-H|Command-Option-F"];
		
		if(command) {
			command.bindKey = ""
            kb.addCommand(command)
		}
	}));
	bindKeyToObj(new KeyBinding("Replace", "Ctrl-H", function() { config.loadModule("ace/ext/searchbox", function(e) {e.Search(a_E, true); }); }));
	
	bindKeyToObj(new KeyBinding("GoToLine", "Ctrl-L", function() {
		var dlg = new WDialog("$DlgGoToLine$", MODULE_LPRE, { modal: true, css: { "width": "400px" }, btnright: ["cancel"]});
		
		dlg.setContent("<textbox id=\"dlg-gotoline-input\" />");
		dlg.show();
		
		$(dlg.element).find("#dlg-gotoline-input").keypress(function(e) {
			if(e.which == 13) {
				var line = parseInt($(this).val());
				if (!isNaN(line)) {
					a_E.gotoLine(line);
				}
				
				dlg.hide();
				dlg = null;
			}
		});
		
	}));
});


// space