/*
 * CTYPES Implementation fuer WINAPI
 */

var Cu = Components.utils;

//Erstmal ggf. aus dem Cache ausladen da es sonst das Debuggen unnoetig erschwert
Cu.unload("resource://gre/modules/js-ctypes-import-datatypes.jsm");
Cu.unload("resource://gre/modules/js-ctypes-import-structs.jsm");

Cu.import("resource://gre/modules/ctypes.jsm");
Cu.import("resource://ctypes/win/js-ctypes-import-datatypes.jsm");
Cu.import("resource://ctypes/win/js-ctypes-import-structs.jsm");

var EXPORTED_SYMBOLS = ["_WIN64", "GetLastError", "CreateProcess", "WaitForSingleObject", "CloseHandle", "CreatePipe", "ReadFile", "WriteFile", 
						"SetHandleInformation", "GetStdHandle", "PeekNamedPipe", "GetExitCodeProcess"];
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
