ace.define("ace/theme/rocking-horse",["require","exports","module","ace/lib/dom"], function(require, exports, module) {

exports.isDark = false;
exports.cssClass = "ace-rocking-horse";
exports.cssText = ".ace-rocking-horse .ace_gutter {\
background: rgb(245, 245, 245);\
border-right: 1px solid rgb(235, 235, 235);\
border-right: 1px solid rgb(200, 200, 200);\
color: rgb(180, 180, 180);\
overflow : hidden;\
}\
.ace-rocking-horse .ace_content {\
background: rgb(245, 245, 245);\
}\
.ace-rocking-horse .ace_print-margin {\
width: 1px;\
background: #e8e8e8;\
}\
.ace-rocking-horse {\
background-color: rgb(250, 250, 250);\
color: rgb(40, 40, 40);\
}\
.ace-rocking-horse .ace_cursor {\
color: black;\
}\
.ace-rocking-horse .ace_invisible {\
color: rgb(191, 191, 191);\
}\
.ace-rocking-horse .ace_constant.ace_buildin {\
color: rgb(88, 72, 246);\
}\
.ace-rocking-horse .ace_constant.ace_language {\
color: rgb(88, 92, 246);\
color: #003aff;\
}\
.ace-rocking-horse .ace_constant.ace_library {\
color: rgb(6, 150, 14);\
}\
.ace-rocking-horse .ace_invalid {\
background-color: rgb(153, 0, 0);\
color: white;\
}\
.ace-rocking-horse .ace_fold {\
background-color: green;\
}\
.ace-rocking-horse .ace_support.ace_function {\
color: rgb(60, 76, 114);\
color: rgb(0, 102, 255);\
color: rgb(93, 144, 179);\
}\
.ace-rocking-horse .ace_support.ace_constant {\
color: rgb(6, 150, 14);\
}\
.ace-rocking-horse .ace_support.ace_type,\
.ace-rocking-horse .ace_support.ace_class\
.ace-rocking-horse .ace_support.ace_other {\
color: rgb(109, 121, 222);\
}\
.ace-rocking-horse .ace_variable.ace_parameter {\
font-style:italic;\
color:#FD971F;\
}\
.ace-rocking-horse .ace_keyword.ace_operator,\
.ace-rocking-horse .ace_param-divide,\
.ace-rocking-horse .ace_paren {\
color: rgb(104, 118, 135);\
font-weight: bold;\
color: grey;\
}\
.ace-rocking-horse .ace_comment {\
color: rgb(53, 158, 107);\
}\
.ace-rocking-horse .ace_comment.ace_ocdoc {\
color: rgb(0, 102, 255);\
}\
.ace-rocking-horse .ace_comment.ace_ocdoc.ace_tag {\
color: rgb(0, 32, 225);\
}\
.ace-rocking-horse .ace_constant.ace_numeric,\
.ace-rocking-horse .ace_constant.ace_character {\
color: rgb(0, 102, 255);\
}\
.ace-rocking-horse .ace_variable {\
color: rgb(49, 132, 149);\
color: rgb(241, 59, 0);\
color: rgb(214, 125, 51);\
font-weight: bold;\
}\
.ace-rocking-horse .ace_entity.ace_name.ace_function {\
color: #0000A2;\
}\
.ace-rocking-horse .ace_heading {\
color: rgb(12, 7, 255);\
}\
.ace-rocking-horse .ace_list {\
color:rgb(185, 6, 144);\
}\
.ace-rocking-horse .ace_marker-layer .ace_selection {\
background: rgb(196, 233, 243);\
}\
.ace-rocking-horse .ace_marker-layer .ace_step {\
background: rgb(252, 255, 0);\
}\
.ace-rocking-horse .ace_marker-layer .ace_stack {\
background: rgb(164, 229, 101);\
}\
.ace-rocking-horse .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid rgb(192, 192, 192);\
}\
.ace-rocking-horse .ace_marker-layer .ace_active-line {\
background: rgba(0, 0, 0, 0.07);\
}\
.ace-rocking-horse .ace_gutter-active-line {\
background-color : #dcdcdc;\
}\
.ace-rocking-horse .ace_marker-layer .ace_selected-word {\
background: rgb(250, 250, 255);\
border: 1px solid rgb(200, 200, 250);\
}\
.ace-rocking-horse .ace_storage,\
.ace-rocking-horse .ace_keyword,\
.ace-rocking-horse .ace_meta.ace_tag {\
color: rgb(219, 70, 49);\
font-weight: bold;\
}\
.ace-rocking-horse .ace_string.ace_regex {\
color: rgb(255, 0, 0)\
}\
.ace-rocking-horse .ace_string {\
color: #BA6133;\
}\
.ace-rocking-horse .ace_string.ace_placeholder {\
color: #F4370A;\
}\
.ace-rocking-horse .ace_entity.ace_other.ace_attribute-name {\
color: #994409;\
}\
.ace-rocking-horse .ace_indent-guide {\
background: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAE0lEQVQImWP4////f4bLly//BwAmVgd1/w11/gAAAABJRU5ErkJggg==\") right repeat-y;\
}\
";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});
