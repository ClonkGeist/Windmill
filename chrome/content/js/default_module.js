"use strict";

/* Module-Include */

var {TextDecoder, TextEncoder, OS} = Components.utils.import("resource://gre/modules/osfile.jsm", {});
Components.utils.import("resource://gre/modules/Task.jsm");

const OCGRP_FILEEXTENSIONS = ["ocd", "ocs","ocg","ocf","ocs", "oci", "ocp"];
const MAX_LOG_ENTRIES = 200;

//Hilfsfunktion zum loggen
function log(str, hidden, type) {
	let logitems = _mainwindow.$("#developerlog .log-listitem");
	if(logitems.length > MAX_LOG_ENTRIES && !getConfigData("Global", "DisableLogLimitation"))
		$(logitems[1]).remove();

	//Shorthand for logging
	if(typeof hidden == "string" && !type) {
		type = hidden;
		hidden = false;
	}
	let clone = _mainwindow.$("#developerlog .log-listitem.draft").clone();
	clone.removeClass("draft");
	clone.appendTo(_mainwindow.$("#log-entrylist"));
	
	if(!_mainwindow.startupReady) {
		let errorbox = _mainwindow.$("#startup-errorlog > vbox");
		errorbox.text(errorbox.text() + str+"\n");
	}

	//Ggf. nur loggen wenn mans wirklich will.
	if(type == -1 && !getConfigData("Global", "ShowHiddenLogs"))
		return;

	if(type)
		clone.addClass(type);
	if(hidden)
		clone.addClass("hidden");
	if(typeof str == "object") {
		let str2 = str;
		clone.click(function() {
			let dlg = new WDialog("Object Information", "DEX", { modal: true, css: { "width": "450px" }, btnright: ["accept"]});
			dlg.setContent('<box style="word-wrap: break-word; white-space: pre-wrap; overflow-y: scroll; height: 360px" flex="1">'+showObj3(str2)+"</box>");
			dlg.show();
			dlg = 0;
		});
		clone.addClass("object");
		if(!str.toString || str.toString().length == 0)
			str = "[object " + str.constructor.name + "]";
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

window.addEventListener("load", function(){
	// function hook for custom-load
	// better use this, so afterload really works after all of the hooked functions
	execHook("load");
	execHook("afterload");
});

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
	top.Services.scriptloader.loadSubScript("chrome://windmill/content/js/default_functionalities/inherit.js");
	
	var MODULE_ID = parseInt(window.frameElement.id.replace(/module-/, ""));
	var MODULE_NAME = $(window.frameElement).attr("name");
	var MODULE_PATH = $(window.frameElement).attr("src");
	var MODULE_DEF = getModuleDef(MODULE_NAME);
	if(!MODULE_DEF)
		MODULE_DEF = { mainfile: "", languageprefix: "" };
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

	hook("load", function() {
		localizeModule();
		initializeTooltips();
	});

	$(window).focus(function() {
		if(window._createCideToolbar && (!parent || (parent != window && !parent._createCideToolbar))) {
			window.clearCideToolbar();
			window._createCideToolbar();
		}

		if(parent && parent.updateChildFrameWindowFocus)
			parent.updateChildFrameWindowFocus(window);
		_mainwindow.setFocusedFrame(window);

		frameUpdateWindmillTitle();
	});
}
else {	
	MODULE_LPRE = "";
	MODULE_LANG = "xul";
	var _mainwindow = window;
	
	//let worker;
	class OSError {
		constructor(message, code) {
			this.message = message;
			this.code = code;
		}
		toString() {
			return "OSError: " + this.message;
		}
	}

	window.ctypesWorker = function(fnname, ...pars) {
		let worker = new BasePromiseWorker("resource://ctypes/js-ctypes.worker.js");
		worker.ExceptionHandlers["OSError"] = function(msg) {
			return new OSError(msg.message, msg.code);
		};

		return worker.post(fnname, pars);
	}
	registerInheritableObject("ctypesWorker");
}

function initializeTooltips(container, options = {}) {
	$("[data-tooltip!='']", container).each(function() {
		let desc = $(this).attr("data-tooltip");
		if(!desc)
			return;
		$(this).removeAttr("data-tooltip");
		tooltip(this, desc, options.lang, options.duration, options);
	});
}

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
