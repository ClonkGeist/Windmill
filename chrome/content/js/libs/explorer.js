
hook("load", function() {
	//Tree initalisieren
	setupMaintree($("#maintree"));

	let promise = OS.File.stat(getClonkExecutablePath());
	promise.then(function(info) {
		if(info.isDir) {
			$("#filecontainer").text("An error occurred while loading: File not found.");
			return;
		}

		$("#filecontainer").append(Locale("<label id='msg-loading' value='$loading$' />"));
		lockModule("$loading$");

		if(initializeContextMenu)
			initializeContextMenu();

		bindKeyToObj(new KeyBinding("FullRefresh", "Ctrl-F5", function() {
			$(MAINTREE_OBJ).empty();

			initializeDirectory();
		}, 0, "DEX"), document);
		bindKeyToObj(new KeyBinding("Refresh", "F5", function() {
			if(window.onExplorerRefresh)
				if(window.onExplorerRefresh())
					return;

			$(MAINTREE_OBJ).empty();

			initializeDirectory();
		}, 0, "DEX"), document);
		bindKeyToObj(new KeyBinding("Search", "F3", function() {
			if($("#searchinput")[0]) {
				$("#searchinput").removeClass("hidden").focus();
				$("#searchinput")[0].setSelectionRange(0, $("#searchinput").val().length);
			}
		}, 0, "DEX"), MAINTREE_OBJ);

		if($("#searchinput")[0])
			bindKeyToObj(new KeyBinding("__startsearch", "ENTER", function() {
				var text = $("#searchinput").val();
				searchFile(text);
			}, 0, 0, {no_customization: true}), $("#searchinput"));

		explorerLoadWorkEnvironments();
	}, function(reason) {
		$("#filecontainer").text("An error occured while loading: " + reason);
		return;
	});

	let dragstep;
	$(document).on("dragover", function(e) {
		e = e.originalEvent;
		let start = dragstep;

		if(e.clientY < 150)
			dragstep = -5;
		else if(e.clientY > $(window).height()-150)
			dragstep = 5;
		else
			dragstep = 0;

		function scrollDraggableElement() {
			let scrolltop = $(MAINTREE_OBJ).parent().scrollTop();
			$(MAINTREE_OBJ).parent().scrollTop(scrolltop+dragstep);
			if(dragstep)
				window.requestAnimationFrame(scrollDraggableElement);
		}

		if(!start)
			scrollDraggableElement();
	});
	//Mousemove wird nur aufgerufen wenn kein Dragevent aktiv ist
	$(document).mousemove(function(e) {
		dragstep = 0;
	});

	return true;
});

let explorer_search_info = {};

function searchFile(searchstr, workpath) {
	var lastmatch = $(".last-search-match");
	if(!workpath) {
		var wp = getWorkEnvironmentByPath(_sc.workpath(lastmatch)), workenvs = getWorkEnvironments();
		var index = 0;
		if(wp)
			index = workenvs.indexOf(wp);

		for(var retv; index < workenvs.length; index++) {
			if(retv = searchFile(searchstr, workenvs[index])) {
				if(retv == -1)
					return;
				var treeobj = navigateToPath(retv.path, true);
				$(treeobj).addClass(".last-search-match");
				explorer_search_info = {searchstr, path: retv.path};
			}
		}
	}
	else {
		
		warn("Die Suche ist noch nicht voll integriert.");
		return -1;
	}
}

function navigateToPath(path, open_and_select) {
	let fullpath = path;
	path = path.replace(_sc.workpath(path) + "/", "");
	var branches = path.split("/");

	//Ggf. leeres Endelement rausnehmen (wenn der Path auf '/' endet. Wird dann am Ende auch geoeffnet)
	var open_last_branch = false;
	if(!branches[branches.length-1]) {
		open_last_branch = true;
		branches.pop();
	}

	let obj = MAINTREE_OBJ;
	//Branches einzelnd durchgehen und TreeObj suchen
	return Task.spawn(function*() {
		if(!(yield OS.File.exists(fullpath)))
			throw "File not found";
		for(var i = 0; i < branches.length; i++) {
			//Gegebenenfalls Ordnerinhalte laden die noch nicht geladen sind.
			if(!$(obj).find("li")[0])
				yield loadDirectory(_sc.workpath(obj)+getTreeObjPath(obj), obj);

			//Checken ob Branch existiert
			obj = $(obj).find("li[filename='"+branches[i]+"']");
			if(!obj[0])
				return;

			//Naechsten Container auswaehlen
			if(i+1 < branches.length)
				obj = getTreeCntById(getTreeObjId(obj));
		}

		//Gegebenenfalls oeffnen und auswaehlen
		if(open_and_select) {
			setTimeout(function() {
				selectTreeItem(obj, true);
				if(open_last_branch)
					treeExpand(obj);
			}, 10);
		}
	});
}

function PrepareDirectory(path, call) {
	//c4group & openclonk suchen
	let c4group, openclonk;

	let nodir = false, noc4group = false, noopenclonk = false;
	if(!_sc.clonkpath()) {
		noopenclonk = true;
	}
	else {
		openclonk = _sc.file(getClonkExecutablePath());
		if(!openclonk.exists() || !openclonk.isExecutable())
			noopenclonk = true;
	}
	if(!getConfigData("Global", "C4GroupPath") && !_sc.clonkpath())
		noc4group = true;
	else {
		c4group = _sc.file(getC4GroupPath());
		if(!c4group.exists() || !c4group.isExecutable())
			noc4group = true;
	}
	if(!path)
		nodir = true;
	else {
		var dir = _sc.file(path);
		if(!dir.exists())
			nodir = true;
	}

	if(noopenclonk || noc4group || nodir) {
		if(!getConfigData("CIDE", "DirsNotFoundDlg")) {
			addConfigString("CIDE", "DirsNotFoundDlg", true, "boolean", { runTimeOnly: true });
			//Dialog oeffnen
			var dlg = new WDialog("$DlgErrMissingDirectoryInfo$", "DEX", { modal: true, css: { "width": "450px" }, btnright: ["accept"]});

			var content = "<hbox><description>$DlgErrMissingDirectoryInfoDesc$</description></hbox>";
			if(noopenclonk)
				content += "<hbox><description style='margin-top: 1em'>$DlgErrMissingClonkDirDesc$</description></hbox>";
			if(noc4group)
				content += "<hbox><description style='margin-top: 1em'>$DlgErrMissingC4GroupFileDesc$</description></hbox>";
			if(nodir)
				content += "<hbox><description style='margin-top: 1em'>$DlgErrMissingWEDirDesc$</description></hbox>";

			dlg.setContent(content);
			dlg.show();
			dlg = 0;
		}
		return;
	}

	//Verzeichnis durchsuchen
	var entries = dir.directoryEntries;
	PrepareDirectory2(c4group, path, entries, call);

	return true;
}

function PrepareDirectory2(c4group, path, entries, call) {
	var runp = false;

	if(!entries.hasMoreElements())
		if(typeof call == "function")
			return call();

	while(entries.hasMoreElements()) {
		var entry = entries.getNext().QueryInterface(Ci.nsIFile);
		var t = entry.leafName.split("."), fext = t[t.length-1];
		var extensions = ["ocd", "ocg", "ocf", "ocs", "ocp"];

		//Nicht-Groupdateien aussortieren
		if(extensions.indexOf(fext) == -1)
			continue;

		if(entry.isDirectory())
			continue;

		//Falls gefunden, entpacken.
		var process = _ws.pr(c4group);
		if(OS_TARGET == "WINNT")
			var args = [path.replace(/\//, "\\")+"\\"+entry.leafName, "-x"];
		else
			var args = [path+"/"+entry.leafName, "-x"];
		lockModule("<hbox>$loading$</hbox><hbox>Exploding " + entry.leafName + "</hbox>");
		process.create(args, 0x1, function() {
			PrepareDirectory2(c4group, path, entries, call);
		});
		runp = true;
		break;
	}

	if(!runp)
		if(typeof call == "function")
			return call();

	return true;
}

function fileSorting(t, t2, fexta, fextb) {
	//Directories immer nach oben
	if(t.length == 1 && fextb)
		return -1;
	else if(t2.length == 1 && fexta)
		return +1;
	//Sortierung unter Directories
	else if(!fexta && !fextb)
	{
		if(a < b) { return -1; }
		else if(a > b) { return +1; }
		else { return 0; }
	}
	
	//Sortierung nach Fileextensions
	var prioa = getFileExtensionPriority(fexta), priob = getFileExtensionPriority(fextb);
	
	//Unterstützte Dateiformate nach oben
	if((prioa != -1 || priob != -1) && prioa != priob) {
		if(prioa == -1 && priob > -1) { return +1; }
		else if(priob == -1 && prioa > -1) { return -1; }
		else if(prioa < priob) { return -1; }
		else if(prioa > priob) { return +1; }
		else { return 0; }
	}
	
	var fna = t.join(".").toLowerCase(), fnb = t2.join(".").toLowerCase();

	if(fna < fnb) { return -1; }
	else if(fna > fnb) {return +1;}
	else { return 0; }
}

function loadDirectory(path, parentobj, autosearch_parent, no_async, blacklist) {
	if(!parentobj)
		parentobj = MAINTREE_OBJ;
	
	if(autosearch_parent) {
		var parentpath = path.replace(_sc.workpath(path)+"/", "");
		while(parentpath) {
			if(OS_TARGET == "WINNT")
				var nextfilename = parentpath.match(/(.+?)\\/);
			else
				var nextfilename = parentpath.match(/(.+?)\/+/);

			if(nextfilename) {
				parentpath = parentpath.replace(nextfilename[1]+"/", "");
				if($(parentobj).children("li[filename='"+nextfilename[1]+"']")) {
					var cnt = getTreeCntById(getTreeObjId($(parentobj).children("li[filename='"+nextfilename[1]+"']")));

					//Sollte kein Container sein/der Container noch nicht geladen sein, abbrechen
					if(!$(cnt)[0] || !$(cnt).find("li")[0])
						return false;
					
					parentobj = $(cnt)[0];
				}
			}
			else
				break;
		}
		
		if(!$(parentobj).find("li")[0])
			return false;
		
		$(parentobj).empty();
	}

	function processEntryList(aDirEntries) {
		//Array sortieren
		aDirEntries.sort(function(a,b) {
			//Fileextensions nehmen
			var t = a.leafName.split("."), fexta = t[t.length-1].toLowerCase();
				t2 = b.leafName.split("."), fextb = t2[t2.length-1].toLowerCase();
			
			return fileSorting(t, t2, fexta, fextb);
		});

		return Task.spawn(function*() {
			var tree_element_added = false;

			//Arrayelemente verarbeiten
			for(var i = 0; i < aDirEntries.length; i++) {
				var entry = aDirEntries[i], container = false;

				//TODO: Fileextensions verarbeiten und ggf. Informationen zwischenspeichern fE Previews

				if(yield addFileTreeEntry(entry, parentobj)) {
					//Leerer-Ordner-Eintrag verhindern
					tree_element_added = true
				}
			}

			//Ggf. Pseudoelement fuer leeren Ordner erzeugen
			if(!tree_element_added)
				createEmptyTemplate(parentobj);
		});
	}
	
	if($(parentobj).hasClass("tree-loadcontainer"))
		return;

	/* Da processEntryList und addFileTreeEntry auch nicht mehr asynchron sind, ist no_async auch nicht mehr 
	 * voll synchron, garantiert also nicht das dass Verzeichnis komplett geladen/angezeigt ist nach Abschluss.
	 * Daher moeglichst die asynchrone Funktion mittels Tasks/Promises nutzen.
	 */
	if(no_async) {
		var f = _sc.file(path);
		if(autosearch_parent && f.parent)
			f = f.parent;

		if(!f.exists() || !f.isDirectory())
			return;
		//Verzeichniselemente in Array einlesen
		var entries = f.directoryEntries, aDirEntries = [];
		while(entries.hasMoreElements()) {
			var entry = entries.getNext().QueryInterface(Ci.nsIFile), container = false;
			aDirEntries[aDirEntries.length] = entry;
		}

		processEntryList(aDirEntries);
	}
	else {
		$(parentobj).addClass("tree-loadcontainer");
		let task = Task.spawn(function*() {
			//Ladetemplate
			createTreeElement(parentobj, "&lt;...&gt;", false, false, "", "", "treeitem-loading", { noSelection: false });
			if(autosearch_parent) {
				let splitpath = formatPath(path).split("/");
				splitpath.pop();
				path = splitpath.join("/");
			}
			let iterator = new OS.File.DirectoryIterator(path), subentries = [], entry;
			while(true) {
				try { entry = yield iterator.next(); } catch(e) {
					if(e != StopIteration)
						throw e;

					break;
				}
				if(blacklist && blacklist.indexOf(entry.name) != -1)
					continue;

				//Ins nsIFile-Format uebersetzen
				entry.leafName = entry.name;
				entry.isDirectory = function() { return this.isDir };
				subentries.push(entry);
			}

			iterator.close();
			yield processEntryList(subentries);

			//Ladetemplate loeschen
			let select_first_item;
			if($(parentobj).find(".treeitem-loading.tree-selected")[0])
				select_first_item = true;
			$(parentobj).find(".treeitem-loading").remove();
			if(select_first_item)
				selectTreeItem($(parentobj).children("li:not(.no-selection)")[0]);
			$(parentobj).removeClass("tree-loadcontainer");
		});
		task.then(null, function(reason) {
			$(parentobj).removeClass("tree-loadcontainer");
			log("An error occured while trying to load the directory:");
			log(reason);
		});
		
		return task;
	}
	return true;
}

function FilenameBlacklist() { return [".git"] }

function addFileTreeEntry(entry, parentobj, sort_container) {
	if(FilenameBlacklist().indexOf(entry.leafName) != -1 && getConfigData("CIDE", "HideUnsupportedFiles"))
		return;

	//Fileextensions
	var t = entry.leafName.split("."), fext = t[t.length-1].toLowerCase(), fSpecial = false;
	var container = false;
	if(hideFileExtension(fext))
		return false;

	let task = Task.spawn(function*() {
		let {title, icon, special, index, additional_data} = yield getTreeEntryData(entry, fext)||{};
		let classes = "";
		if(!title)
			title = entry.leafName;

		if(!icon) {
			for(var p in specialData) {
				var d = specialData[p];

				if(d.ext == fext && d.img.length) {
					icon = d.img;
					fSpecial = true;
					break;
				}
			}
		}

		if(entry.isDirectory()) {
			container = true;
			
			//Standard Ordnericon verwenden
			if(!fSpecial && !icon)
				icon = "chrome://windmill/content/img/icon-directory.png";
		}
		else if(getConfigData("CIDE", "HideUnsupportedFiles") && !fSpecial)
			return false;
		else if(OCGRP_FILEEXTENSIONS.indexOf(fext) != -1)
			classes += "tree-groupfile-packed ";

		if(noContainer(fext))
			container = false;

		if(!icon)
			icon = "chrome://windmill/content/img/icon-fileext-other.png";

		if(index === undefined || isNaN(index))
			index = -1;
		//Baumelement erzeugen
		createTreeElement(parentobj, title, container, 0, icon, entry.leafName, special, {noSelection: !!special, index, additional_data, classes});
		if(sort_container)
			sortTreeContainerElements(parentobj);
		return true;
	});
	
	return task;
}

function getFileExtensionPriority(extension) {
	var rv = -1;
	for(var priority in specialData) {
		if(specialData[priority].ext == extension) {
			rv = parseInt(priority);
			break;
		}
	}
	
	return rv;
}

function createEmptyTemplate(container) {
	createTreeElement(container, Locale("$treeelm_container_empty$"), false, false, false, false, "treeelm-container-empty");
	
	return true;
}

function onTreeObjRemove(obj_container) {
	if(!obj_container.find("li")[0])
		createEmptyTemplate(obj_container);
	
	return true;
}

var treeitemID = 1;