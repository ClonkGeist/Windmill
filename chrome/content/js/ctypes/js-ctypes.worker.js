/*-- Worker for js ctypes functionality --*/

var OS_TARGET = OS.Constants.Sys.Name;
dump("CTypes Worker: Initialize CTypes Worker for " + OS_TARGET + "\r\n");

importScripts("resource://gre/modules/workers/require.js");
let PromiseWorker = require("resource://gre/modules/workers/PromiseWorker.js");

// Instantiate AbstractWorker (see below).
let worker = new PromiseWorker.AbstractWorker()

worker.dispatch = function(method, args = []) {
  // Dispatch a call to method `method` with args `args`
  return self[method](...args);
};
worker.postMessage = function(...args) {
  // Post a message to the main thread
  self.postMessage(...args);
};
worker.close = function() {
  // Close the worker
  self.close();
};
worker.log = function(...args) {
  // Log (or discard) messages (optional)
  dump("CTypes Worker: " + args.join(" ") + "\n");
};

// Connect it to message port.
self.addEventListener("message", msg => worker.handleMessage(msg));

var isWorker = true;

if(OS_TARGET == "WINNT") { 
	 importScripts("resource://ctypes/js-ctypes-windmillinterface.jsm",
				   "resource://ctypes/win/js-ctypes-import-datatypes.jsm", 
				   "resource://ctypes/win/js-ctypes-import-structs.jsm",
				   "resource://ctypes/win/js-ctypes-import.jsm");
}
else {
	fallbackInformation();
}

function fallbackInformation() {
	dump("There is no or not fully supported native function support available for this operating system ("+OS_TARGET+"). Use limited fallback.\r\n");
	return;
}

importScripts('resource://ctypes/js-ctypes-files.jsm');
importScripts('resource://ctypes/js-ctypes-sockets.jsm');

function moveToTrash(...pars) {
	return moveFileToTrash(...pars);
}

function createSocket(addr, port, options = {}) {
	let socket = new wmSocket(addr, port);
	socket.create();
	socket.close();
	if(socket.err) {
		if(OS_TARGET == "WINNT") {
			if(options.throwAllErrors || (socket.err != 10061 && socket.err != 10060))
				throw new OSError("An error occured during the socket connection. (Errorcode: " + socket.err + ")", socket.err);
		}
	}
	
	return { status: socket.status, err: socket.err, port, addr };
}