ace.define("ace/snippets/ocscript",["require","exports","module"], function(require, exports, module) {
"use strict";

exports.snippetText = "# Function\n\
snippet func\n\
	func ${1?:function_name}(${2:argument}) {\n\
		${3:// body...}\n\
	}\n\
snippet global func\n\
	global func ${1?:function_name}(${2:argument}) {\n\
		${3:// body...}\n\
	}\n\
snippet protected func\n\
	protected func ${1?:function_name}(${2:argument}) {\n\
		${3:// body...}\n\
	}\n\
snippet public func\n\
	public func ${1?:function_name}(${2:argument}) {\n\
		${3:// body...}\n\
	}\n\
snippet private func\n\
	private func ${1?:function_name}(${2:argument}) {\n\
		${3:// body...}\n\
	}\n\
# if\n\
snippet if\n\
	if (${1:true}) {\n\
		${0}\n\
	}\n\
# if ... else\n\
snippet ife\n\
	if (${1:true}) {\n\
		${2}\n\
	} else {\n\
		${0}\n\
	}\n\
# FxBasicCallbacks\n\
snippet Fx*\n\
	func Fx${1?:effectName}Start(object target, proplist effect, int temporary, any var1, any var2, any var3, any var4)\n\
	{\n\
		if(temporary)\n\
			return;\n\
		${2:// body...}\n\
	}\n\
	\n\
	func Fx${1}Timer(object target, proplist effect, int time)\n\
	{\n\
		\n\
	}\n\
	\n\
	func Fx${1}Stop(object target, proplist effect, int reason, bool temporary)\n\
	{\n\
		if(temporary)\n\
			return;\n\
	}\n\
	\n\
";
exports.scope = "ocscript";

});