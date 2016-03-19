/** Komponenten importieren und konfigurieren **/

"use strict";

function hook() {};

var Cc = Components.classes, Ci = Components.interfaces, Cm = Components.manager, Cu = Components.utils, CByID = Components.classesByID;
var {TextDecoder, TextEncoder, OS} = Cu.import("resource://gre/modules/osfile.jsm", {});
Cu.import("resource://gre/modules/Task.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
const { require } = Cu.import("resource://gre/modules/commonjs/toolkit/require.js", {});

var _inheritableObjects = [];

//Zum vererben diverser Objekte (Funktionen, Klassen, Objekte wie _sc etc.) -- Die Variablennamen sollen angegeben werden!
function registerInheritableObject(obj) { _inheritableObjects.push(obj); }

var OS_TARGET = Cc["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime).OS;

function formatPath(path) {
	if(!path)
		return path;

	if(OS_TARGET == "WINNT") {
		path = path.replace(/\\/g, "/");
		path = path.replace(/(^[A-Z]:\/)\//i, "$1");
	}
	
	return path;
}

//Hilfsfunktion zum loggen
function log(str) {
	dump(str + "\n");
}


try {
	var {devtools} = Cu.import("resource://gre/modules/devtools/Loader.jsm", {});
	let { DebuggerServer } = require("devtools/server/main");
	if(!DebuggerServer.initialized) {
	  DebuggerServer.init();
	  DebuggerServer.addBrowserActors();
	  DebuggerServer.allowChromeProcess = true;
	}

	let dbgListener = DebuggerServer.createListener();
	dbgListener.portOrPath = 6000;
	dbgListener.open();
	//Falls es doch mal klappen sollte...
	setTimeout(function() { log(">>> DebuggerServer was successfully created and initialized"); }, 5000);
} catch(err) {
	
}

//Globale Shortcuts
var _sc = {
	env: Cc["@mozilla.org/process/environment;1"].getService(Ci.nsIEnvironment), //Umgebungsvariablen
	runtime: Cc["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime), //XULRuntime
	//Prozessinstanz
	process: function(file) { 
		var p = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
		p.init(file);
		return p;
	},
	//Dateiinstanz
	file: function(path, failsafe = true) {
		if(!path || path == "false" || path == "true")
			return { exists() { return false; } };

		if(OS_TARGET == "WINNT")
			path = path.replace(/\//g, "\\");

		var f = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
		if(failsafe) {
			try {
				f.initWithPath(path);
			} catch(err) {
				log(err);
				log(err.stack);
				return { exists() { return false; } };
			}
		}
		else
			f.initWithPath(path);

		return f;
	},
	//Dateiauswahl
	filepicker: function() { return Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker); },
	//Directoryservice
	dirserv: function() { return Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties); },
	//Chrome-Pfad
	chpath : (function() { 
		var ds = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties);
		if(OS_TARGET == "WINNT")
			return ds.get("AChrom", Ci.nsIFile).path.replace(/\\/, "/");

		return ds.get("AChrom", Ci.nsIFile).path;
	}()),
	//Profile-Pfad
	profd : (function() {
		var ds = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties);
		if(OS_TARGET == "WINNT")
			return ds.get("ProfD", Ci.nsIFile).path.replace(/\\/, "/");

		return ds.get("ProfD", Ci.nsIFile).path;
	}()),
	//INI-Factory
	inifact : function() { return Cm.getClassObjectByContractID("@mozilla.org/xpcom/ini-parser-factory;1", Ci.nsIINIParserFactory); },
	//File-Output-Stream
	ofstream : function(file, flags, perm, behaviorFlags) {
		var str = Cc['@mozilla.org/network/file-output-stream;1'].createInstance(Ci.nsIFileOutputStream);
		str.init(file, flags, perm, behaviorFlags);
		return str;
	},
	//File-Input-Stream
	ifstream : function(file, flags, perm, behaviorFlags) {
		var str = Cc['@mozilla.org/network/file-input-stream;1'].createInstance(Ci.nsIFileInputStream);
		str.init(file, flags, perm, behaviorFlags);
		return str;
	},
	// Chrome Window
	chwin : function() { nsIDOMChromeWindow },
	//Binary-Output-Stream
	bostream : function() { return Cc['@mozilla.org/binaryoutputstream;1'].createInstance(Ci.nsIBinaryOutputStream); },
	//Binary-Input-Stream
	bistream : function() { return Cc['@mozilla.org/binaryinputstream;1'].createInstance(Ci.nsIBinaryInputStream); },
	//Converter-Output-Stream
	costream : function() { return Cc['@mozilla.org/intl/converter-output-stream;1'].createInstance(Ci.nsIConverterOutputStream); },
	//Converter-Input-Stream
	cistream : function() { return Cc['@mozilla.org/intl/converter-input-stream;1'].createInstance(Ci.nsIConverterInputStream); },
	//Dragservice
	dragserv : function() { return Cc['@mozilla.org/widget/dragservice;1'].getService(Ci.nsIDragService); },
	//IO-Service
	ioserv : function() { return Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService); },
	//Transferable
	transferable : function() { return Cc["@mozilla.org/widget/transferable;1"].createInstance(Ci.nsITransferable); },
	//Serversocket
	serversocket : function() { return Cc["@mozilla.org/network/server-socket;1"].createInstance(Ci.nsIServerSocket); },
	//Socket-Transport-Service
	socktsvc : function() { return Cc["@mozilla.org/network/socket-transport-service;1"].getService(Ci.nsISocketTransportService); },
	//ThreadManager
	threadmanager : function() { return Cc["@mozilla.org/thread-manager;1"].getService(); },
	//Scriptable-Input-Stream
	isstream : function() { return Cc["@mozilla.org/scriptableinputstream;1"].createInstance(Ci.nsIScriptableInputStream); },
	//Input-Stream-Pump
	istreampump : function() { return Cc["@mozilla.org/network/input-stream-pump;1"].createInstance(Ci.nsIInputStreamPump); },
	//Error-Service
	errsvc : function() { return Cc["@mozilla.org/xpcom/error-service;1"].getService(Ci.nsIErrorService); },
	//safe-file-output-stream
	sfostream : function() { return Cc["@mozilla.org/network/safe-file-output-stream;1"].createInstance(Ci.nsIFileOutputStream); },
	//Screen Manager
	screenmgr : function() { return Cc["@mozilla.org/gfx/screenmanager;1"].getService(Ci.nsIScreenManager); },
	//Screen
	screen : function() { return Cc["@mozilla.org/gfx/screenmanager;1"].getService("Ci.nsiScreen"); },
	//WinRegKey
	wregkey : function() { return Cc["@mozilla.org/windows-registry-key;1"].createInstance(Ci.nsIWindowsRegKey); },
	//Clipboard Helper
	cbHelper : function() { return Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper); },
	//Clipboard
	clipboard : function() { return Cc["@mozilla.org/widget/clipboard;1 "].getService(Ci.nsIClipboard); },
	//Supports-String
	supportsstr : function() { return Cc["@mozilla.org/supports-string;1"].getService(Ci.nsISupportsString); },
	//Crypto-Hash
	crptohash : function() { return Cc["@mozilla.org/security/hash;1"].createInstance(Ci.nsICryptoHash); }
};

//XPCOM-Konstanten
var _scc = {
	//FileI/O Flags
	PR_RDONLY : 0x01,
	PR_WRONLY : 0x02,
	PR_RDWR   : 0x04,
	PR_CREATE_FILE : 0x08,
	PR_APPEND : 0x10,
	PR_TRUNCATE : 0x20,
	PR_SYNC : 0x40,
	PR_EXCL : 0x80,
	
	//acess permission
	PR_IRWXU : 0x0700,
	PR_IRUSR : 0x0400,
	PR_IWUSR : 0x0200,
	PR_IXUSR : 0x0100,
	PR_IRWXG : 0x0070,
	PR_IRGRP : 0x0040,
	PR_IWGRP : 0x0020,
	PR_IXGRP : 0x0010,
	PR_IRWXO : 0x0007,
	PR_IROTH : 0x0004,
	PR_IWOTH : 0x0002,
	PR_IXOTH : 0x0001
	
};

//CTYPES
Cu.unload("resource://ctypes/js-ctypes-process.jsm");
var __ws = Cu.import("resource://ctypes/js-ctypes-process.jsm");

//Windmill-Shortcuts
var _ws = {
	pr: function(...args) { return new wmProcess(...args); }
};

/**
 * sprintf for Javascript
 * https://github.com/alexei/sprintf.js
 */

(function(window) {
    var re = {
        not_string: /[^s]/,
        number: /[dief]/,
        text: /^[^\x25]+/,
        modulo: /^\x25{2}/,
        placeholder: /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fiosuxX])/,
        key: /^([a-z_][a-z_\d]*)/i,
        key_access: /^\.([a-z_][a-z_\d]*)/i,
        index_access: /^\[(\d+)\]/,
        sign: /^[\+\-]/
    }

    function sprintf() {
        var key = arguments[0], cache = sprintf.cache
        if (!(cache[key] && cache.hasOwnProperty(key))) {
            cache[key] = sprintf.parse(key)
        }

        return sprintf.format.call(null, cache[key], arguments)
    }

    sprintf.format = function(parse_tree, argv) {
        var cursor = 1, tree_length = parse_tree.length, node_type = "", arg, output = [], i, k, match, pad, pad_character, pad_length, is_positive = true, sign = ""
        for (i = 0; i < tree_length; i++) {
            node_type = get_type(parse_tree[i])
            if (node_type === "string") {
                output[output.length] = parse_tree[i]
            }
            else if (node_type === "array") {
                match = parse_tree[i] // convenience purposes only
                if (match[2]) { // keyword argument
                    arg = argv[cursor]
                    for (k = 0; k < match[2].length; k++) {
                        if (!arg.hasOwnProperty(match[2][k])) {
                            throw new Error(sprintf("[sprintf] property '%s' does not exist", match[2][k]))
                        }
                        arg = arg[match[2][k]]
                    }
                }
                else if (match[1]) { // positional argument (explicit)
                    arg = argv[match[1]]
                }
                else { // positional argument (implicit)
                    arg = argv[cursor++]
                }

                if (get_type(arg) == "function") {
                    arg = arg()
                }

                if (re.not_string.test(match[8]) && (get_type(arg) != "number" && isNaN(arg))) {
                    throw new TypeError(sprintf("[sprintf] expecting number but found %s", get_type(arg)))
                }

                if (re.number.test(match[8])) {
                    is_positive = arg >= 0
                }

                switch (match[8]) {
                    case "b":
                        arg = arg.toString(2)
                    break
                    case "c":
                        arg = String.fromCharCode(arg)
                    break
                    case "d":
                    case "i":
                        arg = parseInt(arg, 10)
                    break
                    case "e":
                        arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential()
                    break
                    case "f":
                        arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg)
                    break
                    case "o":
                        arg = arg.toString(8)
                    break
                    case "s":
                        arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg)
                    break
                    case "u":
                        arg = arg >>> 0
                    break
                    case "x":
                        arg = arg.toString(16)
                    break
                    case "X":
                        arg = arg.toString(16).toUpperCase()
                    break
                }
                if (re.number.test(match[8]) && (!is_positive || match[3])) {
                    sign = is_positive ? "+" : "-"
                    arg = arg.toString().replace(re.sign, "")
                }
                else {
                    sign = ""
                }
                pad_character = match[4] ? match[4] === "0" ? "0" : match[4].charAt(1) : " "
                pad_length = match[6] - (sign + arg).length
                pad = match[6] ? (pad_length > 0 ? str_repeat(pad_character, pad_length) : "") : ""
                output[output.length] = match[5] ? sign + arg + pad : (pad_character === "0" ? sign + pad + arg : pad + sign + arg)
            }
        }
        return output.join("")
    }

    sprintf.cache = {}

    sprintf.parse = function(fmt) {
        var _fmt = fmt, match = [], parse_tree = [], arg_names = 0
        while (_fmt) {
            if ((match = re.text.exec(_fmt)) !== null) {
                parse_tree[parse_tree.length] = match[0]
            }
            else if ((match = re.modulo.exec(_fmt)) !== null) {
                parse_tree[parse_tree.length] = "%"
            }
            else if ((match = re.placeholder.exec(_fmt)) !== null) {
                if (match[2]) {
                    arg_names |= 1
                    var field_list = [], replacement_field = match[2], field_match = []
                    if ((field_match = re.key.exec(replacement_field)) !== null) {
                        field_list[field_list.length] = field_match[1]
                        while ((replacement_field = replacement_field.substring(field_match[0].length)) !== "") {
                            if ((field_match = re.key_access.exec(replacement_field)) !== null) {
                                field_list[field_list.length] = field_match[1]
                            }
                            else if ((field_match = re.index_access.exec(replacement_field)) !== null) {
                                field_list[field_list.length] = field_match[1]
                            }
                            else {
                                throw new SyntaxError("[sprintf] failed to parse named argument key")
                            }
                        }
                    }
                    else {
                        throw new SyntaxError("[sprintf] failed to parse named argument key")
                    }
                    match[2] = field_list
                }
                else {
                    arg_names |= 2
                }
                if (arg_names === 3) {
                    throw new Error("[sprintf] mixing positional and named placeholders is not (yet) supported")
                }
                parse_tree[parse_tree.length] = match
            }
            else {
                throw new SyntaxError("[sprintf] unexpected placeholder")
            }
            _fmt = _fmt.substring(match[0].length)
        }
        return parse_tree
    }

    var vsprintf = function(fmt, argv, _argv) {
        _argv = (argv || []).slice(0)
        _argv.splice(0, 0, fmt)
        return sprintf.apply(null, _argv)
    }

    /**
     * helpers
     */
    function get_type(variable) {
        return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase()
    }

    function str_repeat(input, multiplier) {
        return Array(multiplier + 1).join(input)
    }

    /**
     * export to either browser or node.js
     */
    if (typeof exports !== "undefined") {
        exports.sprintf = sprintf
        exports.vsprintf = vsprintf
    }
    else {
        window.sprintf = sprintf
        window.vsprintf = vsprintf

        if (typeof define === "function" && define.amd) {
            define(function() {
                return {
                    sprintf: sprintf,
                    vsprintf: vsprintf
                }
            })
        }
    }
})(typeof window === "undefined" ? this : window);