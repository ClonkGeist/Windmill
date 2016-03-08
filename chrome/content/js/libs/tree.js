
var TREE_ELM_ID = 0, MAINTREE_OBJ;

var workpathov = _sc.workpath;

_sc.workpath = function(treeobj) {
	if(treeobj === undefined)
		treeobj = getCurrentTreeSelection();

	if(typeof treeobj == "object" && $(treeobj).hasClass("treeobj")) {
		if($(treeobj).hasClass("workenvironment"))
			return $(treeobj).attr("workpath");
		treeobj = $(treeobj).parents(".workenvironment").attr("workpath");
	}

	return workpathov(treeobj);
}

function noDragDropItem() {}

function createTreeElement(tree, label, container, open, img, filename, special) {
	if(img)
		var imgTag = '<image src="'+img+'" width="16" height="16" xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul" /> ';
	else
		var imgTag = "";

	var drag = ' draggable="true"';
	if(noDragDropItem(label) || special)
		drag = "";

	if(filename)
		filename = ' filename="'+filename+'"';
	else
		filename = '';
	
	$(tree).append('<li id="treeelm-'+TREE_ELM_ID+'" tabindex="0" name="'+label.toLowerCase()+'" class="treeobj treeelm'+(container?' treecontainer':'')+' '+special+'" xmlns="http://www.w3.org/1999/xhtml"' +
	drag+filename+'>'+imgTag+' <description>' + label + '</description></li>');
	if(container)
		$(tree).append('<ul id="treecnt-'+TREE_ELM_ID+'" class="treeobj treecnt '+special+'" xmlns="http://www.w3.org/1999/xhtml"></ul>');
	
	var elm = $("#treeelm-"+TREE_ELM_ID)[0],
		cnt = $("#treecnt-"+TREE_ELM_ID)[0];
	
	if(!elm)
		return log("Tree error: Tree element with id " + TREE_ELM_ID + " (label: " + label + ") was not created.", true);
		
	if(special && special.search(/workenvironment/) == -1)
		$(elm).addClass("no-selection");

	if(!open && container) {
		$(cnt).addClass("tree-collapsed");
		$(elm).addClass("tree-collapsed");
	}
	
	//if(container) {
	$(elm).children("description")[0].addEventListener("dragover", function(e) {
		var dragService = _sc.dragserv();
		var dragSession = dragService.getCurrentSession();
		
		var supported = dragSession.isDataFlavorSupported("text/cideexplorer");
		if(!supported)
			supported = dragSession.isDataFlavorSupported("application/x-moz-file");
		
		if(supported)
			dragSession.canDrop = true;
	});
	$(elm).children("description")[0].addEventListener("dragdrop", function(e) {
		//Bei Nicht-Container auf das Elternelement verweisen
		if(!container)
			elm = $(elm).parent()[0];
		var dragService = _sc.dragserv();
		var dragSession = dragService.getCurrentSession();
		
		var _ios = _sc.ioserv();
		var files = new Array();

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
					files.push(file);
			}
		}
	   
		//Files durchgehen und verschieben
		var path = _sc.workpath(elm) + getTreeObjPath(elm);
		
		for(var i = 0; i < files.length; i++) {
			var f = files[i];
			
			//Datei befindet sich in anderem Laufwerk? Dann moveTo, ansonsten renameTo
			if(f.path[0] != path[0])
				f.moveTo(_sc.file(path), f.leafName);
			else
				f.renameTo(_sc.file(path), f.leafName);
			
			//Callback wenn Container schon Inhalte hat
			if($(cnt).children("li")[0]) {
				onTreeFileDragDrop(cnt, _sc.file(path+"/"+f.leafName));
				sortTreeContainerElements(cnt);
			}
		}
	});
	//}
	
	var id = TREE_ELM_ID;
	//Drag and Drop
	if(drag) {
		elm.addEventListener("dragstart", function(e) {
			//Ggf. Fileinformationen mitreinpasten für Drag außerhalb der Application
			e.dataTransfer.setData('text/cideexplorer', id);
			e.dataTransfer.mozSetDataAt('application/x-moz-file', _sc.file(_sc.workpath(elm)+getTreeObjPath(elm)), 0);
			e.dataTransfer.setData("text/uri-list", _sc.workpath(elm)+getTreeObjPath(elm));

			e.dataTransfer.effectAllowed = "copyMove";
			e.dataTransfer.dropEffect = "copy"; //Damit Objekte auch in Enginefenster reingezogen werden können
		});
	}
	elm.addEventListener("drop", function(e) {
		var data = parseInt(e.dataTransfer.getData("text/cideexplorer"));
		var d_obj = getTreeObjById(data), d_cnt = getTreeCntById(data); //data_object
		var e_id = -1; //destination

		//Verschieben ins Rootverzeichnis
		if($(e.target).attr("id") == "maintree" || $(e.target).prop("tagName") == "li") {
			//Objekt befindet sich bereits im root
			if($(d_obj).parent()[0] == $(MAINTREE_OBJ)[0])
				return false;
			
			//Pfad vorher
			var d_path = _sc.workpath(d_obj) + getTreeObjPath(d_obj);
			var e_path = _sc.workpath(e.target);
		}
		else {
			e_id = getTreeObjId($(e.target).parent()); //Target ID
			if(!getTreeCntById(e_id)[0])
				e_id = getTreeObjId($(e.target).parents("ul")[0]);

			//Nicht in sich selbst oder in Child-Elements von sich selbst
			if(e_id == data || $(d_cnt).find("#treeelm-"+e_id)[0] || getTreeObjId($(d_obj).parent()) == e_id)
				return false;
			
			//Pfad vorher
			var d_path = _sc.workpath(d_obj) + getTreeObjPath(d_obj);
			var e_path = _sc.workpath(getTreeCntById(e_id)) + getTreeObjPath(getTreeCntById(e_id));
		}
		
		var f = _sc.file(d_path), nDir = _sc.file(e_path);
		if(!f.exists() || !nDir.exists() || !nDir.isDirectory())
			return false;

		var containerloaded = !!getTreeCntById(e_id).children("li")[0];

		//Container öffnen
		if(e_id >= 0)
			treeExpand(getTreeCntById(e_id));
		
		//Bei Druck der Steuerungstaste kopieren
		if(e.ctrlKey || getConfigData("Explorer", "CopyOnDragDrop")) {
			var t = f.leafName.split("."), fext = '.'+t[t.length-1];
			t.pop();
			if(t.length)
				var nofext = t.join(".");
			else {
				var nofext = f.leafName;
				fext = '';
			}
			var fname = f.leafName, i = 1;
			while(_sc.file(nDir.path+"/"+fname).exists()) {
				fname = nofext + " - " + i + fext;
				i++;
			}
			
			f.copyTo(nDir, fname);
			
			var img = $(d_obj).find("image").attr("src");
			var cont;
			
			if(e_id >= 0)
				cont = getTreeCntById(e_id);
			else
				cont = MAINTREE_OBJ;
			
			if(containerloaded)
				createTreeElement(cont, fname, !!d_cnt[0], false, img);
			sortTreeContainerElements(cont);
		}
		else {
			//Datei verschieben
			f.renameTo(nDir,f.leafName);

			//Elemente verschieben
			if(containerloaded) {
				if(e_id >= 0) {
					$(d_obj).detach().appendTo(getTreeCntById(e_id));
					if(d_cnt[0])
						$(d_cnt).detach().appendTo(getTreeCntById(e_id));
					sortTreeContainerElements(getTreeCntById(e_id));
				}
				else {
					$(d_obj).detach().appendTo(MAINTREE_OBJ);
					if(d_cnt[0])
						$(d_cnt).detach().appendTo(MAINTREE_OBJ);
					sortTreeContainerElements(MAINTREE_OBJ);
				}
			}
			else
				$(d_obj).remove();
		}
		
		return;
	});
	elm.addEventListener("dragend", function(e) {
		
	});

	//Listitemfunktionen initialisieren
	setupTreeObj($("#treeelm-"+TREE_ELM_ID));

	TREE_ELM_ID++;
	return TREE_ELM_ID-1;
}

/* CALLBACKS

function onTreeDeselect(obj) {}
function onTreeSelect(obj) {}
function onTreeExpand(obj) {}
function onTreeCollapse(obj) {}
*/

/*-- Selectionhelper --*/

function getTreeObjPath(obj) {
	var path = "", o = $(obj);
	
	while((o.parent().prop("tagName") == "html:ul" || o.parent().prop("tagName") == "ul")) {
		var id = getTreeObjId(o);
		var elm = getTreeObjById(id);
		
		if(!elm.attr("filename"))
			break;
		
		path = "/"+elm.attr("filename") + path;
		o = o.parent();
	}
	
	return path;
}

function getTreeObjById(id) {
	return $("#treeelm-"+id);
}

function getTreeCntById(id) {
	return $("#treecnt-"+id);
}

function getTreeObjId(obj) {
	return parseInt($(obj).attr("id").replace(/.+-/, ""));
}

function getCurrentTreeSelection() {
	return $(".tree-selected", MAINTREE_OBJ)[0];
} 

//Item-Markierung
function selectTreeItem(obj, openParents) {
	if(obj && openParents) {
		//Parents ggf oeffnen
		var parents = obj.parents("ul");
		for(var i = 0; i < parents.length; i++) {
			if(!$(parents[i]).hasClass("tree-collapsed"))
				break;

			treeExpand(parents[i]);
		}	
	}
	
	if($(obj).hasClass("no-selection"))
		return;

	var lastobj = $(".tree-selected", MAINTREE_OBJ);
	lastobj.removeClass("tree-selected");
	if(obj)
		$(obj).focus().addClass("tree-selected");
	
	onTreeDeselect(lastobj);
	
	if(obj && obj[0]) {
		onTreeSelect(obj);
		
		//Scrolling
		var {top, left} = $(obj).position();
		var fcnt = $("#filecontainer");
		var wdt = fcnt.width(), hgt = fcnt.height();
		var ohgt = $(obj).height();
		
		if($(MAINTREE_OBJ).height() > hgt)
			wdt -= 20;
		if($(MAINTREE_OBJ).width() > wdt)
			hgt -= 20;

		if(left <= 20)
			fcnt.scrollLeft(fcnt.scrollLeft()+left-20);
		else if(left >= 50)
			fcnt.scrollLeft(fcnt.scrollLeft()+left-50);
		if(hgt-top <= ohgt)
			fcnt.scrollTop(fcnt.scrollTop()+top-hgt+ohgt);
		else if(top < 5) 
			fcnt.scrollTop(fcnt.scrollTop()+top);
	}
	
	return true;
}

function selectTreeEntryCrs(val) {
	//Alle li-Elemente sammeln
	var elements = $("li:visible:not(.no-selection)", MAINTREE_OBJ);

	//Ausgewähltes Element suchen
	var pos = elements.index(getCurrentTreeSelection());
	var nPos = pos+val;
	if(nPos < 0)
		nPos += elements.length;
	nPos %= elements.length;

	selectTreeItem($(elements[nPos]));
	
	return true;
}

function getTreeEntryByIndex(index) {
	//Alle li-Elemente sammeln
	var elements = $("li:visible:not(.no-selection)", MAINTREE_OBJ);
	
	return elements[index];
}

function getTreeEntryIndex(elm) {
	//Alle li-Elemente sammeln
	var elements = $("li:visible:not(.no-selection)", MAINTREE_OBJ);
	
	return elements.index(getCurrentTreeSelection());
}

/*-- Setup --*/

function setupMaintree(obj) {
	MAINTREE_OBJ = obj;

	//Events wie keydown bearbeiten
	$(document).keydown(function(e) {
		//Textbox-Eingaben nicht stören
		var ret = false;
		$("textbox").each(function() {
			if($($(this).prop("inputField")).is(":focus"))
				ret = true;
		});
		
		if($("#edit-filename")[0] || ret)//find(":focus")[0])
			return;
	
		var chr = e.which, obj = $(getCurrentTreeSelection());

		if(chr == 38) { //CursorUp
			e.preventDefault();
			return selectTreeEntryCrs(-1);
		}
		else if(chr == 40) { //CursorDown
			e.preventDefault();
			return selectTreeEntryCrs(+1);
		}
		else if(chr == 37) { //CursorLeft
			e.preventDefault();
			//Ausgewähltes Element ist offenes Tree-Element?
			if($(obj).hasClass("treecontainer") && $(obj).hasClass("tree-expanded"))
				treeCollapse(obj);
			else {
				//Ansonsten übergeordnetes Element auswählen (Falls nicht root)
				var obj = $(obj).parent();
				if(obj.hasClass("treecnt"))
					selectTreeItem(getTreeObjById(getTreeObjId(obj)));
			}
		}
		else if(chr == 39) { //CursorRight
			e.preventDefault();
			if($(obj).hasClass("treecontainer"))
				treeExpand(obj);
		}
		else if(chr == 113) { //F2
			//Description verstecken, Textbox einfügen; Bei Verlust von Fokus/Drücken der Eingabetaste Änderungen übernehmen.
			renameTreeObj(obj);
		}
		else if(chr == 13) { //Eingabetaste
			//Ausgewählte Datei ausführen/laden
			handleTreeEntry(obj);
		}
		else if(chr == 46) { //DEL
			//Löschen des ausgewählten File/Directory
			removeTreeEntry(obj);
		}
		else if(chr == 67 && e.ctrlKey) { //Ctrl + C
			//Kopieren der ausgewaehlten File/Directory
			copyTreeEntry(obj);
		}
		else if(chr == 86 && e.ctrlKey) { //Ctrl + V
			//Einfuegen eines Eintrags aus dem Clipboard an die ausgewaehlte Stelle (oder Hauptverzeichnis)
			pasteFile(obj);
		}
		else if(!(e.ctrlKey||e.altKey||e.shiftKey) && RegExp("[a-zA-Z0-9]").test(String.fromCharCode(chr))) {
			//TODO: Schauen ob die Taste an ein KeyBinding verknuepft ist
			return searchTreeEntry(chr);
		}
		
	});
	$(document).mouseup(function(e) {
		if(!e.button)
			selectTreeItem(0);
	});

	$(MAINTREE_OBJ).addClass("maintree");
	return true;
}

function setupTreeObj(obj) {
	//Events wie onclick, ondblclick bearbeiten
	$(obj).click(function() {
		if($(obj).find("textbox")[0])
			return;

		if(!$(this).hasClass("tree-selected"))
			selectTreeItem(this);
	});
	
	$(obj).mouseup(function(e) {
		if($(obj).find("textbox")[0])
			return;

		if(e.button == 2) {
			if(!$(this).hasClass("tree-selected"))
				selectTreeItem(this);
		}
	});
	
	//Bei Doppelklick Auf- oder Zuklappen
	$(obj).dblclick(function() {
		if($(obj).find("textbox")[0])
			return;

		if(!getTreeCntById(getTreeObjId($(obj)))[0])
			handleTreeEntry($(obj));
		else
			toggleOpenState($(this));
	});
	
	$(obj).blur(function() {
		if(!onTreeItemBlur || !onTreeItemBlur(this))
			selectTreeItem();
	});

	execHook("treeObjAdded", obj);
}

/*-- Clipboard --*/

//Kopieren
function copyTreeEntry(obj) {
	obj = $(obj)[0];
	
	//Transferable-Objekt erzeugen
	var trans = new _sc.transferable();
	trans.init(null);
	trans.addDataFlavor("application/x-moz-file");
	
	//Datei ins Clipboard speichern
	var file = _sc.file(_sc.workpath(obj)+getTreeObjPath(obj));
	trans.setTransferData("application/x-moz-file", file, file.fileSize);
	Services.clipboard.setData(trans, null, Services.clipboard.kGlobalClipboard);

	EventInfo("$EI_Copied$", -1);
	
	return true;
}

//Einfuegen
function pasteFile(target) {
	if(!target)
		target = MAINTREE_OBJ;
	target = $(target)[0];

	var destination = _sc.file(_sc.workpath(target)+getTreeObjPath(target));
	
	//Pruefen ob das Ziel ein Ordner ist
	if(!destination.isDirectory())
		return false;
	
	//Pruefen ob gueltiger Clipboard-Inhalt vorhanden ist
	if(!Services.clipboard.hasDataMatchingFlavors(["application/x-moz-file"], 1, Services.clipboard.kGlobalClipboard))
		return false;
	
	//Transferable-Objekt erzeugen
	var trans = new _sc.transferable();
	trans.init(null);
	trans.addDataFlavor("application/x-moz-file");
	
	//Datei aus dem Clipboard laden
	Services.clipboard.getData(trans, Services.clipboard.kGlobalClipboard);
	var file = {}, fileSize = {};
	trans.getTransferData("application/x-moz-file", file, fileSize);
	file = file.value.QueryInterface(Ci.nsIFile);
	
	//TODO: Namen ggf. aendern falls Datei schon vorhanden ist
	var newFilename = file.leafName;
	
	//Rekursives Kopieren vermeiden
	if(destination.path == file.path) {
		var tempfile = new _sc.file(destination.path+"/"+newFilename);
		tempfile.create(Ci.nsIFile.DIRECTORY_TYPE, 0o777);
		
		//Ordnerinhalte einzelnd rueberkopieren
		var entries = file.directoryEntries;
		while(entries.hasMoreElements()) {
			var entry = entries.getNext().QueryInterface(Ci.nsIFile);
			if(entry.path == tempfile.path)
				continue;

			entry.copyTo(tempfile, null);
		}
	}
	else
		file.copyTo(destination, newFilename);
	
	var copiedFile = _sc.file(destination.path+"/"+newFilename);
	if(!copiedFile.exists())
		return false;
	
	//Falls Verzeichnisinhalte schon geladen sind, Tree-Eintrag hinzufuegen
	var cont = getTreeCntById(getTreeObjId(target));
	if(cont.children("li")[0]) {
		//Tree-Eintrag erzeugen
		addFileTreeEntry(copiedFile, cont);
		sortTreeContainerElements(cont);
	}
	
	//Ggf. Baumelement oeffnen
	if(target != MAINTREE_OBJ)
		treeExpand(target);
	
	return true;
}

/*-- Sortierung --*/

function sortTreeContainerElements(obj) {
	var cont = getTreeCntById(getTreeObjId(obj)), aContElm;
	if(!$(cont)[0])
		cont = MAINTREE_OBJ;
	
	aContElm = $(cont).children("li").toArray();
	aContElm.sort(function(a,b) {
		//Fileextensions nehmen
		var t = getTreeItemFilename(a).split("."), fexta = t[t.length-1].toLowerCase();
			t2 = getTreeItemFilename(b).split("."), fextb = t2[t2.length-1].toLowerCase();

		return fileSorting(t, t2, fexta, fextb);
	});

	//Elemente verschieben
	for(var i = 0; i < aContElm.length; i++) {
		if(!i)
			$(aContElm[i]).prependTo(cont);
		else
			$(aContElm[i]).insertAfter(cont.children("li:nth-child("+(i)+")"));
	}
	//Containerposition korrigieren
	for(var i = 0; i < aContElm.length; i++)
		getTreeCntById(getTreeObjId(aContElm[i])).insertAfter(aContElm[i]);

	return true;
}

function getTreeItemFilename(obj) {
	if($(obj).hasClass("workenvironment"))
		return $(obj).attr("workpath").split("/").pop();
	return $(obj).attr("filename");
}

/*-- Löschen --*/

function removeTreeEntry(obj, forced, ignoreFile) {
	if(!$(obj)[0])
		return;

	var f = _sc.file(_sc.workpath(obj)+getTreeObjPath(obj));
	if(f.exists()) {
		//Hauptverzeichnis nicht löschen
		if(formatPath(f.path) == _sc.workpath(obj) && !forced) {
			//Dialog oeffnen
			var dlg = new WDialog("$DlgDeleteConfirmation$", "DEX", { modal: true, css: { "width": "450px" }, btnright: [{ label: "$DlgBtnDelete$",
				onclick: function(e, btn, dialog) {
					getWorkEnvironmentByPath(_sc.workpath(obj)).unload();
					removeTreeEntry(obj, true);
					dialog.hide();
				}
			},{ label: "$DlgBtnUnload$",
				onclick: function(e, btn, dialog) {
					getWorkEnvironmentByPath(_sc.workpath(obj)).unload();
					removeTreeEntry(obj, true, true);
					dialog.hide();
				}
			}, "cancel"]});
			dlg.setContent(sprintf(Locale('<hbox><description style="width: 450px;">$DlgDeleteConfirmationDesc$</description></hbox>'), formatPath(f.path).split("/").pop()));
			dlg.show();
			dlg = 0;
			return;
		}

		if(!ignoreFile)
			f.remove(true);
	}

	var cnt, obj_container;
	obj_container = $(obj).parent();
	
	var selection_index = getTreeEntryIndex(obj);
	if(!$(obj).next()[0])
		selection_index--;

	if(cnt = getTreeCntById(getTreeObjId(obj)))
		$(cnt).remove();

	$(obj).remove();
	
	//Element darunter auswaehlen
	if($(obj_container).find("li")[0])
		selectTreeItem(getTreeEntryByIndex(selection_index));
	//Alternativ vorherigen Container auswaehlen
	else
		selectTreeItem(getTreeObjById(getTreeObjId(obj_container)));

	//Remove-Callback
	onTreeObjRemove(obj_container);
	
	return true;
}

/*-- Umbenennen --*/

function renameTreeObj(obj) {
	$(obj).children("description").css("display", "none");
	var filename = obj.attr("filename"), t;
	if(!filename && obj.attr("workpath"))
		filename = obj.attr("workpath").split("/").pop();

	if(!filename)
		return;

	t = filename.split(".");
	if(t.length > 1)
		t.pop();
	t = t.join(".");
	$(obj).css("text-overflow", "unset");
	$(obj).append('<textbox id="edit-filename" class="el-rename-input" value="'+filename+'" focused="true" />');

	$("#edit-filename")[0].setSelectionRange(0, t.length);

	var drag = $(obj).attr("draggable");
	if(drag)
		$(obj).attr("draggable", "false");

	$("#edit-filename").blur(function(e) {
		var val = $(this).val(), r;
		if(val && val.length > 0) {
			if((r = onTreeObjRename(obj, val)) > 0) {
				$(obj).children("description").text(val);
				if($(obj).hasClass("workenvironment"))
					$(obj).attr("workpath", $(obj).attr("workpath").replace(/\/[^/]+$/, "/"+val));
				else
					$(obj).attr("filename", val);
			}
			else if(r == -1)
				$(obj).children("description").text(filename);
		}

		if(drag)
			$(obj).attr("draggable", "true");
		$(obj).css("text-overflow", "");
		$(obj).children("description").css("display", "initial");
		$("#edit-filename").remove();

		var filepath = _sc.workpath(obj) + getTreeObjPath(obj);
		var file = _sc.file(filepath);
		var t = file.leafName.split("."), fext = t[t.length-1];
		if(!obj.hasClass("workenvironment")) {
			var img = "chrome://windmill/content/img/icon-fileext-other.png";
			if(file.isDirectory())
				img = "chrome://windmill/content/img/icon-directory.png";

			for(var p in specialData) {
				var d = specialData[p];

				if(d.ext == fext && d.img.length) {
					img = d.img;
					break;
				}
			}

			$(obj).find("image").attr("src", img);
		}

		sortTreeContainerElements($(obj).parent());
	});
	$("#edit-filename").keypress(function(e) {
		if(e.which == 13) {
			e.preventDefault();
			$(this).trigger('blur');
		}
	});
	$("#edit-filename").focus();

	return true;
}

/*-- Starten --*/

function handleTreeEntry(obj, open_sidedeck) {
	var t = getTreeItemFilename(obj).split("."), fext = t[t.length-1].toLowerCase(); 
	var filepath = _sc.workpath(obj) + getTreeObjPath(obj), file = _sc.file(filepath);
	
	if(!file.exists())
		return;
	
	//Files behandeln je nach Fileextension
	switch(fext) {
		case "ocs": //Szenarien starten
			var args = getOCStartArguments(formatPath(filepath));
			if(args == -1)
				return;
			
			var name = "openclonk";
			if(OS_TARGET == "WINNT")
				name = "openclonk.exe";

			var f = _sc.file(_sc.clonkpath() + "/" + name);
			var process = _ws.pr(f);
			process.create(args);
			break;
		
		default:
			parent.openFileInDeck(file, open_sidedeck);
			break;
	}
	
	return true;
}

/*-- Suche --*/

function searchTreeEntry(chr) {
	//Alle li-Elemente sammeln
	var elements = $("li:visible:not(.no-selection)", MAINTREE_OBJ);
	var sel = getCurrentTreeSelection();
	var celm = elements.filter('[name^="'+String.fromCharCode(chr).toLowerCase()+'"]').not($(sel));
	
	//Ausgewähltes Element suchen
	var pos = elements.index(sel);
	var cpos = pos+elements.length;
	celm.each(function() {
		var p = elements.index(this);
		if(p < pos)
			p += elements.length;
		
		if(p < cpos) {
			cpos = p;
			sel = this;
		}
	});
	
	selectTreeItem($(sel));
	
	return true;
}

/*-- Auf-/Zuklappen --*/

function treeExpand(obj, no_calls) {
	if(!$(obj).hasClass("tree-collapsed"))
		return;
	
	toggleOpenState(obj, no_calls);
	return true;
}

function treeCollapse(obj, no_calls) {
	if(!$(obj).hasClass("tree-expanded"))
		return;
	
	toggleOpenState(obj, no_calls);
	return true;
}

function toggleOpenState(obj, no_calls) {
	var id = getTreeObjId(obj);
	var listitem = getTreeObjById(id);
	var container = getTreeCntById(id);
	
	//Aufklappen
	if(container.hasClass("tree-collapsed")) {
		if(!no_calls)
			onTreeExpand(container, listitem);

		container.removeClass("tree-collapsed").addClass("tree-expanded");
		listitem.removeClass("tree-collapsed").addClass("tree-expanded");
	}
	//Zuklappen
	else if(container.hasClass("tree-expanded")) {
		if(!no_calls)
			onTreeCollapse(container, listitem);

		container.removeClass("tree-expanded").addClass("tree-collapsed");
		listitem.removeClass("tree-expanded").addClass("tree-collapsed");
	}
	
	return true;
}