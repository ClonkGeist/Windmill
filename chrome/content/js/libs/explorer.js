
hook("load", function() {
	//Tree initalisieren
	setupMaintree($("#maintree"));

	var f = _sc.file(_sc.clonkpath());

	//Clonkpfad existiert nicht?
	if(!f.exists() || !f.isDirectory()) {
		$("#filecontainer").text(Locale("$err_path_not_found$"));
		return;
	}

	//Alternative Executabledatei
	var name = getConfigData("Global", "AlternativeApp");
	if(!name) {
		if(OS_TARGET == "WINNT")
			name = "openclonk.exe";
		else
			name = "openclonk";
	}
	var clonkexe = _sc.file(_sc.clonkpath() + "/" + name);

	//openclonk.exe wurde nicht gefunden?
	if(!clonkexe.exists() || !clonkexe.isExecutable()) {
		$("#filecontainer").text(name + " was not found.");
		return;
	}

	$("#filecontainer").append(Locale("<label id='msg-loading' value='$loading$' />"));
	lockModule("$loading$");

	if(initializeContextMenu)
		initializeContextMenu();

	bindKeyToObj(new KeyBinding("Refresh", "F5", function() {
		$(MAINTREE_OBJ).empty();

		initializeDirectory();
	}, 0, "DEX"), MAINTREE_OBJ);
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

	return true;
});

function searchFile(searchstr, workpath) {
	var lastmatch = $(".last-search-match");
	if(!workpath) {
		var wp = getWorkEnvironmentByPath(_sc.workpath(lastmatch)), workenvs = getWorkEnvironments();
		var index = 0;
		if(wp)
			index = workenvs.indexOf(wp);

		for(var retv; index < workenvs.length; index++) {
			if(retv = searchFile(searchstr, workenvs[index])) {
				if(retv == -1) //HAB DIE MELDUNG SCHON BEIM ERSTEN MAL VERSTANDEN
					return;
				var treeobj = navigateToPath(retv.path, true);
				$(treeobj).addClass(".last-search-match");
			}
		}
	}
	else {
		warn("Die Suche ist noch nicht voll integriert da vorher ein Code Rework anstehen muss.");
		return -1;
	}
}

function navigateToPath(path, open_and_select) {
	path = path.replace(_sc.workpath(path) + "/", "");
	var branches = path.split("/");
	
	//Ggf. leeres Endelement rausnehmen (wenn der Path auf '/' endet. Wird dann am Ende auch geoeffnet)
	var open_last_branch = false;
	if(!branches[branches.length-1]) {
		open_last_branch = true;
		branches.pop();
	}

	var obj = MAINTREE_OBJ;
	//Branches einzelnd durchgehen und TreeObj suchen
	for(var i = 0; i < branches.length; i++) {
		//Gegebenenfalls Ordnerinhalte laden die noch nicht geladen sind.
		if(!$(obj).find("li")[0])
			loadDirectory(_sc.workpath(obj)+getTreeObjPath(obj), obj, false, true);

		//Checken ob Branch existiert
		var obj = $(obj).find("li[filename='"+branches[i]+"']");
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

	return obj;
}

function PrepareDirectory(path, call) {
	//c4group suchen
	var name = "c4group";
	if(OS_TARGET == "WINNT")
		name = "c4group.exe";

	var nodir = false, noc4group = false;
	if(!_sc.clonkpath())
		noc4group = true;
	else {
		var c4group = _sc.file(_sc.clonkpath() + "/" + name);
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
	
	if(noc4group || nodir) {
		if(!getConfigData("CIDE", "DirsNotFoundDlg")) {
			addConfigString("CIDE", "DirsNotFoundDlg", true, "boolean", { runTimeOnly: true });
			//Dialog oeffnen
			var dlg = new WDialog("$DlgErrMissingDirectoryInfo$", "DEX", { modal: true, css: { "width": "450px" }, btnright: ["accept"]});

			var content = "<hbox><description>$DlgErrMissingDirectoryInfoDesc$</description></hbox>";
			if(noc4group)
				content += "<hbox><description style='margin-top: 1em'>$DlgErrMissingClonkDirDesc$</description></hbox>";
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
	
	//Unterst�tzte Dateiformate nach oben
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

function loadDirectory(path, parentobj, autosearch_parent, no_async) {
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

	var f = _sc.file(path);
	if(autosearch_parent && f.parent)
		f = f.parent;

	if(!f.exists() || !f.isDirectory())
		return;

	var showDirectoryEntries = function() {
		//Verzeichniselemente in Array einlesen
		var entries = f.directoryEntries, aDirEntries = [];
		while(entries.hasMoreElements()) {
			var entry = entries.getNext().QueryInterface(Ci.nsIFile), container = false;
			aDirEntries[aDirEntries.length] = entry;
		}
		
		//Array sortieren
		aDirEntries.sort(function(a,b) {
			//Fileextensions nehmen
			var t = a.leafName.split("."), fexta = t[t.length-1].toLowerCase();
				t2 = b.leafName.split("."), fextb = t2[t2.length-1].toLowerCase();
			
			return fileSorting(t, t2, fexta, fextb);
		});
		
		var tree_element_added = false;
		
		//Arrayelemente verarbeiten
		for(var i = 0; i < aDirEntries.length; i++) {
			var entry = aDirEntries[i], container = false;
			
			//TODO: Fileextensions verarbeiten und ggf. Informationen zwischenspeichern f�E Previews
			
			if(addFileTreeEntry(entry, parentobj)) {
				//Leerer-Ordner-Eintrag verhindern
				tree_element_added = true
			}
		}
		
		//Ggf. Pseudoelement fuer leeren Ordner erzeugen
		if(!tree_element_added)
			createEmptyTemplate(parentobj);
		
		//Ladetemplate loeschen
		$(parentobj).find(".treeitem_loading").remove();
	};
	
	if(no_async)
		showDirectoryEntries();
	else {
		//Ladetemplate
		createTreeElement(parentobj, "&lt;...&gt;", false, false, "", "", "treeitem_loading");
		
		setTimeout(showDirectoryEntries, 10);
	}
	return true;
}

function FilenameBlacklist() { return [".git"] }

function addFileTreeEntry(entry, parentobj) {
	if(FilenameBlacklist().indexOf(entry.leafName) != -1 && getConfigData("CIDE", "HideUnsupportedFiles"))
		return;

	//Fileextensions
	var t = entry.leafName.split("."), fext = t[t.length-1].toLowerCase(), fSpecial = false;
	var container = false;

	if(hideFileExtension(fext))
		return false;

	var {title, icon} = getTreeEntryData(entry, fext)||{};
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
	
	if(noContainer(fext))
		container = false;

	if(!icon)
		icon = "chrome://windmill/content/img/icon-fileext-other.png";
	
	//Baumelement erzeugen
	createTreeElement(parentobj, title, container, 0, icon, entry.leafName, 0);
	
	return true;
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
	createTreeElement(container, Locale("$treeelm_container_empty$"), false, false, false, false, "treeelm_container_empty");
	return true;
}

function onTreeObjRemove(obj_container) {
	if(!obj_container.find("li").get(0))
		createEmptyTemplate(obj_container);
	
	return true;
}

var treeitemID = 1;