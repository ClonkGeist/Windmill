ace.define("ace/mode/ocscript",["require","exports","module","ace/lib/oop","ace/mode/text_highlight_rules"], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
// defines the parent mode
var TextMode = require("./text").Mode;
var Tokenizer = require("../tokenizer").Tokenizer;
// var MatchingBraceOutdent = require("./matching_brace_outdent").MatchingBraceOutdent;

// defines the language specific highlighters and folding rules
var OC_HiglightRules = require("./ocscript_highlight_rules").OC_HiglightRules;
//var OC_Behaviour = require("./behaviour/ocscript").OC_Behaviour;
var MyNewFoldMode = require("./folding/ocscript").FoldMode;
var Range = require("../range").Range;
var Mode = function() {
    // set everything up
    this.HighlightRules = OC_HiglightRules;
	// this.$behaviour = new OC_Behaviour();
    // this.$outdent = new MatchingBraceOutdent();
    this.foldingRules = new MyNewFoldMode();
	
	this.completer = {
		getCompletions: (editor, session, pos, prefix, callback) => {
			var keywords = this.$keywordList || this.$createKeywordList();
			let words = keywords.map(function(word) {
				if(OC_FN_NAMES.indexOf(word) != -1) {
					return {
						name: word,
						value: word+"()",
						score: 12039120390123,
						meta: "func"
					}
				}
				return {
					name: word,
					value: word,
					score: 0,
					meta: "keyword"
				};
			});
			
			callback(null, words);
		}
	}
};

oop.inherits(Mode, TextMode);

exports.Mode = Mode;
});

ace.define("ace/mode/ocscript_highlight_rules",["require","exports","module","ace/lib/oop","ace/mode/text_highlight_rules","ace/range"], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

var OC_HiglightRules = function() {

    var keywords = (
        "break|continue|for|while|return|else|if|in|this|public|global|protected|func|private"
    );
	
	var varDeclarations = (
		"var|const|static|local|int|proplist|object|string|array|bool|any|def|effect|true|false|nil"
	);
	
	var keywordMapper = this.createKeywordMapper({
        "keyword": keywords,
		"variable": varDeclarations,
		"support.function": OC_FN_NAMES+"|"+OC_CONSTANTS,
    }, "identifier");
	
		// regexp must not have capturing parentheses. Use (?:) instead.
		// regexps are ordered -> the first match is used
	   this.$rules = {
			"start" : [
				{
					token : "comment.ocdoc", // doc comment
					regex :  "\\/\\*(?=\\*)",	// /\/\*(?=\*)/g,
					next  : "ocdoc",
				},	{
					token: "comment",
					regex: "\\/\\*",
					next: "comment",
				},	{
					token: "comment",
					regex: "\\/\\/",
					next: "line_comment",
				},	{
					token: "string",
					regex: "\"",
					next: "string",
				},	{
					token: "keyword.operator",
					regex: /--|\+\+|==|=|!=|!=|<=|>=|<<|>>|<|>|!|&&|\|\||\?\?|[!%&*+\-~\/^]=?/,
				},	{
					token: "paren.lparen",
					regex: /[\[{(]/,
				},	{
					token: "paren.rparen",
					regex: /[\]})]/
				},	{
					token: "statement-ending",
					regex: /\;/
				},	{
					token: "param-divide",
					regex: /\,/
				},	{
					token: "keyword",
					regex: "#include|#appendto",
				},	{
					token: "constant.character",
					regex: "([0-9_])"
				},	{
					token: keywordMapper,
					regex : "[a-zA-Z_$][a-zA-Z0-9_$]*\\b"
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
			"ocdoc" : [
				{
					token: "comment.ocdoc",
					regex: "\\*\\/",
					next: "start",
				}, {
					token: "comment.ocdoc.tag",
					regex: /\@[a-zA-Z_$]+/,
					next: "ocdoc",
				}, {
					defaultToken: "comment.ocdoc"
				}
			],
			"string" : [
				{
					token: "string",
					regex: "\"",
					next: "start",
					
				}, {
					token : "string", 
					regex : "$|^", 
					next : "start"
				},	{
					token: "string.placeholder",
					regex: "\%(?:d|x|X|i|v|s)",
				}, {
					defaultToken: "string"
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
		};
};

oop.inherits(OC_HiglightRules, TextHighlightRules);

exports.OC_HiglightRules = OC_HiglightRules;

});

/*ace.define("ace/mode/behaviour/ocscript",["require","exports","module","ace/lib/oop","ace/mode/behaviour","ace/token_iterator"], function(require, exports, module) {
// "use strict";

var oop = require("../../lib/oop");
var Behaviour = require("../behaviour").Behaviour;
var TokenIterator = require("../../token_iterator").TokenIterator;
var EditSession = require("../edit_session").EditSession;

var OC_Behaviour = function() {
	
	var session = new EditSession();
	var ti = new TokenIterator(session);
	err(ti);
};


exports.OC_Behaviour = OC_Behaviour;
});*/

ace.define("ace/mode/folding/ocscript",["require","exports","module","ace/lib/oop","ace/range","ace/mode/folding/fold_mode"], function(require, exports, module) {
"use strict";

var oop = require("../../lib/oop");
var Range = require("../../range").Range;
var BaseFoldMode = require("./fold_mode").FoldMode;

var FoldMode = exports.FoldMode = function() {};
oop.inherits(FoldMode, BaseFoldMode);

(function() {

    this.foldingStartMarker = /(\{|\[)[^\}\]]*$|^\s*(\/\*)/;
	this.foldingStopMarker = /^[^\[\{]*(\}|\])|^[\s\*]*(\*\/)/;

    this.getFoldWidgetRange = function(session, foldStyle, row) {
        
		var line = session.getLine(row);
		var match = line.match(this.foldingStartMarker);
		if (match) {
			var i = match.index;

			if (match[1])
				return this.openingBracketBlock(session, match[1], row, i);

			var range = session.getCommentFoldRange(row, i + match[0].length);
			range.end.column -= 2;
			return range;
		}
    };

}).call(FoldMode.prototype);

});

var OC_FN_NAMES = "Anim_AbsX|Anim_AbsY|Anim_Action|Anim_Const|Anim_Dist|Anim_Linear|Anim_X|Anim_XDir|\
Anim_Y|Anim_YDir|Trans_Identity|Trans_Mul|Trans_Rotate|Trans_Scale|Trans_Translate|\
GetAnimationLength|GetAnimationName|GetAnimationPosition|GetAnimationWeight|\
GetRootAnimation|PlayAnimation|SetAnimationBoneTransform|SetAnimationPosition|SetAnimationWeight|\
StopAnimation|TransformBone|Abs|Angle|ArcCos|ArcSin|BoundBy|Cos|Distance|DoRGBaValue|GetBit|\
GetRGBaValue|HSL|HSL2RGB|HSLa|Inside|Max|Min|RGB|RGB2HSL|RGBa|Random|RandomX|SetBit|SetRGBaValue|\
Sin|SplitRGBaValue|Sqrt|Tan|ToggleBit|EditCursor|FatalError|LogCallStack|ReloadDef|ReloadParticle|\
StartScriptProfiler|StopScriptProfiler|AddEffect|CheckEffect|EffectCall|GetEffect|GetEffectCount|\
RemoveEffect|Sound|SoundAt|Bubble|Smoke|GetClimate|GetSeason|GetTemperature|GetWind|LaunchLighting|\
SetSeason|SetTemperature|SetWind|LaunchEarthquake|LaunchVolcano|PlaceAnimal|PlaceVegation|GetActMapVal|\
GetDefCoreVal|GetMaterialVal|GetObjectInfoCoreVal|GetObjectVal|GetPlayerInfoCoreVal|GetPlayerVal|\
GetScenarioVal|FrameCounter|GameOver|GetGravity|IsNetwork|ResetGamma|SetGameSpeed|SetGamma|SetGravity|\
AddMsgBoardCmd|DoScoreboardShow|ScoreboardCol|SetScoreboardData|SortScoreboard|CanInsertMaterial|\
ExtractLiquid|ExtractMaterialAmount|GBackLiquid|GBackSemiSolid|GBackSky|GetAverageTextureColor|GetMaterial|\
GetMaterialCount|GetTexture|InsertMaterial|Material|MaterialName|BlastFree|CastPXS|ClearFreeRect|DigFree|\
DigFreeRect|DrawDefMap|DrawMap|DrawMaterialQuad|FindConstructionSite|GetMatAdjust|GetPatLength|InLiquid|\
LandscapeHeight|LandscapeWidth|PathFree|PathFree2|SetClimate|SetMatAdjust|ShakeFree|CustomMessage|Log|Message|\
PlayerMessage|Music|MusicLevel|SetPlayList|GetLeagueProgressData|GetLegueScore|SetLeaguePerformance|\
SetLeagueProgressData|ActIdle|GetActTime|GetAction|GetActionTarget|GetDir|GetPhase|GetProcedure|\
SetAction|SetActionData|SetActionTargets|SetBridgeActionData|SetDir|SetPhase|GetCategory|SetCategory|\
AddCommand|AppendCommand|FinishCommand|GetCommand|SetCommand|ComponentAll|GetComponent|SetComponent|\
Collect|Contained|Contents|ContentsCount|GrabContents|ScrollContents|ShiftContents|Buy|CastObjects|\
CheckConstructionSite|ComposeContents|CreateConstruction|CreateContents|CreateObject|PlaceObjects|\
DoCrewExp|GetController|GetCrew|GetCrewCount|GetCrewEnabled|GetCursor|GetHiRank|GrabObjectInfo|MakeCrewMember|\
SetCrewEnabled|SetCrewStatus|AttachMesh|DetachMesh|GetClrModulation|GetColor|GetMeshMaterial|\
GetObjectBlitMode|GetUnusedOverlayID|SetAttachBones|SetAttachTransform|SetClrModulation|SetColor|SetGraphics|\
SetMeshMaterial|SetObjDrawTransform|SetObjectBlitMode|SetPicture|Explode|RemoveAll|RemoveObject|Sell|\
Split2Components|DeathAnnounce|DoBreath|GetAlive|GetBreath|Kill|Punch|SetAlive|AddMenuItem|ClearMenuItems|\
CloseMenu|CreateMenu|GetMenu|GetMenuSelection|SelectMenuItem|SetMenuSiize|ShowInfo|Flint|GetComDir|\
GetR|GetRDir|GetXDir|GetYDir|Jump|SetComDir|SetR|SetRDir|SetSpeed|SetXDir|SetYDir|SlimFlight|GetOCF|\
AbsX|AbsY|Enter|Exit|GetX|GetY|SetPosition|GetProperties|GetProperty|SetProperty|FindBase|FindContents|\
FindObject|FindObjects|FindOtherContetns|Find_Action|Find_ActionTarget|Find_ActionTarget2|Find_ActionTargets|\
Find_Allied|Find_And|Find_AnyContainer|Find_AtPoint|Find_Category|Find_Container|Find_Distance|Find_Exclude|\
Find_Func|Find_Hostile|Fine_ID|Find_InRect|Find_NoContainer|Find_Not|Find_OCF|Find_OnLine|Find_Or|\
Find_Owner|ObjectCount|Sort_Distance|Sort_Func|Sort_Mass|Sort_Multiple|Sort_Random|Sort_Reverse|\
Sort_Speed|Sort_Value|ChangeDef|DoCon|DoDamage|DoEnergy|Extinguish|GetCon|GetContact|GetDamage|GetDefBottom|\
GetKiller|GetMass|GetNeededMatStr|GetOwner|GetValue|OnFire|SetCon|SetContactDensity|SetController|SetKiller|\
SetMass|SetName|SetOwner|SetSolidMask|SetTransferZone|Stuck|AddVertex|GetVertex|GetVertexNum|RemoveVertex|\
SetVertex|SetVertexXY|VerticesStuck|CheckVisibility|BlastObjects|CanConcatPictureWith|GetDefinition|\
GetEnergy|GetEntrance|GetID|GetName|GetRank|Incinerate|Object|ObejctDistance|ObjectNumber|SetEntrance|\
SetShape|ShakeObjects|ClearParticles|CreateParticle|CreateParticleAtBone|DrawParticleLine|\
PushParticles|GetPlayerZoomLimits|GetPlrView|GetPlrViewMode|SetFilmView|\
SetFoW|SetPlayerViewLock|SetPlayerZoom|SetPlrView|SetPlrViewRange|SetViewOffset|CreateScriptPlayer|\
DoBaseMaterial|DoBaseProduction|DoPlayerScore|DoWealth|EliminatePlayer|GainScenarioAchievement|GetBase|\
GetBaseMaterial|GetBaseProduction|GetCrewExtraData|GetPlayerByIndex|GetPlayerByName|GetPlayerColor|\
GetPlayerControlAssignment|GetPlayerCount|GetPlayerID|GetPlayerName|GetPlayerScore|GetPlayerScoreGain|\
GetPlayerTeam|GetPlayerType|GetPlrClonkSkin|GetPlrExtraData|GetPlrKnowledge|GetPlrMagic|GetStartupPlayerCount|\
GetTaggedPlayerName|GetWealth|Hostile|SetBaseMaterial|SetBaseProduction|SetCrewExtraData|\
SetCursor|SetHostility|SetMaxPlayer|SetPlayerTeam|SetPlrExtraData|SetPlrKnowledge|SetPlrMagic|SetWealth|\
GetIndexOf|SortArray|SortArrayByArrayElement|SortArrayByProperty|Call|GameCall|GameCallEx|CreateArray|Format|\
GetChar|GetLength|SetLength|Translate|WildcarMatch|ClearScheduleCall|DeepEqual|Par|ScheduleCall|Schedule|\
_inherited|eval|inherited|GetSkyAdjust|SetSkyAdjust|SetSkyParallax|FileWrite|GainsMissionAcces|GetMissionAcces|\
GetTime|MakeScenarioSaveName|SaveScenarioObjectAction|GetTeamByIndex|GetTeamColor|GetTeamName|GetType|Particles_Colored|\
PC_Bounce|PC_Die|PC_Stop|PV_Direction|PV_Gravity|PV_KeyFrames|PV_Linear|PV_Random|PV_Speed|PV_Sin|PV_Speed|PV_Wind\
";
var OC_CONSTANTS = "C4D_All|C4D_Background|C4D_Goal|C4D_Living|C4D_Object|C4D_Parallax|C4D_Rule|C4D_StaticBack|C4D_Structure|\
C4D_Vehicle|COMD_Down|COMD_DownLeft|COMD_DownRight|COMD_Left|COMD_None|COMD_Right|COMD_Stop|COMD_Up|COMD_UpLeft|COMD_UpRight|\
OCF_Alive|OCF_AttractLighting|OCF_Available|OCF_Chop|OCF_Collectible|OCF_Collection|OCF_Construct|OCF_Container|\
OCF_CrewMember|OCF_Entrance|OCF_Exclusive|OCF_FullIcon|OCF_Grab|OCF_HitSpeed1|OCF_HitSpeed2|OCF_HitSpeed3|OCF_HitSpeed4|\
OCF_InFree|OCF_InLiquid|OCF_InSolid|OCF_Inflammable|OCF_Living|OCF_NotContained|OCF_OnFire|OCF_Rotate|DIR_Left|DIR_Right|\
NO_OWNER|C4V_Array|C4V_Bool|C4V_C4Object|C4V_Int|C4V_Nil|C4V_PropList|C4V_String\
";
