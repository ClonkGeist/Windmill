/*-- Scenario Settings --*/

var md_editor, md_editorframe, deflistitem_keybindings;
var ctxDeflist, ctxAODeflist;

function TabManager() { return sessions; }
function alternativeActiveId() { return getCurrentWrapperIndex(); }

$(window).ready(function() {
	md_editor = createModule("scripteditor", $("#editorframe"));
	md_editorframe = getModule(md_editor, true);

	setupDeflistKeybindings();
	initializeContextMenu();
	setupNumberInputs();
});

function setupDeflistKeybindings() {
	deflistitem_keybindings = [
		//Eintraege loeschen
		new KeyBinding("DefselRemoveItem", "DELETE", function(e, target) {
			removeDeflistEntry(target);			
		}, 0, 0, { no_customization: true }),

		//Cursor Hoch
		new KeyBinding("DefselMoveUp", "UP", function(e, target) {
			if($(target).prev()[0])
				$(target).prev().trigger("mousedown").focus();
		}, 0, 0, { no_customization: true }),

		//Cursor Runter
		new KeyBinding("DefselMoveDown", "DOWN", function(e, target) {
			if($(target).next()[0])
				$(target).next().trigger("mousedown").focus();
		}, 0, 0, { no_customization: true }),

		//Itemanzahl erhoehen
		new KeyBinding("DefselIncEntry", ["+", "NUMPAD +"], function(e, target) { changeDeflistEntryValue(target, +1); }, 0, 0, { no_customization: true }),		
		//Itemanzahl verringern
		new KeyBinding("DefselDecEntry", ["-", "NUMPAD -"], function(e, target) { changeDeflistEntryValue(target, -1); }, 0, 0, { no_customization: true }),
	];
}

function initializeContextMenu() {
	ctxDeflist = new ContextMenu(0, [
		["$ctxIncrease$", 0, function(obj_by) {
			changeDeflistEntryValue(obj_by, +1);
		}, 0, { identifier: "normal" }],
		["$ctxDecrease$", 0, function(obj_by) {
			changeDeflistEntryValue(obj_by, -1);
		}, 0, { identifier: "normal" }],
		["$ctxRemove$", 0, function(obj_by) {
			removeDeflistEntry(obj_by);
		}, 0, { identifier: "normal" }],
		["$ctxAddItem$", 0, function(obj_by) {
			addDeflistEntry(getWrapper(".deflist-current > .deflist-ao-list-content"), $(obj_by).attr("data-defid"), 0, { nodragdrop: true, trackchange: true });
		}, 0, { identifier: "selection" }],
		"seperator",
		["$ctxNavigateInExplorer$", 0, function(obj_by) { //Definition im Explorer navigieren/auswaehlen
			var f = _sc.file($(obj_by).attr("data-path"));
			if(!f.exists())
				return EventInfo("$FileNotFound$");

			$(getModuleByName("cide-explorer").contentWindow).focus();
			getModuleByName("cide-explorer").contentWindow.navigateToPath(formatPath(f.path)+"/", true).then(null, function() {
				EventInfo("$FileNotFound$");
			});
		}, 0],
		"seperator",
		["$ctxOpenMeshes$", 0, 0, (new ContextMenu(ctxInsertMeshEntries, [], MODULE_LPRE)), { identifier: "openMeshes" }],
		["$ctxOpenGraphics$", 0, 0, (new ContextMenu(ctxInsertGraphicsEntries, [], MODULE_LPRE)), { identifier: "openGraphics" }]
	], MODULE_LPRE, { fnCheckVisibility: ctxCheckVisibility });
}

function ctxCheckVisibility(obj_by, identifier) {
	if($(obj_by).hasClass("invalid")) {
		if(identifier != "normal")
			return 1 + (identifier == "selection");
		else
			return 0;
	}

	var f = _sc.file($(obj_by).attr("data-path")), check = "";

	if(identifier == "openMeshes")
		check = /.+\.mesh$/i;
	else if(identifier == "openGraphics")
		check = /^Graphics.*\.png$/i;
	else {
		if(identifier == "normal" && $(obj_by).parents(".deflist-defsel")[0])
			return 2;
		else if(identifier == "selection" && !$(obj_by).parents(".deflist-defsel")[0])
			return 2;
		return 0;
	}

	//Dateien durchgehen und abgleichen
	var entries = f.directoryEntries;
	while(entries.hasMoreElements()) {
		var entry = entries.getNext().QueryInterface(Ci.nsIFile);
		if(entry.leafName.search(check) != -1)
			return 0;
	}

	return 1;
}

function ctxInsertMeshEntries(obj_by) {
	var f = _sc.file($(obj_by).attr("data-path"));
	this.clearEntries();

	var entries = f.directoryEntries, aMatches = [];
	while(entries.hasMoreElements()) {
		var entry = entries.getNext().QueryInterface(Ci.nsIFile);
		if(entry.leafName.search(/.+\.mesh$/i) != -1)
			this.addEntry(entry.leafName, 0, function(target, menuitemobj, menuitem) {
				getModuleByName("cide").contentWindow.addMeshviewer((new _sc.file(menuitem.options.entrypath)));
			}, 0, { entrypath: entry.path });
	}

	return true;
}

function ctxInsertGraphicsEntries(obj_by) {
	var f = _sc.file($(obj_by).attr("data-path"));
	this.clearEntries();

	var entries = f.directoryEntries, aMatches = [];
	while(entries.hasMoreElements()) {
		var entry = entries.getNext().QueryInterface(Ci.nsIFile);
		if(entry.leafName.search(/^Graphics.*\.png$/i) != -1)
			this.addEntry(entry.leafName, 0, function(target, menuitemobj, menuitem) {
				getModuleByName("cide").contentWindow.addImgEditor((new _sc.file(menuitem.options.entrypath)), false);
			}, 0, { entrypath: entry.path });
	}

	return true;
}

var sessions = [], definitions = [];

function setLoadingCaption(text, index) {	getWrapper(".loadingPage-caption > p", index).text(Locale(text)); }
function setLoadingSubCaption(text, index) {	getWrapper(".loadingPage-subCaption", index).text(Locale(text)); }

function getWrapper(sel, index = getCurrentWrapperIndex()) {
	if(sel)
		return $("#scensettings-session-"+index).find(sel);

	return $("#scensettings-session-"+index);
}

function getCurrentWrapperIndex() {
	if($(".scenario-settings.visible")[0])
		return parseInt($(".scenario-settings.visible").attr("id").replace("scensettings-session-", ""));
	else
		return -1;
}

function addScript(path, lang, index, path, fShow) {
	var clone = $(".scenario-settings.draft").clone();
	clone.removeClass("draft");
	clone.attr("id", "scensettings-session-"+index);
	$("body").append(clone);
	if(fShow) {
		$(".scenario-settings.visible").removeClass("visible");
		clone.addClass("visible");
		$("#editorframe").removeClass("visible");
	}

	setLoadingCaption("$LoadingReadScenarioData$", index);
	sessions[index] = { path };

	//Definitionen laden
	var loadingdefs = [], scenariodefs = [];
	Task.spawn(function*() {
		let text = yield OS.File.read(path, {encoding: "utf-8"});
		let scendata = parseINIArray(text), def;
		sessions[index].scendata = scendata;

		for(var key in scendata["Definitions"]) {
			def = scendata["Definitions"][key];

			if(def)
				scenariodefs.push(def);

			//Geladene und gecachete Definitionen nicht nochmal laden
			if(definitions[def])
				continue;

			loadingdefs.push(def);
		}
		if(!scendata["Definitions"])
			loadingdefs = ["Objects.ocd"], scenariodefs = ["Objects.ocd"];

		let temp = formatPath(sessions[index].path).split("/");
		temp.pop();
		let relpath = temp.join("/").replace(_sc.workpath(index)+"/", "");
		loadingdefs.push(relpath);
		scenariodefs.push(relpath);
		sessions[index].relpath = relpath;
		sessions[index].loadingdefs = loadingdefs;
		sessions[index].scenariodefs = scenariodefs;

		while(def = sessions[index].loadingdefs.pop()) {
			setLoadingCaption("$LoadingDefFrom$: " + def);
			definitions[def] = { ids: [] };
			definitions[def].d = yield loadDefinitionsFrom(def, 0, def);
			if(!definitions[def].d)
				definitions[def] = undefined;
		}
		return text;
	}).then(function(text) {
		setLoadingCaption("$LoadingDone$");
		setLoadingSubCaption("");
		getWrapper(".navigation, .settings-page-container", index).addClass("ready");
		getWrapper(".loadingPage", index).fadeOut(200);

		let prev_page;
		var navbtnfn = function(identifier) { return function() {
			if($(this).hasClass("nav-page-code") && identifier != "page-code") {
				//TODO: Auf Changes ueberpruefen und an dieser Stelle ueberarbeiten
				reloadDefinitions();
			}
			getWrapper(".navigation-option", index).removeClass("active");
			$(this).addClass("active");

			getWrapper(".settings-page.active", index).removeClass("active");
			getWrapper("."+identifier, index).addClass("active");

			closeAddingOverlay(index);

			if(identifier == "page-code") {
				md_editorframe.contentWindow.setDocumentValue(index, generateScenarioTxt(index), true);
				$("#editorframe").addClass("visible");
				createCideToolbar();
			}
			else if(prev_page == "page-code") {
				let scendata = sessions[index].scendata, deflist_changed;
				sessions[index].scendata = parseINIArray(md_editorframe.contentWindow.getDocumentValue(index));
				let scendefs = [];
				for(var key in sessions[index].scendata["Definitions"]) {
					def = sessions[index].scendata["Definitions"][key];

					if(def)
						scendefs.push(def);

					if(!definitions[def])
						definitions[def] = true;
				}
				if(!sessions[index].scendata["Definitions"])
					scendefs = ["Objects.ocd"];
				scendefs.push(sessions[index].relpath);
				sessions[index].scendata["PlayerX"] = sessions[index].scendata["Player1"];
				if(scendefs.length != sessions[index].scenariodefs.length)
					deflist_changed = true;
				else
					for(var i = 0; i < scendata.length; i++)
						if(sessions[index].scenariodefs.indexOf(scendefs[i]) == -1)
							deflist_changed = true;

				sessions[index].scenariodefs = scendefs;
				Task.spawn(function*() {
					if(deflist_changed)
						yield reloadDefinitions();

					loadScenarioContentToElements(index);

					$("#editorframe").removeClass("visible");
				});
			}
			prev_page = identifier;
		};};
		getWrapper(".nav-page-general", index).mousedown(navbtnfn("page-general")).trigger("mousedown");
		getWrapper(".nav-page-objects", index).mousedown(navbtnfn("page-objects"));
		getWrapper(".nav-page-landscape", index).mousedown(navbtnfn("page-landscape"));
		getWrapper(".nav-page-environment", index).mousedown(navbtnfn("page-environment"));
		getWrapper(".nav-page-code", index).mousedown(navbtnfn("page-code"));
		getWrapper(".nav-reload", index).mousedown(reloadDefinitions);
		getWrapper(".nav-save", index).mousedown(function() { return saveTab(index); });

		tooltip(getWrapper(".nav-reload", index), "$TooltipReloadDefs$", "html", 600);

		preparePseudoElements(index);

		getWrapper(".sp-o-switchpage", index).click(function() { getWrapper(".sp-o-group", index).toggleClass("inactive"); });
		getWrapper(".deflist-ao-header-close", index).click(function() { closeAddingOverlay(index); });

		getWrapper(".deflist-ao-listwrapper", index).on("dragover", function(e) {
			e = e.originalEvent;
			e.preventDefault();
		}).on("drop", function(e) {
			e = e.originalEvent;
			e.preventDefault();
			var data = e.dataTransfer.getData("cide/deflistitem");
			addDeflistEntry($(this).find(".deflist-ao-list-content"), data, 0, { nodragdrop: true, trackchange: true });
		});

		getWrapper(".deflist-ao-searchinput").keyup(function(e) {
			$(this).parents(".deflist-ao-listwrapper").find(".deflist-ao-hidesearch").removeClass("deflist-ao-hidesearch");
			if($(this).val())
				$(this).parents(".deflist-ao-listwrapper").find(".definition-selection-item:not(.definition-selection-item[data-displayname*='"+$(this).val().toUpperCase()+"'])").addClass("deflist-ao-hidesearch");
		});

		loadScenarioContentToElements(index, true);

		if(!md_editorframe.contentWindow.readyState) {
			md_editorframe.contentWindow.addEventListener("load", function(){
				this.addScript(text, lang, index, path, true);
			});
		}
		else
			md_editorframe.contentWindow.addScript(text, lang, index, path, true);
	});
}

function loadScenarioContentToElements(index, skipDefsel) {
	if(!skipDefsel) {
		getWrapper(".definition-selection-wrapper", index).each(function() {
			loadDefinitionSelectionData(this);
			loadDefinitionSelection(this);
		});
	}

	//Sonstige Eintraege fuellen
	getWrapper("[data-scenario-sect!='']", index).each(function() {
		if(!$(this).attr("data-scenario-key"))
			return;

		var sect = $(this).attr("data-scenario-sect"), key = $(this).attr("data-scenario-key"), val;
		if(!sessions[index].scendata[sect] || sessions[index].scendata[sect][key] === undefined) {
			if(!$(this).attr("data-defaultvalue"))
				return;

			val = $(this).attr("data-defaultvalue");
		}
		else
			val = sessions[index].scendata[sect][key];

		if($(this).prop("tagName").toLowerCase() == "input") {
			switch($(this).attr("type").toLowerCase()) {
				case "checkbox":
					$(this).prop("checked", val == "1");
					break;

				default:
					val = val.split(",")[0];
					$(this).val(val);
					break;
			}
		}
		$(this).unbind("change").change(function() {
			onFileChanged(getCurrentWrapperIndex());
		});
	});
}

function saveTabContent(index) {
	let promise = OS.File.writeAtomic(sessions[index].path, generateScenarioTxt(index), {encoding: "utf-8"});
	promise.then(function() {
		EventInfo("$EI_Saved$", -1);
	});
	return promise;
}

function getScenarioValue(obj) {
	var val = $(obj).attr("data-defaultvalue");
	if($(obj).prop("tagName").toLowerCase() == "input") {
		switch($(obj).attr("type").toLowerCase()) {
			case "checkbox":
				val = $(obj).prop("checked")?"1":"0";
				break;

			default:
				//Support fuer 4-Integer-Werte
				val = $(obj).val();
				break;
		}
	}
	if($(obj).hasClass("definition-selection-wrapper"))
		val = getDeflistString(obj);

	return val;
}

function generateScenarioTxt(index) {
	var data = sessions[index].scendata;

	//Daten aus den HTML-Elementen laden
	getWrapper("[data-scenario-sect!='']", index).each(function() {
		if(!$(this).attr("data-scenario-key"))
			return;

		var sect = $(this).attr("data-scenario-sect"), key = $(this).attr("data-scenario-key"), val = getScenarioValue(this);
		var setvalue = (s, k, v) => {
			if(!data[s])
				data[s] = [];

			data[s][k] = v;
		}
		if(sect == "PlayerX" || sect == "Player1") {
			for(var i = 1; i <= 4; i++)
				setvalue("Player"+i, key, val);
		}
		else
			setvalue(sect, key, val);
	});

	var order = ["Head", "Definitions", "Game", "Player1", "Player2", "Player3", "Player4", "Landscape", "Weather", "Animals"], text = "";

	//Sonstige Sections
	for(var key in data)
		if(data[key] instanceof Array && order.indexOf(key) == -1 && isNaN(parseInt(key)))
			if(key != "PlayerX")
				order.push(key);

	//Text generieren
	for(var i = 0; i < order.length; i++) {
		var sect = order[i];
		if(!data[sect])
			continue;

		var head = false;
		for(var key in data[sect]) {
			if(data[sect][key] === undefined)
				continue;

			if(!head) {
				text += "["+sect+"]\r\n";
				head = true;
			}

			text += key+"="+data[sect][key]+"\r\n";
		}

		text += "\r\n";
	}

	return text;
}

function reloadDefinitions() {
	closeAddingOverlay(getCurrentWrapperIndex());

	let task = Task.spawn(function*() {
		lockModule("Reloading...");
		for(var def in definitions) {
			definitions[def] = { ids: [] };
			definitions[def].d = yield loadDefinitionsFrom(def, 0, def, 0, true);
			if(!definitions[def].d)
				EventInfo($(getWrapper(".loadingPage-subCaption").text()));
		}
	});
	task.then(function() {
		unlockModule();
		$(".definition-selection-item").each(function() {
			if($(this).parents(".deflist-adding-overlay")[0])
				return;

			var index = parseInt($(this).parents(".scenario-settings").attr("id").replace("scensettings-session-", ""));
			var scenariodefs = sessions[index].scenariodefs;
			for(var i = 0; i < scenariodefs.length; i++) {
				var def = definitions[scenariodefs[i]].ids[$(this).attr("data-defid")];
				if(!def)
					continue;

				if(!def.invalid && $(this).hasClass("invalid")) {
					def.invalid = false;
					$(this).removeClass("invalid");
				}
				else if(def.invalid) {
					def.desc = Locale("$DefInvalid$");
					$(this).addClass("invalid");
				}

				$(this).attr("data-path", def.path);
				$(this).attr("data-displayname", def.title.toUpperCase());
				$(this).contents().first()[0].textContent = def.title;
				$(this).unbind("mouseenter").unbind("mouseleave");
				tooltip(this, def.desc, "html", 600);

				break;
			}

			if(!def) {
				$(this).addClass("invalid");
				$(this).unbind("mouseenter").unbind("mouseleave");

				var title = $(this).attr("data-defid");
				$(this).attr("data-displayname", title.toUpperCase());
				$(this).contents().first()[0].textContent = title;
				tooltip(this, Locale("$DefInvalid$"), "html", 600);
			}
		});

		EventInfo("$ReloadComplete$");
	}, function() { unlockModule(); });
	return task;
}

function createCideToolbar(...pars) {
	if(md_editorframe && md_editorframe.contentWindow)
		if($("#editorframe").hasClass("visible"))
			md_editorframe.contentWindow._createCideToolbar(...pars);
}

function getDeflistEntryValue(entry) { return parseInt($(entry).find(".definition-selection-item-counter").text()) || 0; }

function changeDeflistEntryValue(entry, change) {
	if(!$(entry).find(".definition-selection-item-counter")[0])
		return;

	var def = getDefinitionById($(entry).attr("data-defid")), maxval = def.max_menu_select || 100;
	if(def.max_menu_select > 0)
		maxval = Math.min(def.max_menu_select, 0x7FFFFFFF);

	var val = Math.max(Math.min(getDeflistEntryValue(entry)+change, maxval), 1);
	$(entry).find(".definition-selection-item-counter").text(val);
	onFileChanged(getCurrentWrapperIndex());
	return;
}

function getDefinitionById(def) {
	var index = getCurrentWrapperIndex();
	for(var i = sessions[index].scenariodefs.length-1; i >= 0; i--) {
		var odef = definitions[sessions[index].scenariodefs[i]].ids[def];
		if(odef && odef.defcore)
			break;
		odef = undefined;
	}

	return odef;
}

function getDeflistString(entry) {
	var content = "";
	$(entry).find(".definition-selection-item").each(function() {
		content += $(this).attr("data-defid")+"="+getDeflistEntryValue(this)+";";
	});

	if(!content)
		return;
	return content.substr(0, content.length-1);
}

function addDeflistEntry(deflist, def, deflistitem, options = {}) {
	if(!deflistitem) {
		var classes = "";
		if(typeof def == "string") { //Definition ueber ID laden
			def = getDefinitionById(def);

			if(!def || def.invalid) {
				classes += " invalid";
				if(getConfigData("ScenarioSettings", "HideInvalidDefs"))
					return false;
			}

			//Eintrag bereits vorhanden?
			var entry = $(deflist).find('.definition-selection-item[data-defid="'+def.defcore["DefCore"]["id"]+'"]')[0];
			if(entry) {
				changeDeflistEntryValue(entry, 1);
				return;
			}
		}
		else if(def.invalid) {
			classes += " invalid";
			if(getConfigData("ScenarioSettings", "HideInvalidDefs"))
				return false;
		}

		var counter = '';
		if(!options.hidecounter)
			counter = '<span class="definition-selection-item-counter">'+(options.counter || 1)+'</span>';

		var deflistitem = $(`<div class="definition-selection-item${classes}" tabindex="0" data-defid="${def.defcore.DefCore.id}"
							  data-path="${def.path}" data-displayname="${def.title.toUpperCase()}" draggable="true">${def.title}${counter}</div>`);
		$(deflist).append(deflistitem);
	}

	deflistitem.mousedown(function() {
		$(this).parent().find(".definition-selection-item.selected").removeClass("selected");
		$(this).addClass("selected");
	}).blur(function() {
		$(this).removeClass("selected");
	});

	if(def)
		tooltip($(deflistitem)[0], def.desc, "html", 600);

	if(!options.nodragdrop)
		deflistitem.on("dragstart", function(e) {
			e = e.originalEvent;
			e.dataTransfer.setData("cide/deflistitem", def.defcore["DefCore"]["id"]);
		});

	for(var i = 0; i < deflistitem_keybindings.length; i++)
		bindKeyToObj(deflistitem_keybindings[i], deflistitem);

	if(ctxDeflist)
		ctxDeflist.bindToObj(deflistitem[0]);

	if(options.trackchange)
		onFileChanged(getCurrentWrapperIndex());

	return;
}

function removeDeflistEntry(target) {
	if($(target).parent().parent().hasClass("deflist-defsel"))
		return;

	if($(target).next()[0])
		$(target).next().trigger("mousedown").focus();
	else if($(target).prev()[0])
		$(target).prev().trigger("mousedown").focus();
	$(target).remove();
	onFileChanged(getCurrentWrapperIndex());
	return;
}

function preparePseudoElements(index) {
	//Pseudo-WebComponents
	//Definitionsliste
	getWrapper(".defsel", index).each(function() {
		var clone = $(".definition-selection-wrapper.draft").clone();
		clone.removeClass("draft");

		var index = getCurrentWrapperIndex();
		var classes = $(this)[0].className.split(/\s+/);
		for(var i = 0; i < classes.length; i++)
			clone.addClass(classes[i]);

		var headertext = $(this).text();
		if(headertext)
			clone.find(".definition-selection-header").text(headertext);
		else
			clone.find(".definition-selection-header").remove();

		loadDefinitionSelectionData(this, clone, index);
		loadDefinitionSelection(clone);

		$(this).replaceWith(clone);
	});

	//Checkbox-Textinputs
	getWrapper(".checkinput", index).each(function() {
		var clone = $(".sp-checkinput.draft").clone();
		clone.removeClass("draft");
		var classes = $(this)[0].className.split(/\s+/);
		for(var i = 0; i < classes.length; i++) {
			if(classes[i] == "checked")
				clone.find(".checkinput-check").addClass("checked");

			clone.addClass(classes[i]);
		}

		clone.find(".sp-checkinput-check").addClass($(this).attr("data-class")+"-check");
		clone.find(".sp-checkinput-text").addClass($(this).attr("data-class")+"-text");
		clone.find(".sp-checkinput-label").text($(this).text());
		clone.find(".sp-checkinput-check").mousedown(function() {
			$(this).toggleClass("checked");
			if($(this).hasClass("checked"))
				$(this).text("✔");
			else
				$(this).text(Locale("$Deactivated$"));
		}).trigger("mousedown").trigger("mousedown");

		$(this).replaceWith(clone);
		clone.find(".sp-checkinput-label").insertBefore(clone);
	});

	getWrapper(".sp-settingsgroup-collapse", index).parent().mousedown(function() {
		//Collapse
		$(this).toggleClass("collapsed");

		if($(this).hasClass("collapsed")) {
			$(this).parent().find(".sp-settingsgroup-body").css("display", "none");
			$(this).find(".sp-settingsgroup-collapse").text("◀");
		}
		else {
			$(this).parent().find(".sp-settingsgroup-body").css("display", "");
			$(this).find(".sp-settingsgroup-collapse").text("▼");
		}
	});

	getWrapper(".sp-radiobutton", index).mousedown(function() {
		$(this).parent().find('.sp-radiobutton[data-group="sp-o-playersel"]').removeClass("active");
		$(this).addClass("active");
	});

	return true;
}

function loadDefinitionSelectionData(infosource, dest = infosource, index = getCurrentWrapperIndex()) {
	var category = $(infosource).attr("data-category") || "C4D_Object|C4D_Living|C4D_Goal|C4D_Rule|C4D_Structure|C4D_Vehicle|C4D_Environment",
		sect = $(infosource).attr("data-scenario-sect").replace(/PlayerX/, "Player1") || "", //TODO: Replace fuer PlayerX richtig machen
		key = $(infosource).attr("data-scenario-key") || "",
		flaglist = $(infosource).attr("data-defflags") || "";

	if(!sessions[index].deflist)
		sessions[index].deflist = [];
	sessions[index].deflist[sect+"_"+key] = [];

	$(dest).attr({ "data-category": category, "data-scenario-sect": sect, "data-scenario-key": key, "data-defflags": flaglist});

	//C4ID-Liste aus Scenario.txt
	var c4idlist = sessions[index].scendata[sect];
	if(!c4idlist || !(c4idlist = c4idlist[key]))
		c4idlist = "";

	c4idlist = c4idlist.split(";");
	//Listenelemente laden (Rueckwaerts, um die Ladereihenfolge zu beruecksichtigen)
	var listelements = [];
	for(var i = sessions[index].scenariodefs.length-1; i >= 0 && c4idlist.length; i--) {
		var deff = sessions[index].scenariodefs[i];
		for(var j = 0; j < c4idlist.length; j++) {
			var listentry = c4idlist[j].split("=");
			listentry[1] = parseInt(listentry[1]);
			if(listentry[0] == "")
				continue;

			var def = definitions[deff].ids[listentry[0]];
			if(!def || !def.defcore["DefCore"])
				continue;

			c4idlist.splice(j, 1);
			j--;

			sessions[index].deflist[sect+"_"+key].push([def, listentry[1]]);
		}
	}

	//Uebrige Eintraege als fehlerhaft markieren (da nicht (in den geladenen Definitionen) vorhanden)
	if(!getConfigData("ScenarioSettings", "HideInvalidDefs")) {
		for(var i = 0; i < c4idlist.length; i++) {
			var listentry = c4idlist[i].split("=");
			listentry[1] = parseInt(listentry[1]);
			if(listentry[0] == "")
				continue;

			def = new OCDefinition(listentry[0]);
			def.invalid = true;
			def.defcore = { DefCore: { id: listentry[0] } };
			def.title = listentry[0];
			def.desc = Locale("$DefInvalid$");
			definitions[deff].ids[listentry[0]] = def;
			definitions[deff].d.push(def);

			sessions[index].deflist[sect+"_"+key].push([def, listentry[1]]);
		}
	}

	return true;
}

function loadDefinitionSelection(defsel) {
	defsel = $(defsel);
	var category = defsel.attr("data-category") || "C4D_Object|C4D_Living|C4D_Goal|C4D_Rule|C4D_Structure|C4D_Vehicle|C4D_Environment",
		sect = defsel.attr("data-scenario-sect").replace(/PlayerX/, "Player1") || "", //TODO: Replace fuer PlayerX richtig machen
		key = defsel.attr("data-scenario-key") || "";

	defsel.find(".definition-selection-new").unbind("click").click(function() {
		getWrapper(".deflist-adding-overlay").fadeIn(250);

		getWrapper(".deflist-ao-header-caption").text(defsel.find(".definition-selection-header").text() || Locale("$DefSelAOHeader$"));
		getWrapper(".deflist-ao-list-content").empty();
		getWrapper(".deflist-current > .deflist-ao-list-content").append(defsel.find(".definition-selection-item").clone());
		addDeflistEntry(getWrapper(".deflist-current > .deflist-ao-list-content"), 0, getWrapper(".deflist-current").find(".definition-selection-item"), { nodragdrop: true });

		var index = getCurrentWrapperIndex();
		var flaglist = $(this).parents(".definition-selection-wrapper").attr("data-defflags");
		for(var i = sessions[index].scenariodefs.length-1; i >= 0; i--) {
			for(var j = 0; j < definitions[sessions[index].scenariodefs[i]].d.length; j++) {
				var def = definitions[sessions[index].scenariodefs[i]].d[j];

				//Definition nicht anzeigen
				if(def.flags & DEFFLAG_HIDEINMENUSYSTEM)
					continue;

				//Ueber weitere Flags filtern
				if(!checkDefListFlags(def, flaglist) && !def.no_auto_sort)
					continue;

				//TODO: Support fuer Kategorien in Zahlen (Falls OC die ueberhaupt in der DefCore noch supportet?)
				//TODO: Gedoppelte IDs verhindern

				//Windmilleigene Menuekategorien
				if(def.menu_categeory) {
					def.menu_categeory.split("|");
					if(def.menu_categeory.indexOf(key) != -1) {
						addDeflistEntry(getWrapper(".deflist-defsel > .deflist-ao-list-content"), def, 0, { hidecounter: true, specialContextMenu: true });
						continue;
					}
				}
				if(!def.no_auto_sort) {
					var defcat = [];
					if(def.defcore["DefCore"]["Category"])
						defcat = def.defcore["DefCore"]["Category"].split("|");
					for(var k = 0; k < defcat.length; k++)
						if(category.search(RegExp("\\b"+defcat[k].replace(/[^A-Za-z0-9_]/g, "")+"\\b")) != -1) {
							addDeflistEntry(getWrapper(".deflist-defsel > .deflist-ao-list-content"), def, 0, { hidecounter: true, specialContextMenu: true });
							break;
						}
				}
			}
		}
		sessions[index].ao_currentdeflist = defsel;
	});

	//TODO: Listenelemente vorher sortieren
	var deflist = sessions[getCurrentWrapperIndex()].deflist[sect+"_"+key];
	$(defsel).find(".definition-selection-list").empty();
	if(deflist)
		for(var i = 0; i < deflist.length; i++)
			addDeflistEntry(defsel.find(".definition-selection-list"), deflist[i][0], 0, {counter: deflist[i][1]});

	return true;
}

function closeAddingOverlay(index) {
	if(!sessions[index].ao_currentdeflist)
		return;

	getWrapper(".deflist-adding-overlay", index).fadeOut(250);

	var defsel = sessions[index].ao_currentdeflist.find(".definition-selection-list");
	defsel.empty();
	defsel.append(getWrapper(".deflist-current", index).find(".definition-selection-item").clone());
	addDeflistEntry(defsel, 0, defsel.find(".definition-selection-item"));
	return true;
}

/*-- Definitionslisten: Spezielle Unterscheidungen --*/

function checkDefListFlags(def, flaglist) {
	var flags = flaglist.split("|");
	if(!flags || !flags.length)
		return;

	if(flags.indexOf("DFLAG_Vegetation") != -1 && !(def.flags & DEFFLAG_VEGETATION))
		return false;
	if(flags.indexOf("DFLAG_Animals") != -1 && !(def.flags & DEFFLAG_ANIMAL))
		return false;
	if(flags.indexOf("DFLAG_Vehicles") != -1 && !(def.flags & DEFFLAG_VEHICLES))
		return false;

	return true;
}

/*-- Definitionen einlesen --*/

const DEFFLAG_VEGETATION = 1, DEFFLAG_ANIMAL = 2, DEFFLAG_HIDEINMENUSYSTEM = 4,
	  DEFFLAG_VEHICLES = 8;

function loadDefinitionsFrom(path, fullpath, maindef, flags, skipError) {
	let iterator;
	return Task.spawn(function*() {
		if(!fullpath) {
			var tpath = _sc.workpath(getCurrentWrapperIndex()) + "/" + path;
			//Ggf. aus dem Clonkverzeichnis laden
			if(!(yield OS.File.exists(tpath)))
				path = _sc.clonkpath()+"/"+path;
			else
				path = tpath;
		}
		path = formatPath(path);

		var defs = [], definition = new OCDefinition();
		definition.path = formatPath(path);
		if(flags)
			definition.flags = flags;
		else
			flags = 0;

		//Definitionen anhand der Ordnerstruktur flaggen
		// Ist zwar nicht das schoenste, aber da in OpenClonk mangels Menueauswahlsystem zumindest die Originalobjekte keine
		// passende Kategorien haben, muss man sich wohl so behelfen. Custom-Objekte koennten ggf. durch eigene Windmill-Section geflagged werden (TODO)
		// (Ist vielleicht aber auch angenehmer mittels Ordnerstruktur?)
		switch(path.split("/").pop().toUpperCase()) {
			case "VEGETATIONS.OCD":
			case "VEGETATION.OCD":
				flags |= DEFFLAG_VEGETATION;
				break;

			case "ANIMALS.OCD":
				flags |= DEFFLAG_ANIMAL;
				break;

			case "EFFECTS.OCD":
			case "HELPERS.OCD":
			case "HUD.OCD":
			case "ICONS.OCD":
			case "LIBRARIES.OCD":
				flags |= DEFFLAG_HIDEINMENUSYSTEM;
				break;

			case "VEHICLES.OCD":
				flags |= DEFFLAG_VEHICLES;
				break;
		}


		setLoadingSubCaption(path);

		let f = _sc.file(path);
		if(!f.isDirectory())
			return;

		//Verzeichniselemente durchsuchen
		let entries = f.directoryEntries;
		while(entries.hasMoreElements()) {
			let {leafName, path} = entries.getNext().QueryInterface(Ci.nsIFile);

			if(leafName.search(/\.ocd$/) != -1) {
				var subdefs = yield loadDefinitionsFrom(path, true, maindef, flags, skipError);
				if(subdefs)
					defs = defs.concat(subdefs);
				else if(!skipError)
					return;
			}

			if(leafName.toUpperCase() == "DEFCORE.TXT")
				definition.defcore = parseINIArray(yield OS.File.read(path, {encoding: "utf-8"}));

			//Stringtables fuer Name/Beschreibung auslesen (Englische StringTables als Fallback verwenden)
			if(leafName == Locale("StringTbl$ClonkLangPrefix$.txt", -1) || leafName == "StringTblUS.txt") {
				if(definition.title)
					if(leafName != Locale("StringTbl$ClonkLangPrefix$.txt", -1))
						continue;

				var stringtables = parseINIArray(yield OS.File.read(path, {encoding: "utf-8"}));
				if(!stringtables[0])
					continue;

				if(stringtables[0]["Name"])
					definition.title = stringtables[0]["Name"];
				if(stringtables[0]["Description"])
					definition.desc = stringtables[0]["Description"];
			}
		}

		if(definition.defcore != undefined) {
			if(maindef && definition.defcore["DefCore"]) {
				definitions[maindef].ids[definition.defcore["DefCore"]["id"]] = definition;

				//Falls kein Titel vorhanden, ID als Fallback verwenden
				if(!definition.title)
					definition.title = definition.defcore["DefCore"]["id"];

				//Windmilleigene Einstellungen
				if(definition.defcore["Windmill"]) {
					// MenuCategory:
					//   Definiert, wo die Definition im Menuesystem angezeigt wird.
					//   Moegliche Werte: Goals|Rules|Crew|Buildings|Vehicles|Material|Knowledge|Magic|BaseProduction|BaseMaterial|
					//  			   Vegetation|InEarth|Animals|Nest|Environment
					definition.menu_categeory = definition.defcore["Windmill"]["MenuCategory"];

					// HideInMenu:
					//   Falls true, wird die Definition im Menuesystem nicht angezeigt
					if(definition.defcore["Windmill"]["HideInMenu"]) {
						if(parseINIValue(definition.defcore["Windmill"]["HideInMenu"], "bool", false))
							definition.flags |= DEFFLAG_HIDEINMENUSYSTEM;
						else if(definition.flags & DEFFLAG_HIDEINMENUSYSTEM)
							definition.flags ^= DEFFLAG_HIDEINMENUSYSTEM;
					}

					// NoAutoSort:
					//   Falls true, wird nur MenuCategory zur Sortierung verwendet. Standardwert: true (wenn MenuCategory nicht undefined)
					definition.no_auto_sort = parseINIValue(definition.defcore["Windmill"]["NoAutoSort"], "bool", true);

					// MaxMenuSelect:
					//   Gibt die Maximalanzahl fuer die jeweilige Definition an. Standardwert: 100.
					definition.max_menu_select = parseINIValue(definition.defcore["Windmill"]["MaxMenuSelect"], "int", 100);
				}
			}
			defs.push(definition);
		}

		return defs;
	});
}

class OCDefinition {
	constructor() {
		this.defcore = undefined;
		this.path = "";
		this.title = undefined;
		this.flags = 0;
		this.imagepath = "";
		this.desc = Locale("$DefHasNoDescription$");
	}
}

/*-- Number inputs --*/

function setupNumberInputs() {
	$(".input-spinners").each(function() {
		var tId = this.getAttribute("data-input-id");
		var tEl = document.getElementById(tId);
		if(!tEl)
			return err("Input with id " + tId + " hasn't been found. Custom spinners couldn't be created.");

		var spUp = document.createElement("div"),
			spDw = document.createElement("div");

		spUp.className = "input-spinners-button icon-arrow-up";
		spDw.className = "input-spinners-button icon-arrow-down";

		spUp.addEventListener("click", function() { tEl.stepUp(); });
		spDw.addEventListener("click", function() { tEl.stepDown(); });
		$(this).append(spUp).append(spDw);
	});
}

/*-- Deck Callbacks --*/

function onFileStatusChange(changed, index) {
	changed?onFileChanged(index):onFileUnchanged(index);
	return true;
}

function checkIfTabIsUnsaved() { return false; }

function showDeckItem(id) {
	md_editorframe.contentWindow.showDeckItem(id);
	$(".scenario-settings.visible").removeClass("visible");
	$("#scensettings-session-"+id).addClass("visible");
	if(getWrapper(".navigation-option.active", id).hasClass("nav-page-code"))
		$("#editorframe").addClass("visible");
	else
		$("#editorframe").removeClass("visible");
	clearCideToolbar();
	createCideToolbar();
	frameUpdateWindmillTitle();
}

function removeDeckItem(id) {
	md_editorframe.contentWindow.removeDeckItem(id);
	sessions[id] = 0;

	//Unbenutzte Definitionen wieder rausnehmen um Speicher zu leeren
	//(TODO: Evtl. in Zukunft auch mit einer Art Frequently Used Definitions-List?)
	for(var def in definitions) {
		//Um Ladezeiten zu verkuerzen, wird Objects.ocd nicht entfernt.
		if(def == "Objects.ocd")
			continue;

		var def_used = false;
		for(var i = 0; i < sessions.length; i++) {
			if(sessions[i] && sessions[i].scenariodefs.indexOf(def) >= 0) {
				def_used = true;
				break;
			}	
		}

		if(!def_used)
			definitions[def] = undefined;
	}
	$("#scensettings-session-"+id).remove();
}

/*-- TabData --*/

function getTabData(tabid) {
	var data;
	return data;
}

function dropTabData(data, tabid) {
	return true;
}