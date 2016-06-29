var mainDeck;
var navigation;
var modmanager,modmanagerID,cide,cideID,cbridge,cbridgeID,settings,settingsID;

window.onerror = function(msg, url, line, col, e) {
	log(msg + " " + url + ":"+line+":"+col, false, "error");
	//too much recursion...
	if(e.stack) {
		if(e.stack.split("\n").length < 100)
			log(e.stack, false, "error");
		else {
			log(e.stack.split("\n").splice(0, 30).join("\n"), false, "error");
			log("[...]", false, "error");
		}
	}
	log("");
}


function initializeModules() {
	mainDeck = addDeck($("#modules-wrapper")[0], $("#modules-nav")[0]);

	cide = createModule("cide", $(mainDeck.element));
	cideID = mainDeck.add(getModule(cide, true), 0);

	modmanager = createModule("modmanager", $(mainDeck.element));
	modmanagerID = mainDeck.add(getModule(modmanager, true), 0, false, false, true);
	
	cbridge = createModule("cbridge", $(mainDeck.element));
	cbridgeID = mainDeck.add(getModule(cbridge, true), 0, false, false, true);
	
	settings = createModule("settings", $(mainDeck.element));
	settingsID = mainDeck.add(getModule(settings, true), 0, false, false, true);
}

var togglemode_timeout_id;

hook("load", function() {
	Task.spawn(function*() {
		let sass_snapshot = yield OS.File.exists(_sc.profd+"/sass-snapshot.json"), prepended_html = "";
		if(sass_snapshot) {
			try {
				let stat;
				if(stat = yield OS.File.stat(_sc.chpath+"/styles/main.css")) {
					if(!stat.size)
						sass_snapshot = false;
				}
			} catch(e) {
				sass_snapshot = false;
			}
		}
		//Falls keine generierten CSS-Dateien gefunden wurden: In speziellen Modus uebergehen
		if(!sass_snapshot) {
			//Sehr rudimentaeres Design anzeigen. (Alles verstecken, nur Statusinformation anzeigen)
			$(".startup-nohide").css("background", "rgb(45, 45, 45)");
			$("window *:not(.startup-nohide)").css("display", "none");
			$("#startup-loading").css({
				color: "white",
				display: "flex",
				"flex-direction": "column",
				"font-size": "2em",
				"justify-content": "center",
				"align-items": "center",
				"font-family": '"Segoe UI", "Trebuchet MS", sans-serif'
			});
			prepended_html = '<div style="font-size: 4.8em">Windmill</div>';
		}

		//Config initialisieren
		initializeConfig();
		
		//Modulinformationen einlesen
		$("#startup-loading").html(prepended_html+"Loading Module Information");
		try { yield loadModules(_sc.chpath + "/content/modules"); } catch(e) {}
		//SASS Observer (benoetigt die Module vorher)
		$("#startup-loading").html(prepended_html+"Generating Stylesheets");
		let sass_files_changed = yield initializeSassObserver();
		//Falls keine CSS Dateien vorher vorhanden waren oder CSS Dateien geandert worden sind, Windmill nochmal neustarten
		if(!sass_snapshot || sass_files_changed) {
			restartWindmill();
			return -2;
		}
		$("#startup-loading").html("Loading Config");

		//Config einlesen
		try { yield loadConfig(); } catch(e) {}
		//Config speichern
		yield saveConfig(); //Configdatei speichern (falls noch nicht existiert)

		//Sprachpakete einlesen
		$("#startup-loading").text("Loading Languagefiles");
		yield initializeLanguage();
		//Keybindings einlesen
		$("#startup-loading").text("Loading Keybindings");
		yield loadKeyBindings();
		//Informationen zu externen Anwendungen einlesen
		$("#startup-loading").text("Loading External Application Definitions");
		try { yield loadExternalApplicationDefs(_sc.chpath + "/content"); } catch(e) { }

		//Bei erstem Start anders verhalten
		if(CONFIG_FIRSTSTART || getConfigData("Global", "FirstStartDevTest") == true)
			return -1;

		//Weitere Arbeitsumgebungen laden
		$("#startup-loading").text("Loading Work Environments");
		try { yield loadWorkEnvironment(); } catch(e) {}
		
		execHook("startLoadingRoutine");
	}).then(function(result) {
		if(result == -2)
			return;
		localizeModule();

		$("#startup-loading").text("Creating and Initializing Modules");
		//Configuration Wizard ggf. starten
		if(result == -1) {
			$("#modules-wrapper").removeClass("startup-loading");
			$("#startup-loading").fadeOut(500);
			createModule("configwizard", $("#modules-wrapper")[0]);
			return;
		}

		//Navigation
		navigation = new Navigation($("#inner-navigation"));
		initializeModules();
		mainDeck.hook("showItem", function(deck, itemId) {
			if(itemId != cideID) {
				$(document).attr("title", "Windmill");
				hideCideToolbar();
			}
			else
				showCideToolbar();
		});
		
		var _mm = {
			round: new Segment(document.getElementById("mm-svg-to-round"), 0, 15),
			lowerButton: new Segment(document.getElementById("mm-svg-to-lower-button"), 0, 9),
			upperButton: new Segment(document.getElementById("mm-svg-to-upper-button"), 0, 7),
			horizontalStick: new Segment(document.getElementById("mm-svg-to-horizontal-stick"), 9, 24),
			verticalStick: new Segment(document.getElementById("mm-svg-to-vertical-stick"), 0, 16)
		};
		
		var _mmToPlayIcon = () => {
			//round.draw('100% - 54.5', '100% - 30.5', 0.6, {easing: ease.ease('elastic-out', 1, 0.3)});
			_mm.round.draw('100% - 73', '100%', 0.3);
			_mm.lowerButton.draw('100% - 0.1', '100%', 0.3);
			_mm.upperButton.draw('100% - 0.1', '100%', 0.3);
			_mm.horizontalStick.draw('0', '0% + 6', 0.3);
			_mm.verticalStick.draw('100% - 6', '100%', 0.3);
		}
		
		var _mmToDevelopIcon = () => {
			//round.draw('100% - 54.5', '100% - 30.5', 0.6, {easing: ease.ease('elastic-out', 1, 0.3)});
			_mm.round.draw(0, 15, 0.3);
			_mm.lowerButton.draw(0, 9, 0.3);
			_mm.upperButton.draw(0, 7, 0.3);
			_mm.horizontalStick.draw(9, 24, 0.3);
			_mm.verticalStick.draw(0, 16, 0.3);
		}

		//Switcher zwischen cIDE/cBridge
		$(".mm-button").click(function() {
			// show develop mode
			if($(this).hasClass("mm-dev-wrapper")) {
				if(mainDeck.selectedId != mainDeck.getModuleId("cide")) {
					$(".main-mode-ui").removeClass("cBridge");
					navigation.hideGroups();
					_mmToDevelopIcon();
					togglePage(mainDeck.id, mainDeck.getModuleId("cide"));
				}
				else
					return;
			}
			// show play mode
			else if($(this).hasClass("mm-play-wrapper")) {
				if(mainDeck.selectedId != mainDeck.getModuleId("cbridge")) {
					$(".main-mode-ui").addClass("cBridge");
					navigation.showGroup("cbridge");
					_mmToPlayIcon();
					togglePage(mainDeck.id, mainDeck.getModuleId("cbridge"));
				}
				else
					return;
			}
			else
				return;
		});

		//cIDE/cBridge-Deaktivier Box (Vorerst deaktiviert..)
		/*var mouseholdID = 0;
		$(".togglemode-img").mouseenter(function() {
			clearTimeout(togglemode_timeout_id);
		}).mouseleave(function() { 
			togglemode_timeout_id = setTimeout(function() {
				$(".togglemode-img").addClass("invisible"); 
				$(".mm-icon").removeClass("selected"); 
			}, 150);
		});
		$(".mm-icon").mousedown(function() {
			mouseholdID = setTimeout(function() {
				$(".mm-icon").addClass("selected");
				$(".togglemode-img").removeClass("invisible");
			}, 600);
		}).bind("mouseup mouseleave", function() {
			clearTimeout(mouseholdID);
		});*/

		$("#toggle-cide").click(function() {
			$(this).toggleClass("activated");
			//todo: cide deaktivieren
		});
		$("#toggle-cbridge").click(function() {
			$(this).toggleClass("activated");
			//todo: cbridge deaktivieren
		});
		//Ressourcensparender Modus
		$("#showResSaveMode").click(function() {
			var dlg = new WDialog("$DlgTitleResSaveMode$", "", { modal: true, css: { "width": "450px" }, btnright: [{ preset: "accept",
					onclick: function(e, btn, _self) {
						activateResSaveMode();
					}
				}, "cancel"]});
			dlg.setContent("<description>$DlgResSaveFileWarning$</description>");
			dlg.show();
		});

		function toggleSidebar(id) {
			$("#"+id).toggleClass("invisible");
			/*if($("#"+id).hasClass("invisible"))
				$('[data-sidebarid="'+id+'"]').css("color", "");
			else
				$('[data-sidebarid="'+id+'"]').css("color", $("#"+id).find(".sidebar-header").css("background-color"));*/
			let wdt = 0;
			$(".sidebar").not(".invisible").each(function() {
				wdt += parseInt($(this).css("max-width"));
			});
			if(wdt > $(window).width()) {
				let widths = [];
				$(".sidebar").not("#"+id+",.invisible").each(function() {
					//Subtract width from 10000 to make sorting easier (we want to close the sidebar which is taking the most space first)
					let sb_wdt = 10000-parseInt($(this).css("max-width"));
					if(!widths[sb_wdt])
						widths[sb_wdt] = [];
					widths[sb_wdt].push(this);
				});
				//Closing sidebars which would overflow the window
				for(let sb_wdt in widths) {
					if(wdt < $(window).width())
						continue;
					while(widths[sb_wdt].length && wdt > $(window).width()) {
						let sb = widths[sb_wdt].shift();
						$(sb).addClass("invisible");
						//$('[data-sidebarid="'+$(sb).attr("id")+'"]').css("color", "");
						wdt -= 10000-sb_wdt;
					}
				}
			}
		}

		//Generate player selection
		initPlayerselection();

		//Documentation
		let frame = $('<iframe src="resource://docs/build/de/_home/__head_de.html" flex="1" id="docFrame"></iframe>');
		frame.appendTo($(mainDeck.element));
		let docFrameID = mainDeck.add(frame[0], 0, false, false, true);

		//Dropdown menu for the hamburger
		let dropdownMenu = new ContextMenu(0, [
			//Module manager
			["$NAVModManager$", 0, function() {
				togglePage(mainDeck.id, mainDeck.getModuleId("modmanager"));
			}, 0, { uicon: "icon-heartbeat", identifier: "showModManager" }],
			//Documentation
			["$NAVDocumentation$", 0, function() {
				togglePage(mainDeck.id, docFrameID);
			}, 0, { uicon: "icon-documentation", identifier: "showDocs" }],

			"seperator",

			//Open Clonk manager
			["$NAVOCManager$", 0, 0, new ContextMenu(function() {
					this.clearEntries();
					let workenvs = getWorkEnvironments();
					//Iterate through all workenvironments and search for clonk directories
					for(let env2 of workenvs) {
						//Something broke all of a sudden let in for loops for me??
						let env = env2;
						if(env.type != WORKENV_TYPE_ClonkPath)
							continue;
						
						let textpath = env.path;
						let name = env.path.split("/").pop();
						if(name.length > 30)
							name = name.substr(0, 30) + "...";
						//Craete an entry for switching the clonk path
						this.addEntry(name, 0, function() {
							setClonkPath(env.path);
						}, 0, {
							type: "radioitem",
							isSelected: formatPath(_sc.clonkpath()) == env.path,
							radiogroup: "ocdir",
							tooltip: env.path
						});
					}
					this.addSeperator();
					//TODO: Add new clonk directory
					this.addEntry("$AddClonkDirectory$", 0, function() {
						log("[!]");
					});
				}, [], MODULE_LPRE, {}
			), { uicon: "icon-multisource", identifier: "showClonkDirs" }],
			//Git log
			["$NAVGitLog$", 0, function() {
				toggleSidebar("gitlog");
			}, 0, { uicon: "icon-git", identifier: "showGitLog" }],
			//Screenshot folder
			["$NAVScreenshots$", 0, function() {
				let path = "";
				if(OS_TARGET == "WINNT")
					path = _sc.env.get("APPDATA")+"\\OpenClonk\\Screenshots";

				let promise = OS.File.exists(path);
				promise.then(function(exists) {
					if(exists)
						openInFilemanager(path);
					else
						warn("No screenshots folder found.");
				}, function(e) {
					log(e);
				});
			}, 0, { uicon: "icon-screenshots", identifier: "showScreenshots" }],

			"seperator",

			//Settings
			["$NAVSettings$", 0, function() {
				togglePage(mainDeck.id, mainDeck.getModuleId("settings"));
			}, 0, { uicon: "icon-gear", identifier: "showSettings" }]
		], MODULE_LPRE, { fnCheckVisibility: function(by_obj, id) {
			//Hide devmode options
			if(!getConfigData("Global", "DevMode") && ["showModManager", "showDocs"].indexOf(id) != -1)
				return 2;
			//Hide Gitlog if git is not available
			if(id == "showGitLog" && !getAppByID("git").isAvailable())
				return 2;
			return 0;
		}, allowIcons: true });
		dropdownMenu.bindToObj($("#showOptions"), {dropdown: true});
		//Log
		$("#showLog").click(function() {
			toggleSidebar("developerlog");
		});

		//Neustart
		$("#restartWindmill").click(function(e) {
			if(e.ctrlKey && getFocusedFrame() != window) {
				var pars = "?";
				if(typeof getFocusedFrame().getReloadPars == "function")
					pars += getFocusedFrame().getReloadPars();

				getFocusedFrame().location.replace(getFocusedFrame().location.pathname+pars);
			}
			else
				restartWindmill();
		}).hover(function(e) {
			if(e.ctrlKey) {
				let doc = getFocusedFrame().document;
				if(getFocusedFrame().document.documentElement)
					doc = getFocusedFrame().document.documentElement;
				$(doc).css("outline", "3px solid rgba(250,169, 0, 0.7)");
				$(doc).css("outline-offset", "-3px");
			}
		}, function() {
			let doc = getFocusedFrame().document;
			if(getFocusedFrame().document.documentElement)
				doc = getFocusedFrame().document.documentElement;
			$(doc).css("outline", "").css("outline-offset", "");;
		});
		$(window).focus(function() { setFocusedFrame(window); });

		if(!getConfigData("Global", "DevMode"))
			$(".devmode-elm").css("display", "none");

		if(getConfigData("Global", "ShowHiddenLogs"))
			$("#log-entrylist").addClass("show-hidden-logs");
		$("#log-entrylist").on("DOMSubtreeModified", function() {
			$("#log-entrylist").scrollTop($("#log-entrylist")[0].scrollHeight);
		});
		$(window).keydown(function(e) {
			if(e.keyCode == 68 && e.ctrlKey && e.shiftKey && !getConfigData("Global", "DevMode")) {
				setConfigData("Global", "DevMode", true, true);
				$(".devmode-elm").css("display", "");
				EventInfo("DevMode activated");
			}
		});
	}, function(reason) {
		$("#startup-loading").remove();
		$("#startup-errorlog > vbox").append(`
An error occurred while loading the application:
************************************************
${reason}
------------------------------------------------
${reason.stack}`).parent().css("display", "");
	});

	/*hook("onWorkenvCreated", function(env) {
		if(!env)
			return;


		var clone = $("#page-clonkdirselection").find(".cds-listitem.draft").clone();
		clone.removeClass("draft");

		var path = env.path, textpath = path;
		clone.attr("data-path", path);

		var ocexecname = "openclonk";
		if(OS_TARGET == "WINNT")
			ocexecname = "openclonk.exe";

		OS.File.exists(path+"/"+ocexecname).then(function(exists) {
			if(!exists)
				return clone.find(".cds-lbl-directory").attr("value", "Error: "+ocexecname+" not found.");

			
			clone.find(".cds-lbl-directory").attr("value", textpath);
			//tooltip(clone.find(".cds-lbl-directory"), path, 0, 600);

			//TODO: Tags (Standard/Snapshot X/Nightly X/Ggf. eigene Benennung)
			clone.find(".cds-lbl-type").attr("value", "Standard");
			clone.click(function() {
				$("#cds-clonkdirlist").find(".cds-listitem").removeClass("selected");
				$(this).addClass("selected");
				setClonkPath(env.path);
			});

			if(formatPath(_sc.clonkpath()) == env.path)
				clone.addClass("selected");
			clone.appendTo($("#cds-clonkdirlist"));
		});
	});
	hook("onWorkenvUnloaded", function(env) {
		$("#page-clonkdirselection").find('.cds-listitem[data-path="'+env.path+'"]').remove();
	});*/
});

function toggleLogLimitation(elm) {
	setConfigData("Global", "DisableLogLimitation", !getConfigData("Global", "DisableLogLimitation"), false, "bool", { runTimeOnly: true });
	if(getConfigData("Global", "DisableLogLimitation"))
		$(elm).addClass("active");
	else
		$(elm).removeClass("active");
	return true;
}

function toggleHiddenLogEntries() {
	var showlogs = !getConfigData("Global", "ShowHiddenLogs");
	setConfigData("Global", "ShowHiddenLogs", showlogs);
	if(showlogs)
		$("#log-entrylist").addClass("show-hidden-logs");
	else
		$("#log-entrylist").removeClass("show-hidden-logs");
}

function clearLog(listid) { $("#"+listid+"-entrylist").children(".log-listitem:not(.draft)").remove(); }

function restartWindmill() {
	window.location.reload();
}

function activateResSaveMode() {
	removeSubFrames();
	$("#modules-wrapper").empty();
	$("#mainstack").fadeOut(400, function() { 
		$("#showgames-wrapper").css("display", "-moz-box"); 
		navigation.empty(); 
		if($(".mm-icon").hasClass("cBridge")) {
			$(".mm-icon").removeClass("cBridge");
			$(".mm-icon").attr("src", "chrome://windmill/content/img/mode-code.png");
			navigation.hideGroups();
		}
	});
	var sg = createModule("showgames", $("#showgames-container"));
	setTimeout(function() { getModule(sg, true).contentWindow.setResSaveMode(); }, 1000);
}

function deactivateResSaveMode() {
	$("#showgames-container").fadeOut(400, function() { 
		$("#showgames-container").empty(); 
		$("#showgames-wrapper").css("display", "none");
		$("#mainstack").css("display", "-moz-stack");
	});
	initializeModules();
}

function parseINI(text) {
	//TODO: OctToAscii für Strings
	//TODO: (Zusätzlicher Parameter um) Werte zu entschärfen bzw. Lücken zu schließen
	//      Sonst kann man mit bestimmten Textdateien in Spielern/Objekten/Szenarien etc. Windmill abschießen

	var lines = text.split('\n');
	var sect = [], szSect;
	for(var i = 0; i < lines.length; i++) {
		var line = lines[i];
		if(line.search(/[=\[]/) == -1)
			continue;

		if(line.search(/^\[.+?\]\W*$/) != -1) {
			szSect = line.match(/\[(.+?)\]/)[1];
			sect[szSect] = [];
			continue;
		}
		
		var key = line.match(/(.+?)=.+/)[1];
		var val = line.match(/.+?=(.+)/)[1];
		sect[szSect][key] = val;
	}
	
	return sect;
}

let FOCUSED_FRAME;

function setFocusedFrame(wnd) {
	FOCUSED_FRAME = wnd;
}

function getFocusedFrame() { return FOCUSED_FRAME || window; }


/*********************************************************************
					cIDE Toolbar
*********************************************************************/


var CIDE_TOOLBAR_CONTEXT;

function clearCideToolbar() {
	$("#cide-toolbar").empty();
}
function hideCideToolbar() { $("#cide-toolbar").css("display", "none"); }
function showCideToolbar() { $("#cide-toolbar").css("display", ""); }

function setCideToolbarContext(wdw) { CIDE_TOOLBAR_CONTEXT = wdw; }

function addCideToolbarButton(icon, callback, context) {
	if(icon == -1 || icon == "seperator") {
		$("#cide-toolbar").append('<box class="cide-tb-seperator" />');
		return;
	}
	var btn = $('<box class="nav-image '+icon+' icon-24" height="24" width="24" id="test"></box>');
	$(btn).click(function() { callback.call(CIDE_TOOLBAR_CONTEXT); });
	$(btn).appendTo($("#cide-toolbar"));
	
	showCideToolbar();
	
	return btn;
}

/*-*/

function Navigation(obj) {
	this.obj = obj;
	this.navgroups = {};
	this.add = function(item, group, active) {
		if(!this.get(group)) {
			this.navgroups[group] = [];
			this.get(group).selectedID = -1;
			if(active)
				this.get(group).selectedID = item.id;
		}

		item.top_navigation = this;
		item.group = group;
		this.get(group).push(item);
	}
	this.get = function(group) {
		return this.navgroups[group];
	}
	this.showGroup = function(group) {
		if(!this.obj || !this.get(group))
			return;

		$(this.obj).empty();
		this.selectedGroup = group;
		for(var i = 0; i < this.get(group).length; i++) {
			if(this.get(group)[i]) {
				this.get(group)[i].apply();
			}
		}
	}
	this.hideGroups = function() {
		$(this.obj).empty();
		this.selectedGroup = 0;
	}
	this.empty = function() {
		for(var str in this.navgroups) {
			for(var i = 0; i < this.get(str).length; i++) {
				this.get(str)[i] = 0;
			}
			this.navgroups[str] = 0;
		}
		this.navgroups = {};
	}
}

var NAV_ID_Counter = 0;

function NavItem() {
	this.id = NAV_ID_Counter++;
	this.obj = null;
	this.label = "";
	this.code = "";
	this.active = false;
	
	this.apply = function() {
		if(!this.obj || !this.obj.parent().html()) {
			var topnav = this.top_navigation;
			if(!topnav || topnav.selectedGroup != this.group)
				return;

			if(!this.code || this.code == "") {
				if(topnav.get(this.group).selectedID == this.id)
					$(topnav.obj).append("<button id='navitem-"+this.id+"' label='"+this.label+"' class='nav-item nav-active'/>");
				else
					$(topnav.obj).append("<button id='navitem-"+this.id+"' label='"+this.label+"' class='nav-item'/>");
			} else
				$(topnav.obj).append(this.code);

			this.obj = $("#navitem-"+this.id);
			var _self = this;
			
			if(typeof this.callfn == "function") {
				$(this.obj).click(function() { 
					$(".nav-item.nav-active").removeClass("nav-active");
					$(this).addClass("nav-active");
					topnav.get(_self.group).selectedID = _self.id;
					_self.callfn();
				});
			}
			else {
				$(this.obj).click(function() {
					$(".nav-item.nav-active").removeClass("nav-active");
					$(this).addClass("nav-active");
					_self.top_navigation.get(_self.group).selectedID = _self.id;
				});
			}
		}
		else {
			if(!this.code || this.code == "")
				$(this.obj).attr("label", this.label);
		}
	}
}

function addNavigationItem(label, group, active, fCode, callfn) {
	var navitem = new NavItem();
	
	if(!fCode)
		navitem.label = label;
	else
		navitem.code = label;
	
	navitem.callfn = callfn;

	navigation.add(navitem, group, active);
	navitem.apply();
	//$("#inner-navigation");
	return navitem;
}


/*********************************************************************
					Window controls
*********************************************************************/


var restoreHeight, restoreWidth, restoreLeft, restoreTop;

function maximizeWindow() {
	// save old state
	saveWindowInformation();
	
	let scr = _sc.screenmgr().screenForRect(window.screenX, window.screenY, getWindowWidth(), getWindowHeight());
	let x = {}, y = {}, wdt = {}, hgt = {};
	scr.GetAvailRect(x, y, wdt, hgt);
	window.moveTo(x.value, y.value);
	window.resizeTo(wdt.value, hgt.value);
	$("window").addClass("maximized");
}

function getWindowWidth()  { return document.getElementById("window-w").getAttribute("data-value") || 
									document.getElementById("main").getAttribute("width"); }
function getWindowHeight() { return document.getElementById("window-h").getAttribute("data-value") ||
									document.getElementById("main").getAttribute("height"); }

function restoreWindow(fOnlySize, mouse_event) {
	if(restoreHeight == undefined)
		restoreHeight = getWindowHeight();
	if(restoreWidth == undefined)
		restoreWidth = getWindowWidth();
	if(restoreLeft == undefined)
		restoreLeft = document.getElementById("window-l").getAttribute("data-value") ||
			document.getElementById("main").getAttribute("screenX");
	if(restoreTop == undefined)
		restoreTop = document.getElementById("window-t").getAttribute("data-value") ||
			document.getElementById("main").getAttribute("screenY");
	
	$("window").removeClass("maximized");
	
	window.resizeTo(restoreWidth, restoreHeight);
	if(!fOnlySize)
		window.moveTo(restoreLeft, restoreTop);
	else if(mouse_event) {
		let scr = _sc.screenmgr().screenForRect(window.screenX, window.screenY, getWindowWidth(), getWindowHeight());
		let x = {}, y = {}, wdt = {}, hgt = {};
		scr.GetAvailRect(x, y, wdt, hgt);
		let newx = Math.min(Math.max(mouse_event.screenX-restoreWidth/2, 0), wdt.value-restoreWidth);
		window.moveTo(newx, 0);
		return newx;
	}
}


var draggingWindow = false,
	windowStartX = 0,
	windowStartY = 0,
	windowFn = true;
	
hook("load", function() {
	$(".header-ctrl").mousedown(function(e) {
		if(!$(e.target).hasClass("header-ctrl"))
			return;
		draggingWindow = true;
		
		windowStartX = e.screenX - window.screenX;
		windowStartY = e.screenY - window.screenY;
	}).mousemove(function(e) {
		if(draggingWindow && windowFn) {
			if(window.isMaximized()) {
				windowFn = false;
				
				windowStartX = e.screenX - restoreWindow(true, e);
				/*window.moveTo(
					Math.round(e.screenX - e.clientX/screen.availWidth*restoreWidth) - 4,
					Math.round(e.screenY - e.clientY/screen.availHeight*restoreHeight) - 4
				);*/
				
				windowFn = true;
			}
			else {
				windowFn = false;
				window.moveTo(e.screenX - windowStartX, e.screenY - windowStartY);
				windowFn = true;
			}
		}
	}).mouseup(function(e) {
		draggingWindow = false;
	}).mouseout(function(e) {
		if(draggingWindow && windowFn) {
			windowFn = false;
			windowFn = true;
			draggingWindow = false;
		}
	})
	/*
	 * <titlebar>-Implementation:
	 *	Da die maximize-Implementation kein richtiges Maximize ist, sondern nur das Fenster vergroessert, gibt es beim Wiederherstellen des Fensters
	 *	Probleme mit der Neupositionierung des Fensters. (Da die Differenz zw. Mausposition und Fensterposition nicht neu berechnet wird)
	 *	Es gibt mit Maximize jedoch auch Probleme unter Windows, da das Fenster nicht auf die WorkArea vergroessert wird, sondern auf die gesamte
	 *	Bildschirmgroesse (Fullscreen), was ein Verdecken der Taskleiste zur Folge hat.
	 *
	 *  Daher bis auf weiteres (bis eine bessere Loesung gefunden wird falls vorhanden) deaktiviert und durch obige volle JavaScript-Implementation
	 * 	ersetzt.

	$(".header-ctrl").mousedown(function(e) {
		draggingWindow = true;
	}).mousemove(function(e) {
		if(draggingWindow && window.isMaximized())
			restoreWindow(true, e);
	}).on("command", function(e) {
		draggingWindow = false;
	})*/.dblclick(function() {
		if(window.isMaximized())
			restoreWindow();
		else
			maximizeWindow();
	});

	$("window").resize(window.saveWindowInformation());
});

// use as window.isMaximized() for more readable code
function isMaximized() {
	return $("window").hasClass("maximized");
}

function saveWindowInformation() {
	
	if(window.isMaximized())
		return;
	restoreHeight = window.outerHeight;
	restoreWidth = window.outerWidth;
	restoreLeft = window.screenX;
	restoreTop = window.screenY;
	
	if(restoreHeight < 600)
		restoreHeight = 600;
	
	if(restoreWidth < 800)
		restoreWidth = 800;
	
	// also save them meta-session-wise
	document.getElementById("window-h").setAttribute("data-value", restoreHeight);
	document.getElementById("window-w").setAttribute("data-value", restoreWidth);
	document.getElementById("window-l").setAttribute("data-value", restoreLeft);
	document.getElementById("window-t").setAttribute("data-value", restoreTop);
}

function triggerModeButtonIcon() {	
	$(".mm-icon").css("opacity", "0");
	setTimeout(function() {
		$(".mm-icon").removeClass("icon-the-mill").css("display", "none"); //.addClass("icon-brackets").css("opacity", "1");
		$(".main-mode-ui").addClass("loaded");
	}, 1000);

	if($(".startup-loading")[0]) {
		$("#startup-loading").fadeOut(800);
		$(".startup-loading").removeClass("startup-loading");
	}
}

window.addEventListener("focus", function(event) {
	if(domwu)
		domwu.redraw();
}, false)