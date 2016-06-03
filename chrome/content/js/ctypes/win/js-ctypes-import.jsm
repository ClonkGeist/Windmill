/*
 * CTYPES Implementation fuer WINAPI
 */

if(this.isWorker) {
	importScripts("resource://ctypes/win/js-ctypes-import-datatypes.jsm");
}
else {
	var Cu = Components.utils;

	//Erstmal ggf. aus dem Cache ausladen da es sonst das Debuggen unnoetig erschwert
	Cu.unload("resource://gre/modules/js-ctypes-import-datatypes.jsm");
	Cu.unload("resource://gre/modules/js-ctypes-import-structs.jsm");

	Cu.import("resource://gre/modules/ctypes.jsm");
	Cu.import("resource://ctypes/win/js-ctypes-import-datatypes.jsm");
	Cu.import("resource://ctypes/win/js-ctypes-import-structs.jsm");
}

var EXPORTED_SYMBOLS = ["_WIN64", "GetLastError", "CreateProcess", "WaitForSingleObject", "CloseHandle", "CreatePipe", "ReadFile", "WriteFile", "SetHandleInformation", "GetStdHandle", "PeekNamedPipe", "GetExitCodeProcess", "SHFileOperation", "WSAStartup", "socket", "connect", "closesocket", "inet_addr", "htons", "WSACleanup", "MAKEWORD", "HIWORD", "LOWORD"];
var WINABI = _WIN64?ctypes.default_abi:ctypes.winapi_abi;
var GetLastError = function() { return ctypes.winLastError; }

/*-- kernel32.dll --*/

var kernel32 = ctypes.open("kernel32.dll");

/* CreateProcessW (CreateProcess)
 * https://msdn.microsoft.com/en-us/library/windows/desktop/ms682425(v=vs.85).aspx
 */

var CreateProcess = kernel32.declare("CreateProcessW", WINABI, 
		BOOL, 					// return value
		LPCTSTR, 				// _In_opt_ 	LPCTSTR 				lpApplicationName
		LPTSTR, 				// _Inout_opt_ 	LPTSTR					lpCommandLine
		LPSECURITY_ATTRIBUTES, 	// _In_opt_		LPSECURITY_ATTRIBUTES	lpProcessAttributes
		LPSECURITY_ATTRIBUTES,	// _In_opt_		LPSECURITY_ATTRIBUTES	lpThreadAttributes	
		BOOL, 					// _In_			BOOL					bInheritHandles
		DWORD, 					// _In_			DWORD					dwCreationFlags
		LPVOID, 				// _In_opt_		LPVOID					lpEnvironment
		LPCTSTR, 				// _In_opt_		LPCTSTR					lpCurrentDirectory
		LPSTARTUPINFO, 			// _In_			LPSTARTUPINFO			lpStartupInfo
		LPPROCESS_INFORMATION	// _Out_		LPPROCESS_INFORMATION	lpProcessInformation
);

/* WaitForSingleObject
 * https://msdn.microsoft.com/de-de/library/windows/desktop/ms687032(v=vs.85).aspx
 */

var WaitForSingleObject = kernel32.declare("WaitForSingleObject", WINABI, 
	DWORD, 	// return value
	HANDLE, // _In_ HANDLE 	hHandle
	DWORD	// _In_ DWORD 	dwMilliseconds
);

/* CloseHandle
 * https://msdn.microsoft.com/de-de/library/windows/desktop/ms724211(v=vs.85).aspx
 */

var CloseHandle = kernel32.declare("CloseHandle", WINABI, 
	BOOL, 	// return value
	HANDLE	// _In_	HANDLE	hObject
);

/* CreatePipe
 * https://msdn.microsoft.com/en-us/library/aa365152(v=vs.85).aspx
 */

var CreatePipe = kernel32.declare("CreatePipe", WINABI,
	BOOL,					// return value
	PHANDLE,				// _Out_	PHANDLE					hReadPipe
	PHANDLE,				// _Out_	PHANDLE					hWritePipe
	LPSECURITY_ATTRIBUTES,	// _In_opt_	LPSECURITY_ATTRIBUTES	lpPipeAttributes
	DWORD					// _In_		DWORD					nSize
);

/* ReadFile
 * https://msdn.microsoft.com/en-us/library/windows/desktop/aa365467(v=vs.85).aspx
 */

var ReadFile = kernel32.declare("ReadFile", WINABI,
	BOOL,			// return value
	HANDLE,			// _In_			HANDLE			hFile
	LPVOID,			// _Out_		LPVOID			lpBuffer
	DWORD,			// _In_			DWORD			nNumberOfBytesToRead
	LPDWORD,		// _Out_opt_	LPDWORD			lpNumberOfBytesRead
	LPOVERLAPPED	// _Inout_opt_	LPOVERLAPPED	lpOverlapped
);

/* WriteFile
 * https://msdn.microsoft.com/en-us/library/windows/desktop/aa365747(v=vs.85).aspx
 */

var WriteFile = kernel32.declare("WriteFile", WINABI,
	BOOL,			// return value
	HANDLE,			// _In_			HANDLE			hFile
	LPCVOID,		// _In_			LPCVOID			lpBuffer
	DWORD,			// _In_			DWORD			nNumberOfBytesToWrite
	LPDWORD,		// _Out_opt_	LPDWORD			lpNumberOfBytesWritten
	LPOVERLAPPED	// _Inout_opt_	LPOVERLAPPED	lpOverlapped
);

/* SetHandleInformation
 * https://msdn.microsoft.com/de-de/library/windows/desktop/ms724935(v=vs.85).aspx
 */

var SetHandleInformation = kernel32.declare("SetHandleInformation", WINABI,
	BOOL,	// return value
	HANDLE,	// _In_	HANDLE	hObject
	DWORD,	// _In_	DWORD	dwMask
	DWORD	// _In_	DWORD	dwFlags
);

/* GetStdHandle
 * https://msdn.microsoft.com/en-us/library/windows/desktop/ms683231(v=vs.85).aspx
 */

var GetStdHandle = kernel32.declare("GetStdHandle", WINABI,
	BOOL,	// return value
	DWORD	// _In_	DWORD	nStdHandle
);

/* PeekNamedPipe
 * https://msdn.microsoft.com/en-us/library/windows/desktop/aa365779(v=vs.85).aspx
 */

var PeekNamedPipe = kernel32.declare("PeekNamedPipe", WINABI,
	BOOL,		// return value
	HANDLE,		// _In_			HANDLE	hNamedPipe
	LPVOID,		// _Out_opt_	LPVOID	lpBuffer
	DWORD,		// _In_			DWORD	nBuferSize
	LPDWORD,	// _Out_opt_	LPDWORD	lpBytesRead
	LPDWORD,	// _Out_opt_	LPDWORD	lpTotalByesAvail
	LPDWORD		// _Out_opt_	LPDWORD	lpBytesLeftThisMessage
);

/* GetExitCodeProcess
 * https://msdn.microsoft.com/de-de/library/windows/desktop/ms683189(v=vs.85).aspx
 */

var GetExitCodeProcess = kernel32.declare("GetExitCodeProcess", WINABI,
	BOOL,		// return value
	HANDLE,		// _In_		HANDLE	hProcess
	LPDWORD	// _Out_	LPDWORD	lpExitCode
);

/*-------------------------------- Shell32.dll --------------------------------*/

var shell32 = ctypes.open("Shell32.dll");

var SHFileOperation = shell32.declare("SHFileOperationW", WINABI,
	ctypes.int,			// return value
	LPSHFILEOPSTRUCT	// _Inout_ lpFileOp
);


/*--------------------------------- Ws2_32.dll --------------------------------*/

var Ws2_32 = ctypes.open("Ws2_32.dll");

/* WSAStartup
 * https://msdn.microsoft.com/de-de/library/windows/desktop/ms742213(v=vs.85).aspx
 */ 

var WSAStartup = Ws2_32.declare("WSAStartup", WINABI,
	ctypes.int,	// return value
	WORD,		// __in		WORD		wVersionRequested
	LPWSADATA	// __out	LPWSADATA	lpWSAData
);

/* socket
 * https://msdn.microsoft.com/de-de/library/windows/desktop/ms740506(v=vs.85).aspx
 */

var socket = Ws2_32.declare("socket", WINABI,
	SOCKET,		// return value
	ctypes.int,	// __in	int	af
	ctypes.int,	// __in	int	type
	ctypes.int	// __in	int	protocol
);

/* connect
 * https://msdn.microsoft.com/de-de/library/windows/desktop/ms737625(v=vs.85).aspx
 */

var connect = Ws2_32.declare("connect", WINABI,
	ctypes.int,		// return value
	SOCKET,			// __in	SOCKET					s
	sockaddr_ptr,	// __in	const struct sockaddr	*name
	ctypes.int		// __in	int						namelen
);

/* closesocket
 * https://msdn.microsoft.com/de-de/library/windows/desktop/ms737582(v=vs.85).aspx
 */

var closesocket = Ws2_32.declare("closesocket", WINABI,
	ctypes.int,	// return value
	SOCKET		// __in	SOCKET	s
);

/* inet_addr
 * https://msdn.microsoft.com/de-de/library/windows/desktop/ms738563(v=vs.85).aspx
 */

var inet_addr = Ws2_32.declare("inet_addr", WINABI,
	ctypes.unsigned_long,	// return value
	ctypes.char.ptr			// __in	const char	*cp
);

/* htons
 * https://msdn.microsoft.com/de-de/library/windows/desktop/ms738557(v=vs.85).aspx
 */

var htons = Ws2_32.declare("htons", WINABI,
	ctypes.unsigned_short,	// return value
	ctypes.unsigned_short	// __in	u_short	hostshort
);

/* WSACleanup
 * https://msdn.microsoft.com/de-de/library/windows/desktop/ms741549(v=vs.85).aspx
 */

var WSACleanup = Ws2_32.declare("WSACleanup", WINABI,
	ctypes.int	// return value
);

/* Macros */

var MAKEWORD = function(bLow, bHigh) { return (bHigh<<8)+bLow; }
var LOWORD = function(val) { return val&0xFFFF; }
var HIWORD = function(val) { return val&0xFFFF0000; }