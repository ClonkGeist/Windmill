/*-- Inherit --*/

if(!window.log)
	var log = top.log;

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