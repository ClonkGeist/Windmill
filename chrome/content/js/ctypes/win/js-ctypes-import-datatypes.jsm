/*
 * WINAPI DATATYPES
 */
 
var Cu = Components.utils;
Cu.import("resource://gre/modules/ctypes.jsm");

const _WIN64 = (ctypes.voidptr_t.size == 8);
const NULL = null;
const TRUE = true;
const FALSE = false;

//BASIC
const BOOL = ctypes.bool;
const BOOLEAN = ctypes.bool;
const BYTE = ctypes.unsigned_char;
const CCHAR = ctypes.char;
const CHAR = ctypes.char;
const DWORD = ctypes.uint32_t;
const DWORDLONG = ctypes.uint64_t;
const DWORD_PTR = ctypes.uint64_t.ptr;
const DWORD32 = ctypes.uint32_t;
const DWORD64 = ctypes.uint64_t;
const FLOAT = ctypes.float32_t;
const HALF_PTR = _WIN64?ctypes.int32_t:ctypes.int16_t;
const HFILE = ctypes.int32_t;
const HRESULT = ctypes.long;
const INT = ctypes.int;
const INT_PTR = _WIN64?ctypes.int64_t:ctypes.int32_t;
const INT8 = ctypes.char;
const INT16 = ctypes.int16_t;
const INT32 = ctypes.int32_t;
const INT64 = ctypes.int64_t;
const LONG = ctypes.long;
const LONGLONG = ctypes.long_long;
const LONG_PTR = _WIN64?ctypes.int64_t:ctypes.long;
const LONG32 = ctypes.long;
const LONG64 = ctypes.int64_t;
const PCSTR = ctypes.char.ptr;
const PCTSTR = ctypes.jschar.ptr;
const PCWSTR = ctypes.jschar.ptr;
const LPCSTR = ctypes.char.ptr;
const LPCTSTR = ctypes.jschar.ptr;
const LPCVOID = ctypes.voidptr_t;
const LPCWSTR = ctypes.jschar.ptr;
const LPVOID = ctypes.voidptr_t;
const PVOID = ctypes.voidptr_t;
const QWORD = ctypes.uint64_t;
const SHORT = ctypes.short;
const UCHAR = ctypes.unsigned_char;
const UHALF_PTR = _WIN64?ctypes.unsigned_int:ctypes.unsigned_short;
const UINT = ctypes.unsigned_int;
const UINT_PTR = _WIN64?ctypes.uint64_t:ctypes.unsigned_int;
const UINT8 = ctypes.unsigned_char;
const UINT16 = ctypes.unsigned_short;
const UINT32 = ctypes.unsigned_int;
const UINT64 = ctypes.uint64_t;
const ULONG = ctypes.unsigned_long;
const ULONGLONG = _WIN64?ctypes.uint64_t:ctypes.double;
const ULONG_PTR = _WIN64?ctypes.uint64_t:ctypes.unsigned_long;
const ULONG32 = ctypes.unsigned_int;
const ULONG64 = ctypes.uint64_t;
const USHORT = ctypes.unsigned_short;
const USN = ctypes.long_long;
const VOID = ctypes.void_t;
const WCHAR = ctypes.jschar;
const WORD = ctypes.unsigned_short;

//ADV
const ATOM = WORD;
const COLORREF = DWORD;
const HANDLE = PVOID;
const LANGID = WORD;
const LCID = DWORD;
const LCTYPE = DWORD;
const LGRPID = DWORD;
const LPARAM = LONG_PTR;
const SC_LOCK = LPVOID;
const SIZE_T = ULONG_PTR;
const SSIZE_T = LONG_PTR;
const TBYTE = WCHAR;
const TCHAR = WCHAR;
const WPARAM = UINT_PTR;
const LPBOOL = BOOL.ptr;
const LPBYTE = BYTE.ptr;
const LPCOLORREF = COLORREF.ptr;
const LPDWORD = DWORD.ptr;
const LPHANDLE = HANDLE.ptr;
const LPINT = INT.ptr;
const LPLONG = LONG.ptr;
const LPSTR = CHAR.ptr;
const LPWORD = WORD.ptr;
const LPWSTR = WCHAR.ptr;
const LRESULT = LONG_PTR;
const PBOOL = BOOL.ptr;
const PBOOLEAN = BOOLEAN.ptr;
const PBYTE = BYTE.ptr;
const PCHAR = CHAR.ptr;
const PDWORD = DWORD.ptr;
const PDWORDLONG = DWORDLONG.ptr;
const PDWORD_PTR = DWORD_PTR.ptr;
const PDWORD32 = DWORD32.ptr;
const PDWORD64 = DWORD64.ptr;
const PFLOAT = FLOAT.ptr;
const PHALF_PTR = HALF_PTR.ptr;
const PINT = INT.ptr;
const PINT_PTR = INT_PTR.ptr;
const PINT8 = INT8.ptr;
const PINT16 = INT16.ptr;
const PINT32 = INT32.ptr;
const PINT64 = INT64.ptr;
const PLCID = PDWORD;
const PLONG = LONG.ptr;
const PLONGLONG = LONGLONG.ptr;
const PLONG_PTR = LONG_PTR.ptr;
const PLONG32 = LONG32.ptr;
const PLONG64 = LONG64.ptr;
const PSHORT = SHORT.ptr;
const PSIZE_T = SIZE_T.ptr;
const PSSIZE_T = SSIZE_T.ptr;
const PSTR = CHAR.ptr;
const PTBYTE = TBYTE.ptr;
const PTCHAR = TCHAR.ptr;
const PUCHAR = UCHAR.ptr;
const PUHALF_PTR = UHALF_PTR.ptr;
const PUINT = UINT.ptr;
const PUINT_PTR = UINT_PTR.ptr;
const PUINT8 = UINT8.ptr;
const PUINT16 = UINT16.ptr;
const PUINT32 = UINT32.ptr;
const PUINT64 = UINT64.ptr;
const PULONG = ULONG.ptr;
const PULONGLONG = ULONGLONG.ptr;
const PULONG_PTR = ULONG_PTR.ptr;
const PULONG32 = ULONG32.ptr;
const PULONG64 = ULONG64.ptr;
const PUSHORT = USHORT.ptr;
const PWCHAR = WCHAR.ptr;
const PWORD = WORD.ptr;
const PWSTR = WCHAR.ptr;
const SOCKET = PVOID;
const HWND = HANDLE;
const HMENU = HANDLE;
const HINSTANCE = HANDLE;
const HICON = HANDLE;
const HCURSOR = HANDLE;
const HBRUSH = HANDLE;

//SUPER ADV
const PHANDLE = HANDLE.ptr;
const PTSTR = LPWSTR;
const SC_HANDLE = HANDLE;
const SERVICE_STATUS_HANDLE = HANDLE;
const LPTSTR = LPWSTR;

//Callbacks
const CALLBACK_ABI = ctypes.stdcall_abi;

const WNDENUMPROC = ctypes.FunctionType(CALLBACK_ABI, BOOL, [HWND, LPARAM]);
/* LRESULT WindowProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam);
 * https://msdn.microsoft.com/en-us/library/windows/desktop/ms633573(v=vs.85).aspx
 */
const WNDPROC = ctypes.FunctionType(CALLBACK_ABI, LRESULT, [HWND, UINT, WPARAM, LPARAM]);


var EXPORTED_SYMBOLS = ["BOOL", "BOOLEAN", "BYTE", "CCHAR", "CHAR", "DWORD", "DWORDLONG", "DWORD_PTR", "DWORD32", "DWORD64", "FLOAT", "HALF_PTR", "HFILE", "HRESULT", "INT", "INT_PTR", "INT8", "INT16", "INT32", "INT64", "LONG", "LONGLONG", "LONG_PTR", "LONG32", "LONG64", "PCSTR", "PCTSTR", "PCWSTR", "LPCSTR", "LPCTSTR", "LPCVOID", "LPCWSTR", "LPVOID", "PVOID", "QWORD", "SHORT", "UCHAR", "UHALF_PTR", "UINT", "UINT_PTR", "UINT8", "UINT16", "UINT32", "UINT64", "ULONG", "ULONGLONG", "ULONG_PTR", "ULONG32", "ULONG64", "USHORT", "USN", "VOID", "WCHAR", "WORD", "ATOM", "COLORREF", "HANDLE", "LANGID", "LCID", "LCTYPE", "LGRPID", "LPARAM", "SC_LOCK", "SIZE_T", "SSIZE_T", "TBYTE", "TCHAR", "WPARAM", "LPBOOL", "LPBYTE", "LPCOLORREF", "LPDWORD", "LPHANDLE", "LPINT", "LPLONG", "LPSTR", "LPTSTR", "LPWORD", "LPWSTR", "LRESULT", "PBOOL", "PBOOLEAN", "PBYTE", "PCHAR", "PDWORD", "PDWORDLONG", "PDWORD_PTR", "PDWORD32", "PDWORD64", "PFLOAT", "PHALF_PTR", "PINT", "PINT_PTR", "PINT8", "PINT16", "PINT32", "PINT64", "PLCID", "PLONG", "PLONGLONG", "PLONG_PTR", "PLONG32", "PLONG64", "PSHORT", "PSIZE_T", "PSSIZE_T", "PSTR", "PTBYTE", "PTCHAR", "PUCHAR", "PUHALF_PTR", "PUINT", "PUINT_PTR", "PUINT8", "PUINT16", "PUINT32", "PUINT64", "PULONG", "PULONGLONG", "PULONG_PTR", "PULONG32", "PULONG64", "PUSHORT", "PWCHAR", "PWORD", "PWSTR", "PHANDLE", "PTSTR", "SC_HANDLE", "SERVICE_STATUS_HANDLE", "SOCKET", "WNDENUMPROC", "HWND", "HMENU", "HINSTANCE", "HICON", "HCURSOR", "HBRUSH", "WNDPROC", "_WIN64", "NULL", "TRUE", "FALSE"];