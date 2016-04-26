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
	constructor(addr, port, options) {
		super();
		this.addr = addr;
		this.port = port;
		this.options = options;
	}

	create() {
		if(true)
			return;
		/**WIP**/
		if(OS_TARGET == "WINNT") {
			let data = new WSADATA, err;
			if(err = WSAStartup(MAKEWORD(2,0), data.address())) {
				throw "Winsock did not initialize correctly. (Errorcode: " + err + ")";
			}
			else {
				let AF_INET = 0x2, SOCK_STREAM = 0x1;

				if(!options.blocking) {
					let wClass = new WNDCLASSEX, hInst = ctypes.cast(GetModuleHandle(), HINSTANCE);
					wClass.cbSize = WNDCLASSEX.size;
					wClass.hbrBackground = ctypes.cast(COLOR_WINDOW, HBRUSH);
					wClass.hCursor = LoadCursor(NULL, IDC_ARROW);
					wClass.hInstance = hInst;
					wClass.lpfnWndProc = new WNDPROC(function(hwnd, umsg, wparam, lparam) {
						
					});
					wClass.lpszClassName = "Window Class";
					
					let wnd = CreateWindowEx(NULL, "Window Class", "Windows Async Client", NULL, 1, 1, 1, 1, NULL, NULL, hInst, NULL);
					if(!wnd)
						throw "Window creatiob failed. (Errorcode: " + GetLastError() + ")";
				}

				this.sock = socket(AF_INET, SOCK_STREAM, 0);

				if(!options.blocking) {
					let result = WSAAsyncSelect(this.sock, getCurrentProcessMainwindow(), 104, (FD_CLOSE|FD_CONNECT));
					if(result)
						throw "WSAAsyncSelect failed. (Errorcode: " + GetLastError() + ")";
				}

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

