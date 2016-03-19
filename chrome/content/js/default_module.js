"use strict";

/* Module-Include */

var {TextDecoder, TextEncoder, OS} = Components.utils.import("resource://gre/modules/osfile.jsm", {});
Components.utils.import("resource://gre/modules/Task.jsm");

//Hilfsfunktion zum loggen
function log(str, hidden, type) {
	if(getConfigData("Global", "DevMode")) {
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
	}
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

/* hook api */

var _HOOKS = {};
function hook(eventName, fn) {
	if(!_HOOKS[eventName])
		_HOOKS[eventName] = [];
	
	// save function or function name
	_HOOKS[eventName].push(fn);	
}

function execHook(eventName, ...args) {
	var list = _HOOKS[eventName];
	
	if(!list)
		return;
	
	for(var item in list) {
		if(typeof list[item] === "function")
			list[item].call(list[item], ...args);
		else if(list[item] && window[list[item]])
			window[list[item]].call(null, ...args);
		else
			err("Problem with executing hook: " + list[item]);
	}
}

class WindmillObject {
	//Aufrufen ueber super() fuehrt atm zu Abstuerze, kann spaeter nachgeliefert werden.
	constructor() {
		this._HOOKS = [];
	}
	
	hook(eventName, fn) {
		if(!this._HOOKS)
			this._HOOKS = [];
		
		if(!this._HOOKS[eventName])
			this._HOOKS[eventName] = [];
		
		this._HOOKS[eventName].push(fn);
	}
	
	execHook(eventName, ...args) {
		if(!this._HOOKS)
			return;

		var list = this._HOOKS[eventName];
	
		if(!list)
			return;
		
		for(var item in list) {
			if(typeof list[item] === "function")
				list[item].call(this, ...args);
			else
				err("Problem with executing hook: " + list[item]);
		}
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
			var $ = function (selector) { return jQuery(selector, iframeBody); };
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
		
		//Sprache aktualisieren
		hook("load", function() {
			var rgx = /\$[a-zA-Z0-9_]+?\$/g;
			var getReplacement = function(lgreplace) {
				return __l[MODULE_LPRE+"_"+lgreplace.replace(/\$/g, "")];
			}
			var fnLocale = function(i, obj) {
				//Keine Lokalisierung
				if($(obj).attr("no_localization") != undefined)
					return;
				
				//Attribute durchgehen
				jQuery.each(obj.attributes, function(j, attr) {
					var match = $(obj).attr(attr.name).match(rgx);
					if(match)
						$(obj).attr(attr.name, getReplacement(match[0]));
				});
				
				//Textnodes durchgehen
				$(obj).contents().each(function() {
					if(this.nodeType == 3) {
						this.nodeValue = jQuery.trim($(this).text()).replace(rgx, function(match) {
							if(getReplacement(match))
								return getReplacement(match);
							else
								return match;
						});
					}
				});
				
				jQuery.each($(obj).children("*"), fnLocale);
			}
			jQuery.each($("body > *"), fnLocale);
		});
	}
	else if(MODULE_LANG == "xul") {
		//Sprache aktualisieren
		hook("load", function() {
			var rgx = /\$[a-zA-Z0-9_]+?\$/g;
			var getReplacement = function(lgreplace) {
				return __l[MODULE_LPRE+"_"+lgreplace.replace(/\$/g, "")];
			}
			var fnLocale = function(i, obj) {
				//Keine Lokalisierung
				if($(obj).attr("no_localization"))
					return;
				
				//Attribute durchgehen
				jQuery.each(obj.attributes, function(j, attr) {
					var match = $(obj).attr(attr.name).match(rgx);
					if(match)
						$(obj).attr(attr.name, getReplacement(match[0])); //Funktioniert nicht bei Attribut "emptytext"? [=> placeholder-Attribut verwenden!]
				});
				
				//Textnodes durchgehen
				$(obj).contents().each(function() {
					if(this.nodeType == 3) {
						this.nodeValue = jQuery.trim($(this).text()).replace(rgx, function(match) {
							if(getReplacement(match))
								return getReplacement(match);
							else
								return match;
						});
					}
				});
				
				jQuery.each($(obj).children("*"), fnLocale);
			}
			jQuery.each($(document.documentElement).children("*"), fnLocale);
		});
	}

	$(window).focus(function() {
		if(window.createCideToolbar) {
			window.clearCideToolbar();
			window.createCideToolbar();
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

function Locale(str, prefix) {
	if(!prefix && prefix !== "")
		prefix = MODULE_LPRE;

	if(prefix == -1)
		prefix = "";

	if(!str)
		return str;
	
	var lgreplace = str.match(/\$[a-zA-Z0-9_]+?\$/g);
	for(var d in lgreplace) {
		var id = lgreplace[d];
		var str2 = __l[prefix+"_"+id.match(/\$([a-zA-Z0-9_]+?)\$/)[1]];
		
		if(str2)
			str = str.replace(RegExp(id.replace(/\$/g, "\\$")), str2);
	}
	
	return str;
}

function getClonkExecutablePath(filename_only) {
	//Alternative Executabledatei
	var name = getConfigData("Global", "AlternativeApp");
	if(!name) {
		if(OS_TARGET == "WINNT")
			name = "openclonk.exe";
		else
			name = "openclonk";
	}

	if(filename_only)
		return name;
	return _sc.clonkpath() + "/" + name;
}

function getC4GroupPath() {
	if(OS_TARGET == "WINNT")
		name = "c4group.exe";
	else
		name = "c4group";

	return _sc.clonkpath() + "/" + name;
}

var domWrapper;

function displayDOM(el, lang) {
	var css = `position: absolute;
	bottom: 0;
	left: 0;
	right: 0;`;
	if(!domWrapper) {
		if(lang == "xul")
			domWrapper = $('<box style="'+css+'"></box>')[0];
		else
			domWrapper = $('<div style="'+css+'"></div>')[0];
	}
	err(parseHTML(el));
	$(domWrapper).text(parseHTML(el));
}

function parseHTML(el) {
	var str = "<"+el.nodeName+" >";
	
	for(var i in el.childNodes) {	
		err(i + "  ::  " + el.childNodes[i])
		str += parseHTML(el.childNodes[i]);
	}
	return str + "</"+el.nodeName+">";
}

function parseCssStyle(el) {
	var str = "", style = window.getComputedStyle(el);

	for(var i = 0; i < style.length; i++)
		str += style.item(i) + ": " + style.getPropertyValue(style.item(i)) + "\n";

	return str;
}

function* parseINI2(value) {
	if(typeof value == "string")
		value = parseINIArray(value);
	
	for(var sect in value) {
		if(value[sect])
			yield sect;
		else
			continue;

		for(var key in value[sect])
			yield { sect, key, val: value[sect][key] };
	}
}	

function parseINIArray(text) {
	var lines = text.split("\n");
	var data = [], current_section = 0;
	for(var i = 0; i < lines.length; i++) {
		var line = lines[i];
		if(line.search(/[^=\[]+#/) == 0)
			continue;
		
		if(line.search(/[^=.]*\[[^=.]+\][^=.]*/) == 0) {
			//Section
			current_section = line.match(/[^=.]*\[([^=.]+)\][^=.]*/)[1];
			data[current_section] = [];
		}
		else if(line.search(/.=./) != -1) {
			var key = line.match(/(.+?)=/)[1];
			var value = line.match(/.+?=(.+)/)[1];

			if(!data[current_section])
				data[current_section] = [];
			data[current_section][key] = value;
		}
	}

	return data;
}

function parseINIValue(value, type, default_val) {
	if(value == undefined)
		return default_val;

	if(type == "int") {
		value = parseInt(value);
		if(isNaN(value))
			return default_val;
		else
			return value;
	}
	else if(type == "bool" || type == "boolean") {
		if(isNaN(parseInt(value))) {
			if(value.toUpperCase() == "TRUE")
				return true;
			else if(value.toUpperCase() == "FALSE")
				return false;
			else
				return default_val;
		}
		else
			return !!parseInt(value);
	}
	
	//Currently not supported
	return value;
}

function readFile(input, nohtml) {
	if(!input)
		return false;
	
	if(input.isFile)
		var f = input;
	else
		var f = _sc.file(input);
	
	if(!f.exists())
		return false;

	var	charset = "utf-8",
		fs = _sc.ifstream(f, 1, 0, false),
		cs = _sc.cistream(),
		result = {};
		cs.init(fs, charset, fs.available(), cs.DEFAULT_REPLACEMENT_CHARACTER);
	
	cs.readString(fs.available(), result);

	cs.close();
	fs.close();
	
	//HTML-Codes entschaerfen
	if(nohtml)
		result.value = result.value.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
	
	return result.value;
}

function writeFile(path, text, fCreateIfNonexistent) {
	if(path instanceof Ci.nsIFile)
		var f = path;
	else
		var f = new _sc.file(path);

	if(!f.exists() && fCreateIfNonexistent)
		f.create(f.NORMAL_FILE_TYPE, 0o777);
	
	var fstr = _sc.ofstream(f, _scc.PR_WRONLY|_scc.PR_TRUNCATE, 0x200);
	var cstr = _sc.costream();

	cstr.init(fstr, "utf-8", text.length, Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
	cstr.writeString(text);

	cstr.close();
	fstr.close();
}

function OSFileRecursive(sourcepath, destpath, callback, operation = "copy", noOverwrite = (operation == "copy"), __rec) {
	//TODO: Overwrite vorschlagen
	let task = Task.spawn(function*() {
		let f = new _sc.file(sourcepath), extra = "", file;
		if(!f.isDirectory()) {
			try { yield OS.File[operation](sourcepath, destpath, {noOverwrite}); }
			catch(e) {
				if(noOverwrite == 2)
					throw e;
				file = yield OS.File.openUnique(destpath, { humanReadable: true });
				destpath = file.path;
				yield OS.File[operation](sourcepath, destpath);
			}
			return destpath;
		}
		else {
			let counter = 0;
			while(true) {
				try { yield OS.File.makeDir(destpath+extra, {ignoreExisting: false}); }
				catch(e) {
					if(!e.becauseExists)
						throw e;
					if(noOverwrite == 2)
						throw e;
					if(counter > 99)
						throw "Could not create an alternative name";
					extra = " - " + (++counter);
					continue;
				}
				destpath += extra;
				break;
			}
		}
		
		let entries = f.directoryEntries;
		while(entries.hasMoreElements()) {
			let entry = entries.getNext().QueryInterface(Ci.nsIFile);

			if(callback)
				callback(entry.leafName, entry.path);

			yield OSFileRecursive(entry.path, destpath+"/"+entry.leafName, callback, operation, noOverwrite, true);
		}

		//Ggf. nochmal aufraeumen
		if(f.isDirectory())
			if(!__rec && operation == "move")
				yield OS.File.removeDir(sourcepath, {ignoreAbsent: true})

		return destpath+extra;
	});
	task.then(null, function(reason) {
		log(reason);
	});
	
	return task;
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

var tooltipTimeout, tooltipEl;

function tooltip(targetEl, desc, lang, duration) {
	desc = Locale(desc);
	if(!duration)
		duration = 600; // ms

	$(targetEl).mouseenter(function() {
		clearTooltip();
		
		tooltipTimeout = setTimeout(() => {
			var el = $('<'+(lang === "html"?'div style="background-color: black"':'panel')+'></'+(lang == "html"?'div':'panel')+'>')[0];

			$(this).append(el);

			$(el).css(toolTipStyle).text(desc);

			var [x,y,w,h] = [this.offsetLeft, this.offsetTop, this.offsetWidth, this.offsetHeight];
			
			// if its too near to the upper border
			if(y < el.offsetHeight)
				y += h; // then show it at the bottom
			else // otherwise lift it so the original element is still visible
				y -= el.offsetHeight;
			
			// center the x position relative to the original element
			x += (w/2 - el.offsetWidth/2);
			
			// if its too close to the left border
			if(x < 0)
				x = 0;
			// same thing with right border
			else if(x + el.offsetWidth > $(document).width())
				x = $(document).width() - $(el)[0].offsetWidth;

			$(el).css("top", y + "px");
			$(el).css("left", x + "px");

			// store for remove
			tooltipEl = el;
		}, duration);
	});
	
	$(targetEl).mouseleave(function(e) {
		clearTooltip();
	});
}

function clearTooltip() {
	clearTimeout(tooltipTimeout);
	$(tooltipEl).remove();
}

var toolTipStyle = {
	position: "absolute",
	"background-color": "rgb(80, 80, 80)",
	color: "whitesmoke",
	"font-family": '"Segoe UI", Verdana, sans-serif',
	"font-size": "14px",
	"line-height": "14px",
	"z-index": "30",
	width: "auto",
	padding: "1px 5px",
	transition: "opacity 0.3s"
};

function setWindowTitle(title) {
	_mainwindow.document.getElementById("window-title").setAttribute("value", title);
}

/*-- KeyBindings --*/

const KB_Call_Down = 0, KB_Call_Up = 1, KB_Call_Pressed = 2;

function _keybinderGetKeysByIdentifier(identifier) {
	if(!_mainwindow.customKeyBindings)
		return;
	
	return _mainwindow.customKeyBindings[identifier];
}

function _keybinderCheckKeyBind(keybind, event, keys) {
	if(!keys) {
		keys = _keybinderGetKeysByIdentifier(keybind.getIdentifier());
		if(!keys && !(keys = keybind.defaultKeys))
			return false;

		if(typeof keys == "object") {
			for(var i = 0; i < keys.length; i++)
				if(_keybinderCheckKeyBind(keybind, event, keys[i]))
					return true;
			
			return false;
		}
	}

	//Modifier überprüfen
	if(keys.search(/(^|-)Ctrl($|-)/) != -1 && !event.ctrlKey)
		return false;
	if(keys.search(/(^|-)Shift($|-)/) != -1 && !event.shiftKey)
		return false;
	if(keys.search(/(^|-)Alt($|-)/) != -1 && !event.altKey)
		return false;

	//Letzte Taste Rausfinden und checken
	var key = keys.replace(/-?(Ctrl|Shift|Alt)-?/g, "");
	if(getKeyCodeIdentifier(event.keyCode) == key)
		return true;
	
	return false;
}

function bindKeyToObj(kb, obj = $(document)) {
	obj = $(obj);
	for(var i = 0; i < obj.length; i++) {
		var elm = obj[i];
		if(elm._windmill_keybinding)
			elm._windmill_keybinding.push(kb);
		else {
			elm._windmill_keybinding = [kb];
			$(obj).keypress(function(e) {
				if(!$(this).prop("_windmill_keybinding"))
					return;

				for(var i = 0; i < $(this).prop("_windmill_keybinding").length; i++) {
					var keybind = $(this).prop("_windmill_keybinding")[i];

					if(keybind.calltype != KB_Call_Pressed)
						continue;

					if(_keybinderCheckKeyBind(keybind, e))
						keybind.exec(e, this);
					else
						continue;

					e.stopImmediatePropagation();
					return true;
				}
			});
			$(obj).keydown(function(e) {
				if(!$(this).prop("_windmill_keybinding"))
					return;

				for(var i = 0; i < $(this).prop("_windmill_keybinding").length; i++) {
					var keybind = $(this).prop("_windmill_keybinding")[i];

					if(keybind.calltype != KB_Call_Down)
						continue;

					if(_keybinderCheckKeyBind(keybind, e))
						keybind.exec(e, this);
					else
						continue;

					e.stopImmediatePropagation();
					return true;
				}
			});
			$(obj).keyup(function(e) {
				if(!$(this).prop("_windmill_keybinding"))
					return;

				for(var i = 0; i < $(this).prop("_windmill_keybinding").length; i++) {
					var keybind = $(this).prop("_windmill_keybinding")[i];

					if(keybind.calltype != KB_Call_Up)
						continue;

					if(_keybinderCheckKeyBind(keybind, e))
						keybind.exec(e, this);
					else
						continue;

					e.stopImmediatePropagation();
					return true;
				}
			});
		}
	}
}

function getKeyBindingObjById(id) {
	if(!_mainwindow)
		_mainwindow = window;

	for(var i = 0; i < _mainwindow.keyBindingList.length; i++)
		if(_mainwindow.keyBindingList[i] && _mainwindow.keyBindingList[i].getIdentifier() == id)
			return _mainwindow.keyBindingList[i];

	return false;
}

class _KeyBinding {
	constructor(id, dks, ex, ct = KB_Call_Down, pfx = MODULE_LPRE, opt = {}) {
		if(typeof id == "object") {
			var options = id;
			this.identifier = options.identifier;
			this.prefix = options.prefix || pfx;
			this.calltype = options.calltype || ct; // 
			this.defaultKeys = options.defaultKeySetup;
			this.exec = options.exec;
			this.options = options;
		}
		else { //Falls id = identifier
			this.identifier = id;
			this.prefix = pfx;
			this.calltype = ct;
			this.defaultKeys = dks;
			this.exec = ex;
			this.options = opt;
		}
		//In Liste hinzufügen
		if(!_mainwindow.keyBindingList)
			_mainwindow.keyBindingList = [this];
		else
			_mainwindow.keyBindingList.push(this);

		if(!_mainwindow.customKeyBindings)
			_mainwindow.customKeyBindings = [];

		if(!_mainwindow.customKeyBindings[this.getIdentifier()])
			_mainwindow.customKeyBindings[this.getIdentifier()] = this.defaultKeys;
	}

	getIdentifier() { return this.prefix + "_" + this.identifier; }
}

//Fallback
function KeyBinding(...pars) { return new _KeyBinding(...pars); }

/*-- Lock Module --*/

function lockModule(message, nofadein) {
	if($(".windmill-modal")[0]) {
		$(".windmill-modal").html(Locale(message));
	
		return true;
	}

	if(MODULE_LANG == "html") {
		var modal = $('<div class="windmill-modal"></div>');
		modal.html(Locale(message));
		$("body").append(modal);
		/*if(!nofadein)
			$(".windmill-modal").fadeIn(400);
		else
			$(".windmill-modal").show();*/
	}
	else if(MODULE_LANG == "xul") {
		var modal = $('<box class="windmill-modal"></box>');
		modal.html(Locale(message));
		if(!$("#windmill-modal-wrapper,.windmill-lockmodule-wrapper")[0])
			$(document.documentElement).children().wrapAll('<stack flex="1" id="windmill-modal-wrapper" class="temporary"></stack>');

		$("#windmill-modal-wrapper,.windmill-lockmodule-wrapper").append(modal);
		/*if(!nofadein)
			$(".windmill-modal").fadeIn(400);
		else
			$(".windmill-modal").show();*/
	}

	return true;
}

function unlockModule() {
	//$(".windmill-modal").fadeOut(400, function() { $($("#windmill-modal-wrapper.temporary").children()[0]).unwrap(); $(".windmill-modal").remove() });
	$($("#windmill-modal-wrapper.temporary").children()[0]).unwrap();
	$(".windmill-modal").remove();
	return true;
}

/*-- EventInfos --*/

const EVENTINFO_DISPLAYTIME = 400;
var eventinfo_timeout;

function EventInfo(message, lpre) {
	message = Locale(message, lpre);

	if($(".eventinfo")[0]) {
		clearTimeout(eventinfo_timeout);
		$(".eventinfo").stop(true).css("opacity", "");

		var off = $(".eventinfo").last().offset();
		if(MODULE_LANG == "html")
			var nEventInfo = $('<div class="eventinfo">'+message+'</div>');
		else if(MODULE_LANG == "xul")
			var nEventInfo = $('<div class="eventinfo" xmlns="http://www.w3.org/1999/xhtml">'+message+'</div>');
		nEventInfo.appendTo(document.documentElement);
		nEventInfo.css({ top: off.top-$(nEventInfo).outerHeight(), left: 0});
	}
	else {
		if(MODULE_LANG == "html")
			var nEventInfo = $('<div class="eventinfo">'+message+'</div>');
		else if(MODULE_LANG == "xul")
			var nEventInfo = $('<div class="eventinfo" xmlns="http://www.w3.org/1999/xhtml">'+message+'</div>');
		nEventInfo.appendTo(document.documentElement);
		nEventInfo.css({ bottom: 0, left: 0});
	}
	
	eventinfo_timeout = setTimeout(function() { $(".eventinfo").fadeOut(600, function() {$(this).remove();}); }, EVENTINFO_DISPLAYTIME);
	return nEventInfo;
}

Object.defineProperty(Array.prototype, "byte2str", { enumerable: false, writable: false,
	value: function(nullchars) {
	for(var i = 0, str = ""; i < this.length; i++)
		if(this[i] > 0 || nullchars)
			str += String.fromCharCode(this[i]);
	
	return str;
}});
Object.defineProperty(Array.prototype, "byte2num", { enumerable: false, writable: false,
	value: function() {
	for(var i = this.length-1, str = ""; i >= 0; i--) {
		if(this[i] < 16)
			str += "0";
		str += this[i].toString(16);
	}
	var ret = parseInt(str, 16);
	if(isNaN(ret))
		return 0;
	else
		return ret;
}});
Object.defineProperty(Number.prototype, "num2byte", { enumerable: false, writable: false,
	value: function(size) {
		var ar = [], num = this;
		for(var i = 0; i < size; i++) {
			ar.push(num & 0xFF);
			num >>= 8;
		}
		
		return ar;
}});



// debugfn

function showObj2(obj, depth, options = {}) {
	if(depth == undefined || depth == -1)
		depth = 10;
	var fn = function(obj, indent, d) {		
		var txt = "";

		try {
			for(var key in obj) {
				if(obj instanceof Array && options.maxArraySize) {
					if(obj.length > options.maxArraySize && !isNaN(parseInt(key)))
						if(parseInt(key) >= 2 || parseInt(key) < obj.length-2) {
							if(key == "2")
								txt += indent + "[...]\n";
							
							continue;
						}
				}
				
				if(key == "top")
					continue;
				
				var v, isObj = false;

				try {
					if(typeof obj[key] === "function")
						v = "[function]";
					else if(typeof obj[key] === "object")
						isObj = true;
					else
						v = obj[key];
				}
				catch(e) {
					v = "error";
				}
				
				if(isObj && d)
					txt += indent + "[" + key + "]: \n" + fn(obj[key], indent + "        ", d - 1);
				else if(isObj)
					txt += indent + key + "[object]\n";
				else
					txt += indent + key + ": " + v + "\n";
			}
		} catch(e) { txt = "[Prevented]"; }

		return txt;
	};
	
	if(options.avoidErr)
		return fn(obj, "", depth);
	else
		err(fn(obj, "", depth));
}

function showObj3(obj) {
	function stringify(obj, replacer, spaces, cycleReplacer) {
	  return JSON.stringify(obj, serializer(replacer, cycleReplacer), spaces)
	}

	function serializer(replacer, cycleReplacer) {
	  var stack = [], keys = []

	  if (cycleReplacer == null) cycleReplacer = function(key, value) {
		if (stack[0] === value) return "[Circular ~]"
		return "[Circular ~." + keys.slice(0, stack.indexOf(value)).join(".") + "]"
	  }

	  return function(key, value) {
		if (stack.length > 0) {
		  var thisPos = stack.indexOf(this)
		  ~thisPos ? stack.splice(thisPos + 1) : stack.push(this)
		  ~thisPos ? keys.splice(thisPos, Infinity, key) : keys.push(key)
		  if (~stack.indexOf(value)) value = cycleReplacer.call(this, key, value)
		}
		else stack.push(value)

		return replacer == null ? value : replacer.call(this, key, value)
	  }
	}
	return stringify(obj, null, 4);
}

var TIMES = {};

function iTr(key) { TIMES[key] = (new Date).getTime(); }
function gTr(key) { err(key + ": " + ((new Date).getTime() - (TIMES[key])) + "ms"); }
