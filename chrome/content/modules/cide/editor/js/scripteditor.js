var defaultTheme = getConfigData("CIDE", "EditorTheme") || "chrome";

/**
		Editor management
*/

var editors = {},
	editorData = [],
	dumpedEditorIds = [],
	CM_ACTIVEID,
	CM_PATHALIAS = "__filePath",
	a_E;

function TabManager() { return editors; }
	
function addScript(highlightMode, id, path, fShow) {
	return Task.spawn(function*() {
		log(">> " + highlightMode);
		let text = yield OS.File.read(path, {encoding: "utf-8"});
		if(!ace)
			return err("Could not initialize Scripteditor Module because ace is unavailable.");
		
		$("#editor-container").append("<div stlye=\"display: none\" id=\"editor-"+id+"\" class=\"main-editor\">"+text+"</div>");
		
		editors[id] = ace.edit("editor-"+id);
		
		var _e = editors[id];
		
		remapKeybindings(_e);
		
		_e.setTheme("ace/theme/" + defaultTheme);
		
		if(highlightMode)
			editors[id].getSession().setMode("ace/mode/" + highlightMode);
		editors[id].getSession().on("change", function(e) {
			//setTimeout, da der UndoManager erst nach dem Event geupdatet wird
			setTimeout(function() {
				if(editors[id].getSession().getUndoManager().isClean())
					onFileUnchanged(id);
				else
					onFileChanged(id);
			}, 1);
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
		
		_e.__id = id;
		_e.__scope = highlightMode;
		_e.__filePath = path;
		
		if(fShow || !$(".visible").length)
			showDeckItem(id);
	});
}


function getEditorFilePath(id) {
	return editors[id].__filePath;
}

function showDeckItem(id) {
	$(".visible").removeClass("visible");
	$("#editor-"+id).addClass("visible");
	CM_ACTIVEID = id;
	
	// set pointer
	a_E = editors[CM_ACTIVEID];
	if(!a_E)
		return;
	a_E.focus();
	
	hideParamlist();
		
	frameUpdateWindmillTitle();	
}

function removeDeckItem(id) {
	$("#editor-" + id).remove();
		
	if(CM_ACTIVEID == id)
		CM_ACTIVEID = undefined;
	
	editors[id] = null;
}

function applyTheme(themeName) {

	defaultTheme = themeName;
	
	for(var id in editors)
		editors[id].setTheme("ace/theme/" + themeName);
}

function saveTabContent(...pars) {
	return saveDocument(...pars);
}

function saveDocument(id) {
	if(id === -1)
		id = CM_ACTIVEID;
	
	if(!editors[id])
		return false;
	
	Task.spawn(function*() {
		lockModule();
		yield OS.File.writeAtomic(getEditorFilePath(id), editors[id].getValue(), {encoding: "utf-8"});
		editors[id].getSession().getUndoManager().markClean();
		unlockModule();
		EventInfo("$EI_Saved$", -1, true);
	});
}

function getDocumentValue(id) {
	return editors[id].getSession().getDocument().getValue();
}

function setDocumentValue(id, text, fRestoreScrollPos) {
	var s = editors[id].getSession(),
		scrollTop = s.getScrollTop();
	
	var r = s.getDocument().setValue(text);
	if(fRestoreScrollPos)
		s.setScrollTop(scrollTop);
	return r;
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
function checkIfTabIsUnsaved(id) { return !editors[id].getSession().getUndoManager().isClean(); }

function createCideToolbar(startup) {
	addCideToolbarButton("icon-save", function() { saveTab(-1); });
	addCideToolbarButton("icon-search", function() {  a_E.execCommand("find"); });
	addCideToolbarButton("icon-snippet", function() { showSnippetDialog(a_E.__scope); });
	
	return true;
}


function remapKeybindings(editor) {
	var commandsToRemove = [
		"selectall",
		"showSettingsMenu",
		//"centerselection",
		"gotoline",
		"undo",
		"redo",
		"find",
		"removeline",
		"duplicateSelection",
		"backspace",
		"del"
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
	$(window).bind("paste", function(e) {
		e.preventDefault();
	});
	bindKeyToObj(new KeyBinding("Save", "Ctrl-S", function() { saveTab(-1); }));
	bindKeyToObj(new KeyBinding("DuplicateSel", "Ctrl-Shift-D", function() { a_E.execCommand("duplicateSelection"); }));
	bindKeyToObj(new KeyBinding("Paste", "Ctrl-V", function() { a_E.execCommand("paste", _sc.clipboard2.get()); }));
	bindKeyToObj(new KeyBinding("RemoveLine", "Ctrl-D", function() { a_E.execCommand("removeline"); }));
	bindKeyToObj(new KeyBinding("OpenSnippetDialog", "Ctrl-Alt-S", function() { err("ES"); showSnippetDialog(a_E.__scope); }));
	bindKeyToObj(new KeyBinding("SelectAll", "Ctrl-A", function() { a_E.selectAll(); }));
	bindKeyToObj(new KeyBinding("Undo", "Ctrl-Z", function() { a_E.undo(); }));
	bindKeyToObj(new KeyBinding("Redo", "Ctrl-Y", function() { a_E.redo(); }));
	bindKeyToObj(new KeyBinding("RemoveRight", "DELETE", function() { a_E.remove(); }));
	bindKeyToObj(new KeyBinding("RemoveLeft", "BACK_SPACE", function() { a_E.remove("left"); }));
	bindKeyToObj(new KeyBinding("Find", "Ctrl-F", function() {
		
		if(a_E.SearchBox && a_E.SearchBox.isFocused)
			a_E.SearchBox.$searchBarKb.execCommand("Ctrl-f|Command-f");
		else
			ace.require("ace/config").loadModule("ace/ext/searchbox", function(e) {
					e.Search(a_E)
				
				var kb = a_E.searchBox.$searchBarKb;
				var command = kb.commands["Ctrl-f|Command-f"]
				
				if(command) {
					command.bindKey = ""
					kb.addCommand(command)
				}
				
				command = kb.commands["Ctrl-H|Command-Option-F"]
				
				if(command) {
					command.bindKey = ""
					kb.addCommand(command)
				}
			});
	}));
	bindKeyToObj(new KeyBinding("Replace", "Ctrl-H", function() { 
		if(a_E.SearchBox && a_E.SearchBox.isFocused)
			a_E.SearchBox.$searchBarKb.execCommand("Ctrl-H|Command-Option-F");
		else
			ace.require("ace/config").loadModule("ace/ext/searchbox", function(e) {
					e.Search(a_E, true)
				
				var kb = a_E.searchBox.$searchBarKb;
				var command = kb.commands["Ctrl-f|Command-f"]
				
				if(command) {
					command.bindKey = ""
					kb.addCommand(command)
				}
				
				command = kb.commands["Ctrl-H|Command-Option-F"]
				
				if(command) {
					command.bindKey = ""
					kb.addCommand(command)
				}
			});
	}));
	
	bindKeyToObj(new KeyBinding("GoToLine", "Ctrl-L", function() {
		var dlg = new WDialog("$DlgGoToLine$", MODULE_LPRE, { modal: true, css: { "width": "400px" }, btnright: ["cancel"]});
		
		dlg.setContent("<textbox id=\"dlg-gotoline-input\" placeholder=\"$DlgGoToLineDefault$\"/>");
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
		}).focus();
		
	}));
});


// space