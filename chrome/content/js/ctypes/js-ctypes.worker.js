/*-- Worker for js ctypes functionality --*/

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
var OS_TARGET = OS.Constants.Sys.Name;

importScripts('resource://ctypes/js-ctypes-files.jsm');

function moveToTrash(...pars) {
	return moveFileToTrash(...pars);
}