/*
 * Dateifunktionen ueber CTypes
 */

if(this.isWorker) {

}
else {
	var OS_TARGET = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime).OS;
	var Cu = Components.utils;
	Cu.unload("resource://ctypes/win/js-ctypes-import.jsm");
	Cu.import("resource://gre/modules/Timer.jsm");
	Cu.import("resource://gre/modules/ctypes.jsm");
	Cu.import("resource://ctypes/js-ctypes-windmillinterface.jsm");

	if(OS_TARGET == "WINNT") {
		Cu.import("resource://ctypes/win/js-ctypes-import-datatypes.jsm");
		Cu.import("resource://ctypes/win/js-ctypes-import-structs.jsm");
		Cu.import("resource://ctypes/win/js-ctypes-import.jsm");
	}
	else {
		fallbackInformation();
	}
}

function fallbackInformation() {
	dump("There is no or not fully supported native function support available for this operating system ("+OS_TARGET+"). Use limited fallback.\n");
	return;
}

function moveFileToTrash(path, options = {}) {
	if(OS_TARGET == "WINNT") {
		path = path.replace(/\//g, "\\");
		let sfo = new SHFILEOPSTRUCT;
		sfo.hWnd = null;
		sfo.wFunc = 0x3; // FO_DELETE
		sfo.pFrom = PCZZTSTR.targetType.array(path.length+2)(path);
		sfo.pTo = null;
		let flags = 0x40; // FOF_ALLOWUNDO
		if(!options.not_silent)
			flags |= 0x414; // FOF_NOCONFIRMATION|FOF_NOERRORUI|FOF_SILENT

		sfo.fFlags = flags;
		sfo.fAnyOperationsAborted = 0;
		sfo.hNameMappings = null;
		sfo.lpszProgressTitle = null;
		let err = SHFileOperation(sfo.address());
		if(err != 0)
			throw new OSError("An error occured while trying to move a file to trash. Errorcode: " + err + "\r\n", err);

		return sfo.fAnyOperationsAborted;
	}
}
 
var EXPORTED_SYMBOLS = ["moveFileToTrash"];

