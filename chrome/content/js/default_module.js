"use strict";

/* Module-Include */

var {TextDecoder, TextEncoder, OS} = Components.utils.import("resource://gre/modules/osfile.jsm", {});
Components.utils.import("resource://gre/modules/Task.jsm");

const OCGRP_FILEEXTENSIONS = ["ocd", "ocs","ocg","ocf","ocs", "oci", "ocp"];

//Hilfsfunktion zum loggen
function log(str, hidden, type) {	
	var clone = _mainwindow.$("#developerlog .log-listitem.draft").clone();
	clone.removeClass("draft");
	clone.appendTo(_mainwindow.$("#log-entrylist"));

	if(type)
		clone.addClass(type);
	if(hidden)
		clone.addClass("hidden");
	if(typeof str == "object") {
		clone.click(function() {
			var dlg = new WDialog("Object Information", "DEX", { modal: true, css: { "width": "450px" }, btnright: ["accept"]});
			dlg.setContent('<box style="word-wrap: break-word; white-space: pre-wrap; overflow-y: scroll; height: 360px" flex="1">'+showObj3(str)+"</box>");
			dlg.show();
			dlg = 0;
		});
		clone.addClass("object");
	}

	clone.find(".log-listitem-content").text(str+"\n");
	_mainwindow.$("#showLog").addClass("flashOnLog").addClass(type);
	setTimeout(function() {
		_mainwindow.$("#showLog").removeClass("flashOnLog").removeClass(type);
	}, 10);
	if(hidden && !getConfigData("Global", "ShowHiddenLogs"))
		return;

	dump(str + "\n");
	return;
}

function logToGitConsole(data) {
	var lines = data.split("\n");
	for(var i = 0; i < lines.length; i++) {
		var clone = _mainwindow.$("#gitlog .log-listitem.draft").clone();
		clone.removeClass("draft");
		clone.appendTo(_mainwindow.$("#gitlog-entrylist"));
		clone.find(".log-listitem-content").text(lines[i]+"\n");
	}
}

//Zum vererben diverser Objekte (Funktionen, Klassen, Objekte wie _sc etc.)
function registerInheritableObject(key) { _inheritableObjects.push(key); }

var err = Components.utils.reportError;

function warn(str, prefix) {
	alert(Locale(str, prefix));
	return true;
}

if(top != window) {
	top.Services.scriptloader.loadSubScript("chrome://windmill/content/js/default_functionalities/windmillobject.js");
	top.Services.scriptloader.loadSubScript("chrome://windmill/content/js/default_functionalities/parser.js");
	top.Services.scriptloader.loadSubScript("chrome://windmill/content/js/default_functionalities/keybindings.js");
	top.Services.scriptloader.loadSubScript("chrome://windmill/content/js/default_functionalities/filehandling.js");
	top.Services.scriptloader.loadSubScript("chrome://windmill/content/js/default_functionalities/localization.js");
	top.Services.scriptloader.loadSubScript("chrome://windmill/content/js/default_functionalities/ui-feedback.js");
	top.Services.scriptloader.loadSubScript("chrome://windmill/content/js/default_functionalities/debug.js");
	top.Services.scriptloader.loadSubScript("chrome://windmill/content/js/default_functionalities/other.js");
	
	//Zugriff auf Sprachdateien
	var __l = top.__l;

	//Zugriff auf import.js
	var _sc = top._sc, _scc = top._scc, _ws = top._ws, __ws = top.__ws;
	
	if(top.top != top.window)
		var _mainwindow = top._mainwindow;
	else
		var _mainwindow = top;

	//jQuery durchleiten
	if(typeof(jQuery) == "undefined") {
		var iframeBody = document;
		var jQuery = _mainwindow.jQuery;

		try {
			var $ = function(selector, context = iframeBody) { return jQuery(selector, context); };
		}
		catch(e) { }
	}
	
	//Keymap
	var getKeyCodeIdentifier = top.getKeyCodeIdentifier;

	//Modul/Config-Funktionen durchleiten
	var createModule = function(a,b,c,d,e) { return top.createModule(a,b,c,d,e,window); } ;
	var getModuleDef = top.getModuleDef;
	var getModuleDefByPrefix = top.getModuleDefByPrefix;
	var getModule = top.getModule;
	var getModulesByName = top.getModulesByName;
	var getModuleByName = top.getModuleByName;
	var sprintf = top.sprintf;
	
	var getConfig = top.getConfig;
	var getConfigData = top.getConfigData;
	var setConfigData = top.setConfigData;
	var saveConfig = top.saveConfig;
	var ContextMenu = top.ContextMenu;
	var ContextMenuEntry = top.ContextMenuEntry;
	var WDialog = top.WDialog;
	
	var OS_TARGET = top.OS_TARGET;
	var formatPath = top.formatPath;
	
	//Toolbar
	var addCideToolbarButton = top.addCideToolbarButton;
	var clearCideToolbar = top.clearCideToolbar;
	var hideCideToolbar = top.hideCideToolbar;
	var showCideToolbar = top.showCideToolbar;
	
	var frameWindowTitle = top.frameWindowTitle;
	
	var showNotification = top.showNotification;
	
	//Weitere Funktionen zum vererben
	var _inheritableObjects = parent._inheritableObjects || [];
	var inheritedFuncs = parent.inheritedFuncs || [];
	if(parent.inheritFuncs)
		inheritedFuncs = inheritedFuncs.concat(parent.inheritFuncs());
	//Bald nur auf _inheritableObjects umsteigen.
	if(_inheritableObjects)
		for(let i = 0; i < _inheritableObjects.length; i++)
			window[_inheritableObjects[i]] = parent[_inheritableObjects[i]];

	if(inheritedFuncs)
		for(let i = 0; i < inheritedFuncs.length; i++)
			window[inheritedFuncs[i]] = parent[inheritedFuncs[i]];
	
	//Components* durchleiten
	//var Components = top.Components;
	var Ci = top.Ci;
	var Cc = top.Cc;
	var Cm = top.Cm;
	var Cu = top.Cu;

	//Services
	var Services = top.Services;
	
	var MODULE_ID = parseInt(window.frameElement.id.replace(/module-/, ""));
	var MODULE_NAME = $(window.frameElement).attr("name");
	var MODULE_PATH = $(window.frameElement).attr("src");
	var MODULE_DEF = getModuleDef(MODULE_NAME);
	var MODULE_LANG = (function() {var t = MODULE_DEF.mainfile.split('.'); return t[t.length-1];})();
	var MODULE_LPRE = MODULE_DEF.languageprefix;
	
	log("Initialize module " + MODULE_NAME + " (" + MODULE_ID + ")\n"+
		"Definition: " + MODULE_DEF + " / Language: " + MODULE_LANG+"\n"+
		"Path: " + MODULE_PATH + "\n");

	if(MODULE_LANG == "html") {	
		var ACTIVATE_INSPECTOR = false;
	
		setTimeout(function() {
			$("head").append('<link rel="stylesheet" type="text/css" href="chrome://windmill/skin/debug.css" />');
			$("body").append('<div id="domi-hover-rect"></div>');
			$("body").append('<div id="domi-hover-text"></div>');
		
			$(":not(iframe,#domi-hover-rect,html)").hover(function(e) {
				if(!ACTIVATE_INSPECTOR)
					return false;
			
				e.stopPropagation();

				var {left, top} = $(this).offset();
				var width = $(this).css("width"), height = $(this).css("height");
				var rect = $("#domi-hover-rect").css({top, left, width, height, display: "block"});

				if(top+rect.outerHeight()+20 < $(document).height())
					$("#domi-hover-text").css("top", top+rect.outerHeight());
				else
					$("#dmoi-hover-text").css("top", top+rect.outerHeight()-20);
				$("#domi-hover-text").css("left", left);
				
				var element = '<span style="color: purple;">'+$(this).prop("tagName").toLowerCase()+'</span>';
				var idstr = "";
				if($(this).attr("id"))
					idstr = '<span style="color: blue;">#'+$(this).attr("id")+'</span>';
				var classes = $(this).attr("class");
				var classstr = ' <span style="color: orange;">';
				if(classes) {
					classes = classes.split(/\s+/);
					for(var i = 0; i < classes.length; i++) {
						classstr += "."+classes[i];
					}
				}
				classstr += "</span>";
				
				$("#domi-hover-text").html(element+idstr+classstr+" "+rect.css("width")+" x "+rect.css("height")).css("display", "block");
			}, function(e) {
				e.stopPropagation();
				
				$("#domi-hover-rect,#domi-hover-text").css("display", "none");
			}).click(function(e) {
				if(!ACTIVATE_INSPECTOR)
					return;
			});
		}, 1000);
	}

	hook("load", localizeModule);

	$(window).focus(function() {
		if(window._createCideToolbar && (!parent || (parent != window && !parent._createCideToolbar))) {
			window.clearCideToolbar();
			window._createCideToolbar();
		}

		if(parent && parent.updateChildFrameWindowFocus)
			parent.updateChildFrameWindowFocus(window);

		frameUpdateWindmillTitle();
	});
}
else {	
	MODULE_LPRE = "";
	MODULE_LANG = "xul";
	var _mainwindow = window;
}

window.addEventListener("load", function(){
	// function hook for custom-load
	// better use this, so afterload really works after all of the hooked functions
	execHook("load");
	execHook("afterload");
});

//Suche nach naechstem Element im DOM (Unter Beruecksichtigung aller Ebenen im angegebenen Container)
function* nextElementInDOM(start, container = $(document.documentElement?document.documentElement:"body"), indent = "  ") {
	let elements = $(container).children();
	for(var i = 0; i < elements.length; i++) {
		//log(`${indent}[${i}/${elements.length-1}] <${elements[i].tagName}>:${elements[i].id} (${$(elements[i]).attr("tabindex")})`);
		//ggf. nach Startpunkt suchen
		if(start) {
			if($(start)[0] == elements[i]) {
				if($(elements[i]).children()[0])
					yield* nextElementInDOM(0, elements[i], indent+"  ");
				start = false;
			}
			else if($(start).parents().index(elements[i]) != -1) {
				yield* nextElementInDOM(start, elements[i], indent+"  ");
				start = false;
			}
		}
		else {
			//Nicht sichtbare Elemente, Frames und Elemente mit Tabindex -1 ueberspringen
			if($(elements[i]).css("display") == "none" || 
			   $(elements[i]).css("visibility") == "hidden" || 
			   $(elements[i]).prop("tagName") == "iframe" ||
			   $(elements[i]).attr("tabindex") == "-1")
				continue;
			yield $(elements[i]);
			if($(elements[i]).children()[0])
				yield* nextElementInDOM(0, elements[i], indent+"  ");
		}
	}
}

function* prevElementInDOM(start, container = $(document.documentElement?document.documentElement:"body"), indent = "  ") {
	let elements = $(container).children();
	for(var i = elements.length-1; i >= 0; i--) {
		//log(`${indent}[${i}/${elements.length-1}] <${elements[i].tagName}>:${elements[i].id} (${$(elements[i]).attr("tabindex")})`);
		//ggf. nach Startpunkt suchen
		if(start) {
			if($(start)[0] == elements[i])
				start = false;
			else if($(start).parents().index(elements[i]) != -1) {
				yield* prevElementInDOM(start, elements[i], indent+"  ");
				start = false;
			}
		}
		else {
			//Nicht sichtbare Elemente, Frames und Elemente mit Tabindex -1 ueberspringen
			if($(elements[i]).css("display") == "none" || 
			   $(elements[i]).css("visibility") == "hidden" || 
			   $(elements[i]).prop("tagName") == "iframe")
				continue;
			if($(elements[i]).children()[0])
				yield* prevElementInDOM(0, elements[i], indent+"  ");
			yield $(elements[i]);
		}
	}
}

//Tabfocus
$(document).keydown(function(e) {
	//log(showObj2(e, 0, {avoidErr: true}));
	if(e.currentTarget != document)
		return;
	//Nicht auf Event-Bubbling reagieren
	if(!document.activeElement || $(document.activeElement).prop("tagName") == "iframe")
		return;

	if(e.keyCode == 9) {
		let elm = document.activeElement;

		//Naechstes fokussierbares Element suche
		let search = e.shiftKey?prevElementInDOM:nextElementInDOM;
		let start = document.activeElement, container = $(start).parents('[data-tabcontext="true"]')[0], elmdom = search(start, container), result;
		while(result = elmdom.next()) {
			if(result.done && start) {
				elmdom = search(0, container);
				continue;
			}
			let elm = result.value;
			if(start == elm[0])
				break;
			if(elm.attr("tabindex") == "-1")
				continue;
			elm.focus();
			//Auch auf Parents untersuchen, um Shadow DOM zu beruecksichtigen (XUL Textboxen laden HTML-Inputfelder)
			if(document.activeElement == elm[0] || $(document.activeElement).parents().index(elm[0]) != -1)
				break;
		}
		e.preventDefault();
	}
});

var domwu = window.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowUtils) || top.domwu;

function frameUpdateWindmillTitle() {
	if(window.frameWindowTitle && window.frameWindowTitle() != -1) {
		setWindowTitle("Windmill");
		if(window.frameWindowTitle()) {
			try {
				setWindowTitle(window.frameWindowTitle() + " - Windmill");
			} catch(e) {}
		}
	}
}


function removeSubFrames() {
	if($("iframe").get(0)) {
		$("iframe").each(function(a, wdw) {
			if(wdw.contentWindow.removeSubFrames)
				wdw.contentWindow.removeSubFrames();
		});
		
		$("iframe").remove();
	}
}
