/*
 * CTYPES struct Definitionen
 */

if(this.isWorker) {
	importScripts("resource://ctypes/win/js-ctypes-import-datatypes.jsm");
}
else {
	var Cu = Components.utils;
	Cu.import("resource://gre/modules/ctypes.jsm");
	Cu.import("resource://ctypes/win/js-ctypes-import-datatypes.jsm");
}

var EXPORTED_SYMBOLS = ["SECURITY_ATTRIBUTES", "LPSECURITY_ATTRIBUTES", "STARTUPINFO", "LPSTARTUPINFO", "PROCESS_INFORMATION", "LPPROCESS_INFORMATION", "OVERLAPPED", "LPOVERLAPPED", "SHFILEOPSTRUCT", "LPSHFILEOPSTRUCT", "WSADATA", "LPWSADATA", "in_addr", "sockaddr", "sockaddr_ptr", "sockaddr_in", "sockaddr_in_ptr"];

/* SECURITY_ATTRIBUTES structure
 * https://msdn.microsoft.com/en-us/library/windows/desktop/aa379560(v=vs.85).aspx
 */ 
var SECURITY_ATTRIBUTES = new ctypes.StructType("_SECURITY_ATTRIBUTES", [
	{"nLength": DWORD}, 
	{"lpSecurityDescriptor": LPVOID},
	{"bInheritHandle": BOOL}
]);
var LPSECURITY_ATTRIBUTES = new ctypes.PointerType(SECURITY_ATTRIBUTES);

/* STARTUPINFO structure
 * https://msdn.microsoft.com/en-us/library/windows/desktop/ms686331(v=vs.85).aspx
 */

var STARTUPINFO = new ctypes.StructType("_STARTUPINFO", [
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
var LPSTARTUPINFO = new ctypes.PointerType(STARTUPINFO);

/* PROCESS_INFORMATION structure
 * https://msdn.microsoft.com/en-us/library/windows/desktop/ms684873(v=vs.85).aspx
 */

var PROCESS_INFORMATION = new ctypes.StructType("_PROCESS_INFORMATION", [
	{"hProcess": HANDLE},
	{"hThread": HANDLE},
	{"dwProcessId": DWORD},
	{"dwThreadId": DWORD}
]);
var LPPROCESS_INFORMATION = new ctypes.PointerType(PROCESS_INFORMATION);

/* OVERLAPPED structure
 * https://msdn.microsoft.com/de-de/library/windows/desktop/ms684342(v=vs.85).aspx
 */

var OVERLAPPED = new ctypes.StructType("_OVERLAPPED", [
	{"Internal": ULONG_PTR},
	{"InternalHigh": ULONG_PTR},
	{"Pointer": PVOID},
	{"hEvent": HANDLE}
]);
var LPOVERLAPPED = new ctypes.PointerType(OVERLAPPED);

/* SHFILEOPSTRUCT structure
 * https://msdn.microsoft.com/en-us/library/bb759795.aspx
 */

var SHFILEOPSTRUCT = new ctypes.StructType("_SHFILEOPSTRUCT", [
	{"hWnd": HWND},
	{"wFunc": UINT},
	{"pFrom": PCZZTSTR},
	{"pTo": PCZZTSTR},
	{"fFlags": FILEOP_FLAGS},
	{"fAnyOperationsAborted": BOOL},
	{"hNameMappings": LPVOID},
	{"lpszProgressTitle": PCTSTR}
]);
var LPSHFILEOPSTRUCT = new ctypes.PointerType(SHFILEOPSTRUCT);

/* WSADATA structure
 * https://msdn.microsoft.com/de-de/library/windows/desktop/ms741563(v=vs.85).aspx
 */

var WSADATA = new ctypes.StructType("WSAData", [
	{"wVersion": WORD},
	{"wHighVersion": WORD},
	{"szDescription": ctypes.char},
	{"szSystemStatus": ctypes.char},
	{"iMaxSockets": ctypes.unsigned_short},
	{"iMaxUdpDg": ctypes.unsigned_short},
	{"lpVendorInfo": ctypes.voidptr_t}
]);
var LPWSADATA = new ctypes.PointerType(WSADATA);

/* in_addr structure
 * https://msdn.microsoft.com/de-de/library/windows/desktop/ms738571(v=vs.85).aspx
 */

var in_addr = new ctypes.StructType("in_addr", [
	{"S_addr": ctypes.unsigned_long}
]);
var IN_ADDR = in_addr;
var PIN_ADDR = new ctypes.PointerType(in_addr);

/* sockaddr, sockaddr_in structure
 * https://msdn.microsoft.com/de-de/library/windows/desktop/ms740496(v=vs.85).aspx
 */

var sockaddr = new ctypes.StructType("sockaddr", [
	{"sa_family": ctypes.unsigned_short},
	{"sa_data": ctypes.char.array(14)}
]);
var sockaddr_ptr = new ctypes.PointerType(sockaddr);

var sockaddr_in = new ctypes.StructType("sockaddr_in", [
	{"sin_family": ctypes.short},
	{"sin_port": ctypes.unsigned_short},
	{"sin_addr": in_addr},
	{"sin_zero": ctypes.char.array(8)}
]);
var sockaddr_in_ptr = new ctypes.PointerType(sockaddr_in);