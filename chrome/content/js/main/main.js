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
		$("#startup-loading").text("Loading Config");
		//Config initialisieren
		initializeConfig();

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
		//Modulinformationen einlesen
		$("#startup-loading").text("Loading Module Information");
		try { yield loadModules(_sc.chpath + "/content/modules"); } catch(e) {}

		//Bei erstem Start anders verhalten
		if(CONFIG_FIRSTSTART || getConfigData("Global", "FirstStartDevTest") == true)
			return -1;

		//Weitere Arbeitsumgebungen laden
		$("#startup-loading").text("Loading Work Environments");
		try { yield loadWorkEnvironment(); } catch(e) {}
	}).then(function(result) {
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

		//Switcher zwischen cIDE/cBridge
		$("#switchMode").click(function() {
			/*if(!$(".togglemode-img").hasClass("invisible"))
				return;*/

			if(mainDeck.selectedId == mainDeck.getModuleId("cbridge") || mainDeck.selectedId == mainDeck.getModuleId("cide")) {
				if($(this).hasClass("cBridge")) {
					$(this).removeClass("cBridge");
					navigation.hideGroups();
				}
				else {
					$(this).addClass("cBridge");
					navigation.showGroup("cbridge");
				}
			}

			togglePage(mainDeck.id, $(this).hasClass("cBridge")?mainDeck.getModuleId("cbridge"):mainDeck.getModuleId("cide"));
		});

		//cIDE/cBridge-Deaktivier Box (Vorerst deaktiviert..)
		/*var mouseholdID = 0;
		$(".togglemode-img").mouseenter(function() {
			clearTimeout(togglemode_timeout_id);
		}).mouseleave(function() { 
			togglemode_timeout_id = setTimeout(function() {
				$(".togglemode-img").addClass("invisible"); 
				$("#switchMode").removeClass("selected"); 
			}, 150);
		});
		$("#switchMode").mousedown(function() {
			mouseholdID = setTimeout(function() {
				$("#switchMode").addClass("selected");
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

		//Einstellungen
		$("#showSettings").click(function() {
			if(mainDeck.selectedId == mainDeck.getModuleId("settings")) {
				togglePage(mainDeck.id, mainDeck.previd);
				return;
			}

			togglePage(mainDeck.id, mainDeck.getModuleId("settings"));
		});
		//Modulemanager
		$("#showModManager").click(function() {
			if(mainDeck.selectedId == mainDeck.getModuleId("modmanager")) {
				togglePage(mainDeck.id, mainDeck.previd);
				return;
			}

			togglePage(mainDeck.id, mainDeck.getModuleId("modmanager"));
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

		//Playerselection
		$("#showPlayerSelect").click(function() {
			$("#playerselect").toggleClass("invisible");
			switchPlrPage("page-playerselection");
		});
		//Clonk Directory Selection
		$("#showClonkDirs").click(function() {
			$("#clonkdirselection").toggleClass("invisible");
		});
		//Log
		$("#showLog").click(function() {
			$("#gitlog").addClass("invisible");
			$("#developerlog").toggleClass("invisible");
		});
		//Git Log
		$("#showGitLog").click(function() {
			$("#developerlog").addClass("invisible");
			$("#gitlog").toggleClass("invisible");
		});
		let frame = $('<iframe src="resource://docs/build/de/_home/__head_de.html" flex="1" id="docFrame"></iframe>');
		frame.appendTo($(mainDeck.element));
		let docFrameID = mainDeck.add(frame[0], 0, false, false, true);
		//Docs
		$("#showDocs").click(function() {
			togglePage(mainDeck.id, docFrameID);
		});
		$("#showScreenshots").click(function() {
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
		if(!getAppByID("git").isAvailable())
			$("#showGitLog").css("display", "none");
	}, function(reason) {
		$("#startup-loading").remove();
		$("#startup-errorlog > vbox").append(`
An error occurred while loading the application:
************************************************
${reason}
------------------------------------------------
${reason.stack}`).parent().css("display", "");
	});

	hook("onWorkenvCreated", function(env) {
		if(!env)
			return;

		if(env.type != WORKENV_TYPE_ClonkPath)
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

			//Mittleren Teil durch 3 Punkte ersetzen wenn zu lang
			if(path.length > 40) {
				textpath = path.replace(/(^\/*.+?\/).+(\/.+\/?$)/, function(str, a, b, c) { 
					var middle = str.substr(0, str.length-b.length).substr(a.length); 
					return a+("..."+middle.substr(middle.length-(Math.max(40-a.length-b.length, 0))))+b; 
				});
			}
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
	});
});

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
		if($("#switchMode").hasClass("cBridge")) {
			$("#switchMode").removeClass("cBridge");
			$("#switchMode").attr("src", "chrome://windmill/content/img/mode-code.png");
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
					$(topnav.obj).append("<button id='navitem-"+this.id+"' label='"+this.label+"' class='nav-item active'/>");
				else
					$(topnav.obj).append("<button id='navitem-"+this.id+"' label='"+this.label+"' class='nav-item'/>");
			} else
				$(topnav.obj).append(this.code);

			this.obj = $("#navitem-"+this.id);
			var _self = this;
			
			if(typeof this.callfn == "function") {
				$(this.obj).click(function() { 
					$(".nav-item.active").removeClass("active");
					$(this).addClass("active");
					topnav.get(_self.group).selectedID = _self.id;
					_self.callfn();
				});
			}
			else {
				$(this.obj).click(function() {
					$(".nav-item.active").removeClass("active");
					$(this).addClass("active");
					_self.top_navigation.get(_self.group).selectedID = _self.id;
				});
			}
			
			if(topnav.get(this.group).selectedID == this.id) {
				//Vorerst mit Timeout "gehackt"; active-Klasse verschwindet sonst sofort (auch wenn schon im Code vorher vorhanden...)
				setTimeout(function() { $(_self.obj).addClass("active"); }, 2);
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
	$("#switchMode").css("opacity", "0");
	setTimeout(function() {
		$("#switchMode").removeClass("icon-the-mill").addClass("icon-brackets").css("opacity", "1");
	}, 1000);

	if($(".startup-loading")[0]) {
		$("#startup-loading").fadeOut(800);
		$(".startup-loading").removeClass("startup-loading");
	}
}

window.addEventListener("focus", function(event) {
	if(domwu)
		domwu.redraw();
}, false);
