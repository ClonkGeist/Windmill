/*
 * Prozessfunktionen ueber CTypes
 */

var OS_TARGET = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime).OS;
var Cu = Components.utils;
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

function fallbackInformation() {
	log("There is no or not fully supported native function support available for this operating system ("+OS_TARGET+"). Use limited fallback.");
	return;
}

const wmP_NO_WINDOW = 0x00000001;
const wmP_BLOCKING  = 0x00000002;

function formatPath(path) {
	if(!path || typeof path != "string")
		return path;

	if(OS_TARGET == "WINNT") {
		path = path.replace(/\\/g, "/");
		path = path.replace(/(^[A-Z]:\/)\//i, "$1");
	}
	
	return path;
}

class wmSocket extends WindmillInterface {
	constructor(addr, port) {
		super();
		this.addr = addr;
		this.port = port;
	}

	create() {
		if(OS_TARGET == "WINNT") {
			let data = new WSADATA, err;
			if(err = WSAStartup(513, data.address())) {
				throw "Winsock did not initialize correctly. (Errorcode: " + err + ")";
			}
			else {
				let AF_INET = 0x2, SOCK_STREAM = 0x1;

				this.sock = socket(AF_INET, SOCK_STREAM, 0);
				let saddr = new sockaddr_in;
				saddr.sin_family = AF_INET;
				saddr.sin_port = htons(this.port);
				saddr.sin_addr.S_addr = inet_addr(this.addr);
				let rv = connect(this.sock, ctypes.cast(saddr, sockaddr).address(), sockaddr.size), err = "no error";
				if(rv)
					err = GetLastError();

				this.status = rv;
			}
		}
		else {
			fallbackInformation();
		}
	}

	close() {
		if(OS_TARGET == "WINNT") {
			if(this.sock) {
				closesocket(this.sock);
				this.sock = undefined;
			}
		}
	}
	
	cleanup() {
		if(OS_TARGET == "WINNT") {
			WSACleanup();
		}
	}

	OSCONST(wmconst) {

	}
}

 
EXPORTED_SYMBOLS = ["wmSocket"];

