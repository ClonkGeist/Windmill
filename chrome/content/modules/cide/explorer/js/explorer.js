var treeContextMenu = new ContextMenu(0, 0, MODULE_LPRE, { fnCheckVisibility: treeHideContextItems });
var workenvContextMenu = new ContextMenu(0, 0, MODULE_LPRE, { fnCheckVisibility: workenvHideContextItems });

function initializeDirectory() {
	var workenvs = getWorkEnvironments();
	for(var i = 0; i < workenvs.length; i++) {
		var id = createWorkEnvironmentEntry(workenvs[i], !i);

		//Verzeichnis einlesen und Inhalte auflisten
		loadDirectory(workenvs[i].path, getTreeCntById(id));
	}
}

function createWorkEnvironmentEntry(workenv, first) {
	var {type, path, title} = workenv;
	var img = "chrome://windmill/content/img/icon-workenvironment-ws.png", typeclass = " we-workspace";
	if(type == _mainwindow.WORKENV_TYPE_ClonkPath) {
		img = "chrome://windmill/content/img/icon-workenvironment-clonkdir.png";
		typeclass = " we-clonkdir";
	}
	if(workenv.repository)
		img = "chrome://windmill/content/img/icon-workenvironment-git.png";
	if(workenv.options.identifier == "UserData")
		img = "chrome://windmill/content/img/icon-workenvironment-user.png";

	var id = createTreeElement(MAINTREE_OBJ, title, true, 0, img, 0, "workenvironment"+typeclass);
	$(getTreeCntById(id)).attr("workpath", path);
	$(getTreeObjById(id)).attr("workpath", path);
	if(first)
		treeExpand(getTreeCntById(id), true);

	return id;
}

function explorerLoadWorkEnvironments() {
	//Arbeitsumgebungen laden
	var workenvs = _mainwindow.getWorkEnvironments();
	for(var i = 0, first = true; i < workenvs.length; i++) {
		let id;
		if(workenvs[i].options.identifier == "UserData")
			id = createWorkEnvironmentEntry(workenvs[i]);
		else {
			id = createWorkEnvironmentEntry(workenvs[i], first);
			first = false;
		}

		let c = i;
		//Falls Clonkverzeichnis, dann direkt laden. (Ausnahme: AlwaysExplode = true)
		if(workenvs[c].type == _mainwindow.WORKENV_TYPE_ClonkPath && !workenvs[c].alwaysexplode) {
			$("#msg-loading").remove();

			//Verzeichnis einlesen und Inhalte auflisten
			loadDirectory(workenvs[c].path, getTreeCntById(id));
		}
		//Ansonsten vorher Verzeichnis vorbereiten (c4group-explodes)
		else {
			PrepareDirectory(workenvs[c].path, function() {
				$("#msg-loading").remove();

				//Verzeichnis einlesen und Inhalte auflisten
				loadDirectory(workenvs[c].path, getTreeCntById(id));
			});
		}
	}

	unlockModule();
}

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

	explorerLoadWorkEnvironments();

	var dlgcontent = $("#dlg_workenvironment").html();
	$("#dlg_workenvironment").remove();

	//Erstellungsdialog fuer Arbeitsumgebungen
	$("#newWorkEnvironment").mousedown(function() {
		var dlg = new WDialog("$DlgNewWorkEnvironment$", MODULE_LPRE, { modal: true, css: { "width": "600px" }, btnright: [{ preset: "accept",
			onclick: function(e, btn, _self) {
				var error = (str) => { return $(_self.element).find("#dex_dlg_workenv_errorbox").text(Locale(str)); }

				var type = parseInt($(_self.element).find("#dex_dlg_workenv_type").val()), file;
				if(type == _mainwindow.WORKENV_TYPE_ClonkPath) {
					//Checken ob der angegebene Pfad existiert/valide ist
					var path = $(_self.element).find("#dex_dlg_workenv_ocpath").text();
					try {
						file = new _sc.file(path);
					}
					catch(err) {
						error("$DlgErrWEInvalidPath$")
						return e.stopImmediatePropagation();
					}

					if(!file.exists() || !file.isDirectory()) {
						error("$DlgErrWEPathDoesNotExist$");
						return e.stopImmediatePropagation();
					}

					var cdirs = JSON.parse(getConfigData("Global", "ClonkDirectories")) || [];

					//Ueberpruefen ob Pfad bereits vorhanden ist
					if(cdirs.indexOf(path) != -1) {
						error("$DlgErrWEAlreadyLoaded$");
						return e.stopImmediatePropagation();
					}

					//Ansonsten der Liste hinzufuegen und speichern
					cdirs.push(path);
					setConfigData("Global", "ClonkDirectories", cdirs, true);
					var workenv = createWorkEnvironment(path, _mainwindow.WORKENV_TYPE_ClonkPath);
					workenv.alwaysexplode = $(_self.element).find("#dex_dlg_workenv_explodecdir").attr("checked") || false;
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
				if(!path) {
					error("$DlgErrWENoWorkspaceDir$");
					return e.stopImmediatePropagation();
				}

				//Workspaceverzeichnis erstellen und ggf. Error zurueckwerfen
				try {
					file = _sc.file(path);
				} catch(err) {
					log(err, true);
					log(err.stack, true);
					error("$DlgErrWEInvalidPath$");
					return e.stopImmediatePropagation();
				}
				if(!file.exists()) {
					try {
						file.create(Ci.nsIFile.DIRECTORY_TYPE, 0o777);
					} catch(err) {
						log(err, true);
						log(err.stack, true);
						error("$DlgErrWENoAccess$");
						return e.stopImmediatePropagation();
					}
				}

				//Namen ueberpruefen
				var name = $(_self.element).find("#dex_dlg_workenv_name").val();
				if(type == 3) //Repository
					name = $(_self.element).find("#dex_dlg_workenv_destname").val();
				if(!name) {
					error("$DlgErrWENoName$");
					return e.stopImmediatePropagation();
				}

				//Ggf. Dateiliste generieren (Checklistbox)
				var options = {};

				if($(_self.element).find("#dex_dlg_workenv_fullcopy").attr("checked"))
					options.fullcopy = true;

				if(type == _mainwindow.WORKENV_TYPE_Workspace) {
					options.migrate_files = [];
					$(_self.element).find("#dex_dlg_workenv_filelist > .dlg-checklistitem").each(function() {
						if($(this).hasClass("hidden") && !options.fullcopy)
							return;
						if(!$(this).hasClass("selected") && !options.fullcopy)
							return;

						options.migrate_files.push($(this).text());
					});
					options.sourcedir = _sc.clonkpath(parseInt($(dlg.element).find("#dex_dlg_workenv_source_clonkdir").prop("value")));
				}
				else if(type == 3) {
					options.repository = _mainwindow.WORKENV_Repository_Git;
					options.cloneurl = $(_self.element).find("#dex_dlg_workenv_cloneurl").val();
					if($(_self.element).find("#dex_dlg_workenv_username").val()) {
						options.userinfo = { username: $(_self.element).find("#dex_dlg_workenv_username").val(),
											 password: $(_self.element).find("#dex_dlg_workenv_password").val(),
											 saveinfo: $(_self.element).find("#dex_dlg_workenv_saveuserinfo").attr("checked") };
					}

					//TODO: Auf Validitaet ueberpruefen
					if(!options.cloneurl) {
						error("$DlgErrWENoCloneURL$");
						return e.stopImmediatePropagation();
					}
					if(!$(_self.element).find("#dex_dlg_workenv_cfgusername").val()) {
						error("$DlgErrWERepositoryNoUserName$");
						return e.stopImmediatePropagation();
					}
					if(!$(_self.element).find("#dex_dlg_workenv_cfgemail").val()) {
						error("$DlgErrWERepositoryNoEmail$");
						return e.stopImmediatePropagation();
					}
					
					options.userconfig = { username: $(_self.element).find("#dex_dlg_workenv_cfgusername").val(), 
										   email: $(_self.element).find("#dex_dlg_workenv_cfgemail").val() };

					//Sonst wie ein normales Workspace behandeln...
					type = _mainwindow.WORKENV_TYPE_Workspace;
				}

				if($(_self.element).find("#dex_dlg_workenv_debug").attr("checked"))
					options.debug = true;
				if($(_self.element).find("#dex_dlg_workenv_nooperations").attr("checked"))
					options.no_file_operations = true;

				options.success = function(workenv) {
					_mainwindow.unlockModule();
					createWorkEnvironmentEntry(workenv);
					showNotification(undefined, Locale("$WESuccessfullyCreated$"), sprintf(Locale("$WESuccessfullyCreatedDesc$"), workenv.title));
				}
				options.rejected = function(err) {
					_mainwindow.unlockModule();
					EventInfo("An error occured while creating the work environment.");
				}

				_mainwindow.lockModule("Copying files to new directory. This may take a while.", true);
				createNewWorkEnvironment(path+"/"+name, type, options);
				_self.hide();
			}
		}, "cancel"]});

		dlg.setContent(dlgcontent);
		dlg.show();

		//Bei Auswahl von Checklistitems die Selection-Checkboxen aktualisieren
		$(dlg.element).find(".dlg-checklistitem").click(function() {
			if($(dlg.element).find("#dex_dlg_workenv_select_all").attr("checked"))
				$(dlg.element).find("#dex_dlg_workenv_select_all").attr("checked", false);
			if($(dlg.element).find("#dex_dlg_workenv_select_ocfiles").attr("checked"))
				if($(this).text().search(/\.oc.$/i) != -1)
					$(dlg.element).find("#dex_dlg_workenv_select_ocfiles").attr("checked", false);
		});
		//Dropdownmenue: Je nach Auswahl Inhalt anzeigen
		$(dlg.element).find("#dex_dlg_workenv_type").on("command", function() {
			$(dlg.element).find('.dex_dlg_workenv_content').css("display", "none");
			$(dlg.element).find('.dex_dlg_workenv_content[data-settingsgroup="'+$(this).find(":selected").attr("id")+'"]').css("display", "");
			if($(this).find(":selected").attr("id") == "dex_dlg_workenv_type_repository") {
				if(!getAppByID("git").isAvailable())
					$(dlg.element).find("#dex_dlg_workenv_errorbox").text(Locale("$DlgErrWEGitNotAvailable$"));
				else
					$(dlg.element).find("#dex_dlg_workenv_errorbox").text("");
			}
			else
				$(dlg.element).find("#dex_dlg_workenv_errorbox").text("");

			//Damit die Groesse der Checklistbox neu berechnet wird: (Da diese, solange versteckt, nicht korrekt berechnet wird)
			$(dlg.element).find("#dex_dlg_workenv_source_clonkdir").trigger("command");
		}).trigger("command");
		//Dateiliste ausblenden bei FullCopy
		$(dlg.element).find("#dex_dlg_workenv_fullcopy").on("command", function() {
			if($(this).attr("checked"))
				$(dlg.element).find('#dex_dlg_workenv_filelist,#dex_dlg_workenv_filelist_ctrls').css("display", "none");
			else
				$(dlg.element).find('#dex_dlg_workenv_filelist,#dex_dlg_workenv_filelist_ctrls').css("display", "");
		});
		//Alle auswaehlen
		$(dlg.element).find("#dex_dlg_workenv_select_all").on("command", function() {
			if($(this).attr("checked"))
				$(dlg.element).find(".dlg-checklistitem").addClass("selected");
			else
				$(dlg.element).find(".dlg-checklistitem").removeClass("selected");
		});
		//.oc? Dateien auswaehlen
		$(dlg.element).find("#dex_dlg_workenv_select_ocfiles").on("command", function() {
			var _this = this;
			$(dlg.element).find(".dlg-checklistitem").each(function() {
				if($(_this).attr("checked") && $(this).text().search(/\.oc.$/i) != -1)
					$(this).addClass("selected");
				else
					$(this).removeClass("selected");
			});
		});
		//Nur .oc? Dateien anzeigen
		$(dlg.element).find("#dex_dlg_workenv_showonlyocfiles").on("command", function() {
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
		$(dlg.element).find("#dex_dlg_workenv_ocpath_button").on("command", function() {
			//Filepicker offnen
			var fp = _sc.filepicker();
			fp.init(window, Locale("$DlgWEChooseOCDir$"), Ci.nsIFilePicker.modeGetFolder);

			var current_path = JSON.parse(getConfigData("Global", "ClonkDirectories"));
			if(current_path && current_path[0]) {
				var dir = new _sc.file(current_path[0]);
				if(dir.exists())
					fp.displayDirectory = dir;
			}

			var rv = fp.show();
			if(rv == Ci.nsIFilePicker.returnOK) {
				var ocexecname = "openclonk";
				if(OS_TARGET == "WINNT")
					ocexecname = "openclonk.exe";

				var ocexec = new _sc.file(fp.file.path+"/"+ocexecname);
				if(!ocexec.exists()) {
					warn("$err_ocexecutable_not_found$", "STG");
					return $(this).trigger("command");
				}

				$(dlg.element).find("#dex_dlg_workenv_ocpath").text(fp.file.path);
			}
		});
		var clonkdirs = JSON.parse(getConfigData("Global", "ClonkDirectories"));
		if(clonkdirs.length < 1)
			$(dlg.element).find("#dex_dlg_workenv_clonkdirset").css("display", "none");
		else {
			$(dlg.element).find("#dex_dlg_workenv_clonkdirset").css("display", "");

			for(var i = 0; i < clonkdirs.length; i++) {
				var workenv = getWorkEnvironmentByPath(clonkdirs[i]);
				$(dlg.element).find("#dex_dlg_workenv_source_clonkdir > menupopup").append('<menuitem label="'+workenv.title+'" value="'+i+'"/>');
			}
			//$(dlg.element).find("#dex_dlg_workenv_source_clonkdir")[0].selectItem = 0;
			$(dlg.element).find("#dex_dlg_workenv_source_clonkdir").prop("selectedIndex", 0).prop("value", "0").on("command", function() {
				//Auflisten
				var entries = (new _sc.file(_sc.clonkpath(this.value))).directoryEntries, list = "";
				while(entries.hasMoreElements()) {
					var entry = entries.getNext().QueryInterface(Ci.nsIFile);
					var additionalclasses = '';
					if($(dlg.element).find("#dex_dlg_workenv_select_all").attr("checked"))
						additionalclasses = ' selected';
					else if($(dlg.element).find("#dex_dlg_workenv_select_ocfiles").attr("checked")) {
						if(entry.path.search(/\.oc.$/i) != -1)
							additionalclasses = ' selected';
					}
					if($(dlg.element).find("#dex_dlg_workenv_showonlyocfiles").attr("checked"))
						if(entry.path.search(/\.oc.$/i) == -1)
							additionalclasses = ' hidden';

					list += `<hbox class="dlg-checklistitem${additionalclasses}">${entry.leafName}</hbox>`;
				}

				$(dlg.element).find("#dex_dlg_workenv_filelist").empty().html(list);
				dlg.updatePseudoElements();
			}).trigger("command");
		}
	});
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
			var header = new _sc.file(fp.file.path+"/.windmillheader");
			if(!header.exists()) {
				warn("$err_is_no_workspace$");
				return $(this).trigger("command");
			}

			if(_sc.workpath(fp.file))
				return warn("$err_workspace_already_loaded$");

			var createEnvironment = function() {
				var env = createWorkEnvironment(formatPath(getConfigData("CIDE", "WorkspaceParentDirectory"))+"/"+fp.file.leafName, _mainwindow.WORKENV_TYPE_Workspace, true);
				env.unloaded = false;
				env.saveHeader();
				createWorkEnvironmentEntry(env);
			}

			if(formatPath(fp.file.path).search(formatPath(getConfigData("CIDE", "WorkspaceParentDirectory"))) != -1)
				return createEnvironment();

			//Dialog oeffnen
			var dlg = new WDialog("$DlgWEImport$", MODULE_LPRE, { modal: true, css: { "width": "450px" }, btnright: [{ label: "$DlgBtnCopy$",
				onclick: function(e, btn, dialog) {
					fp.file.copyTo(_sc.file(getConfigData("CIDE", "WorkspaceParentDirectory")), fp.file.leafName);
					createEnvironment();
					dialog.hide();
				}
			},{ label: "$DlgBtnLink$",
				onclick: function(e, btn, dialog) {
					var env = createNewWorkEnvironment(formatPath(getConfigData("CIDE", "WorkspaceParentDirectory"))+"/"+fp.file.leafName, _mainwindow.WORKENV_TYPE_Workspace);
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

function onTreeItemBlur(obj) {
	var by = treeContextMenu.opened_by || workenvContextMenu.opened_by;
	if($(by).prop("tagName") != "li")
		by = $(by).parents("li")[0];

	if(by == obj)
		return true;

	return;
}

function initializeContextMenu() {
	//-- Kontextmenü initialisieren
	
	//Submenu "Neu"
	var submenu_new = new ContextMenu(0, [ //Neu
		//Spielinhalte

		["$ctxObject$", 0, function() {
			CreateNewGamefile("ocd", $(getCurrentTreeSelection()));
		}, 0, { iconsrc: "chrome://windmill/content/img/icon-fileext-ocd.png" }],
		["$ctxScenario$", 0, function() {
			CreateNewGamefile("ocs", $(getCurrentTreeSelection()));
		}, 0, { iconsrc: "chrome://windmill/content/img/icon-fileext-ocs.png" }],

		"seperator",

		//Ordner

		["$ctxfolder$", 0, function() { // Ordner erstellen
			createNewFile(Ci.nsIFile.DIRECTORY_TYPE, "$create_newfolder$", true, "chrome://windmill/content/img/icon-directory.png");
		}, 0, { iconsrc: "chrome://windmill/content/img/icon-directory.png" }],
		["$ctxobjfolder$", 0, function() { // Objektordner erstellen
			createNewFile(Ci.nsIFile.DIRECTORY_TYPE, "$create_newobjfolder$.ocd", true);
		}, 0, { iconsrc: "chrome://windmill/content/img/icon-fileext-ocd.png" }],
		["$ctxscenfolder$", 0, function() { // Rundenordner erstellen
			createNewFile(Ci.nsIFile.DIRECTORY_TYPE, "$create_newscenfolder$.ocf", true);
		}, 0, { iconsrc: "chrome://windmill/content/img/icon-fileext-ocf.png" }],

		//Textdateien
		"seperator",

		["$ctxtext$", 0, function() { // Textdatei erstellen
			var f = createNewFile(Ci.nsIFile.NORMAL_FILE_TYPE, "$create_newtxt$.txt", false);
			var fstr = _sc.ofstream(f, 2, 0x200);
			var cstr = _sc.costream();

			var text = " ";
			cstr.init(fstr, "utf-8", text.length, Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
			cstr.writeString(text);

			cstr.close();
			fstr.close();
		}, 0, { iconsrc: "chrome://windmill/content/img/icon-fileext-txt.png" }],

		//Bilddateien
		"seperator",

		["$ctxgbmp$", 0, function() { //BMPDatei erstellen
			createNewFile(Ci.nsIFile.NORMAL_FILE_TYPE, "$create_newimg$.bmp", false);
		}, 0, { iconsrc: "chrome://windmill/content/img/icon-fileext-bmp.png" }],
		["$ctxgpng$", 0, function() { //PNGDatei erstellen
			createNewFile(Ci.nsIFile.NORMAL_FILE_TYPE, "$create_newimg$.png", false);
		}, 0, { iconsrc: "chrome://windmill/content/img/icon-fileext-png.png" }],
		["$ctxgjpg$", 0, function() { //JPGDatei erstellen
			createNewFile(Ci.nsIFile.NORMAL_FILE_TYPE, "$create_newimg$.jpg", false);
		}, 0, { iconsrc: "chrome://windmill/content/img/icon-fileext-jpg.png" }],

		//Scriptdateien
		"seperator",

		["$ctxscript$", 0, function() { //Scriptdatei erstellen
			var f = createNewFile(Ci.nsIFile.NORMAL_FILE_TYPE, "$create_newscript$.c", false);
		
			//File-/Converterstream
			var fstr = _sc.ofstream(f, 2, 0x200);
			var cstr = _sc.costream();

			var text = "/*-- New Scriptfile --*/\r\n\r\n\r\n\r\nfunc Initialize() {\r\n  return true;\r\n}\r\n";
			cstr.init(fstr, "utf-8", text.length, Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
			cstr.writeString(text);

			cstr.close();
			fstr.close();
		}, 0, { iconsrc: "chrome://windmill/content/img/icon-fileext-c.png" }]
	], MODULE_LPRE, { allowIcons: true });

	treeContextMenu.addEntry("$ctxnew$", 0, 0, submenu_new, {identifier: "ctxNew"});
	//Duplizieren
	treeContextMenu.addEntry("$ctxduplicate$", 0, function() {
		var path = _sc.workpath() + getTreeObjPath(getCurrentTreeSelection());
		var f = new _sc.file(path);
		var t = f.leafName.split("."), fext = t[t.length-1];
		t.pop();
		if(t.length)
			var nofext = t.join(".");
		else
			var nofext = f.leafName;

		var nFilename = f.leafName, i = 1;
		while(_sc.file(f.parent.path+"/"+nFilename).exists()) {
			nFilename = nofext + " - " + i + "." + fext;
			i++;
		}
		f.copyTo(f.parent, nFilename);

		var cnt = $(getCurrentTreeSelection()).parent();
		if($(cnt).html().length)
			$(cnt).empty();

		loadDirectory(f.parent.path, cnt);
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

		var name = "c4group";
		if(OS_TARGET == "WINNT")
			name = "c4group.exe";

		var c4group = _sc.file(_sc.clonkpath() + "/" + name);
		var dir = _sc.file(_sc.workpath()+getTreeObjPath(sel));

		if(!c4group.exists() || !c4group.isExecutable())
			return warn("$err_group_not_found$");

		var process = _ws.pr(c4group);
		lockModule("Packing " + dir.leafName);
		process.create([dir.path, "-p"], 0x00000001, function(data) {
			log(data);
		}, function() {
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
			$(sel).addClass("tree-packed");
			EventInfo("$EI_Packed$");
		});
	}, 0, { identifier: 'ctxPack' });
	//Zerlegen
	treeContextMenu.addEntry("$ctxexplode$", 0, function() {
		var sel = getCurrentTreeSelection();
		var elmid = getTreeObjId(sel);
		var cnt = getTreeCntById(elmid);

		var name = "c4group";
		if(OS_TARGET == "WINNT")
			name = "c4group.exe";

		var c4group = _sc.file(_sc.clonkpath() + "/" + name);
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
			loadDirectory(dir.path, cnt);
			EventInfo("$EI_Exploded$");
		});
	}, 0, { identifier: 'ctxExplode' });

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

		var name = "openclonk";
		if(OS_TARGET == "WINNT")
			name = "openclonk.exe";

		var f = _sc.file(_sc.clonkpath() + "/" + name);
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

				var name = "openclonk";
				if(OS_TARGET == "WINNT")
					name = "openclonk.exe";

				var f = _sc.file(_sc.clonkpath() + "/" + name);
				var process = _ws.pr(f);
				var args = _mainwindow.$("#dex_dlg_parameters").val().split(' ');
				args.push(filepath);
				process.run(args, 0, 0, function(data) {
					log(data);
				});
			}
		}, "cancel"]});
		var pars = getOCStartArguments("").join(' ');
		dlg.setContent(`<hbox><description style="width: 450px;">$DlgOpenWithParsDesc$</description></hbox>
					    <hbox><textbox id="dex_dlg_parameters" placeholder="$DlgInputParameters$" value="${pars}" /></hbox>`);
		dlg.show();
		dlg = 0;
	}, 0, { identifier: 'ctxOpenPars' });
	
	/*-- WorkEnvironment ContextMenu --*/
	workenvContextMenu.addEntry("$ctxnew$", 0, 0, submenu_new);
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
			if(OS_TARGET == "WINNT") {
				var explorer = _sc.process(new _sc.file(_sc.env.get("windir")+"\\explorer.exe"));
				explorer.run(true, [_sc.workpath(getCurrentTreeSelection()).replace(/\//g, "\\")], 1); 
			}
		}, 0);
	}
	workenvContextMenu.addEntry("$ctxsettings$", 0, function() {
		var dlg = new WDialog("$DlgWorkEnvironmentSettings$", MODULE_LPRE, { modal: true, css: { "width": "600px" }, btnright: [{ preset: "accept",
			onclick: function(e, btn, _self) { }				
		}, "cancel"]});

		var dlgcontent = $("#dlg_workenvsettings").html();
		$("#dlg_workenvsettings").remove();
		dlg.setContent(dlgcontent);
		dlg.show();
	}, 0);
}

//Neue Spieldatei (Objekt/Szenario) erstellen
function CreateNewGamefile(type, treeobj) {
	var dir = _sc.file(_sc.chpath + "/content/modules/cide/explorer/cide_templates/"+type);
	if(!dir.exists())
		return warn("$err_template_not_found$");

	var dlgtitle = "Gamefile$";
	if(type == "ocs")
		dlgtitle = "Scenario$";
	else if(type == "ocd")
		dlgtitle = "Object$";

	//Dialog öffnen
	var dlg = new WDialog("$DlgCreateNew"+dlgtitle, MODULE_LPRE, { modal: true, css: { "width": "450px" }, btnright: [{ preset: "accept",
			//Annehmen-Button
			onclick: function(e, btn, _self) {
				var error = (str) => { return $(_self.element).find("#dex_dlg_gamefile_errorbox").text(Locale(str)); }

				var name = _mainwindow.$("#dex_dlg_gffilename").val();
				if(!name || (OS_TARGET == "WINNT" && name.search(/[\\/:*?"<>|]/) != -1) || name.length < 1) {
					error('$DlgInvalidFilename$');
					return e.stopImmediatePropagation();
				}

				name += '.'+type;

				var ndir = _sc.file(_sc.workpath(treeobj) + getTreeObjPath(treeobj) + '/' + name);
				if(ndir.exists()) {
					error('$DlgFilenameExists$');
					return e.stopImmediatePropagation();
				}

				var cidedir = dir;
				ndir.create(Ci.nsIFile.DIRECTORY_TYPE, 0o777);

				//Auswahl in neu erstelltes Verzeichnis kopieren
				_mainwindow.$('#dex_dlg_gffiles > .dlg-checklistitem.selected').each(function() {
					var f = _sc.file(cidedir.path + '/' + $(this).text());
					if(!f.exists())
						return;

					f.copyTo(ndir, f.leafName);
					return true;
				});

				//TODO: Für Szenarios, Scenario.txt abrufen (falls überhaupt vorhanden) und Definitions setzen

				$(getTreeCntById(getTreeObjId(treeobj))).empty();
				loadDirectory(_sc.workpath(treeobj) + getTreeObjPath(treeobj), getTreeCntById(getTreeObjId(treeobj)));
				setTimeout(function() {
					var new_tree_obj = $(getTreeCntById(getTreeObjId(treeobj))).find("[filename='"+ndir.leafName+"']");
					selectTreeItem(new_tree_obj, true);
					treeExpand(new_tree_obj);
				}, 10);
			}}, "cancel"]});

	var selectedFiles = readFile(dir.path+'/.templateList.txt');
	if(!selectedFiles)
		selectedFiles = '';

	//Dateiauswahl erstellen
	var content = `<vbox><hbox class="dlg_infobox error" id="dex_dlg_gamefile_errorbox"><description></description></hbox>
				   <vbox><description>$DlgGfFilenameDesc$</description><textbox id="dex_dlg_gffilename"></textbox></vbox><vbox>
				   <description>$DlgGfPickFiles$</description></vbox><vbox id="dex_dlg_gffiles" class="dlg-checklistbox">`;

	//Auflisten
	var entries = dir.directoryEntries;
	while(entries.hasMoreElements()) {
		var entry = entries.getNext().QueryInterface(Ci.nsIFile);

		if(entry.leafName == ".templateList.txt")
			continue;

		//Falls in der Liste vorhanden, Datei auswählen
		var selstr = '';
		if(OS_TARGET == "WINNT") {
			if(selectedFiles.search(RegExp("(^|\\|)"+entry.leafName+"($|\\|)")) != -1)
				selstr = ' selected';
		}
		else if(selectedFiles.search(RegExp("(^|/|)"+entry.leafName+"($|/|)")) != -1)
			selstr = ' selected';

		content += `<hbox class="dlg-checklistitem ${selstr}">${entry.leafName}</hbox>`;
	}

	content += '</vbox></vbox>';

	dlg.setContent(content);
	dlg.show();
	setTimeout(function() { $(dlg.element).find("#dex_dlg_gffilename")[0].focus(); dlg = 0; }, 10);

	return true;
}

function getFullPathForSelection() { return _sc.workpath() + getTreeObjPath(getCurrentTreeSelection()); }

//Neue Datei erstellen
function createNewFile(type, name, container, image) {
	var path = _sc.workpath() + getTreeObjPath(getCurrentTreeSelection());
	var f = _sc.file(path+"/"+Locale(name));
	f.createUnique(type, 0o777);

	if(!image) {
		var t = f.leafName.split("."), fext = t[t.length-1];
		image = "chrome://windmill/content/img/icon-fileext-other.png";

		for(var p in specialData) {
			var d = specialData[p];

			if(d.ext == fext && d.img.length) {
				image = d.img;
				break;
			}
		}
	}

	var cnt = getTreeCntById(getTreeObjId(getCurrentTreeSelection()));
	if($(cnt).html().length)
		$(cnt).empty();

	loadDirectory(path, cnt, 0, true);

	//Auswahl mit setTimeout verzoegert durchfuehren, da die Auswahl sonst wegen dem Kontextmenue sofort verschwindet (blur)
	setTimeout(function() {
		selectTreeItem($(cnt).find('[filename="'+f.leafName+'"]'), true);
		renameTreeObj($(cnt).find('[filename="'+f.leafName+'"]'));
	}, 10);

	return f;
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

	return createTreeElement(cnt, f.leafName, f.isDirectory(), 0, img);
}

function onTreeObjRename(obj, name) {
	var f = _sc.file(_sc.workpath(obj)+getTreeObjPath(obj));
	if(!f.exists())
		return false;

	var p = f.parent;

	try { f = f.renameTo(p, name); }
	catch(e) {
		warn("$err_could_not_rename_file$");
		
		log(e, true);
		log(e.stack, true);
		return -1;
	}

	var env;
	if($(obj).hasClass("workenvironment") && (env = getWorkEnvironmentByPath($(obj).attr("workpath"))))
		env.path = p.path+"/"+name;

	return true;
}

function getOCStartArguments(path) {
	var args = ["--editor", "--nonetwork", path];
	if(!getConfigData("CIDE", "RejectScenarioBackup")) {
		//Scenario.txt temporaer backuppen, mit vollen Pfaden veraendern und dann wieder zuruecksetzen
		var scenario = new _sc.file(`${path}/Scenario.txt`);
		if(scenario.exists()) {
			var content = readFile(scenario);
			var data = parseINIArray(content);
			for(var key in data["Definitions"]) {
				var def = data["Definitions"][key];

				var newpath = _sc.workpath(path)+"/"+def;
				var file = new _sc.file(newpath);
				if(file.exists()) {
					newpath = newpath.replace(/\//g, "\\");
					data["Definitions"][key] = newpath;
				}
			}

			var order = ["Head", "Definitions", "Game", "Player1", "Player2", "Player3", "Player4", "Landscape", "Weather", "Animals"], text = "";

			//Sonstige Sections
			for(var key in data)
				if(data[key] instanceof Array && order.indexOf(key) == -1 && isNaN(parseInt(key)))
					order.push(key);

			//Text generieren
			for(var i = 0; i < order.length; i++) {
				var sect = order[i];
				if(!data[sect])
					continue;

				text += "["+sect+"]\r\n";
				for(var key in data[sect]) {
					if(data[sect][key] === undefined)
						continue;

					text += key+"="+data[sect][key]+"\r\n";
				}

				text += "\r\n";
			}

			writeFile(scenario, text);

			//Zuruecksetzen
			setTimeout(function() {
				writeFile(scenario, content);
				log("Scenario file is now successfully resetted.");
			}, 5000);
		}
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
			if(["ocd", "ocs","ocg","ocf","ocs", "oci", "ocp"].indexOf(fext) < 0 && !directory)
				return 1;

			//Packen/Zerlegen nicht für Ordner
			if(identifier != "ctxReload" && directory)
				return 1;

			break;
		
		case "ctxGit":
			var workenv;
			if(!(workenv = getWorkEnvironmentByPath(_sc.workpath(by_obj))))
				return 2;
			if(!workenv.repository)
				return 2;
				
			if(!getAppByID("git").isAvailable())
				return 1;
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