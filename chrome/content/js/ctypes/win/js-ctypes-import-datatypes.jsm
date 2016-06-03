/*
 * WINAPI DATATYPES
 */

if(this.isWorker) {
}
else {
	var Cu = Components.utils;
	Cu.import("resource://gre/modules/ctypes.jsm");
}

var EXPORTED_SYMBOLS = ["BOOL", "BOOLEAN", "BYTE", "CCHAR", "CHAR", "DWORD", "DWORDLONG", "DWORD_PTR", "DWORD32", "DWORD64", "FLOAT", "HALF_PTR", "HFILE", "HRESULT", "INT", "INT_PTR", "INT8", "INT16", "INT32", "INT64", "LONG", "LONGLONG", "LONG_PTR", "LONG32", "LONG64", "PCSTR", "PCTSTR", "PCWSTR", "LPCSTR", "LPCTSTR", "LPCVOID", "LPCWSTR", "LPVOID", "PVOID", "QWORD", "SHORT", "UCHAR", "UHALF_PTR", "UINT", "UINT_PTR", "UINT8", "UINT16", "UINT32", "UINT64", "ULONG", "ULONGLONG", "ULONG_PTR", "ULONG32", "ULONG64", "USHORT", "USN", "VOID", "WCHAR", "WORD", "ATOM", "COLORREF", "HANDLE", "LANGID", "LCID", "LCTYPE", "LGRPID", "LPARAM", "SC_LOCK", "SIZE_T", "SSIZE_T", "TBYTE", "TCHAR", "WPARAM", "LPBOOL", "LPBYTE", "LPCOLORREF", "LPDWORD", "LPHANDLE", "LPINT", "LPLONG", "LPSTR", "LPWORD", "LPWSTR", "LRESULT", "PBOOL", "PBOOLEAN", "PBYTE", "PCHAR", "PDWORD", "PDWORDLONG", "PDWORD_PTR", "PDWORD32", "PDWORD64", "PFLOAT", "PHALF_PTR", "PINT", "PINT_PTR", "PINT8", "PINT16", "PINT32", "PINT64", "PLCID", "PLONG", "PLONGLONG", "PLONG_PTR", "PLONG32", "PLONG64", "PSHORT", "PSIZE_T", "PSSIZE_T", "PSTR", "PTBYTE", "PTCHAR", "PUCHAR", "PUHALF_PTR", "PUINT", "PUINT_PTR", "PUINT8", "PUINT16", "PUINT32", "PUINT64", "PULONG", "PULONGLONG", "PULONG_PTR", "PULONG32", "PULONG64", "PUSHORT", "PWCHAR", "PWORD", "PWSTR", "SOCKET", "PHANDLE", "PTSTR", "SC_HANDLE", "SERVICE_STATUS_HANDLE", "LPTSTR", "PCZZTSTR", "HWND", "FILEOP_FLAGS", "_WIN64", "NULL", "TRUE", "FALSE"];

var _WIN64 = (ctypes.voidptr_t.size == 8);
var NULL = null;
var TRUE = true;
var FALSE = false;

//BASIC
var BOOL = ctypes.bool;
var BOOLEAN = ctypes.bool;
var BYTE = ctypes.unsigned_char;
var CCHAR = ctypes.char;
var CHAR = ctypes.char;
var DWORD = ctypes.uint32_t;
var DWORDLONG = ctypes.uint64_t;
var DWORD_PTR = ctypes.uint64_t.ptr;
var DWORD32 = ctypes.uint32_t;
var DWORD64 = ctypes.uint64_t;
var FLOAT = ctypes.float32_t;
var HALF_PTR = _WIN64?ctypes.int32_t:ctypes.int16_t;
var HFILE = ctypes.int32_t;
var HRESULT = ctypes.long;
var INT = ctypes.int;
var INT_PTR = _WIN64?ctypes.int64_t:ctypes.int32_t;
var INT8 = ctypes.char;
var INT16 = ctypes.int16_t;
var INT32 = ctypes.int32_t;
var INT64 = ctypes.int64_t;
var LONG = ctypes.long;
var LONGLONG = ctypes.long_long;
var LONG_PTR = _WIN64?ctypes.int64_t:ctypes.long;
var LONG32 = ctypes.long;
var LONG64 = ctypes.int64_t;
var PCSTR = ctypes.char.ptr;
var PCTSTR = ctypes.jschar.ptr;
var PCWSTR = ctypes.jschar.ptr;
var LPCSTR = ctypes.char.ptr;
var LPCTSTR = ctypes.jschar.ptr;
var LPCVOID = ctypes.voidptr_t;
var LPCWSTR = ctypes.jschar.ptr;
var LPVOID = ctypes.voidptr_t;
var PVOID = ctypes.voidptr_t;
var QWORD = ctypes.uint64_t;
var SHORT = ctypes.short;
var UCHAR = ctypes.unsigned_char;
var UHALF_PTR = _WIN64?ctypes.unsigned_int:ctypes.unsigned_short;
var UINT = ctypes.unsigned_int;
var UINT_PTR = _WIN64?ctypes.uint64_t:ctypes.unsigned_int;
var UINT8 = ctypes.unsigned_char;
var UINT16 = ctypes.unsigned_short;
var UINT32 = ctypes.unsigned_int;
var UINT64 = ctypes.uint64_t;
var ULONG = ctypes.unsigned_long;
var ULONGLONG = _WIN64?ctypes.uint64_t:ctypes.double;
var ULONG_PTR = _WIN64?ctypes.uint64_t:ctypes.unsigned_long;
var ULONG32 = ctypes.unsigned_int;
var ULONG64 = ctypes.uint64_t;
var USHORT = ctypes.unsigned_short;
var USN = ctypes.long_long;
var VOID = ctypes.void_t;
var WCHAR = ctypes.jschar;
var WORD = ctypes.unsigned_short;

//ADV
var ATOM = WORD;
var COLORREF = DWORD;
var HANDLE = PVOID;
var LANGID = WORD;
var LCID = DWORD;
var LCTYPE = DWORD;
var LGRPID = DWORD;
var LPARAM = LONG_PTR;
var SC_LOCK = LPVOID;
var SIZE_T = ULONG_PTR;
var SSIZE_T = LONG_PTR;
var TBYTE = WCHAR;
var TCHAR = WCHAR;
var WPARAM = UINT_PTR;
var LPBOOL = BOOL.ptr;
var LPBYTE = BYTE.ptr;
var LPCOLORREF = COLORREF.ptr;
var LPDWORD = DWORD.ptr;
var LPHANDLE = HANDLE.ptr;
var LPINT = INT.ptr;
var LPLONG = LONG.ptr;
var LPSTR = CHAR.ptr;
var LPWORD = WORD.ptr;
var LPWSTR = WCHAR.ptr;
var LRESULT = LONG_PTR;
var PBOOL = BOOL.ptr;
var PBOOLEAN = BOOLEAN.ptr;
var PBYTE = BYTE.ptr;
var PCHAR = CHAR.ptr;
var PDWORD = DWORD.ptr;
var PDWORDLONG = DWORDLONG.ptr;
var PDWORD_PTR = DWORD_PTR.ptr;
var PDWORD32 = DWORD32.ptr;
var PDWORD64 = DWORD64.ptr;
var PFLOAT = FLOAT.ptr;
var PHALF_PTR = HALF_PTR.ptr;
var PINT = INT.ptr;
var PINT_PTR = INT_PTR.ptr;
var PINT8 = INT8.ptr;
var PINT16 = INT16.ptr;
var PINT32 = INT32.ptr;
var PINT64 = INT64.ptr;
var PLCID = PDWORD;
var PLONG = LONG.ptr;
var PLONGLONG = LONGLONG.ptr;
var PLONG_PTR = LONG_PTR.ptr;
var PLONG32 = LONG32.ptr;
var PLONG64 = LONG64.ptr;
var PSHORT = SHORT.ptr;
var PSIZE_T = SIZE_T.ptr;
var PSSIZE_T = SSIZE_T.ptr;
var PSTR = CHAR.ptr;
var PTBYTE = TBYTE.ptr;
var PTCHAR = TCHAR.ptr;
var PUCHAR = UCHAR.ptr;
var PUHALF_PTR = UHALF_PTR.ptr;
var PUINT = UINT.ptr;
var PUINT_PTR = UINT_PTR.ptr;
var PUINT8 = UINT8.ptr;
var PUINT16 = UINT16.ptr;
var PUINT32 = UINT32.ptr;
var PUINT64 = UINT64.ptr;
var PULONG = ULONG.ptr;
var PULONGLONG = ULONGLONG.ptr;
var PULONG_PTR = ULONG_PTR.ptr;
var PULONG32 = ULONG32.ptr;
var PULONG64 = ULONG64.ptr;
var PUSHORT = USHORT.ptr;
var PWCHAR = WCHAR.ptr;
var PWORD = WORD.ptr;
var PWSTR = WCHAR.ptr;
var SOCKET = PVOID;
var PCZZTSTR = WCHAR.ptr;
var FILEOP_FLAGS = WORD;

//SUPER ADV
var PHANDLE = HANDLE.ptr;
var PTSTR = LPWSTR;
var SC_HANDLE = HANDLE;
var SERVICE_STATUS_HANDLE = HANDLE;
var LPTSTR = LPWSTR;
var HWND = HANDLE;