var maindeck, sidedeck1, sidedeck2, md_explorer,
    cide_dragdata; //Da die DragDaten in dragenter im ProtectedMode sind, brauchen wir eine globale Variable

function updateFrameWindowTitleDeck(deck, itemid) {
	if(deck.items[itemid].contentWindow.frameWindowTitle)
		setWindowTitle(deck.items[itemid].contentWindow.frameWindowTitle() + " - Windmill");

	updateChildFrameWindowFocus(deck.items[itemid].contentWindow);
	return true;
}

var focused_module;

function updateChildFrameWindowFocus(modwindow) {
	if(modwindow && modwindow.frameWindowTitle)
		focused_module = modwindow;

	return;
}

function frameWindowTitle() {
	if(focused_module)
		return focused_module.frameWindowTitle();

	return;
}

function onFileStatusChange(changed, index, path) {
	let deck = maindeck;
	if(sidedeck.options[index] && sidedeck.options[index].filepath == path)
		deck = sidedeck;

	deck.changeTabStatus(changed, index);
}

function onCideModuleSavingPermissions(path) {
	let workpath = _sc.workpath(path), workenv = getWorkEnvironmentByPath(workpath);

	if(workenv.readOnly)
		return false;
	if(getConfigData("CIDE", "FileProtection") && workenv.type == _mainwindow.WORKENV_TYPE_ClonkPath && !workenv.noFileProtection) {
		let subdir = path.substr(workpath.length+1).split("/").shift();
		let protected_files = ["Objects.ocd", "Arena.ocf", "Defense.ocf", "Experimental.ocf", "Missions.ocf", "Parkour.ocf", "Tutorials.ocf",
							   "Worlds.ocf", "Graphics.ocg", "Material.ocg", "Music.ocg", "Sound.ocg", "System.ocg", "Decoration.ocd", "Experimental.ocd"];
		if(protected_files.indexOf(subdir) != -1)
			return false;
	}
	return true;
}

window.addEventListener("load", function(){
	maindeck = addDeck($("#modules-wrapper-maindeck")[0], $("#modules-nav-maindeck")[0]);
	sidedeck = addDeck($("#modules-wrapper-sidedeck")[0], $("#modules-nav-sidedeck")[0]);

	maindeck.hook("preShowItem", function(deck, itemid) {
		clearCideToolbar();
		if(deck.items[itemid] && deck.items[itemid].contentWindow._createCideToolbar)
			deck.items[itemid].contentWindow._createCideToolbar();
	});
	sidedeck.hook("preShowItem", function(deck, itemid) {
		clearCideToolbar();
		if(deck.items[itemid] && deck.items[itemid].contentWindow._createCideToolbar)
			deck.items[itemid].contentWindow._createCideToolbar();
	});

	$(window).resize(function() {
		var splitter = $("splitter"), pos = splitter.offset();
		if(maindeck.isEmpty() || sidedeck.isEmpty())
			return;

		if($("#cide-modules").css("-moz-box-orient") == "horizontal")
			$(".deckbox").css("width", ($(window).width()-pos.left+splitter.outerWidth())/2+"px");
		else
			$(".deckbox").css("height", $(window).height()/2+"px");
	});

	/** Taberstellung **/

	var btncreatefn = function(deck, btn, id) {
		$(btn).attr("draggable", "true");
		$(deck.items[id]).attr("data-lastused", "");

		//Dragdaten setzen
		btn.addEventListener("dragstart", function(e) {
			e.dataTransfer.setData('text/cidecontent', deck.id + "|" + id + "|" + $(btn).text());
			cide_dragdata = deck.id + "|" + id + "|" + $(btn).text();

			e.dataTransfer.effectAllowed = "move";
			e.dataTransfer.dropEffect = "move";
		});

		btn.addEventListener("dragend", function(e) {
			//Sidedeckdragover-Effekt löschen
			$(".dragover-sidedeck-bottom").removeClass("dragover-sidedeck-bottom");
			$(".dragover-sidedeck-right").removeClass("dragover-sidedeck-right");
			$(".dragover-sidedeck-top").removeClass("dragover-sidedeck-top");
			$(".dragover-sidedeck-left").removeClass("dragover-sidedeck-left");
			$(".dragover-deck").removeClass("dragover-deck");
		});

		//Tabs untereinander verschieben
		btn.addEventListener("dragenter", function(e) {
			//Checken ob _Tabs_ verschiebt wurden
			if(!e.dataTransfer.types.contains("text/cidecontent"))
				return false;

			if(!e.dataTransfer.getData("text/cidecontent"))
				return false;

			var t = cide_dragdata.split('|'), deckid, tabid, tabname;
			deckid = parseInt(t[0]); tabid = parseInt(t[1]); tabname = t[2];

			//Nicht aufs eigene Tab reagieren
			if(deckid == deck.id && tabid == id)
				return false;

			//Daten ggf. ans andere Deck übermitteln
			if(deckid != deck.id) {
				var newData = movedatafn(decks[deckid], decks[deck.id], tabid, tabname, this);
				if(decks[deckid].isEmpty())
					$(decks[deckid].element).parent().parent().removeClass("deck-visible");

				//Neue Tabdaten global speichern
				cide_dragdata = newData[0] + "|" + newData[1] + "|" + tabname;
			}
			$(".deck-"+deckid+"-button-"+tabid).insertBefore($(this));

			e.preventDefault();
		});
		//Tooltip beim Hovern anzeigen
		$(btn).hover(function() {
			//Nur wenn alternatives Label festgelegt wurde1
			var opt = deck.options[id];
			if(!opt.altLabel && !opt.switchLabels)
				return;

			if(!deck.checkIfLabelIsUsed(deck.options[id].label, id))
				return;

			//Tooltip erstellen
			$(document.documentElement).append('<tooltip class="tooltip-tabbutton"><label value="'+opt.label+'"/></tooltip>');

			//Breite setzen
			var tooltip = $(".tooltip-tabbutton")[0];
			$(tooltip).css("width", $(this).css("width"));

			//Tooltip anzeigen
			tooltip.openPopup(btn, "before_start", 0, 0, false, false);
		}, function() {
			$(".tooltip-tabbutton").remove();
		});

		if(deck.checkIfLabelIsUsed(deck.options[id].label, id))
			for(var i = 0; i < deck.options.length; i++)
				if(deck.options[i].label == deck.options[id].label)
					$(".deck-"+deck.id+"-button-"+i).find("description").text(deck.options[i].altLabel);
	};

	maindeck.hook("btnCreated", btncreatefn);
	sidedeck.hook("btnCreated", btncreatefn);

	//Tabs ganz rechts in der Tabnavigation einordnen (Drag and Drop)
	var btncnt_dragenterfn = function(deck) { return function(e) {
		//Nur verschieben, wenn die Tabbar auch das Ziel ist
		if(e.target != this)
			return false;

		//Checken ob _Tabs_ verschiebt wurden
		if(!e.dataTransfer.types.contains("text/cidecontent"))
			return false;

		if(!e.dataTransfer.getData("text/cidecontent"))
			return false;

		var [deckid, tabid, tabname] = cide_dragdata.split('|');
		deckid = parseInt(deckid); tabid = parseInt(tabid);

		//Daten ans andere Deck übermitteln
		if(deckid != deck.id) {
			var newData = movedatafn(decks[deckid], decks[deck.id], tabid, tabname, true);
			if(decks[deckid].isEmpty())
				$(decks[deckid].element).parent().parent().removeClass("deck-visible");

			cide_dragdata = newData[0] + "|" + newData[1] + "|" + tabname;
		}
		$(".deck-"+deckid+"-button-"+tabid).appendTo($(this));

		e.preventDefault();
	}};

	maindeck.buttonContainer.addEventListener("dragenter", btncnt_dragenterfn(maindeck));
	sidedeck.buttonContainer.addEventListener("dragenter", btncnt_dragenterfn(sidedeck));

	//Decks verschwinden lassen, falls leer
	var detachedfn = function(deck, id, frame) {
		if(deck.selectedId == undefined)
			clearCideToolbar();

		//Module loeschen, falls leer
		if(frame && frame.contentWindow && frame.contentWindow.readyState) {
			if(!frame.contentWindow.hasOpenedSessions()) {
				if(frame.contentWindow.rejectFrameRemoval && frame.contentWindow.rejectFrameRemoval())
					return;

				//Zeitpunkt der letzten Nutzung speichern
				$(frame).attr("data-lastused", (new Date()).getTime());

				//Vorherige Timeouts loeschen
				if($(frame).attr("data-timeoutid"))
					clearTimeout(parseInt($(frame).attr("data-timeoutid")));

				//Frame nach ca. 60 Sekunden loeschen, wenn es solange unbenutzt bleibt.
				$(frame).attr("data-timeoutid", setTimeout(function() {
					let time = parseInt($(frame).attr("data-lastused"));
					if(time && !isNaN(time) && (new Date()).getTime() >= (time+59000))
						$(frame).remove();
				}, 60000));
			}
		}

		if(sidedeck.isEmpty() && maindeck.isEmpty()) {
			//Deckverteilung wieder auf Standard umstellen:
			if($(maindeck.element).parents(".deckbox").attr("id") != "box-maindeck") {
				var temp = maindeck;
				maindeck = sidedeck;
				sidedeck = temp;
				$(".deckbox").css("width", "").css("height", "");
			}

			//Wenn beide Decks leer sind, das Maindeck anzeigen
			$(maindeck.element).parents(".deckbox").addClass("deck-visible");
			$(sidedeck.element).parents(".deckbox").removeClass("deck-visible");

			$(_mainwindow.document).attr("title", "Windmill");
			setWindowTitle("Windmill");
			return true;
		}
		else if(deck.isEmpty() && $(deck.element).parents(".deckbox").hasClass("deck-visible")) {
			$(deck.element).parents(".deckbox").removeClass("deck-visible");

			if(deck == maindeck && !sidedeck.isEmpty()) {
				maindeck = sidedeck;
				sidedeck = deck;
				$(".deckbox").css("width", "").css("height", "");
			}
		}

		//Ggf. Labels zurückstellen
		for(var i = 0; i < deck.options.length; i++) {
			var btn = $(".deck-"+deck.id+"-button-"+i);
			if(!btn[0])
				continue;

			var desc = btn.find('description');
			if(desc.text() == deck.options[i].altLabel && !deck.checkIfLabelIsUsed(deck.options[i].label, i))
				desc.text(deck.options[i].label);
		}

		//Tooltip loeschen
		$(".tooltip-tabbutton").remove();
	}

	maindeck.hook("itemDetached", detachedfn);
	sidedeck.hook("itemDetached", detachedfn);

	//Tabs in neues Deck einfügen
	var dragoverfn = function(e) {
		var dragService = _sc.dragserv();
		var dragSession = dragService.getCurrentSession();
		if(!e.dataTransfer.types.contains("text/cidecontent")
		&& !e.dataTransfer.types.contains("text/cideexplorer")
	    && !e.dataTransfer.types.contains("application/x-moz-file")) {
			dragSession.canDrop = false;
			return true;
		}

		dragSession.canDrop = true;
		var outside = false;
		if(e.dataTransfer.types.contains("text/cideexplorer") || e.dataTransfer.types.contains("application/x-moz-file"))
			outside = true;

		//Falls es kein Nebendeck gibt: Deck am Rand öffnen
		if(!$(".deckbox").not($(this).parent().parent()).hasClass("deck-visible")) {
			//Alte Richtungseffekte falls nicht mehr zutreffend löschen
			if($(this).hasClass("dragover-sidedeck-right")) { //Rechts
				if(e.clientX < ($(this).width()-50))
					$(this).removeClass("dragover-sidedeck-right");
			}
			else if($(this).hasClass("dragover-sidedeck-bottom")) { //Unten
				if(e.clientY < ($(this).height()-50))
					$(this).removeClass("dragover-sidedeck-bottom");
			}
			else if($(this).hasClass("dragover-sidedeck-left")) { //Links
				if(e.clientX > 50)
					$(this).removeClass("dragover-sidedeck-left");
			}
			else if($(this).hasClass("dragover-sidedeck-top")) { //Oben
				if(e.clientY > 50)
					$(this).removeClass("dragover-sidedeck-top");
			}

			var newclass;
			//Neuen Richtungseffekt anzeigen
			if(e.clientX > ($(this).width()-50)) //Rechts
				newclass = "dragover-sidedeck-right";
			else if(e.clientY > ($(this).height()-50)) //Unten
				newclass = "dragover-sidedeck-bottom";
			else if(e.clientX < 50) //Links
				newclass = "dragover-sidedeck-left";
			else if(e.clientY < 50) //Oben
				newclass = "dragover-sidedeck-top";
			else if(outside)
				newclass = "dragover-deck";

			if(newclass) {
				if(newclass != "dragover-deck" && $(this).hasClass("dragover-deck"))
					$(this).removeClass("dragover-deck");

				$(this).addClass(newclass);
			}
		}
		//Effekt für Deck-Hover (falls es schon offen ist)
		else {
			if(!$(this).hasClass("dragover-deck"))
				$(this).addClass("dragover-deck");
		}

		e.preventDefault();
	}

	maindeck.element.addEventListener("dragover", dragoverfn);
	sidedeck.element.addEventListener("dragover", dragoverfn);

	/** Tab in neues Deck verschieben **/

	var movedatafn = function(source, destination, tabid, tabname, beforeTab) {
		//Daten in anderes Deck verschieben
		var moduleframe = source.items[tabid];
		var data = moduleframe.contentWindow.getTabData(tabid);

		var modulename = $(moduleframe).attr("name");
		var module = deckGetModule(destination, modulename);
		var rData = []; //Nur für beforeTab
		var taboptions = source.options[tabid];

		if(!module) {
			createModule(modulename, destination.element);
			module = deckGetModule(destination, modulename);
			if(!module)
				return false;
		}

		//Daten an Modul senden
		if(!module.contentWindow.readyState) {
			module.contentWindow.addEventListener("load", function() {
				var index = destination.add(module, tabname, true, true, false, taboptions);
				module.contentWindow.dropTabData(data, index);
				if(beforeTab && beforeTab !== true)
					$(destination.buttons[index]).insertBefore(beforeTab);

				updateFrameWindowTitleDeck(destination, index);
			});
		}
		else {
			var index = destination.add(module, tabname, true, true, false, taboptions);
			module.contentWindow.dropTabData(data, index);
			if(beforeTab) {
				if(beforeTab !== true)
					$(destination.buttons[index]).insertBefore(beforeTab);
				rData = [destination.id, index];
			}
		}

		source.detachItem(tabid);
		return rData;
	}

	/** Tab-Verschiebung starten **/

	var dropfn = function(_tdeck) { return function(e) {
		if(!e.dataTransfer.types.contains("text/cidecontent")
		&& !e.dataTransfer.types.contains("text/cideexplorer")
	    && !e.dataTransfer.types.contains("application/x-moz-file"))
			return;

		var data = e.dataTransfer.getData("text/cidecontent");
		var positionSideDeck = (sdeck) => { 
			var deck = (_tdeck == maindeck)?sidedeck:maindeck, pos = 0;

			if($(this).hasClass("dragover-sidedeck-bottom")) {
				sdeck.insertAfter($(this).parent().parent());
				$("#cide-modules").css("-moz-box-orient", "vertical");
				pos = SIDEDECK_DIRV;
			}
			else if($(this).hasClass("dragover-sidedeck-right")) {
				sdeck.insertAfter($(this).parent().parent());
				$("#cide-modules").css("-moz-box-orient", "horizontal");
				pos = 0;
			}
			else if($(this).hasClass("dragover-sidedeck-top")) {
				sdeck.insertBefore($(this).parent().parent());
				$("#cide-modules").css("-moz-box-orient", "vertical");
				pos = SIDEDECK_DIRV|SIDEDECK_POSBEFORE;
			}
			else if($(this).hasClass("dragover-sidedeck-left")) {
				sdeck.insertBefore($(this).parent().parent());
				$("#cide-modules").css("-moz-box-orient", "horizontal");
				pos = SIDEDECK_POSBEFORE;
			}

			setConfigData("CIDE", "SidedeckPosition", pos);
			saveConfig([["CIDE", "SidedeckPosition"]]);
			$(deck.element).parent().parent().addClass("deck-visible");
			$(window).trigger("resize");

			return deck;
		}
		if(!data) {
			var deck = _tdeck;
			if(!$(this).hasClass("dragover-deck")) {
				deck = (_tdeck == maindeck)?sidedeck:maindeck;
				if(!$(deck.element).parents(".deckbox").hasClass("deck-visible"))
					positionSideDeck($(deck.element).parents(".deckbox"));
			}

			data = e.dataTransfer.getData("text/cideexplorer");

			if(data) {
				data = parseInt(data);
				if(!md_explorer || !md_explorer.contentWindow || isNaN(data))
					return;

				var file = new _sc.file(_sc.workpath() + md_explorer.contentWindow.getTreeObjPath(md_explorer.contentWindow.getTreeObjById(data)));
				if(!file || !file.exists())
					return;

				openFileInDeck(file, deck == sidedeck);
			}
			else {
				var dragService = _sc.dragserv();
				var dragSession = dragService.getCurrentSession();

				var _ios = _sc.ioserv();
				var files = [];

				//Überprüfen, ob von außerhalb
				if(dragSession.sourceNode)
				  return;

				//Setup a transfer item to retrieve the file data
				var trans = _sc.transferable();
				trans.addDataFlavor("application/x-moz-file");

				for(var i = 0; i < dragSession.numDropItems; i++) {
					dragSession.getData(trans, i);
					var flavor = {}, data = {}, length = {};
					trans.getAnyTransferData(flavor, data, length);

					if(data) {
						var file = data.value.QueryInterface(Ci.nsIFile);
						if(file)
							openFileInDeck(file, deck == sidedeck);
					}
				}
			}

			//Dragover-Effekte loeschen
			$(".dragover-sidedeck-bottom").removeClass("dragover-sidedeck-bottom");
			$(".dragover-sidedeck-right").removeClass("dragover-sidedeck-right");
			$(".dragover-sidedeck-top").removeClass("dragover-sidedeck-top");
			$(".dragover-sidedeck-left").removeClass("dragover-sidedeck-left");
			$(".dragover-deck").removeClass("dragover-deck");
			return;
		}

		var [deckid, tabid, tabname] = data.split('|');
		deckid = parseInt(deckid); tabid = parseInt(tabid);

		//Kein Nebendeck vorhanden
		var sdeck = $(".deckbox").not($(this).parent().parent());
		if(!sdeck.hasClass("deck-visible"))
			var deck = positionSideDeck(sdeck);
		else if($(this).hasClass("dragover-deck")) {
			//Auf selbes Deck verschieben
			if(deckid == _tdeck.id)
				return true;

			var deck = _tdeck;
		}

		//Informationen aus Tab entnehmen und anschließend in anderes Deck einfügen
		movedatafn(decks[deckid], deck, tabid, tabname);
		if(decks[deckid].isEmpty())
			$(decks[deckid].element).parent().parent().removeClass("deck-visible");

		e.preventDefault();
	}; };
	maindeck.element.addEventListener("drop", dropfn(maindeck));
	sidedeck.element.addEventListener("drop", dropfn(sidedeck));

	//Dragover-Effekt entfernen
	var dleavefunc = function(e) {
		if($(this).hasClass("dragover-deck"))
			$(this).removeClass("dragover-deck");
	}

	maindeck.element.addEventListener("dragleave", dleavefunc);
	sidedeck.element.addEventListener("dragleave", dleavefunc);

	setTimeout(function() {
		md_explorer = getModule(createModule("cide-explorer", $("#cide-explorer"), 0, 0, { prepend: true }), true);
	}, 2);

	$("#cide-explorer").resize(function() {
		_mainwindow.$("#cide-spacer").css("width", ($("#cide-explorer").outerWidth()+$("splitter").outerWidth())+"px");
	});

	_mainwindow.$("#cide-spacer").css("width", ($("#cide-explorer").outerWidth()+$("splitter").outerWidth())+"px");
});

const SIDEDECK_DIRV = 1, SIDEDECK_POSBEFORE = 2;

function openSideDeck() {
	var pos = getConfigData("CIDE", "SidedeckPosition") || 0;
	var deckbox = $(sidedeck.element).parents(".deckbox");
	if(pos & SIDEDECK_DIRV) {
		if(pos & SIDEDECK_POSBEFORE)
			$(sidedeck.element).insertBefore($(this).parent().parent());
		else
			$(sidedeck.element).insertAfter($(this).parent().parent());

		$("#cide-modules").css("-moz-box-orient", "vertical");
	}
	else {
		if(pos & SIDEDECK_POSBEFORE)
			$(sidedeck.element).insertBefore($(this).parent().parent());
		else
			$(sidedeck.element).insertAfter($(this).parent().parent());

		$("#cide-modules").css("-moz-box-orient", "horizontal");
	}

	$(sidedeck.element).parent().parent().addClass("deck-visible");
	$(window).trigger("resize");
}

function deckGetModule(deck, modulename) {
	var obj = $(deck.element).find("iframe[name='"+modulename+"']");

	return obj[0];
}

function fileLoadedInModule(modulename, filepath, fShow) {
	var module = deckGetModule(maindeck, modulename), index;
	if(module && module.contentWindow && module.contentWindow.readyState && (index = module.contentWindow.fileLoaded(filepath)) > -1) {
		if(fShow)
			maindeck.show(index, true);

		return index+1;
	}

	module = deckGetModule(sidedeck, modulename);
	if(module && module.contentWindow && module.contentWindow.readyState && (index = module.contentWindow.fileLoaded(filepath)) > -1) {
		if(fShow)
			sidedeck.show(index, true);

		return index+1;
	}

	return false;
}

function getUnsavedFiles(deck) {
	var ret = [];
	if(deck == undefined) {
		ret = ret.concat(getUnsavedFiles(maindeck));
		ret = ret.concat(getUnsavedFiles(sidedeck));
		return ret;
	}

	var modules = $(deck.element).find("iframe");

	for(var i = 0; i < modules.length; i++) {
		if(modules[i].contentWindow && modules[i].contentWindow.readyState)
			if(modules[i].contentWindow.getUnsavedFiles)
				ret = ret.concat(modules[i].contentWindow.getUnsavedFiles());
	}

	return ret;
}

/** Einzelne Bearbeitugnsfenster und -module starten/öffnen **/

function openFileInDeck(file, fSideDeck) {
	var t = file.leafName.split("."), fext = t[t.length-1].toLowerCase(); 
	var deck = fSideDeck?sidedeck:maindeck;
	var path = formatPath(file.path);

	if(!file.exists())
		return;

	//Files behandeln je nach Fileextension
	switch(fext) {
		case "c":
			addTexteditor(file, "ocscript", deck);
			break;
		case "txt":
		case "material":
			var filename = file.leafName.toLowerCase();
			switch(filename) {
				case "defcore.txt":
				case "scenario.txt":
				case "particle.txt":
				case "parameterdefs.txt":
				case "teams.txt":
				case "playercontrols.txt":
				case "player.txt":
				case "objectinfo.txt":
				case "objects.txt":
					addTexteditor(file, "ini", deck);
					break;
				case "landscape.txt":
					addTexteditor(file, "c4landscape", deck);
					break;
				default:
					if(filename.match(/StringTbl..\.txt/i))
						addTexteditor(file, "ini", deck);
					else
						addTexteditor(file, "text", deck);
					break;
			}
			break;
		case "ocm":
			addTexteditor(file, "ini", deck);
			break;
		case "mesh":
			addMeshviewer(file, deck);
			break;
		case "bmp":
			addImgEditor(file, true, deck);
			break;
		case "png":
		case "jpg":
			addImgEditor(file, false, deck);
			break;
		case "ogg":
		case "wav":
			addAudioplayer(path);
			break;

		default:
			break;
	}
}

var md_audioplayer = -1;

function addAudioplayer(path) {
	if(getConfigData("CIDE", "AU_Audio"))
		return OpenFileWithProgram(path, getConfigData("CIDE", "ExtProg_Audio"));

	var module = getModule(md_audioplayer, true);

	if(!module) {
		md_audioplayer = createModule("audioplayer", $("#audioplayer"));
		module = getModule(md_audioplayer, true);

		if(!module)
			return warn("$err_loading_module$");
	}

	var t = path.split("/").pop().split('.'), fext = t[t.length-1];
	var iconstr = "chrome://windmill/content/img/icon-fileext-"+fext+".png";

	if(!module.contentWindow.readyState) {
		module.contentWindow.addEventListener("load", function() {
			this.loadFile(path);
		});
	}
	else if(!module.contentWindow.fileLoaded("audioplayer", path))
		module.contentWindow.loadFile(path);

	$("#audioplayer").addClass("active");
}

function prepareDeck(deck, modulename, file) {
	if(fileLoadedInModule(modulename, file.path, true))
		return {};

	if(!deck)
		deck = $(maindeck.element).hasClass("deck-visible")?maindeck:sidedeck;

	if(deck == sidedeck) {
		if(maindeck.isEmpty())
			deck = maindeck;
		else
			openSideDeck();
	}

	var module = deckGetModule(deck, modulename);
	if(!module) {
		createModule(modulename, deck.element),
		module = deckGetModule(deck, modulename);

		if(!module) {
			warn("$err_loading_module$");
			return {};
		}
	}

	return { deck, module };
}

function addTexteditor(file, lang, deck) {
	if(getConfigData("CIDE", "AU_Script") && lang == "ocscript")
		return OpenFileWithProgram(file, getConfigData("CIDE", "ExtProg_Script"));
	if(["text", "ini", "c4landscape"].indexOf(lang) != -1 && getConfigData("CIDE", "AU_Text"))
		return OpenFileWithProgram(file, getConfigData("CIDE", "ExtProg_Text"));

	// load text
	var txt = loadFile(file.path);
	var modulename = "scripteditor";
	//TODO: In Einstellungen verstellbar
	if(file.leafName.toUpperCase() == "SCENARIO.TXT" && getConfigData("ScenarioSettings", "AlwaysUseScenarioSettings"))
		modulename = "scenario-settings";

	var {deck, module} = prepareDeck(deck, modulename, file);
	if(!deck)
		return;

	var t = file.leafName.split('.'), fext = t[t.length-1];
	var icon = "chrome://windmill/content/img/icon-fileext-"+fext+".png";

	// we have to insert the text after the libraries have been read out
	if(!module.contentWindow.readyState) {
		// insert into deck control and safe index
		var index = deck.add(module, file.leafName, true, true, false, {altLabel: file.parent.leafName, switchLabels: true, icon, filepath: file.path });

		module.contentWindow.addEventListener("load", function(){
			this.addScript(txt, lang, index, file.path, true);
			updateFrameWindowTitleDeck(deck, index);
		});
	}
	else {
		// insert into deck control and safe index
		var index = deck.add(module, file.leafName, true, true, false, {altLabel: file.parent.leafName, switchLabels: true, icon, filepath: file.path });

		module.contentWindow.addScript(txt, lang, index, file.path, true);
	}	
}

function addMeshviewer(file, deck) {
	var {deck, module} = prepareDeck(deck, "meshviewer", file);
	if(!deck)
		return;

	if(!module.contentWindow.readyState) {
		module.contentWindow.addEventListener("load", function(){
			var index = deck.add(module, file.leafName, true, true, false, {altLabel: file.parent.leafName, switchLabels: true, icon: "chrome://windmill/content/img/icon-fileext-mesh.png", filepath: file.path });

			this.initModelviewer(file, index);
			updateFrameWindowTitleDeck(deck, index);
		});
	}
	else {
		var index = deck.add(module, file.leafName, true, true, false, {altLabel: file.parent.leafName, switchLabels: true, icon: "chrome://windmill/content/img/icon-fileext-mesh.png", filepath: file.path });

		module.contentWindow.initModelviewer(file, index);
	}
}

function addImgEditor(file, fBMP, deck) {
	if(getConfigData("CIDE", "AU_GraphicsBMP") && fBMP)
		return OpenFileWithProgram(file, getConfigData("CIDE", "ExtProg_GraphicsBMP"));
	if(getConfigData("CIDE", "AU_GraphicsPNG") && !fBMP)
		return OpenFileWithProgram(file, getConfigData("CIDE", "ExtProg_GraphicsPNG"));

	if(!getConfigData("Global", "DevMode") && fBMP) {
		warn(`Der BMP-Editor muss noch gereworked werden und steht daher nicht zur Verfuegung. Daher bitte ein externes Programm ueber die Optionen einstellen.
(Um den BMP-Editor dennoch benutzen zu koennen muss der DevMode aktiviert werden, s. Config)`);
		return;
	}
	var modulename = fBMP?"bmpeditor":"imagepreview";

	var {deck, module} = prepareDeck(deck, modulename, file);
	if(!deck)
		return;

	var t = file.leafName.split('.'), fext = t[t.length-1];
	var icon = "chrome://windmill/content/img/icon-fileext-"+fext+".png";

	if(!module.contentWindow.readyState) {
		var index = deck.add(module, file.leafName, true, true, false, {altLabel: file.parent.leafName, switchLabels: true, icon, filepath: file.path });

		module.contentWindow.addEventListener("load", function() {
			this.loadImage(file, index, true);
			updateFrameWindowTitleDeck(deck, index);
		});
	}
	else {
		var index = deck.add(module, file.leafName, true, true, false, {altLabel: file.parent.leafName, switchLabels: true, icon, filepath: file.path });

		module.contentWindow.loadImage(file, index, true);
	}

	return true;
}

function OpenFileWithProgram(file, extprogstr) {
	//Es wurde kein Programm angegeben
	if(!extprogstr)
		return warn("$err_no_external_program$");

	var args = [(typeof file == "string")?file:file.path];

	var f = new _sc.file(extprogstr);
	var process = _sc.process(f);
	process.run(false, args, args.length);

	return true;
}

function loadFile(path) {
	if(!path)
		return false;

	var f = _sc.file(path);
	if(!f.exists()) {
		Components.utils.reportError("Load file error. File doesn't exist: " + path);
		return false;
	}

	var	charset = "utf-8",
		fs = _sc.ifstream(f, 1, 0, false),
		cs = _sc.cistream(),
		result = {};
		cs.init(fs, charset, fs.available(), cs.DEFAULT_REPLACEMENT_CHARACTER);

	cs.readString(fs.available(), result);
	cs.close();
	fs.close();

	return result.value;
}