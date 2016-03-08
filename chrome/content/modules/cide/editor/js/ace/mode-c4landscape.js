ace.define("ace/mode/c4landscape_highlight_rules",["require","exports","module","ace/lib/oop","ace/mode/text_highlight_rules"], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;


var C4LandscapeHighlightRules = function() {
	var keywordMapper = this.createKeywordMapper({
		// objects
        "keyword": "overlay|map|point",
		// fill algos
		"variable": "solid|random|checker|bozo|sin|boxes|rndchecker|lines|border|mandel|rndall|script|poly",
		// attributes
		"support.function": "mat|tex|wdt|hgt|x|y|ox|oy|algo|zoomX|zoomY|a|b|turbulence|rotate|invert|seed|loosebounds|mask|grp|sub|lambda"
    }, "identifier");
	
    this.$rules = {
        start: [/*{
            token: 'punctuation.definition.comment',
            regex: '\/\/.*',
            push_: [{
                token: 'comment.line.number-sign',
                regex: '$|^',
                next: 'pop'
            }, {
                defaultToken: 'comment.line.number-sign'
            }]
		},*/{
					token: "comment",
					regex: "\\/\\/",
					next: "line_comment",
		},	{
			token: "comment",
			regex: "\\/\\*",
			next: "comment",
		},	{		
			token: "paren.lparen",
			regex: /\{/,
		}, {
			token: "paren.rparen",
			regex: /\}/,
		}, {
			token: "keyword.operator",
			regex: /\&|\||\^/,
		}, {
			token: "constant.character",
			regex: "([0-9_])"
		}, {
			token: keywordMapper,
			regex : "[a-zA-Z_$][a-zA-Z0-9_$]*\\b"
		}, {
            token: ['keyword.other.definition', 'text', 'punctuation.separator.key-value'],
            regex: '\\b([a-zA-Z0-9_.-]+)\\b(\\s*)(=)'
        }
		],
		"line_comment" : [
			{
				token : "comment", 
				regex : "$|^", 
				next : "start"
			},	{
				defaultToken : "comment"
			}
		],
		"comment" : [
			{
				token: "comment",
				regex: "\\*\\/",
				next: "start",
				
			}, {
				defaultToken: "comment"
			}
		],
    };

    this.normalizeRules();
};

oop.inherits(C4LandscapeHighlightRules, TextHighlightRules);

exports.C4LandscapeHighlightRules = C4LandscapeHighlightRules;
});

ace.define("ace/mode/folding/c4landscape",["require","exports","module","ace/lib/oop","ace/range","ace/mode/folding/fold_mode"], function(require, exports, module) {
"use strict";

var oop = require("../../lib/oop");
var Range = require("../../range").Range;
var BaseFoldMode = require("./fold_mode").FoldMode;

var FoldMode = exports.FoldMode = function() {
};
oop.inherits(FoldMode, BaseFoldMode);

(function() {

	this.foldingStartMarker = /(\{)[^\}]*$|^\s*(\/\*)/;

    this.getFoldWidgetRange = function(session, foldStyle, row) {
        var re = this.foldingStartMarker;
        var line = session.getLine(row);
        
        var m = line.match(re);
        
        if (!m) return;
        
        var startName = m[1] + ".";
        
        var startColumn = line.length;
        var maxRow = session.getLength();
        var startRow = row;
        var endRow = row;

        while (++row < maxRow) {
            line = session.getLine(row);
            if (/^\s*$/.test(line))
                continue;
            m = line.match(re);
            if (m && m[1].lastIndexOf(startName, 0) !== 0)
                break;

            endRow = row;
        }

        if (endRow > startRow) {
            var endColumn = session.getLine(endRow).length;
            return new Range(startRow, startColumn, endRow, endColumn);
        }
    };

}).call(FoldMode.prototype);

});

ace.define("ace/mode/c4landscape",["require","exports","module","ace/lib/oop","ace/mode/text","ace/mode/c4landscape_highlight_rules","ace/mode/folding/c4landscape"], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var TextMode = require("./text").Mode;
var C4LandscapeHighlightRules = require("./c4landscape_highlight_rules").C4LandscapeHighlightRules;
var FoldMode = require("./folding/c4landscape").FoldMode;

var Mode = function() {
    this.HighlightRules = C4LandscapeHighlightRules;
    this.foldingRules = new FoldMode();
};
oop.inherits(Mode, TextMode);

(function() {
    this.lineCommentStart = ";";
    this.blockComment = {start: "/*", end: "*/"};
    this.$id = "ace/mode/c4landscape";
}).call(Mode.prototype);

exports.Mode = Mode;
});
