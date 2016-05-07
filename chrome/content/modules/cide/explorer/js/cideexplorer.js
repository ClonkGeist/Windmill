var treeContextMenu = new ContextMenu(0, 0, MODULE_LPRE, { fnCheckVisibility: treeHideContextItems });
var workenvContextMenu = new ContextMenu(0, 0, MODULE_LPRE, { fnCheckVisibility: workenvHideContextItems });

function initializeDirectory() {
	explorerLoadWorkEnvironments();
}

function createWorkEnvironmentEntry(workenv, first, container = MAINTREE_OBJ) {
	var {type, path, title} = workenv;
	var typeclass = " we-workspace", img = workenv.icon;
	if(type == _mainwindow.WORKENV_TYPE_ClonkPath)
		typeclass = " we-clonkdir";
	if(workenv.options.identifier == "UserData")
		typeclass += " we-userdata";

	var id = createTreeElement(container, title, true, false, img, 0, "workenvironment"+typeclass, { noSelection: false, isDraggable: workenv.options.identifier != "UserData", index: workenv.index });
	$(getTreeCntById(id)).attr("workpath", path);
	$(getTreeObjById(id)).attr("workpath", path);
	sortTreeContainerElements(container);
	if(first)
		treeExpand(getTreeCntById(id), true);

	if(workenv.repository) {
		getAppByID("git").create(["-C", path, "branch"], 0x1, 0, function(data) {
			if(!data || !data.length || data.search(/\w/) == -1)
				return;

			var lines = data.split("\n");
			for(var i = 0; i < lines.length; i++)
				if(lines[i].length)
					if(lines[i][0] == "*") {
						$(getTreeObjById(id)).attr("data-special", " ("+lines[i].substr(2)+")");
						return;
					}
		});
	}

	return id;
}

function explorerLoadWorkEnvironments(parentWorkEnv, container) {
	//Arbeitsumgebungen laden
	var workenvs = _mainwindow.getWorkEnvironments();
	if(parentWorkEnv)
		workenvs = parentWorkEnv.getWorkEnvChildren();

	if(!workenvs || !workenvs.length)
		return;

	let we_namelist = [];
	for(var i = 0, first = !parentWorkEnv; i < workenvs.length; i++) {
		if(!parentWorkEnv && workenvs[i].isChildWorkEnv)
			continue;
		if(parentWorkEnv && workenvs[i].type != _mainwindow.WORKENV_TYPE_Workspace)
			continue;

		we_namelist.push(workenvs[i].title);
		let id;
		if(workenvs[i].options.identifier == "UserData")
			id = createWorkEnvironmentEntry(workenvs[i]);
		else {
			id = createWorkEnvironmentEntry(workenvs[i], first, container);
			first = false;
		}
		let blacklist = explorerLoadWorkEnvironments(workenvs[i], getTreeCntById(id));

		let c = i;
		//Falls Clonkverzeichnis, dann direkt laden. (Ausnahme: AlwaysExplode = true)
		if(workenvs[c].type == _mainwindow.WORKENV_TYPE_ClonkPath && !workenvs[c].alwaysexplode) {
			$("#msg-loading").remove();

			//Verzeichnis einlesen und Inhalte auflisten
			loadDirectory(workenvs[c].path, getTreeCntById(id), false, false, blacklist);
		}
		//Ansonsten vorher Verzeichnis vorbereiten (c4group-explodes)
		else {
			PrepareDirectory(workenvs[c].path, function() {
				$("#msg-loading").remove();

				//Verzeichnis einlesen und Inhalte auflisten
				loadDirectory(workenvs[c].path, getTreeCntById(id), false, false, blacklist);
			});
		}
	}
	if(!parentWorkEnv)
		treeExpand($(container).children("ul.workenvironment:not(.we-userdata)")[0]);

	unlockModule();
	return we_namelist;
}

function updateCreateWorkEnvInfo(title, content) {
	if(title)
		$("#workenv-creating-info-title").text(title);
	if(content)
		$("#workenv-creating-info-body").text(content);
	if(!title && !content)
		$("#workenv-creating-info").css("height", "0px");
	else
		$("#workenv-creating-info").css("height", "");
}

var dlgcontent;

$(window).load(function() {
	_mainwindow.triggerModeButtonIcon();

	var keyb_opensidedeck = new KeyBinding("OpenInSidedeck", "Ctrl-ENTER", function(e, target) {
			handleTreeEntry(target, true);
		}, 0, "DEX");
	hook("treeObjAdded", function(obj) {
		if($(obj).hasClass("workenvironment"))
			workenvContextMenu.bindToObj($(obj)[0]);
		else
			treeContextMenu.bindToObj($(obj)[0]);
		bindKeyToObj(keyb_opensidedeck, obj);
	});

	dlgcontent = $("#dlg-workenvironment").html();
	$("#dlg-workenvironment").remove();

	//Erstellungsdialog fuer Arbeitsumgebungen
	$("#newWorkEnvironment").mousedown(function() { createNewWorkEnvironmentDlg(); });
	//Importieren von Arbeitsumgebungen
	$("#importWorkEnvironment").mousedown(function() {
		current_path = getConfigData("CIDE", "WorkspaceParentDirectory");
		if(!current_path)
			return warn("$DlgErrWENoWorkspaceDir$");

		var dir = new _sc.file(current_path);
		if(!dir.exists())
			return warn("$DlgErrWENoWorkspaceDir$");

		//Filepicker offnen
		var fp = _sc.filepicker();
		fp.init(window, Locale("$DlgWEChooseWorkspaceImportDirectory$"), Ci.nsIFilePicker.modeGetFolder);
		fp.displayDirectory = dir;

		var rv = fp.show();
		if(rv == Ci.nsIFilePicker.returnOK) {
			let header = new _sc.file(fp.file.path+"/.windmillheader"), gitdir;
			if(!header.exists()) {
				gitdir = new _sc.file(fp.file.path+"/.git");
				if(!gitdir.exists() || !_sc.file(gitdir.path+"/config")) {
					warn("$err_is_no_workspace$");
					return $(this).trigger("command");
				}
			}

			if(_sc.workpath(fp.file))
				return warn("$err_workspace_already_loaded$");

			function* createEnvironment() {
				let env = createWorkEnvironment(formatPath(getConfigData("CIDE", "WorkspaceParentDirectory"))+"/"+fp.file.leafName, _mainwindow.WORKENV_TYPE_Workspace, true);
				env.unloaded = false;
				if(gitdir) {
					env.repository = true;
					let configtext = yield OS.File.read(gitdir.path+"/config", {encoding: "utf-8"});
					for(var lines = configtext.split("\n"), i = 0, origin = false; i < lines.length; i++) {
						if(/\[remote.+?"origin"\]/.test(lines[i]))
							origin = true;
						else if(/\[remote.+?\]/.test(lines[i]))
							origin = false;
						else if(origin && /url =.+/.test(lines[i])) {
							//TODO: ggf. Benutzername/Passwort reineditieren
							env.cloneurl = lines[i].match(/url\W+=\W+(.+)/)[1];
							break;
						}
					}

					if(!env.cloneurl)
						return warn("$DlgErrWENoCloneURL$");
				}
				env.saveHeader();
				createWorkEnvironmentEntry(env);
			}

			if(formatPath(fp.file.path).search(formatPath(getConfigData("CIDE", "WorkspaceParentDirectory"))) != -1)
				return Task.spawn(createEnvironment);

			//Dialog oeffnen
			let dlg = new WDialog("$DlgWEImport$", MODULE_LPRE, { modal: true, css: { "width": "450px" }, btnright: [{ label: "$DlgBtnCopy$",
				onclick: function*(e, btn, dialog) {
					yield OSFileRecursive(fp.file.path, getConfigData("CIDE", "WorkspaceParentDirectory")+"/"+fp.file.leafName);
					yield Task.spawn(createEnvironment);
					dialog.hide();
				}
			},{ label: "$DlgBtnLink$",
				onclick: function*(e, btn, dialog) {
					let env = createNewWorkEnvironment(formatPath(getConfigData("CIDE", "WorkspaceParentDirectory"))+"/"+fp.file.leafName, _mainwindow.WORKENV_TYPE_Workspace);
					env.unloaded = false;
					env.linkedTo = formatPath(fp.file.path);
					env.saveHeader();
					createWorkEnvironmentEntry(env);
					dialog.hide();
				}
			}, "cancel"]});
			dlg.setContent('<hbox><description style="width: 450px;">$DlgWEImportDesc$</description></hbox>');
			dlg.show();
			dlg = 0;
		}
	});

	$(".nav-image").click(function() {
		$(this).toggleClass("deselected");
	});

	//Arbeitsumgebungen verstecken
	$("#showClonkDirs").click(function() { $(".we-clonkdir").css("display", $(this).hasClass("deselected")?"none":""); });
	$("#showWorkspaces").click(function() { $(".we-workspace").css("display", $(this).hasClass("deselected")?"none":""); });
});

function createNewWorkEnvironmentDlg(parentWorkEnv, parentContainer) {
	var dlg = new WDialog("$DlgNewWorkEnvironment$", MODULE_LPRE, { modal: true, css: { "width": "600px" }, btnright: [{ preset: "accept",
		onclick: function*(e, btn, _self) {
			let error = (str) => { return $(_self.element).find("#dex-dlg-workenv-errorbox").text(Locale(str)); }

			let type = parseInt($(_self.element).find("#dex-dlg-workenv-type").val()), file;
			if(type == _mainwindow.WORKENV_TYPE_ClonkPath) {
				//Checken ob der angegebene Pfad existiert/valide ist
				let path = $(_self.element).find("#dex-dlg-workenv-ocpath").text(), info;
				try { info = yield OS.File.stat(path); }
				catch(err) {
					if(err.becauseNoSuchFile) {
						error("$DlgErrWEPathDoesNotExist$");
						return -1;
					}
					else {
						error("<hbox>The following error occured while trying to create the work environment:</hbox><hbox>"+err+"</hbox>");
						return -1;
					}
				}
				if(!info.isDir) {						
					error("$DlgErrWEPathDoesNotExist$");
					return -1;
				}

				let cdirs = getConfigData("Global", "ClonkDirectories") || [];

				//Ueberpruefen ob Pfad bereits vorhanden ist
				if(cdirs.indexOf(path) != -1) {
					error("$DlgErrWEAlreadyLoaded$");
					return -1;
				}

				//Ansonsten der Liste hinzufuegen und speichern
				cdirs.push(path);
				setConfigData("Global", "ClonkDirectories", cdirs, true);

				let workenv = createWorkEnvironment(path, _mainwindow.WORKENV_TYPE_ClonkPath);
				workenv.alwaysexplode = $(_self.element).find("#dex-dlg-workenv-explodecdir").attr("checked") || false;
				workenv.saveHeader();

				//Ggf. neu laden wenn kein Clonkverzeichnis vorher vorhanden war. (Da wichtige Sachen beim Laden des Explorers erledigt werden muessen)
				if(cdirs.length == 1) {
					window.location.reload();

					//iframe vom HostGame-Modul auch neuladen
					if(getModuleByName("cbexplorer") && getModuleByName("cbexplorer").contentWindow)
						getModuleByName("cbexplorer").contentWindow.location.replace(getModuleByName("cbexplorer").contentWindow.location.pathname);
				}
				else
					createWorkEnvironmentEntry(workenv);

				return true;
			}

			//Checken ob es ueberhaupt ein Workspace-Hauptverzeichnis gibt
			var path = getConfigData("CIDE", "WorkspaceParentDirectory");
			if(parentWorkEnv)
				path = parentWorkEnv.path;
			if(!path) {
				error("$DlgErrWENoWorkspaceDir$");
				return -1;
			}

			//Workspaceverzeichnis erstellen und ggf. Error zurueckwerfen
			try { yield OS.File.makeDir(path); }
			catch(err) {
				if(err.becauseNoSuchFile) {
					error("$DlgErrWEInvalidPath$");
					return -1;
				}
				else {
					error("<hbox>The following error occured while trying to create the work environment:</hbox><hbox>"+err+"</hbox>");
					return -1;
				}
			}

			//Namen ueberpruefen
			var name = $(_self.element).find("#dex-dlg-workenv-name").val();
			if(type == 3) //Repository
				name = $(_self.element).find("#dex-dlg-workenv-destname").val();
			if(!name) {
				error("$DlgErrWENoName$");
				return -1;
			}

			//Ggf. Dateiliste generieren (Checklistbox)
			var options = {};

			if($(_self.element).find("#dex-dlg-workenv-fullcopy").attr("checked"))
				options.fullcopy = true;

			if(type == _mainwindow.WORKENV_TYPE_Workspace) {
				options.migrate_files = [];
				$(_self.element).find("#dex-dlg-workenv-filelist > .dlg-checklistitem").each(function() {
					if($(this).hasClass("hidden") && !options.fullcopy)
						return;
					if(!$(this).hasClass("selected") && !options.fullcopy)
						return;

					options.migrate_files.push($(this).text());
				});
				options.sourcedir = _sc.clonkpath(parseInt($(dlg.element).find("#dex-dlg-workenv-source-clonkdir").prop("value")));
			}
			else if(type == 3) {
				options.repository = _mainwindow.WORKENV_Repository_Git;
				options.cloneurl = $(_self.element).find("#dex-dlg-workenv-cloneurl").val();
				if($(_self.element).find("#dex-dlg-workenv-username").val()) {
					options.userinfo = { username: $(_self.element).find("#dex-dlg-workenv-username").val(),
										 password: $(_self.element).find("#dex-dlg-workenv-password").val(),
										 saveinfo: $(_self.element).find("#dex-dlg-workenv-saveuserinfo").attr("checked") };
				}

				//TODO: Auf Validitaet ueberpruefen
				if(!options.cloneurl) {
					error("$DlgErrWENoCloneURL$");
					return -1;
				}
				if(!$(_self.element).find("#dex-dlg-workenv-cfgusername").val()) {
					error("$DlgErrWERepositoryNoUserName$");
					return -1;
				}
				if(!$(_self.element).find("#dex-dlg-workenv-cfgemail").val()) {
					error("$DlgErrWERepositoryNoEmail$");
					return -1;
				}
				
				options.userconfig = { username: $(_self.element).find("#dex-dlg-workenv-cfgusername").val(), 
									   email: $(_self.element).find("#dex-dlg-workenv-cfgemail").val() };

				//Sonst wie ein normales Workspace behandeln...
				type = _mainwindow.WORKENV_TYPE_Workspace;
			}

			if($(_self.element).find("#dex-dlg-workenv-debug").attr("checked"))
				options.debug = true;
			if($(_self.element).find("#dex-dlg-workenv-nooperations").attr("checked"))
				options.no_file_operations = true;

			options.success = function(workenv) {
				getModuleByName("cide").contentWindow.unlockModule();
				createWorkEnvironmentEntry(workenv, null, parentContainer);
				showNotification(undefined, Locale("$WESuccessfullyCreated$"), sprintf(Locale("$WESuccessfullyCreatedDesc$"), workenv.title));
			}
			options.rejected = function(err) {
				getModuleByName("cide").contentWindow.unlockModule();
				EventInfo("An error occured while creating the work environment.");
			}
			options.parent = parentWorkEnv;

			//getModuleByName("cide").contentWindow.lockModule("Copying files to new directory. This may take a while.", true);
			createNewWorkEnvironment(path+"/"+name, type, options);
			_self.hide();
		}
	}, "cancel"]});

	dlg.setContent(dlgcontent);
	dlg.show();
	
	//Ggf. Elemente ausblenden wenn Elternworkenvironment vorhanden ist:
	if(parentWorkEnv) {
		$(dlg.element).find("#dex-dlg-workenv-type-clonkdir,#dex-dlg-workenv-type-repository").remove();
		$(dlg.element).find("#dex-dlg-workenv-type-selection").hide();
		$(dlg.element).find("#dex-dlg-workenv-type").val(2);
	}

	//Bei Auswahl von Checklistitems die Selection-Checkboxen aktualisieren
	$(dlg.element).find(".dlg-checklistitem").click(function() {
		if($(dlg.element).find("#dex-dlg-workenv-select-all").attr("checked"))
			$(dlg.element).find("#dex-dlg-workenv-select-all").attr("checked", false);
		if($(dlg.element).find("#dex-dlg-workenv-select-ocfiles").attr("checked"))
			if($(this).text().search(/\.oc.$/i) != -1)
				$(dlg.element).find("#dex-dlg-workenv-select-ocfiles").attr("checked", false);
	});
	//Dropdownmenue: Je nach Auswahl Inhalt anzeigen
	$(dlg.element).find("#dex-dlg-workenv-type").on("command", function() {
		$(dlg.element).find('.dex-dlg-workenv-content').css("display", "none");
		$(dlg.element).find('.dex-dlg-workenv-content[data-settingsgroup="'+$(this).find(":selected").attr("id")+'"]').css("display", "");
		if($(this).find(":selected").attr("id") == "dex-dlg-workenv-type-repository") {
			if(!getAppByID("git").isAvailable())
				$(dlg.element).find("#dex-dlg-workenv-errorbox").text(Locale("$DlgErrWEGitNotAvailable$"));
			else
				$(dlg.element).find("#dex-dlg-workenv-errorbox").text("");
		}
		else
			$(dlg.element).find("#dex-dlg-workenv-errorbox").text("");

		//Damit die Groesse der Checklistbox neu berechnet wird: (Da diese, solange versteckt, nicht korrekt berechnet wird)
		$(dlg.element).find("#dex-dlg-workenv-source-clonkdir").trigger("command");
	}).trigger("command");
	//Dateiliste ausblenden bei FullCopy
	$(dlg.element).find("#dex-dlg-workenv-fullcopy").on("command", function() {
		if($(this).attr("checked"))
			$(dlg.element).find('#dex-dlg-workenv-filelist,#dex-dlg-workenv-filelist-ctrls').css("display", "none");
		else
			$(dlg.element).find('#dex-dlg-workenv-filelist,#dex-dlg-workenv-filelist-ctrls').css("display", "");
	});
	//Alle auswaehlen
	$(dlg.element).find("#dex-dlg-workenv-select-all").on("command", function() {
		if($(this).attr("checked"))
			$(dlg.element).find(".dlg-checklistitem").addClass("selected");
		else
			$(dlg.element).find(".dlg-checklistitem").removeClass("selected");
	});
	//.oc? Dateien auswaehlen
	$(dlg.element).find("#dex-dlg-workenv-select-ocfiles").on("command", function() {
		var _this = this;
		$(dlg.element).find(".dlg-checklistitem").each(function() {
			if($(_this).attr("checked") && $(this).text().search(/\.oc.$/i) != -1)
				$(this).addClass("selected");
			else
				$(this).removeClass("selected");
		});
	});
	//Nur .oc? Dateien anzeigen
	$(dlg.element).find("#dex-dlg-workenv-showonlyocfiles").on("command", function() {
		if($(this).attr("checked")) {
			$(dlg.element).find(".dlg-checklistitem").each(function() {
				if($(this).text().search(/\.oc.$/i) == -1)
					$(this).addClass("hidden");
			});
		}
		else
			$(dlg.element).find(".dlg-checklistitem").removeClass("hidden");
	});
	//Auswahl des Clonkverzeichnisses
	$(dlg.element).find("#dex-dlg-workenv-ocpath-button").on("command", function() {
		//Filepicker offnen
		var fp = _sc.filepicker();
		fp.init(window, Locale("$DlgWEChooseOCDir$"), Ci.nsIFilePicker.modeGetFolder);

		var current_path = getConfigData("Global", "ClonkDirectories");
		if(current_path && current_path[0]) {
			var dir = new _sc.file(current_path[0].path);
			if(dir.exists())
				fp.displayDirectory = dir;
		}

		var rv = fp.show();
		if(rv == Ci.nsIFilePicker.returnOK) {
			var ocexec = new _sc.file(fp.file.path+"/"+getClonkExecutablePath(true));
			if(!ocexec.exists()) {
				warn("$err_ocexecutable_not_found$", "STG");
				return $(this).trigger("command");
			}

			$(dlg.element).find("#dex-dlg-workenv-ocpath").text(fp.file.path);
		}
	});
	var clonkdirs = getConfigData("Global", "ClonkDirectories");
	if(clonkdirs.length < 1)
		$(dlg.element).find("#dex-dlg-workenv-clonkdirset").css("display", "none");
	else {
		$(dlg.element).find("#dex-dlg-workenv-clonkdirset").css("display", "");

		for(var i = 0; i < clonkdirs.length; i++) {
			var workenv = getWorkEnvironmentByPath(clonkdirs[i].path);
			$(dlg.element).find("#dex-dlg-workenv-source-clonkdir > menupopup").append('<menuitem label="'+workenv.title+'" value="'+i+'"/>');
		}
		$(dlg.element).find("#dex-dlg-workenv-source-clonkdir").prop("selectedIndex", 0).prop("value", "0").on("command", function() {
			//Auflisten
			var entries = (new _sc.file(_sc.clonkpath(this.value))).directoryEntries, list = "";
			while(entries.hasMoreElements()) {
				var entry = entries.getNext().QueryInterface(Ci.nsIFile);
				if(entry.leafName == ".windmillheader")
					continue;

				var additionalclasses = '';
				if($(dlg.element).find("#dex-dlg-workenv-select-all").attr("checked"))
					additionalclasses = ' selected';
				else if($(dlg.element).find("#dex-dlg-workenv-select-ocfiles").attr("checked")) {
					if(entry.path.search(/\.oc.$/i) != -1)
						additionalclasses = ' selected';
				}
				if($(dlg.element).find("#dex-dlg-workenv-showonlyocfiles").attr("checked"))
					if(entry.path.search(/\.oc.$/i) == -1)
						additionalclasses = ' hidden';

				list += `<hbox class="dlg-checklistitem${additionalclasses}">${entry.leafName}</hbox>`;
			}

			$(dlg.element).find("#dex-dlg-workenv-filelist").empty().html(list);
			dlg.updatePseudoElements();
		}).trigger("command");
	}
}	

function onTreeItemBlur(obj) {
	var by = treeContextMenu.opened_by || workenvContextMenu.opened_by;
	if($(by).prop("tagName") != "li")
		by = $(by).parents("li")[0];

	if(by == obj)
		return true;

	return;
}

function shortenOuterHTML(str) { return str.replace(/(<.+?>)(.+)(<.+?>$)/, function(a,b,c,d) { return b+(c.length?"...":"")+d }) }

function onExplorerRefresh() {
	let sel = getCurrentTreeSelection();
	if(!sel) {
		sel = getLastSelectedTreeItem();
		if(!sel) {
			sel = $(".workenvironment.tree-expanded")[0];
			if(!sel) {
				sel = _sc.clonkpath();
				if(!sel)
					return;
			}
		}
		else
			sel = sel.path;
	}

	workenv = getWorkEnvironmentByPath(_sc.workpath(sel));
	if(!workenv)
		return;

	let cnt = $("ul[workpath='"+workenv.path+"']");
	if(!cnt[0])
		return;

	$(cnt).empty();
	loadDirectory(workenv.path, cnt);
	return true;
}

function initializeContextMenu() {
	//-- Kontextmenü initialisieren
	
	//Submenu "Neu"
	var submenu_new = new ContextMenu(0, [ //Neu
		//Spielinhalte

		["$ctxObject$", 0, function*() {
			yield CreateNewGamefile("ocd", $(getCurrentTreeSelection()));
		}, 0, { iconsrc: "chrome://windmill/content/img/icon-fileext-ocd.png" }],
		["$ctxScenario$", 0, function*() {
			yield CreateNewGamefile("ocs", $(getCurrentTreeSelection()));
		}, 0, { iconsrc: "chrome://windmill/content/img/icon-fileext-ocs.png" }],

		"seperator",

		//Ordner

		["$ctxfolder$", 0, function*() { // Ordner erstellen
			yield createNewFile(true, "$create_newfolder$", true, "chrome://windmill/content/img/icon-directory.png");
		}, 0, { iconsrc: "chrome://windmill/content/img/icon-directory.png" }],
		["$ctxobjfolder$", 0, function*() { // Objektordner erstellen
			yield createNewFile(true, "$create_newobjfolder$.ocd", true);
		}, 0, { iconsrc: "chrome://windmill/content/img/icon-fileext-ocd.png" }],
		["$ctxscenfolder$", 0, function*() { // Rundenordner erstellen
			yield createNewFile(true, "$create_newscenfolder$.ocf", true);
		}, 0, { iconsrc: "chrome://windmill/content/img/icon-fileext-ocf.png" }],

		//Textdateien
		"seperator",

		["$ctxtext$", 0, function*() { // Textdatei erstellen
			yield createNewFile(false, "$create_newtxt$.txt");
		}, 0, { iconsrc: "chrome://windmill/content/img/icon-fileext-txt.png" }],

		//Bilddateien
		"seperator",

		["$ctxgbmp$", 0, function*() { //BMPDatei erstellen
			yield createNewFile(false, "$create_newimg$.bmp", false);
		}, 0, { iconsrc: "chrome://windmill/content/img/icon-fileext-bmp.png" }],
		["$ctxgpng$", 0, function*() { //PNGDatei erstellen
			yield createNewFile(false, "$create_newimg$.png", false);
		}, 0, { iconsrc: "chrome://windmill/content/img/icon-fileext-png.png" }],
		["$ctxgjpg$", 0, function*() { //JPGDatei erstellen
			yield createNewFile(false, "$create_newimg$.jpg", false);
		}, 0, { iconsrc: "chrome://windmill/content/img/icon-fileext-jpg.png" }],

		//Scriptdateien
		"seperator",

		["$ctxscript$", 0, function*() { //Scriptdatei erstellen
			yield createNewFile(false, "$create_newscript$.c", false, null, 
					"/*-- New Scriptfile --*/\r\n\r\nfunc Initialize() {\r\n  return true;\r\n}\r\n");
		}, 0, { iconsrc: "chrome://windmill/content/img/icon-fileext-c.png" }]
	], MODULE_LPRE, { allowIcons: true });

	treeContextMenu.addEntry("$ctxnew$", 0, 0, submenu_new, {identifier: "ctxNew"});
	//Duplizieren
	treeContextMenu.addEntry("$ctxduplicate$", 0, function*() {
		let cnt = $(getCurrentTreeSelection()).parent();
		let path = _sc.workpath() + getTreeObjPath(getCurrentTreeSelection());
		yield OSFileRecursive(path, path);

		if($(cnt).html().length)
			$(cnt).empty();

		let parentpath = path.split("/");
		parentpath.pop();
		loadDirectory(parentpath.join("/"), cnt);
	}, 0, { identifier: 'ctxDuplicate' });
	//Kopieren
	treeContextMenu.addEntry("$ctxcopy$", 0, function() { copyTreeEntry(getCurrentTreeSelection()); }, 0, { identifier: 'ctxCopy' });
	//Einfügen
	treeContextMenu.addEntry("$ctxpaste$", 0, function() { pasteFile(getCurrentTreeSelection()); }, 0, { identifier: 'ctxPaste' });
	//Ausschneiden
	treeContextMenu.addEntry("$ctxcut$", 0, function() {}, 0, { identifier: 'ctxCut' });
	//Umbenennen
	treeContextMenu.addEntry("$ctxrename$", 0, function() {
		renameTreeObj($(getCurrentTreeSelection()));
	}, 0, { identifier: 'ctxRename' });
	//Löschen
	treeContextMenu.addEntry("$ctxdelete$", 0, function() {
		removeTreeEntry($(getCurrentTreeSelection()));
	}, 0, { identifier: 'ctxDelete' });
	//Aktualisieren
	treeContextMenu.addEntry("$ctxreload$", 0, function() {
		var sel = getCurrentTreeSelection();
		var elmid = getTreeObjId(sel);
		var cnt = getTreeCntById(elmid);
		
		$(cnt).empty();
		loadDirectory(_sc.workpath()+getTreeObjPath(sel), cnt);
	}, 0, { identifier: 'ctxReload' });

	treeContextMenu.addSeperator();

	//Packen
	treeContextMenu.addEntry("$ctxpack$", 0, function() {
		var sel = getCurrentTreeSelection();
		var elmid = getTreeObjId(sel);
		var cnt = getTreeCntById(elmid);

		var c4group = _sc.file(getC4GroupPath());
		var dir = _sc.file(_sc.workpath()+getTreeObjPath(sel));

		if(!c4group.exists() || !c4group.isExecutable())
			return warn("$err_group_not_found$");

		var process = _ws.pr(c4group);
		lockModule("Packing " + dir.leafName);
		process.create([dir.path, "-p"], 0x00000001, function() {
			unlockModule();
			
			if(!cnt[0])
				return;

			//Container löschen und Klassen/Events entfernen
			$(cnt).remove();
			$(sel).removeClass("treecontainer");
			$(sel).children("description")[0].ondragover = 0;
			$(sel).removeClass("tree-collapsed").removeClass("tree-expanded");
			$(cnt).removeClass("tree-collapsed").removeClass("tree-expanded");

			//Gepackt
			$(sel).addClass("tree-groupfile-packed");
			EventInfo("$EI_Packed$");
		}, function(data) {
			log(data);
		});
	}, 0, { identifier: 'ctxPack' });
	//Zerlegen
	treeContextMenu.addEntry("$ctxexplode$", 0, function() {
		var sel = getCurrentTreeSelection();
		var elmid = getTreeObjId(sel);
		var cnt = getTreeCntById(elmid);

		var c4group = _sc.file(getC4GroupPath());
		var dir = _sc.file(_sc.workpath()+getTreeObjPath(sel));

		if(!c4group.exists() || !c4group.isExecutable())
			return warn("$err_group_not_found$");

		//c4group explode
		var process = _ws.pr(c4group);
		var args = [dir.path, "-x"];
		lockModule("Exploding " + dir.leafName);
		process.create(args, 0x1, function() {
			unlockModule();

			//Inhalte neu laden
			if(!cnt[0]) {
				//Container einfügen und Klassen/Events setzen
				cnt = $('<ul id="treecnt-'+elmid+'" class="treecnt" xmlns="http://www.w3.org/1999/xhtml"></ul>').insertAfter(sel);
				$(sel).addClass("treecontainer");
				$(sel).children("description")[0].ondragover = function() { return false; };
				$(sel).addClass("tree-collapsed");
				$(cnt).addClass("tree-collapsed");
			}

			$(cnt).empty();
			$(sel).removeClass("tree-groupfile-packed");
			loadDirectory(dir.path, cnt);
			EventInfo("$EI_Exploded$");
		});
	}, 0, { identifier: 'ctxExplode' });

	treeContextMenu.addSeperator();

	//Exportieren
	treeContextMenu.addEntry("$ctxexport$", 0, 0, (new ContextMenu(function(by_obj) {
		this.clearEntries();
		let i = 0, path;
		function* exportToWorkEnv(workenv) {
			let treepath = _sc.workpath(by_obj)+"/"+getTreeObjPath(by_obj);
			let filename = treepath.split("/").pop();
			let destination = workenv.path+"/"+filename;
			destination = (yield OSFileRecursive(treepath, destination, null, "copy", true, { checkIfFileExist: true })).path;

			let fileext = filename.split(".").pop(), fileobj;
			if(workenv.type == _mainwindow.WORKENV_TYPE_ClonkPath) {
				if(!workenv.alwaysexplode && filename.split(".").length > 1 && OCGRP_FILEEXTENSIONS.indexOf(fileext) != -1) {
					let c4group = _sc.file(getC4GroupPath());
					let process = _ws.pr(c4group);
					yield process.createPromise([destination, "-p"], 0x1);
					fileobj = { 
						leafName: destination.split("/").pop(), 
						isDirectory: function() { return false; } 
					};
				}
			}
			else
				fileobj = _sc.file(destination);
			addFileTreeEntry(fileobj, $('.workenvironment[workpath="'+workenv.path+'"]')[1], true);
		}
		while(path = _sc.clonkpath(i)) {
			if(i > 0 && path == _sc.clonkpath(0))
				break;
			let workenv = getWorkEnvironmentByPath(path);
			if(!path || !workenv)
				break;

			this.addEntry(workenv.title, 0, function*(target, menuitemobj, menuitem) {
				yield* exportToWorkEnv(workenv);
			}, 0, { iconsrc: workenv.icon });
			i++;
		}
		this.addSeperator();
		let obj = $(by_obj).parents(".workenvironment")[0];
		while((obj = $(obj).parent()) && $(obj).hasClass("workenvironment")) {
			let workenv = getWorkEnvironmentByPath(_sc.workpath(obj));
			this.addEntry(workenv.title, 0, function*(target, menuitemobj, menuitem) {
				yield* exportToWorkEnv(workenv);
			}, 0, { iconsrc: workenv.icon });
		}
		this.addSeperator();
		this.addEntry("$ctxexport_allclonkdirs$", 0, function*() {
			i = 0;
			while(path = _sc.clonkpath(i)) {
				if(i > 0 && path == _sc.clonkpath(0))
					break;
				let workenv = getWorkEnvironmentByPath(path);
				if(!path || !workenv)
					break;
				yield* exportToWorkEnv(workenv);
				i++;
			}
		});
	}, [], MODULE_LPRE, { allowIcons: true })), { identifier: "ctxExport" });

	treeContextMenu.addSeperator();

	//Git
	treeContextMenu.addEntry("$ctxgit$", 0, 0, gitContextMenu(), { identifier: "ctxGit"});

	//Öffnen
	treeContextMenu.addEntry("$ctxopen$", 0, function() {
		handleTreeEntry($(getCurrentTreeSelection()));
	}, 0, { identifier: 'ctxOpen' });
	//Im Vollbild öffnen
	treeContextMenu.addEntry("$ctxopenfull$", 0, function() {
		var t = $(getCurrentTreeSelection()).attr("filename").split("."), fext = t[t.length-1]; 
		var filepath = _sc.workpath() + getTreeObjPath(getCurrentTreeSelection()), file = _sc.file(filepath);

		if(!file.exists())
			return;

		var f = _sc.file(getClonkExecutablePath());
		var process = _ws.pr(f);
		process.create(["--fullscreen", "--nonetwork", filepath], 0, 0, function(data) {
			log(data);
		});
	}, 0, { identifier: 'ctxOpenFull' });

	//Mit Kommandozeilenparameter öffnen
	treeContextMenu.addEntry("$ctxopenpars$", 0, function() {
		//Dialog öffnen
		var dlg = new WDialog("$DlgOpenWithPars$", MODULE_LPRE, { modal: true, css: { "width": "450px" }, btnright: [{ preset: "accept",
			onclick: function(e, btn, _self) {
				var t = $(getCurrentTreeSelection()).attr("filename").split("."), fext = t[t.length-1]; 
				var filepath = _sc.workpath() + getTreeObjPath(getCurrentTreeSelection()), file = _sc.file(filepath);

				if(!file.exists())
					return;

				var f = _sc.file(getClonkExecutablePath());
				var process = _ws.pr(f);
				var args = _mainwindow.$("#dex_dlg_parameters").val().split(' ');
				args.push(filepath);
				process.create(args, 0, 0, function(data) {
					log(data);
				});
			}
		}, "cancel"]});
		var pars = getOCStartArguments("").join(' ');
		dlg.setContent(`<hbox><description style="width: 450px;">$DlgOpenWithParsDesc$</description></hbox>
					    <hbox><textbox id="dex-dlg-parameters" placeholder="$DlgInputParameters$" value="${pars}" /></hbox>`);
		dlg.show();
		dlg = 0;
	}, 0, { identifier: 'ctxOpenPars' });
	
	/*-- WorkEnvironment ContextMenu --*/
	workenvContextMenu.addEntry("$ctxnew$", 0, 0, submenu_new);
	workenvContextMenu.addEntry("$ctxnewworkenv$", 0, function() {
		let workenv = getWorkEnvironmentByPath(getFullPathForSelection());
		createNewWorkEnvironmentDlg(workenv, getTreeCntById(getTreeObjId(getCurrentTreeSelection())));
	});
	//Aktualisieren
	workenvContextMenu.addEntry("$ctxreload$", 0, function() {
		let sel = getCurrentTreeSelection();
		let cnt = getTreeCntById(getTreeObjId(sel));

		$(cnt).empty();
		loadDirectory(_sc.workpath(sel), cnt);
	}, 0, { identifier: 'ctxReload' });
	workenvContextMenu.addSeperator();
	workenvContextMenu.addEntry("$ctxrename$", 0, function() {
		renameTreeObj($(getCurrentTreeSelection()));
	}, 0);
	workenvContextMenu.addEntry("$ctxdelete$", 0, function() {
		removeTreeEntry($(getCurrentTreeSelection()));
	}, 0);
	workenvContextMenu.addSeperator();
	
	//Git
	workenvContextMenu.addEntry("$ctxgit$", 0, 0, gitContextMenu(), { identifier: "ctxGit"});
	workenvContextMenu.addSeperator();

	var lbl = "$ctxopeninfilemanager$";
	if(OS_TARGET == "WINNT")
		lbl = "$ctxopeninfilemanager_win$";

	//Da Filemanager unter Linux eine Zumutung sind, vorerst nur fuer Windows
	if(OS_TARGET == "WINNT") {
		workenvContextMenu.addEntry(lbl, 0, function() {
			openInFilemanager(_sc.workpath(getCurrentTreeSelection()));
		}, 0);
	}
}

//Neue Spieldatei (Objekt/Szenario) erstellen
function CreateNewGamefile(type, treeobj) {
	let task = Task.spawn(function*() {
		let dir = _sc.file(_sc.chpath + "/content/modules/cide/explorer/cide_templates/"+type);
		if(!dir.exists())
			return warn("$err_template_not_found$");

		let dlgtitle = "Gamefile$";
		if(type == "ocs")
			dlgtitle = "Scenario$";
		else if(type == "ocd")
			dlgtitle = "Object$";

		//Dialog öffnen
		let dlg = new WDialog("$DlgCreateNew"+dlgtitle, MODULE_LPRE, { modal: true, css: { "width": "450px" }, btnright: [{ preset: "accept",
				//Annehmen-Button
				onclick: function*(e, btn, _self) {
					let error = (str) => { return $(_self.element).find("#dex-dlg-gamefile-errorbox").text(Locale(str)); }

					let name = _mainwindow.$("#dex-dlg-gffilename").val();
					//Gueltigkeit des Namens ueberpruefen
					if(!name || (OS_TARGET == "WINNT" && name.search(/[\\/:*?"<>|]/) != -1) || name.length < 1) {
						error('$DlgErrInvalidFilename$');
						return -1;
					}

					name += '.'+type;

					let ndir = _sc.workpath(treeobj) + getTreeObjPath(treeobj) + '/' + name;
					try {
						yield OS.File.makeDir(ndir, { ignoreExisting: false });
					}
					catch(err) {
						if(err.becauseExists)
							error('$DlgErrFilenameExists$');
						else
							error('Error: ' + err);

						return -1;
					}

					//Auswahl in neu erstelltes Verzeichnis kopieren
					let filelist = [];
					$(_self.element).find('#dex-dlg-gffiles > .dlg-checklistitem.selected').each(function() {
						filelist.push($(this).text());
					});

					for(var i = 0; i < filelist.length; i++)
						yield OSFileRecursive(dir.path+"/"+filelist[i], formatPath(ndir+"/"+filelist[i]));

					//TODO: Für Szenarios, Scenario.txt abrufen (falls überhaupt vorhanden) und Definitions setzen

					$(getTreeCntById(getTreeObjId(treeobj))).empty();
					loadDirectory(_sc.workpath(treeobj) + getTreeObjPath(treeobj), getTreeCntById(getTreeObjId(treeobj)));
					setTimeout(function() {
						let new_tree_obj = $(getTreeCntById(getTreeObjId(treeobj))).find("[filename='"+ndir.leafName+"']");
						selectTreeItem(new_tree_obj, true);
						treeExpand(new_tree_obj);
					}, 10);
				}}, "cancel"]});

		let selectedFiles;
		try { selectedFiles = yield OS.File.read(dir.path+'/.templateList.txt', {encoding: "utf-8"}); }
		catch(e) { selectedFiles = undefined; };
		if(!selectedFiles)
			selectedFiles = '';

		//Dateiauswahl erstellen
		let content = 	`<vbox>
							<hbox class="dlg-infobox error" id="dex-dlg-gamefile-errorbox">
								<description></description>
							</hbox>
							<vbox>
								<description>$DlgGfFilenameDesc$</description>
								<textbox id="dex-dlg-gffilename"></textbox>
							</vbox>
							<vbox>
								<description>$DlgGfPickFiles$</description>
							</vbox>
							<vbox id="dex-dlg-gffiles" class="dlg-checklistbox">`;

		//Auflisten
		let entries = dir.directoryEntries;
		while(entries.hasMoreElements()) {
			let entry = entries.getNext().QueryInterface(Ci.nsIFile);

			if(entry.leafName == ".templateList.txt")
				continue;

			//Falls in der Liste vorhanden, Datei auswählen
			let selstr = '';
			if(OS_TARGET == "WINNT") {
				if(selectedFiles.search(RegExp("(^|\\|)"+entry.leafName+"($|\\|)")) != -1)
					selstr = ' selected';
			}
			else if(selectedFiles.search(RegExp("(^|/|)"+entry.leafName+"($|/|)")) != -1)
				selstr = ' selected';

			selstr = "";
			content += `<hbox class="dlg-checklistitem${selstr}">${entry.leafName}</hbox>`;
		}

		content += '</vbox></vbox>';

		dlg.setContent(content);
		dlg.show();
		setTimeout(function() { $(dlg.element).find("#dex-dlg-gffilename")[0].focus(); dlg = 0; }, 10);
	});

	return task;
}

function getFullPathForSelection() { return _sc.workpath() + getTreeObjPath(getCurrentTreeSelection()); }

//Neue Datei erstellen
function createNewFile(is_dir, name, container, image, content = "") {
	let cntpath = _sc.workpath() + getTreeObjPath(getCurrentTreeSelection()), path = cntpath + "/" + Locale(name);
	let cnt = getTreeCntById(getTreeObjId(getCurrentTreeSelection()));
	let task = Task.spawn(function*() {
		if(!is_dir) {
			let new_fname = yield* UniqueFilename(path, true);
			let file = yield OS.File.open(new_fname, {write: true, create: true});
			if(typeof content == "string")
				yield OS.File.writeAtomic(new_fname, content, {encoding: "utf-8"});
			else
				yield file.write(content);

			file.close();
			path = new_fname;
		}
		else {
			let counter = 0, extra = "";
			while(true) {
				try { yield OS.File.makeDir(path+extra, {ignoreExisting: false}); }
				catch(e) {
					if(!e.becauseExists)
						throw e;
					if(counter > 99)
						throw "Could not create an alternative name";

					extra = " - " + (++counter);
					continue;
				}
				path += extra;
				break;
			}
		}
	});
	task.then(function() {
		let filename = formatPath(path).split("/").pop();
		if(!image) {
			let t = filename.split("."), fext = t[t.length-1];
			image = "chrome://windmill/content/img/icon-fileext-other.png";

			for(var p in specialData) {
				var d = specialData[p];

				if(d.ext == fext && d.img.length) {
					image = d.img;
					break;
				}
			}
		}

		if($(cnt).html().length)
			$(cnt).empty();

		let task = loadDirectory(cntpath, cnt);
		task.then(function() {
			if($(cnt).find('[filename="'+filename+'"]')[0]) {
				selectTreeItem($(cnt).find('[filename="'+filename+'"]'), true);
				renameTreeObj($(cnt).find('[filename="'+filename+'"]'));
			}
		}, function(err) {
			log("ERROR: " + err);
		});
	}, function(e) {
		EventInfo("An error occured while trying to create a new file");
		log(e);
		log(e.reason);
	});
	return task;
}

function hideFileExtension(fext) {}
function noContainer() {}
function onTreeDeselect(obj) {}
function onTreeSelect(obj) {}

function onTreeExpand(obj, listitem) {
	//Verzeichnis schon geladen
	if($(obj).children("li")[0])
		return;

	loadDirectory(_sc.workpath(obj)+getTreeObjPath(obj), $(obj));
	return true;
}

function onTreeCollapse(obj) {}
function onTreeFileDragDrop(cnt, f) {
	if(!f.exists())
		return;

    var t = f.leafName.split("."), fext = t[t.length-1], fSpecial = false;
    var img = "chrome://windmill/content/img/icon-fileext-other.png";

	for(var p in specialData) {
		var d = specialData[p];

		if(d.ext == fext && d.img.length) {
			img = d.img;
			fSpecial = true;
			break;
		}
	}

	if(f.isDirectory()) {
		//Standard Ordnericon verwenden
		if(!fSpecial)
			img = "chrome://windmill/content/img/icon-directory.png";
	}

	return createTreeElement(cnt, f.leafName, f.isDirectory(), 0, img, f.leafName);
}

function onTreeObjRename(obj, name) { return true; }

function getOCStartArguments(path, nextversion) {
	let args = ["--editor", "--nonetwork", path];
	if(!getConfigData("CIDE", "RejectScenarioBackup") && nextversion) {
		Task.spawn(function*() {
			//Scenario.txt temporaer backuppen, mit vollen Pfaden veraendern und dann wieder zuruecksetzen
			let scenario = path+"/Scenario.txt";
			let content = yield OS.File.read(scenario, {encoding: "utf-8"});
			let data = parseINIArray(content);
			let sources = [_sc.workpath(path)];
			let obj = $("li[workpath='"+_sc.workpath(path)+"']");
			//Elternworkenvironments auch beruecksichtigen
			while(obj && (obj = obj.parent()) && obj.hasClass("workenvironment"))
				sources.push(_sc.workpath(obj));

			for(let key in data["Definitions"]) {
				let def = data["Definitions"][key];
				let i = 0, source;

				while(source = sources[i++]) {
					let newpath = source+"/"+def;
					if(yield OS.File.exists(newpath)) {
						if(OS_TARGET == "WINNT")
							newpath = newpath.replace(/\//g, "\\");

						data["Definitions"][key] = newpath;
						break;
					}
				}
			}

			let order = ["Head", "Definitions", "Game", "Player1", "Player2", "Player3", "Player4", "Landscape", "Weather", "Animals"], text = "";

			//Sonstige Sections
			for(let key in data)
				if(data[key] instanceof Array && order.indexOf(key) == -1 && isNaN(parseInt(key)))
					order.push(key);

			//Text generieren
			for(var i = 0; i < order.length; i++) {
				let sect = order[i];
				if(!data[sect])
					continue;

				text += "["+sect+"]\r\n";
				for(let key in data[sect]) {
					if(data[sect][key] === undefined)
						continue;

					text += key+"="+data[sect][key]+"\r\n";
				}

				text += "\r\n";
			}

			OS.File.writeAtomic(scenario, text, {encoding: "utf-8"});
			let restore = function() {
				OS.File.writeAtomic(scenario, content, {encoding: "utf-8"});
				log("Scenario file was resetted successfully.");
			}
			setTimeout(restore, 10000);

			return {args, restore};
		});
	}

	return args;
}

/*-- Kontextmenü --*/

function workenvHideContextItems(by_obj, identifier) {
	if(identifier == "ctxGit") {
		var workenv =  getWorkEnvironmentByPath(_sc.workpath(by_obj));
		if(!workenv)
			return 2;
		if(!workenv.repository)
			return 2;

		if(!getAppByID("git").isAvailable())
			return 1;
	}
}

function treeHideContextItems(by_obj, identifier) {
	//Rückgabewert:
	// 0 = Sichtbar
	// 1 = Deaktiviert
	// 2 = Unsichtbar

	var pElm = $(by_obj);
	var tagName = $(by_obj).prop("tagName");

	var fext, directory;
	if(tagName == "li") {
		var filename = $(pElm).attr("filename");
		var t = filename.split("."), fext = t[t.length-1];

		if(t.length == 1)
			directory = true;
	}

	if((tagName == "vbox" || tagName == "html:ul") && ["ctxCopy","ctxCut","ctxRename","ctxDelete","ctxPack","ctxExplode","ctxOpen"].indexOf(identifier) >= 0)
		return 1;

	let workenv = getWorkEnvironmentByPath(_sc.workpath(by_obj));
	switch(identifier) {
		//Einfügen nur sichtbar bei gültigem Clipboard-Inhalt
		case "ctxPaste":
			if((["ocd", "ocg", "ocf"].indexOf(fext) || directory)
				&& Services.clipboard.hasDataMatchingFlavors(["application/x-moz-file"], 1, Services.clipboard.kGlobalClipboard))
				return 0;
			return 2;

		//Nur für Szenarien
		case "ctxOpenPars":
		case "ctxOpenFull":
			if(fext == "ocs")
				return 0;
			else
				return 2;

		case "ctxOpen":
			if(["ocd","ocg","ocf"].indexOf(fext) >= 0)
				return 1;
			break;

		case "ctxPack":
		case "ctxReload":
		case "ctxExplode":
			//Nur für Groupdateien. (Und Reload noch für Ordner)
			if(OCGRP_FILEEXTENSIONS.indexOf(fext) < 0 && !directory)
				return 1;

			//Packen/Zerlegen nicht für Ordner
			if(identifier != "ctxReload" && directory)
				return 1;

			break;
		
		case "ctxGit":
			if(!workenv.repository)
				return 2;
				
			if(!getAppByID("git").isAvailable())
				return 1;

		case "ctxExport":
			if(!_sc.clonkpath() || workenv.type == _mainwindow.WORKENV_TYPE_ClonkPath)
				return 2;
	}

	return 0;
}

function getTreeEntryData(entry, fext) {}

var specialData = {
	0: {ext: "ocp", img: "chrome://windmill/content/img/icon-fileext-ocp.png"},
	1: {ext: "ocf", img: "chrome://windmill/content/img/icon-fileext-ocf.png"},
	2: {ext: "ocs", img: "chrome://windmill/content/img/icon-fileext-ocs.png"},
	3: {ext: "ocg", img: "chrome://windmill/content/img/icon-fileext-ocg.png"},
	4: {ext: "ocm", img: "chrome://windmill/content/img/icon-fileext-ocm.png"},

	10: {ext: "txt", img: "chrome://windmill/content/img/icon-fileext-txt.png"},

	20: {ext: "png", img: "chrome://windmill/content/img/icon-fileext-png.png"},
	21: {ext: "bmp", img: "chrome://windmill/content/img/icon-fileext-bmp.png"},
	22: {ext: "jpg", img: "chrome://windmill/content/img/icon-fileext-jpg.png"},

	30: {ext: "mesh", img: "chrome://windmill/content/img/icon-fileext-mesh.png"},
	31: {ext: "skeleton", img: "chrome://windmill/content/img/icon-fileext-skeleton.png"},
	32: {ext: "material", img: "chrome://windmill/content/img/icon-fileext-material.png"},

	40: {ext: "c", img: "chrome://windmill/content/img/icon-fileext-c.png"},
	41: {ext: "ocd", img: "chrome://windmill/content/img/icon-fileext-ocd.png"},
	42: {ext: "wav", img: "chrome://windmill/content/img/icon-fileext-wav.png"},
	43: {ext: "ogg", img: "chrome://windmill/content/img/icon-fileext-ogg.png"},
	44: {ext: "mid", img: "chrome://windmill/content/img/icon-fileext-mid.png"},

	50: {ext: "ocu", img: "chrome://windmill/content/img/icon-fileext-ocu.png"},
	51: {ext: "oci", img: "chrome://windmill/content/img/icon-fileext-oci.png"},
}