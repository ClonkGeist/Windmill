/*
 * CTYPES struct Definitionen
 */

var Cu = Components.utils;
Cu.import("resource://gre/modules/ctypes.jsm");
Cu.import("resource://ctypes/win/js-ctypes-import-datatypes.jsm");

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

/* WSADATA structure
 * https://msdn.microsoft.com/de-de/library/windows/desktop/ms741563(v=vs.85).aspx
 */

const WSADATA = new ctypes.StructType("WSAData", [
	{"wVersion": WORD},
	{"wHighVersion": WORD},
	{"szDescription": ctypes.char},
	{"szSystemStatus": ctypes.char},
	{"iMaxSockets": ctypes.unsigned_short},
	{"iMaxUdpDg": ctypes.unsigned_short},
	{"lpVendorInfo": ctypes.voidptr_t}
]);
const LPWSADATA = new ctypes.PointerType(WSADATA);

/* in_addr structure
 * https://msdn.microsoft.com/de-de/library/windows/desktop/ms738571(v=vs.85).aspx
 */

const in_addr = new ctypes.StructType("in_addr", [
	{"S_addr": ctypes.unsigned_long}
]);
const IN_ADDR = in_addr;
const PIN_ADDR = new ctypes.PointerType(in_addr);

/* sockaddr, sockaddr_in structure
 * https://msdn.microsoft.com/de-de/library/windows/desktop/ms740496(v=vs.85).aspx
 */

const sockaddr = new ctypes.StructType("sockaddr", [
	{"sa_family": ctypes.unsigned_short},
	{"sa_data": ctypes.char.array(14)}
]);
const sockaddr_ptr = new ctypes.PointerType(sockaddr);

const sockaddr_in = new ctypes.StructType("sockaddr_in", [
	{"sin_family": ctypes.short},
	{"sin_port": ctypes.unsigned_short},
	{"sin_addr": in_addr},
	{"sin_zero": ctypes.char.array(8)}
]);
const sockaddr_in_ptr = new ctypes.PointerType(sockaddr_in);

/* WNDCLASSEX structure
 * https://msdn.microsoft.com/en-us/library/windows/desktop/ms633577(v=vs.85).aspx
 */

const WNDCLASSEX = new ctypes.StructType("tagWNDCLASSEX", [
	{"cbSize": UINT},
	{"style": UINT},
	{"lpfnWndProc": WNDPROC},
	{"cbClsExtra": ctypes.int},
	{"cbWndExtra": ctypes.int},
	{"hInstance": HINSTANCE},
	{"hIcon": HICON},
	{"hCursor": HCURSOR},
	{"hbrBackground": HBRUSH},
	{"lpszMenuName": LPCTSTR},
	{"lpszClassName": LPCTSTR},
	{"hIconSm": HICON}
]);
const PWNDCLASSEX = new ctypes.PointerType(WNDCLASSEX);

/* POINT structure
 * https://msdn.microsoft.com/en-us/library/windows/desktop/dd162805(v=vs.85).aspx
 */

const POINT = new ctypes.StructType("tagPoint", [
	{"x": LONG},
	{"y": LONG}
]);
const PPOINT = new ctypes.PointerType(POINT);

/* MSG structure
 * https://msdn.microsoft.com/en-us/library/windows/desktop/ms644958(v=vs.85).aspx
 */

const MSG = new ctypes.StructType("tagMSG", [
	{"hwnd": HWND},
	{"message": UINT},
	{"wParam": WPARAM},
	{"lParam": LPARAM},
	{"time": DWORD},
	{"pt": POINT}
]);

const EXPORTED_SYMBOLS = ["SECURITY_ATTRIBUTES", "LPSECURITY_ATTRIBUTES", "STARTUPINFO", "LPSTARTUPINFO", "PROCESS_INFORMATION", "LPPROCESS_INFORMATION", "OVERLAPPED", "LPOVERLAPPED", "WSADATA", "LPWSADATA", "in_addr", "sockaddr", "sockaddr_ptr", "sockaddr_in", "sockaddr_in_ptr", "WNDCLASSEX", "PWNDCLASSEX"];