
var TREE_ELM_ID = 0, MAINTREE_OBJ;

var workpathov = _sc.workpath;

_sc.workpath = function(treeobj) {
	if(treeobj === undefined)
		treeobj = getCurrentTreeSelection();

	if(typeof treeobj == "object" && $(treeobj).hasClass("treeobj")) {
		if($(treeobj).hasClass("workenvironment"))
			return $(treeobj).attr("workpath");
		treeobj = $(treeobj).parents(".workenvironment").first().attr("workpath");
	}

	return workpathov(treeobj);
}

function noDragDropItem() {}

function createTreeElement(tree, label, container, open, img, filename, special, options = { noSelection: !!special, index: -1 }) {
	if(img)
		var imgTag = '<image src="'+img+'" width="16" height="16" xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul" /> ';
	else
		var imgTag = "";

	var drag = ' draggable="true"';
	if(noDragDropItem(label) || special && !options.isDraggable)
		drag = "";

	if(filename)
		filename = ' filename="'+filename+'"';
	else
		filename = '';
	
	$(tree).append(`<li id="treeelm-${TREE_ELM_ID}" tabindex="0" name="${label.toLowerCase()}" data-index='${options.index}'
		class="treeobj treeelm${container?' treecontainer':''} ${special}" xmlns="http://www.w3.org/1999/xhtml"
		${drag}${filename}>${imgTag} <description>${label}</description></li>`);
	var elm = $("#treeelm-"+TREE_ELM_ID)[0];
	if(options.additional_data)
		$(elm).attr(options.additional_data);
	if(options.index != -1) {
		//&& $(tree).children("li")[options.index])
		let indexed_elements = $(tree).children("li[data-index!='-1']"), inserted;
		//let indices = $(indexed_elements).map(function() { return parseInt($(this).attr("data-index")); });
		for(var i = 0; i < indexed_elements.length; i++) {
			if(parseInt($(indexed_elements[i]).attr("data-index")) > options.index) {
				$(elm).insertBefore(indexed_elements[i]);
				inserted = true;
				break;
			}
		}
		if(!inserted) { 
			if(indexed_elements.length) {
				let lastelm = indexed_elements[indexed_elements.length-1];
				if(getTreeCntById(getTreeObjId(lastelm)))
					lastelm = getTreeCntById(getTreeObjId(lastelm));
				$(elm).insertAfter(lastelm);
			}
			else if($(tree).children("li[data-index='-1']").length)
				$(elm).insertBefore($(tree).children("li[data-index='-1']")[0]);
			else
				$(elm).appendTo(tree);
		}
	}
	if(container)
		$('<ul id="treecnt-'+TREE_ELM_ID+'" class="treeobj treecnt '+special+'" xmlns="http://www.w3.org/1999/xhtml"></ul>').insertAfter(elm);
	if(!special)
		$(tree).children(".treeelm-container-empty").remove();
	var cnt = $("#treecnt-"+TREE_ELM_ID)[0];
	
	if(!elm)
		return log("Tree error: Tree element with id " + TREE_ELM_ID + " (label: " + label + ") was not created.", true);
		
	if(options.noSelection)
		$(elm).addClass("no-selection");

	if(!open && container) {
		$(cnt).addClass("tree-collapsed");
		$(elm).addClass("tree-collapsed");
	}

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
		let path = _sc.workpath(elm) + getTreeObjPath(elm);

		Task.spawn(function*() {
			for(var i = 0; i < files.length; i++) {
				let f = files[i];
				//Datei befindet sich in anderem Laufwerk? Dann moveTo, ansonsten renameTo
				yield OSFileRecursive(f.path, path+"/"+f.leafName, null, "move");
				
				//Callback wenn Container schon Inhalte hat
				if($(cnt).children("li")[0]) {
					onTreeFileDragDrop(cnt, _sc.file(path+"/"+f.leafName));
					sortTreeContainerElements(cnt);
				}
			}
		});
		
	});

	let dropfn = function(e) {
		var data = parseInt(e.dataTransfer.getData("text/cideexplorer"));
		var d_obj = getTreeObjById(data), d_cnt = getTreeCntById(data); //data_object
		var e_id = -1; //destination

		//DragDrop von ausserhalb?
		if(!d_obj[0])
			return;

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

		var containerloaded = !!getTreeCntById(e_id).children("li")[0], fname = d_path.split("/").pop();
		e_path += "/"+fname;

		//Container öffnen
		if(e_id >= 0)
			treeExpand(getTreeCntById(e_id));
		
		//Bei Druck der Steuerungstaste kopieren
		if(e.ctrlKey || getConfigData("Explorer", "CopyOnDragDrop")) {
			var t = fname.split("."), fext = "."+t[t.length-1];
			t.pop();
			if(t.length)
				var nofext = t.join(".");
			else {
				var nofext = fname;
				fext = "";
			} 

			lockModule();
			let fpath;
			let task = Task.spawn(function*() {
				fpath = (yield OSFileRecursive(d_path, e_path)).path;
			});
			task.then(function() {
				var img = $(d_obj).find("image").attr("src");
				var cont;
				
				if(e_id >= 0)
					cont = getTreeCntById(e_id);
				else
					cont = MAINTREE_OBJ;
				
				fname = fpath.split("/").pop();
				if(containerloaded)
					createTreeElement(cont, fname, !!d_cnt[0], false, img, fname);
				sortTreeContainerElements(cont);
				unlockModule();
			}, function(reason) {
				EventInfo("An error occured while trying to copy the file.");
				log(reason);
				unlockModule();
			});
		}
		else {
			//Datei verschieben
			let promise = OSFileRecursive(d_path, e_path, null, "move");
			lockModule();
			promise.then(function(result) {
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
				$(d_obj).find("description").text(result.path.split("/").pop());
				unlockModule();
			}, function(reason) {
				EventInfo("An error occured while trying to move the file.");
				log(reason);
				unlockModule();
			});

		}
		
		return;
	}

	var id = TREE_ELM_ID;
	if(special && special.search(/workenvironment/) != -1) {
		//Drag and Drop
		if(options.isDraggable) {
			elm.addEventListener("dragstart", function(e) {
				//Ggf. Fileinformationen mitreinpasten für Drag außerhalb der Application
				e.dataTransfer.setData('text/cideexplorer', id);
				e.dataTransfer.mozSetDataAt('application/x-moz-file', _sc.file(_sc.workpath(elm)), 0);
				e.dataTransfer.setData("text/uri-list", _sc.workpath(elm));

				e.dataTransfer.effectAllowed = "copyMove";
				e.dataTransfer.dropEffect = "copy";
			});
		}
		$([elm, cnt]).on("drop", function(e) {
			let data = parseInt(e.originalEvent.dataTransfer.getData("text/cideexplorer"));
			let d_obj = getTreeObjById(data), d_cnt = getTreeCntById(data); //data_object
			if(!d_obj.hasClass("workenvironment"))
				return dropfn(e.originalEvent);
			if($(this).siblings().index(d_obj) == -1)
				return;

			$([d_obj[0], d_cnt[0]]).insertAfter(cnt);
			let parent = $(this).parent()[0];
			for(var i = 0; i < $(parent).children("li.workenvironment").length; i++) {
				let we_elm = $(parent).children("li.workenvironment")[i];
				let workenv = getWorkEnvironmentByPath(_sc.workpath(we_elm));
				workenv.index = $(parent).children("li").index(we_elm);
				workenv.saveHeader();
			}
		});
	}
	else {
		//Drag and Drop
		if(drag) {
			elm.addEventListener("dragstart", function(e) {
				//Ggf. Fileinformationen mitreinpasten für Drag außerhalb der Application
				e.dataTransfer.setData('text/cideexplorer', id);
				e.dataTransfer.mozSetDataAt('application/x-moz-file', _sc.file(_sc.workpath(elm)+getTreeObjPath(elm)), 0);
				e.dataTransfer.setData("text/uri-list", _sc.workpath(elm)+getTreeObjPath(elm));

				e.dataTransfer.effectAllowed = "copyMove";
				e.dataTransfer.dropEffect = "copy"; //Damit Objekte auch ins Enginefenster reingezogen werden können
			});
		}
		elm.addEventListener("drop", dropfn);
		elm.addEventListener("dragend", function(e) {

		});
	}

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

function getTreeObjById(id) { return $("#treeelm-"+id); }
function getTreeCntById(id) { return $("#treecnt-"+id); }
function getTreeObjId(obj) { return parseInt($(obj).attr("id").replace(/.+-/, "")); }
function getCurrentTreeSelection() { return $(".tree-selected", MAINTREE_OBJ)[0]; }

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

	if($(obj)[0]) {
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
	if($(obj).hasClass("no-selection"))
		return;

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
	if(cont.children("li")[0])
		//Tree-Eintrag erzeugen
		addFileTreeEntry(copiedFile, cont, true);

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
	
	aContElm = $(cont).children("li:not(.no-selection)").toArray();
	aContElm.sort(function(a,b) {
		if($(a).hasClass("workenvironment") && !$(b).hasClass("workenvironment"))
			return -1;
		if(!$(a).hasClass("workenvironment") && $(b).hasClass("workenvironment"))
			return +1;
		if($(a).hasClass("workenvironment") && $(b).hasClass("workenvironment")) {
			let we_a = getWorkEnvironmentByPath(_sc.workpath(a)), we_b = getWorkEnvironmentByPath(_sc.workpath(b));
			if(we_a.index < we_b.index)
				return -1;
			else if(we_a.index > we_b.index)
				return +1;
			return 0;
		}

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

	if(getWorkEnvironmentByPath(_sc.workpath(obj)) && getWorkEnvironmentByPath(_sc.workpath(obj)).options.rejectDeletion) {
		EventInfo("Deletion rejected");
		return;
	}

	let task = Task.spawn(function*() {
		if(ignoreFile)
			return;

		let path = _sc.workpath(obj)+getTreeObjPath(obj);
		let info;
		try { info = yield OS.File.stat(path); }
		catch(e) {
			if(e.becauseNoSuchFile)
				return;
		}

		//Hauptverzeichnis nicht löschen
		if(formatPath(path) == _sc.workpath(obj) && !forced) {
			//Dialog oeffnen
			var dlg = new WDialog("$DlgDeleteConfirmation$", "DEX", { modal: true, css: { "width": "450px" }, btnright: [{ label: "$DlgBtnDelete$",
				onclick: function*(e, btn, dialog) {
					getWorkEnvironmentByPath(_sc.workpath(obj)).unload();
					yield removeTreeEntry(obj, true);
					dialog.hide();
				}
			},{ label: "$DlgBtnUnload$",
				onclick: function*(e, btn, dialog) {
					getWorkEnvironmentByPath(_sc.workpath(obj)).unload();
					yield removeTreeEntry(obj, true, true);
					dialog.hide();
				}
			}, "cancel"]});
			dlg.setContent(sprintf(Locale('<hbox><description style="width: 450px;">$DlgDeleteConfirmationDesc$</description></hbox>'), formatPath(path).split("/").pop()));
			dlg.show();
			dlg = 0;
			return -1;
		}

		if(info.isDir) 
			yield OS.File.removeDir(path);
		else
			yield OS.File.remove(path);
	});
	task.then(function(ignore) {
		if(ignore)
			return;
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
	}, function(reason) {
		EventInfo("An error occured while trying to remove the file.");
		log(reason);
	});
	return task;
}

/*-- Umbenennen --*/

function renameTreeObj(obj) {
	if(getWorkEnvironmentByPath(_sc.workpath(obj)).options.rejectRename) {
		EventInfo("Rename rejected");
		return;
	}

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
		function restoreEntry() {			
			$("#edit-filename").remove();
			if(drag)
				$(obj).attr("draggable", "true");
			$(obj).css("text-overflow", "");
			$(obj).children("description").css("display", "");
			selectTreeItem(obj);
		}

		let val = $(this).val();

		if(!val || !val.length || val == filename)
			return restoreEntry();

		//Source und Destination festlegen
		let source = formatPath(_sc.workpath(obj)+getTreeObjPath(obj));
		let splitpath = source.split("/");
		splitpath.pop();
		splitpath.push(val);
		let destpath = splitpath.join("/");

		//Task zum Umbenennen
		Task.spawn(function*() {
			if(!val || !val.length)
				throw -1;

			//Fuer Ordner rekursiv mit Errorthrowing bei Overwrite
			yield OSFileRecursive(source, destpath, null, "move", 2);

			let env;
			if($(obj).hasClass("workenvironment") && (env = getWorkEnvironmentByPath($(obj).attr("workpath"))))
				env.path = destpath;

			return yield OS.File.stat(destpath);
		}).then(function(info) {
			restoreEntry();
			$(obj).children("description").text(val);
			if($(obj).hasClass("workenvironment"))
				$(obj).attr("workpath", $(obj).attr("workpath").replace(/\/[^/]+$/, "/"+val));
			else
				$(obj).attr("filename", val);

			if(!obj.hasClass("workenvironment")) {
				let img = "chrome://windmill/content/img/icon-fileext-other.png";
				if(info.isDir)
					img = "chrome://windmill/content/img/icon-directory.png";

				let fext = val.split(".").pop();
				for(var p in specialData) {
					let d = specialData[p];

					if(d.ext == fext && d.img.length) {
						img = d.img;
						break;
					}
				}

				$(obj).find("image").attr("src", img);
			}

			sortTreeContainerElements($(obj).parent());
		}, function(reason) {
			EventInfo("An error occured while trying to rename the file");
			log(reason);

			restoreEntry();
			$(obj).children("description").text(filename);
		});
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
			let args = getOCStartArguments(formatPath(filepath), true);
			if(args == -1)
				return;

			var f = _sc.file(getClonkExecutablePath());
			var process = _ws.pr(f);
			process.create(args, 0, 0, function(data) {
				log(data);
			});
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