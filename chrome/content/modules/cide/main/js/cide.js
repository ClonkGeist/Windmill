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
			let other_deck = deck==maindeck?sidedeck:maindeck;
			if(other_deck.isEmpty()) {
				let cnt = 0;
				for(let i = 0; i < deck.items.length; i++)
					if(deck.items[i])
						cnt++;

				if(cnt == 1)
					return;
			}
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
			if(deckid != deck.id || tabid == id)
				return false;

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
	
	function tabcheck(e, target, ignore_bubbling) {
		//Nur verschieben, wenn die Tabbar auch das Ziel ist
		if(e.target != target)
			if(!ignore_bubbling || $(e.target).parents().index(target) == -1)
				return false;

		//Checken ob _Tabs_ verschiebt wurden
		if(!e.dataTransfer.types.contains("text/cidecontent"))
			return false;

		if(!e.dataTransfer.getData("text/cidecontent"))
			return false;

		return true;
	}

	//Tabs ganz rechts in der Tabnavigation einordnen (Drag and Drop)
	var btncnt_dragenterfn = function(deck) { return function(e) {
		//Pruefen, ob verschoben werden darf
		if(!tabcheck(e, this))
			return false;

		var [deckid, tabid, tabname] = cide_dragdata.split('|');
		deckid = parseInt(deckid); tabid = parseInt(tabid);

		//Beim Sidedeck nicht direkt in die Navigation einfuegen, allerdings Drop erlauben
		if(deckid != deck.id)
			return;

		$(".deck-"+deckid+"-button-"+tabid).appendTo($(this));

		e.preventDefault();
	}};
	function btncnt_dragoverfn(deck) { return function(e) {
		//Pruefen, ob verschoben werden darf
		if(!tabcheck(e, this, true))
			return false;

		let dragSession = _sc.dragserv().getCurrentSession();
		dragSession.canDrop = true;
	}}
	
	function btncnt_dropfn(deck) { return function(e) {
		//Pruefen, ob verschoben werden darf
		if(!tabcheck(e, this))
			return false;

		var [deckid, tabid, tabname] = cide_dragdata.split('|');
		deckid = parseInt(deckid); tabid = parseInt(tabid);

		//Kein Drop in das gleiche Deck
		if(deckid == deck.id)
			return;

		var newData = movedatafn(decks[deckid], decks[deck.id], tabid, tabname, true);
		if(decks[deckid].isEmpty())
			$(decks[deckid].element).parent().parent().removeClass("deck-visible");

		cide_dragdata = newData[0] + "|" + newData[1] + "|" + tabname;
		$(".deck-"+deckid+"-button-"+tabid).appendTo($(this));

		e.preventDefault();
	}}

	maindeck.buttonContainer.addEventListener("dragenter", btncnt_dragenterfn(maindeck));
	sidedeck.buttonContainer.addEventListener("dragenter", btncnt_dragenterfn(sidedeck));
	maindeck.buttonContainer.addEventListener("dragover", btncnt_dragoverfn(maindeck));
	sidedeck.buttonContainer.addEventListener("dragover", btncnt_dragoverfn(sidedeck));
	maindeck.buttonContainer.addEventListener("dragdrop", btncnt_dropfn(maindeck));
	sidedeck.buttonContainer.addEventListener("dragdrop", btncnt_dropfn(sidedeck));

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
		function clearHoverEffects() {
			//Dragover-Effekte loeschen
			$(".dragover-sidedeck-bottom").removeClass("dragover-sidedeck-bottom");
			$(".dragover-sidedeck-right").removeClass("dragover-sidedeck-right");
			$(".dragover-sidedeck-top").removeClass("dragover-sidedeck-top");
			$(".dragover-sidedeck-left").removeClass("dragover-sidedeck-left");
			$(".dragover-deck").removeClass("dragover-deck");
		}
		if(!data) {
			var deck = _tdeck;
			if(!$(this).hasClass("dragover-deck")) {
				deck = (_tdeck == maindeck)?sidedeck:maindeck;
				if(!$(deck.element).parents(".deckbox").hasClass("deck-visible"))
					positionSideDeck($(deck.element).parents(".deckbox"));
			}

			clearHoverEffects();
			data = e.dataTransfer.getData("text/cideexplorer");

			if(data) {
				data = parseInt(data);
				if(!md_explorer || !md_explorer.contentWindow || isNaN(data))
					return;

				let obj = md_explorer.contentWindow.getTreeObjById(data);
				var file = new _sc.file(_sc.workpath(obj) + md_explorer.contentWindow.getTreeObjPath(obj));
				if(!file || !file.exists())
					return;

				openFileInDeck(file.path, deck == sidedeck);
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
							openFileInDeck(file.path, deck == sidedeck);
					}
				}
			}
			return;
		}

		var [deckid, tabid, tabname] = data.split('|');
		deckid = parseInt(deckid); tabid = parseInt(tabid);

		//Kein Nebendeck vorhanden
		var sdeck = $(".deckbox").not($(this).parent().parent()), deck = undefined;
		if(!sdeck.hasClass("deck-visible"))
			var deck = positionSideDeck(sdeck);
		else if($(this).hasClass("dragover-deck")) {
			//Auf selbes Deck verschieben
			if(deckid == _tdeck.id) {
				clearHoverEffects();
				return true;
			}

			var deck = _tdeck;
		}
		clearHoverEffects();

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

function openFileInDeck(path, fSideDeck) {
	let deck = fSideDeck?sidedeck:maindeck;
	path = formatPath(path);
	let splittedpath = path.split("/"),
		filename = splittedpath.pop(),
		parentpath = formatPath(splittedpath.join("/")),
		fext = filename.split(".").pop().toLowerCase();

	//Files behandeln je nach Fileextension
	switch(fext) {
		case "c":
			addTexteditor(path, filename, parentpath, "ocscript", deck);
			break;
		case "txt":
		case "material":
			switch(filename.toLowerCase()) {
				case "defcore.txt":
				case "scenario.txt":
				case "particle.txt":
				case "parameterdefs.txt":
				case "teams.txt":
				case "playercontrols.txt":
				case "player.txt":
				case "objectinfo.txt":
				case "objects.txt":
					addTexteditor(path, filename, parentpath, "ini", deck);
					break;
				case "landscape.txt":
					addTexteditor(path, filename, parentpath, "c4landscape", deck);
					break;
				default:
					if(filename.match(/StringTbl..\.txt/i))
						addTexteditor(path, filename, parentpath, "ini", deck);
					else
						addTexteditor(path, filename, parentpath, "text", deck);
					break;
			}
			break;
		case "ocm":
			addTexteditor(path, filename, parentpath, "ini", deck);
			break;
		case "mesh":
			addMeshviewer(path, filename, parentpath, deck);
			break;
		case "bmp":
			addImgEditor(path, filename, parentpath, true, deck);
			break;
		case "png":
		case "jpg":
			addImgEditor(path, filename, parentpath, false, deck);
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
	var iconstr = "chrome://windmill/content/img/explorer/icon-fileext-"+fext+".png";

	if(!module.contentWindow.readyState) {
		module.contentWindow.addEventListener("load", function() {
			this.loadFile(path);
		});
	}
	else if(!module.contentWindow.fileLoaded("audioplayer", path))
		module.contentWindow.loadFile(path);

	$("#audioplayer").addClass("active");
}

function prepareDeck(deck, modulename, path) {
	if(fileLoadedInModule(modulename, path, true))
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

function addTexteditor(path, filename, parentpath, lang, deck) {
	if(getConfigData("CIDE", "AU_Script") && lang == "ocscript")
		return OpenFileWithProgram(path, getConfigData("CIDE", "ExtProg_Script"));
	if(["text", "ini", "c4landscape"].indexOf(lang) != -1 && getConfigData("CIDE", "AU_Text"))
		return OpenFileWithProgram(path, getConfigData("CIDE", "ExtProg_Text"));

	var modulename = "scripteditor";
	//TODO: In Einstellungen verstellbar
	if(filename.toUpperCase() == "SCENARIO.TXT" && getConfigData("ScenarioSettings", "AlwaysUseScenarioSettings"))
		modulename = "scenario-settings";

	var {deck, module} = prepareDeck(deck, modulename, path);
	if(!deck)
		return;

	let fext = filename.split('.').pop();
	var icon = "chrome://windmill/content/img/explorer/icon-fileext-"+fext+".png";

	// we have to insert the text after the libraries have been read out
	if(!module.contentWindow.readyState) {
		// insert into deck control and safe index
		var index = deck.add(module, filename, true, true, false, {altLabel: parentpath.split("/").pop(), switchLabels: true, icon, filepath: path });

		module.contentWindow.addEventListener("load", function(){
			this.addScript(lang, index, path, true);
			updateFrameWindowTitleDeck(deck, index);
		});
	}
	else {
		// insert into deck control and safe index
		var index = deck.add(module, filename, true, true, false, {altLabel: parentpath.split("/").pop(), switchLabels: true, icon, filepath: path });

		module.contentWindow.addScript(lang, index, path, true);
	}	
}

function addMeshviewer(path, filename, parentpath, deck) {
	//Pruefen, ob OgreXMLConverter verfuegbar ist
	let ogrexmlconverter = getAppById("ogrexmlcnv");
	if(!ogrexmlconverter.isAvailable()) {
		let dlg = new WDialog("$DlgOgreXMLConverterNotAvailable$", MODULE_LPRE, { css: {"width": "600px"}, btnright: ["accept"]});
		dlg.setContent('<description style="margin-bottom: 1em">$DlgOgreXMLConverterDesc$</description><description>$DlgOgreXMLConverterDesc2$</description>');
		dlg.show();
		dlg = 0;
		return;
	}
	//Modul vorbereiten
	var {deck, module} = prepareDeck(deck, "meshviewer", path);
	if(!deck)
		return;

	if(!module.contentWindow.readyState) {
		module.contentWindow.addEventListener("load", function(){
			var index = deck.add(module, filename, true, true, false, {altLabel: parentpath.split("/").pop(), switchLabels: true, icon: "chrome://windmill/content/img/explorer/icon-fileext-mesh.png", filepath: path });

			this.initModelviewer(path, index);
			updateFrameWindowTitleDeck(deck, index);
		});
	}
	else {
		var index = deck.add(module, filename, true, true, false, {altLabel: parentpath.split("/").pop(), switchLabels: true, icon: "chrome://windmill/content/img/explorer/icon-fileext-mesh.png", filepath: path });

		module.contentWindow.initModelviewer(path, index);
	}
}

function addImgEditor(path, filename, parentpath, fBMP, deck) {
	if(getConfigData("CIDE", "AU_GraphicsBMP") && fBMP)
		return OpenFileWithProgram(path, getConfigData("CIDE", "ExtProg_GraphicsBMP"));
	if(getConfigData("CIDE", "AU_GraphicsPNG") && !fBMP)
		return OpenFileWithProgram(path, getConfigData("CIDE", "ExtProg_GraphicsPNG"));

	if(!getConfigData("Global", "DevMode") && fBMP) {
		warn("$beta_bmpeditor_not_available$");
		return;
	}
	var modulename = fBMP?"bmpeditor":"imagepreview";

	var {deck, module} = prepareDeck(deck, modulename, path);
	if(!deck)
		return;

	let fext = filename.split('.').pop();
	var icon = "chrome://windmill/content/img/explorer/icon-fileext-"+fext+".png";

	if(!module.contentWindow.readyState) {
		var index = deck.add(module, filename, true, true, false, {altLabel: parentpath.split("/").pop(), switchLabels: true, icon, filepath: path });

		module.contentWindow.addEventListener("load", function() {
			this.loadImage(path, index, true);
			updateFrameWindowTitleDeck(deck, index);
		});
	}
	else {
		var index = deck.add(module, filename, true, true, false, {altLabel: parentpath.split("/").pop(), switchLabels: true, icon, filepath: path });

		module.contentWindow.loadImage(path, index, true);
	}

	return true;
}

function OpenFileWithProgram(path, extprogstr) {
	//Es wurde kein Programm angegeben
	if(!extprogstr)
		return warn("$err_no_external_program$");

	var args = [path];

	var f = new _sc.file(extprogstr);
	var process = _sc.process(f);
	process.run(false, args, args.length);

	return true;
}