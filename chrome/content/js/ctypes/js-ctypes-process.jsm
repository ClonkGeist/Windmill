/*
 * Prozessfunktionen ueber CTypes
 */

var OS_TARGET = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime).OS;
var Cu = Components.utils;
Cu.unload("resource://ctypes/win/js-ctypes-import.jsm");
Cu.import("resource://gre/modules/Timer.jsm");
Cu.import("resource://gre/modules/ctypes.jsm");

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

class wmProcess extends WindmillInterface {
	constructor(file) {
		super();
		if(typeof file == "object" && file.toString().search("nsILocalFile") != -1) //Etwas hackig, aber keine andere Moeglichkeit
			this.path = file.path;
		else
			this.path = file;

		setInterval(() => { this.routine(); }, 250);
	}

	create(args, flags, onProcessClosed, outputListener) {
		if(outputListener)
			this.hook("stdout", outputListener);
		if(onProcessClosed)
			this.hook("closed", onProcessClosed);

		if(OS_TARGET == "WINNT") {
			this.pipe_out_rd = new HANDLE;
			this.pipe_out_wr = new HANDLE;
			this.pipe_in_rd = new HANDLE;
			this.pipe_in_wr = new HANDLE;

			var saAttr = new SECURITY_ATTRIBUTES;
			saAttr.nLength = SECURITY_ATTRIBUTES.size;
			saAttr.bInheritHandle = true;
			saAttr.lpSecurityDescriptor = null;
			
			if(!CreatePipe(this.pipe_out_rd.address(), this.pipe_out_wr.address(), saAttr.address(), 0))
				throw "STDOUT Pipe to process could not be created. Error code: " + GetLastError();
			if(!SetHandleInformation(this.pipe_out_rd, 0x1, 0)) //0x1: HANDLE_FLAG_INHERIT
				throw "An error occured while setting the handle information to the pipe for STDOUT. Error code: " + GetLastError();
			if(!CreatePipe(this.pipe_in_rd.address(), this.pipe_in_wr.address(), saAttr.address(), 0))
				throw "STDIN Pipe to process could not be created. Error code: " + GetLastError();
			if(!SetHandleInformation(this.pipe_in_rd, 0x1, 0)) //0x1: HANDLE_FLAG_INHERIT
				throw "An error occured while setting the handle information to the pipe for STDIN. Error code: " + GetLastError();

			this.si = new STARTUPINFO;
			this.si.cb = STARTUPINFO.size;
			this.si.hStdError = this.pipe_out_wr;
			this.si.hStdOutput = this.pipe_out_wr;
			this.si.hStdInput = this.pipe_in_rd;
			this.si.dwFlags = 0x00000100; //STARTF_USESTDHANDLES

			this.pi = new PROCESS_INFORMATION;
			var cmdLine = " ";
			for(var i = 0; i < args.length; i++) {
				if(args[i].search(/ /) != -1)
					cmdLine += "\""+args[i]+"\" ";
				else
					cmdLine += args[i]+" "
			}
			
			var blocking = flags & wmP_BLOCKING;
			if(blocking)
				flags ^= wmP_BLOCKING

			dump("Create Process with command line " + cmdLine + "\r\n");
			if(!CreateProcess(this.path, this.name+cmdLine, null, null, true, sfl(flags, this), null, null, this.si.address(), this.pi.address())) {
				throw "Process could not be created. Error code: " + GetLastError();
				return;
			}

			this.status = 1; //Gestartet
			
			if(blocking) {
				dump("blocking process");
				WaitForSingleObject(this.pi.hProcess, 0xFFFFFFFF);
				this.routine();
			}
				
		}
		else {
			fallbackInformation();
		}
	}
	
	routine() {
		if(!this.status)
			return;

		if(this._HOOKS["stdout"]) {
			var data = this.pipe_read();
			if(data)
				this.execHook("stdout", data, this.status);
		}

		if(!this.is_running()) {
			//Handles schliessen
			if(this.status == 1)
				this.close();

			this.status = false;
			return;
		}
	}

	is_running() {
		if(OS_TARGET == "WINNT") {
			var dwExitCode = new DWORD;
			GetExitCodeProcess(this.pi.hProcess, dwExitCode.address());
			if(dwExitCode.value == 259)
				return true;
			return false;
		}
	}

	pipe_read() {
		var dwRead = new DWORD, chBuf = CHAR.array(4096)(), bSuccess, str_output = "";

		for(;;) {
			var dwPeeked = new DWORD;
			if(!PeekNamedPipe(this.pipe_out_rd, null, 0, null, dwPeeked.address(), null)) {
				throw "Error while reading Pipe. Error code: " + GetLastError();
				return;
			}
			else if(dwPeeked.value == 0)
				return;

			bSuccess = ReadFile(this.pipe_out_rd, chBuf, 4096, dwRead.address(), null);
			if(!bSuccess || dwRead.value == 0)
				break;
			for(var j = 0; j < dwRead.value; j++)
				if(chBuf[j])
					str_output += String.fromCharCode(chBuf[j]);
			break;
		}

		this.lastReadData = str_output;
		return str_output;
	}
	
	pipe_write(data) { //Funktionstuechtigkeit kann ich nicht bestaetigen mangels Testmoeglichkeiten
		var dwWritten = new DWORD, chBuf = CHAR.array(data.length)();
		for(var i = 0; i < data.length; i++)
			chBuf[i] = data.charCodeAt(i);
		WriteFile(this.pipe_out_wr, chBuf, data.length, dwWritten.address(), null);
	}
	
	close() {
		if(OS_TARGET == "WINNT") {
			var dwExitCode = new DWORD;
			GetExitCodeProcess(this.pi.hProcess, dwExitCode.address());
			this.exitCode = dwExitCode.value;
			CloseHandle(this.pi.hProcess);
			CloseHandle(this.pi.hThread);
		}

		this.status = 2;
		this.execHook("closed", this.exitCode);
	}
	
	set path(val) { this._path = formatPath(val); }
	get path() { return this._path; }
	get name() { return this.path.split("/").pop(); }

	OSCONST(wmconst) {
		if(OS_TARGET == "WINNT") {
			switch(wmconst) {
				case wmP_NO_WINDOW: return 0x08000000;
			}
		}
	}
}

 
EXPORTED_SYMBOLS = ["wmProcess", "wmP_NO_WINDOW"];

