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
	LPDWORD		// _Out_	LPDWORD	lpExitCode
);

/* GetCurrentProcessId
 * https://msdn.microsoft.com/en-us/library/ms683180(v=vs.85).aspx
 */

var GetCurrentProcessId = kernel32.declare("GetCurrentProcessId", WINABI,
	DWORD	// return value
);


/* GetModuleHandle
 * https://msdn.microsoft.com/de-de/library/windows/desktop/ms683199(v=vs.85).aspx
 */

var GetModuleHandle = kernel32.declare("GetModuleHandle", WINABI,
	HMODULE,	// return value
	LPCTSTR		// _In_opt_	LPCTSTR	lpModuleName
);

/*------------------------- Ws2_32.dll -------------------------*/

let Ws2_32 = ctypes.open("Ws2_32.dll");

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

/* WSAAsyncSelect
 * https://msdn.microsoft.com/de-de/library/windows/desktop/ms741540(v=vs.85).aspx
 */

var WSAAsyncSelect = Ws2_32.declare("WSAAsyncSelect", WINABI,
	ctypes.int,				// return value
	SOCKET,					// __in	SOCKET			s
	HWND,					// __in	HWND			hWnd
	ctypes.unsigned_int,	// __in	unsigned int	wMsg
	ctypes.long				// __in	long			lEvent
);

/*------------------------- User32.dll -------------------------*/

let user32 = ctypes.open("User32.dll");

/* EnumWindows
 * https://msdn.microsoft.com/en-us/library/ms633497(v=vs.85).aspx
 */

var EnumWindows = user32.declare("EnumWindows", WINABI,
	BOOL,				// return value
	WNDENUMPROC.ptr,	// _In_	WNDENUMPROC	lpEnumFunc
	LPARAM				// _In_	LPARAM		lParam
);

/* GetWindowThreadProcessId
 * https://msdn.microsoft.com/en-us/library/ms633522(v=vs.85).aspx
 */

var GetWindowThreadProcessId = user32.declare("GetWindowThreadProcessId", WINABI,
	DWORD,	// return value
	HWND,	// _In_			HWND	hWnd
	LPDWORD	// _Out_opt_	LPDWORD	lpdwProcessId
);

/* CreateWindowEx
 * https://msdn.microsoft.com/en-us/library/windows/desktop/ms632680(v=vs.85).aspx
 */

var CreateWindowEx = user32.declare("CreateWindowEx", WINABI,
	HWND,		// return value
	DWORD,		// _In_		DWORD		dwExStyle
	LPCTSTR,	// _In_opt_	LPCTSTR		lpClassName
	LPCTSTR,	// _In_opt_	LPCTSTR		lpWindowName
	DWORD,		// _In_		DWORD		dwStyle
	ctypes.int,	// _In_		int			x
	ctypes.int,	// _In_		int			y
	ctypes.int,	// _In_		int			nWidth
	ctypes.int,	// _In_		int			nHeight
	HWND,		// _In_opt_	HWND		hWndParent
	HMENU,		// _In_opt_	HMENU		hMenu
	HINSTANCE,	// _In_opt_	HINSTANCE	hInstance
	LPVOID		// _In_opt_	LPVOID		lpParam
);

/* RegisterClassEx
 * https://msdn.microsoft.com/en-us/library/windows/desktop/ms633587(v=vs.85).aspx
 */

var RegisterClassEx = user32.declare("RegisterClassEx", WINABI,
	ATOM,		// return value
	PWNDCLASSEX // _In_	const WNDCLASSEX	*lpwcx
);

/* LoadCursor
 * https://msdn.microsoft.com/de-de/library/windows/desktop/ms648391(v=vs.85).aspx
 */

var LoadCursor = user32.declare("LoadCursor", WINABI,
	HCURSOR,	// return value
	HINSTANCE,	// _In_opt_	HINSTANCE	hInstance
	LPCTSTR		// _In_		LPCTSTR		lpCursorName
);

/* Macros */

var MAKEWORD = function(bLow, bHigh) { return (bHigh<<8)+bLow; }
var LOWORD = function(val) { return val&0xFFFF; }
var HIWORD = function(val) { return val&0xFFFF0000; }

/* Adv. Macros */

var WSAGETSELECTEVENT = function(lParam) { return LOWORD(lParam); }
var WSAGETSELECTERROR = function(lParam) { return HIWORD(lParam); }

/* Flags */

/* WSAAsyncSelect()-Flags
 * https://msdn.microsoft.com/de-de/library/windows/desktop/ms741540(v=vs.85).aspx
 */

const FD_READ 						= 0x001,
	  FD_WRITE 						= 0x002,
	  FD_OOB						= 0x004,
	  FD_ACCEPT						= 0x008,
	  FD_CONNECT					= 0x010,
	  FD_CLOSE						= 0x020,
	  FD_QQS						= 0x040,
	  FD_GROUP_QQS					= 0x080,
	  FD_ROUTING_INTERFACE_CHANGE	= 0x100,
	  FD_ADDRESS_LIST_CHANGE		= 0x200;

/* SystemColor Flags
 * 
 */

const CTLCOLOR_MSGBOX = 0,
	  CTLCOLOR_EDIT = 1,
	  CTLCOLOR_LISTBOX = 2,
	  CTLCOLOR_BTN = 3,
	  CTLCOLOR_DLG = 4,
	  CTLCOLOR_SCROLLBAR = 5,
	  CTLCOLOR_STATIC = 6,
	  CTLCOLOR_MAX = 7,
	  COLOR_SCROLLBAR = 0,
	  COLOR_BACKGROUND = 1,
	  COLOR_ACTIVECAPTION = 2,
	  COLOR_INACTIVECAPTION = 3,
	  COLOR_MENU = 4,
	  COLOR_WINDOW = 5,
	  COLOR_WINDOWFRAME = 6,
	  COLOR_MENUTEXT = 7,
	  COLOR_WINDOWTEXT = 8,
	  COLOR_CAPTIONTEXT = 9,
	  COLOR_ACTIVEBORDER = 10,
	  COLOR_INACTIVEBORDER = 11,
	  COLOR_APPWORKSPACE = 12,
	  COLOR_HIGHLIGHT = 13,
	  COLOR_HIGHLIGHTTEXT = 14,
	  COLOR_BTNFACE = 15,
	  COLOR_BTNSHADOW = 16,
	  COLOR_GRAYTEXT = 17,
	  COLOR_BTNTEXT = 18,
	  COLOR_INACTIVECAPTIONTEXT = 19,
	  COLOR_BTNHIGHLIGHT = 20,
	  COLOR_3DDKSHADOW = 21,
	  COLOR_3DLIGHT = 22,
	  COLOR_INFOTEXT = 23,
	  COLOR_INFOBK = 24,
	  COLOR_HOTLIGHT = 26,
	  COLOR_GRADIENTACTIVECAPTION = 27,
	  COLOR_GRADIENTINACTIVECAPTION = 28,
	  COLOR_MENUHILIGHT = 29,
	  COLOR_MENUBAR = 30;
	  
const COLOR_DESKTOP = COLOR_BACKGROUND,
	  COLOR_3DFACE = COLOR_BTNFACE,
	  COLOR_3DSHADOW = COLOR_BTNSHADOW,
	  COLOR_3DHIGHLIGHT = COLOR_BTNHIGHLIGHT,
	  COLOR_3DHILIGHT = COLOR_BTNHIGHLIGHT,
	  COLOR_BTNHILIGHT = COLOR_BTNHIGHLIGHT;

/* Useful Functions */

let process_mainwindow;

function getCurrentProcessMainwindow() {
	if(process_mainwindow)
		return process_mainwindow;

	let pid = GetCurrentProcessId(), par = new LPARAM;

	let enumWindowsCB = new WNDENUMPROC(function(hWnd, lParam) {
		let wndPID = new DWORD;
		getWindowThreadProcessId(hWnd, wndPID.address());
		if(wndPID == pid) {
			process_mainwindow = hWnd;
			return false;
		}
		return true;
	});

	EnumWindows(enumWindowsCB.address(), par);
}




var EXPORTED_SYMBOLS = ["_WIN64", "GetLastError", "CreateProcess", "WaitForSingleObject", "CloseHandle", "CreatePipe", "ReadFile", "WriteFile", "SetHandleInformation", "GetStdHandle", "PeekNamedPipe", "GetExitCodeProcess", "WSAStartup", "socket", "connect", "closesocket", "inet_addr", "htons", "WSACleanup", "WSAAsyncSelect", "MAKEWORD", "LOWORD", "HIWORD", "WSAGETSELECTEVENT", "WSAGETSELECTERROR", "FD_READ", "FD_WRITE", "FD_OOB", "FD_ACCEPT", "FD_CONNECT", "FD_CLOSE", "FD_QQS", "FD_GROUP_QQS", "FD_ROUTING_INTERFACE_CHANGE", "FD_ADDRESS_LIST_CHANGE", "GetCurrentProcessId", "EnumWindows", "GetWindowThreadProcessId", "getCurrentProcessMainwindow", "CreateWindowEx", "RegisterClassEx", "CTLCOLOR_MSGBOX", "CTLCOLOR_EDIT", "CTLCOLOR_LISTBOX", "CTLCOLOR_BTN", "CTLCOLOR_DLG", "CTLCOLOR_SCROLLBAR", "CTLCOLOR_STATIC", "CTLCOLOR_MAX", "COLOR_SCROLLBAR", "COLOR_BACKGROUND", "COLOR_ACTIVECAPTION", "COLOR_INACTIVECAPTION", "COLOR_MENU", "COLOR_WINDOW", "COLOR_WINDOWFRAME", "COLOR_MENUTEXT", "COLOR_WINDOWTEXT", "COLOR_CAPTIONTEXT", "COLOR_ACTIVEBORDER", "COLOR_INACTIVEBORDER", "COLOR_APPWORKSPACE", "COLOR_HIGHLIGHT", "COLOR_HIGHLIGHTTEXT", "COLOR_BTNFACE", "COLOR_BTNSHADOW", "COLOR_GRAYTEXT", "COLOR_BTNTEXT", "COLOR_INACTIVECAPTIONTEXT", "COLOR_BTNHIGHLIGHT", "COLOR_3DDKSHADOW", "COLOR_3DLIGHT", "COLOR_INFOTEXT", "COLOR_INFOBK", "COLOR_HOTLIGHT", "COLOR_GRADIENTACTIVECAPTION", "COLOR_GRADIENTINACTIVECAPTION", "COLOR_MENUHILIGHT", "COLOR_MENUBAR", "COLOR_DESKTOP", "COLOR_3DFACE", "COLOR_3DSHADOW", "COLOR_3DHIGHLIGHT", "COLOR_3DHILIGHT", "COLOR_BTNHILIGHT"];