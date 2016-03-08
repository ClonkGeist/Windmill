/*
 * CTYPES struct Definitionen
 */

var Cu = Components.utils;
Cu.import("resource://gre/modules/ctypes.jsm");
Cu.import("resource://ctypes/win/js-ctypes-import-datatypes.jsm");

const EXPORTED_SYMBOLS = ["SECURITY_ATTRIBUTES", "LPSECURITY_ATTRIBUTES", "STARTUPINFO", "LPSTARTUPINFO", "PROCESS_INFORMATION", "LPPROCESS_INFORMATION", "OVERLAPPED", "LPOVERLAPPED"];

/* SECURITY_ATTRIBUTES structure
 * https://msdn.microsoft.com/en-us/library/windows/desktop/aa379560(v=vs.85).aspx
 */ 
const SECURITY_ATTRIBUTES = new ctypes.StructType("_SECURITY_ATTRIBUTES", [
	{"nLength": DWORD}, 
	{"lpSecurityDescriptor": LPVOID},
	{"bInheritHandle": BOOL}
]);
const LPSECURITY_ATTRIBUTES = new ctypes.PointerType(SECURITY_ATTRIBUTES);

/* STARTUPINFO structure
 * https://msdn.microsoft.com/en-us/library/windows/desktop/ms686331(v=vs.85).aspx
 */

const STARTUPINFO = new ctypes.StructType("_STARTUPINFO", [
	{"cb": DWORD},
	{"lpReserved": LPTSTR},
	{"lpDesktop": LPTSTR},
	{"lpTitle": LPTSTR},
	{"dwX": DWORD},
	{"dwY": DWORD},
	{"dwXSize": DWORD},
	{"dwYSize": DWORD},
	{"dwXCountChars": DWORD},
	{"dwYCountChars": DWORD},
	{"dwFillAttribute": DWORD},
	{"dwFlags": DWORD},
	{"wShowWindow": WORD},
	{"cbReserved2": WORD},
	{"lpReserved2": LPBYTE},
	{"hStdInput": HANDLE},
	{"hStdOutput": HANDLE},
	{"hStdError": HANDLE}
]);
const LPSTARTUPINFO = new ctypes.PointerType(STARTUPINFO);

/* PROCESS_INFORMATION structure
 * https://msdn.microsoft.com/en-us/library/windows/desktop/ms684873(v=vs.85).aspx
 */

const PROCESS_INFORMATION = new ctypes.StructType("_PROCESS_INFORMATION", [
	{"hProcess": HANDLE},
	{"hThread": HANDLE},
	{"dwProcessId": DWORD},
	{"dwThreadId": DWORD}
]);
const LPPROCESS_INFORMATION = new ctypes.PointerType(PROCESS_INFORMATION);

/* OVERLAPPED structure
 * https://msdn.microsoft.com/de-de/library/windows/desktop/ms684342(v=vs.85).aspx
 */

const OVERLAPPED = new ctypes.StructType("_OVERLAPPED", [
	{"Internal": ULONG_PTR},
	{"InternalHigh": ULONG_PTR},
	{"Pointer": PVOID},
	{"hEvent": HANDLE}
]);
const LPOVERLAPPED = new ctypes.PointerType(OVERLAPPED);