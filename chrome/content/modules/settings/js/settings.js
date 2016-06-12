let keybinding_changes = false;

hook("load", function() {
	setTimeout(function() {
		$(".view-directory-path").each(function() {
			var options = filePickerOptions($(this).attr("id"));
			if(!options)
				return;

			$(this).text(getConfigData(options.cfgsect, options.cfgkey));
		});

		loadEditorThemes(_sc.chpath + "/content/modules/cide/editor/js/ace");

		$(".extprogram").each(function() {
			let type = $(this).attr("id").replace(/row-/, "");
			if(getConfigData("CIDE", "ExtProg_"+type))
				$(this).find(".view-directory-path").text(getConfigData("CIDE", "ExtProg_"+type));
			if(getConfigData("CIDE", "AU_"+type))
				$(this).find(".extprogram-always-use").prop("checked", true);
		});

		let iterator;
		Task.spawn(function*() {
			iterator = new OS.File.DirectoryIterator(_sc.chpath+"/content/locale");
			let i = 0, entry, text;
			while(true) {
				entry = yield iterator.next();
				if(!entry.isDir)
					continue;

				try { text = yield OS.File.read(entry.path+"/langcfg.ini", {encoding: "utf-8"}); } catch(e) { continue; }

				let parser = parseINIArray(text);
				$("#languageselection").append('<menuitem label="'+parser["Head"]["Lang"]+' - '+parser["Head"]["Name"]+'" value="'+entry.name+'" />');
				if(entry.name == getConfigData("Global", "Language"))
					$("#languageselection").parent()[0].selectedIndex = i;
				++i;
			}
		}).then(null, function(reason) {
			iterator.close();
			if(reason != StopIteration)
				throw reason;
		});
		
		let completers = getConfigData("Scripteditor", "Completers");
		$("#completerSelection").parent().on("command", function(e) {
			setConfigData("Scripteditor", "Completers", $(this)[0].selectedItem.value);
			if(parseInt($(this)[0].selectedItem.value) != completers)
				changeNeedsRestart = true;
			else
				changeNeedsRestart = false;
		});
		$("#completerSelection").parent()[0].selectedItem = $("#completerSelection").find('menuitem[value="'+completers+'"]')[0];

		//KeyBindings auflisten
		var keybindings = _mainwindow.customKeyBindings, current_prefix;

		for(var key2 in keybindings) {
			let key = key2;
			var t = key.split("_");
			var prefix = t[0], val = keybindings[key];

			if(!prefix || t.length <= 1)
				continue;

			t.shift();
			var key_corename = t.join('_');
			if(_mainwindow.keyBindingList) {
				let no_customization = false;
				for(let kb of _mainwindow.keyBindingList) {
					if(kb.getIdentifier() == key) {
						no_customization = kb.options.no_customization
						break;
					}
				}
				if(no_customization)
					continue;
			}

			//ggf. neuen Header erzeugen
			if(prefix != current_prefix) {
				var clone = $(".pkb-list-subheader.draft").clone();
				clone.removeClass("draft");

				clone.find(".pkb-list-sh-caption").text(Locale("$KeyBindingsHeaderCaption$", prefix));
				clone.appendTo($("#pkb-keybindings-list"));

				current_prefix = prefix;
			}

			//Listeneintrag erstellen
			var clone = $(".pkb-list-entry.draft").clone();
			clone.removeClass("draft");

			clone.attr("keyname", key);
			clone.attr("lprefix", prefix);
			clone.find(".pkb-list-entry-desc").text(Locale("$KEYB_"+key_corename+"$", prefix));
			var lkeyw = Locale("$KEYCODE_"+val.replace(/-?(Ctrl|Shift|Alt)-?/g, "")+"$", -1);
			if(lkeyw[0] != "$") {
				if(val.search(/(Ctrl|Shift|Alt)/) != -1)
					clone.find(".pkb-list-entry-keys").text(val.replace(/-([^-]*-?)$/, "")+"-"+lkeyw);
				else
					clone.find(".pkb-list-entry-keys").text(lkeyw);
			}
			else
				clone.find(".pkb-list-entry-keys").text(val);
			clone.appendTo($("#pkb-keybindings-list"));

			//Neue Taste zuweisen
			clone.click(function() {
				//Dialog öffnen
				var dlg = new WDialog("$DlgApplyNewKey$", MODULE_LPRE, { modal: true, cancelOnModal: true, simple: true, css: { "width": "450px" }});
				dlg.show();

				$(dlg.element).keydown((e) => {
					if(["Shift", "Control", "Alt"].indexOf(e.key) != -1)
						return;

					var keystr = "";
					if(e.ctrlKey)
						keystr += "Ctrl-";
					if(e.altKey)
						keystr += "Alt-";
					if(e.shiftKey)
						keystr += "Shift-";

					var lkeystr = keystr + getKeyCodeIdentifier(e.keyCode, true);
					keystr += getKeyCodeIdentifier(e.keyCode);

					let applyKeyBinding = (key, val) => {
						$(this).find(".pkb-list-entry-keys").text(val);
						_mainwindow.customKeyBindings[key] = val;
						keybinding_changes = true;
					}

					var ckey, prefix = $(this).attr("lprefix");
					if(ckey = isShortcutAlreadyInUse(keystr, prefix)) {
						dlg.hide();

						var ckeydata = ckey.match(/(.*?)_(.+)/i);
						if(ckeydata[0] == $(this).attr("keyname"))
							return;

						dlg = new WDialog("$DlgConflictedKey$", MODULE_LPRE, { modal: true, css: { "width": "450px" },
							btnright: [{preset: "accept", onclick: function(e, btn, _self) {
								$(".pkb-list-entry[keyname="+ckey+"]").find(".pkb-list-entry-keys").text("");
								_mainwindow.customKeyBindings[ckey] = "";
								applyKeyBinding(key, keystr);
							}}, "cancel"]});

						dlg.setContent(`<description style="width: 450px;">$DlgConflictedKeyDesc$</description>
									   <hbox flex="1"><label value="`+Locale("$KeyBindingsHeaderCaption$", ckeydata[1])`" flex="1" style="font-weight: bold" />
											<label value="`+Locale("$KEYB_"+ckeydata[2]+"$", ckeydata[1])+`" flex="1" />
											<label value="${keystr}" flex="1"/></hbox>
									   <description style="width: 450px;">$DlgConflictedKeyDesc2$</description>`);
						dlg.show();
					}
					else {
						applyKeyBinding(key, keystr);

						dlg.hide();
					}
				});
			});
		}

		$("#restartBarButton").click(function() {
			var files = [];
			if(getModuleByName("cide"))
				files = getModuleByName("cide").contentWindow.getUnsavedFiles();

			if(files.length) {
				dlg = new WDialog("$DlgUnsavedChanges$", MODULE_LPRE, { modal: true, css: { "width": "450px" },
					btnright: [{preset: "accept", onclick: function(e, btn, _self) {
						$(_self.element).find(".dlg-checklistitem.selected").each(function() {
							var index = parseInt($(this).attr("data-fileindex"));
							if(files[index].module.saveFileByPath)
								files[index].module.saveFileByPath(files[index].filepath);
						});

						_mainwindow.restartWindmill();
					}}, "cancel"]});
				
				var liststr = '<vbox id="dex-dlg-gffiles" class="dlg-checklistbox">';
				for(var i = 0; i < files.length; i++)
					liststr += '<hbox class="dlg-checklistitem" data-fileindex="'+i+'">'+files[i].filepath.replace(_sc.workpath(files[i])+"/", "")+'</hbox>';
				
				liststr += "</vbox>"

				dlg.setContent('<description>$DlgUnsavedChangesDesc$</description>'+liststr+
							   '<description>$DlgUnsavedChangesDesc2$</description>');
				dlg.show();
				
				$(dlg.element).find(".dlg-checklistitem").click(function() {
					var index = parseInt($(this).attr("data-fileindex"));
					_mainwindow.mainDeck.show(_mainwindow.mainDeck.getModuleId("cide"));
					getModuleByName("cide").contentWindow.fileLoadedInModule($(files[index].module).attr("name"), files[index].filepath, true);
				});
				
				return;
			}
			else
				_mainwindow.restartWindmill();
		});

		var applications = _mainwindow.application_data;
		for(var id in applications) {
			let obj = applications[id];
			if(!obj)
				continue;

			var clone = $(".applist-item.draft").clone();
			clone.removeClass("draft");
			clone.appendTo($("#application-list"));
			clone.attr("default-appid", obj.identifier);
			clone.find(".applist-img").attr("src", obj.icon);
			clone.find(".applist-title").val(obj.name);
			clone.find(".applist-desc").text(Locale(obj.data.description, -1));
			clone.find(".applist-path").val(obj.path);
			clone.find(".applist-browse").click(function() {
				openProgramDialog(this, obj);
			});
		}

		//Simplere Einstellungselemente automatisch initialisieren
		$(".autoinit").each(function() {
			let sect = $(this).attr("default-cfgsect");
			let key = $(this).attr("default-cfgkey");
			if(!sect || !key)
				throw "No section or key for auto initialized settings element defined.";
			let val = getConfigData(sect, key), event = "command";

			//Wert und Event je nach Elementart setzen
			switch($(this).prop("tagName").toLowerCase()) {
				case "checkbox":
					$(this).attr("checked", val);
					break;

				case "textbox":
					event = "input";
					$(this).val(val);
					break;

				default:
					$(this).val(val);
					break;
			}
			//Bei Veraenderung diese in der Config temporaer speichern
			$(this).on(event, function() {
				switch($(this).prop("tagName").toLowerCase()) {
					case "checkbox":
						val = $(this).attr("checked");
						break;

					default:
						val = $(this).val();
						break;
				}

				setConfigData(sect, key, val);
			});
		});

		$(".extprogram-always-use").on("command", function() {
			let id = $(this).parent().attr("id").replace(/row-/, "");
			setConfigData("CIDE", "AU_"+id, $(this).prop("checked"));
		});
		$(".extprogram-clear").click(function() {
			let id = $(this).parent().attr("id").replace(/row-/, "");
			setConfigData("CIDE", "ExtProg_"+id, "");
			$(this).parent().find(".view-directory-path").text(Locale("$pathempty$"));
		});
		tooltip($("#explorer-scendef-polyfill")[0], "$TooltipDEXScendefPolyfill$");
		tooltip($("#scenariosettings-module-cache")[0], "$TooltipSCEModuleCache$");
		tooltip($("#cbridge-gameport")[0], "$TooltipSGGamePort$");
	}, 1);
});

const TEMPORARY_DATA_PATH = _sc.profd+"/tmp";
let clearTempDataTask;

function showDeckItem() {
	if(clearTempDataTask)
		return;

	clearTempDataTask = Task.spawn(function*() {
		$("#clear-temp-data").attr("data-additional", Locale("$Calculating$"));
		function* calcDirSize(fpath) {
			if(clearTempDataTask == -2)
				return -1;
			let size = 0;
			let iterator = new OS.File.DirectoryIterator(fpath);
			entries = yield iterator.nextBatch();
			iterator.close();
			for(var i = 0; i < entries.length; i++) {
				if(entries[i].isDir)
					size += yield* calcDirSize(entries[i].path);
				else {
					let info = yield OS.File.stat(entries[i].path);
					size += info.size;
				}
				if(clearTempDataTask == 2)
					return -1;
			}

			return size;
		}
		let totalsize = yield* calcDirSize(TEMPORARY_DATA_PATH);
		if(totalsize == -1)
			return -1;

		if(!totalsize)
			$("#clear-temp-data").attr("data-additional", Locale("$Empty$"));
		else {
			totalsize /= 1024;
			let unit = "KB";
			if(totalsize > 1024) {
				totalsize /= 1024;
				unit = "MB";
				if(totalsize > 1024) {
					totalsize /= 1024;
					unit = "GB";
				}
			}
			$("#clear-temp-data").attr("data-additional", Math.floor(totalsize)+" "+unit);
		}
	});
	clearTempDataTask.then(function(val) {
		if(val != -1)
			clearTempDataTask = false;
	}, function(reason) {
		log("Temp Data calculation failed: " + reason);
		clearTempDataTask = false;
		$("#clear-temp-data").attr("data-additional", Locale("$Failed$"));
	});
}

function clearTemporaryData() {
	clearTempDataTask = 2;
	Task.spawn(function*() {
		let iterator = new OS.File.DirectoryIterator(TEMPORARY_DATA_PATH);
		entries = yield iterator.nextBatch();
		iterator.close();
		for(var i = 0; i < entries.length; i++) {
			if(entries[i].isDir)
				yield OS.File.removeDir(entries[i].path, {ignoreAbsent: true});
			else
				yield OS.File.remove(entries[i].path, {ignoreAbsent: true});
		}
		$("#clear-temp-data").attr("data-additional", Locale("$Empty$"));
		EventInfo("$EI_TempCleared$");
		clearTempDataTask = false;
	}).then(null, function(reason) {
		log("Clearing temporary data failed: " + reason);
		EventInfo("An error occured while trying to clear temporary data.");
	});
}

function rejectDeckPageLeave(deck, newPageId) {
	let changed = keybinding_changes, cfg = getConfig();
	if(!changed)
		for(var sect in cfg)
			for(var key in cfg[sect])
				if(cfg[sect][key].value != cfg[sect][key]._value) {
					changed = true;
					break;
				}
	//Falls ungespeicherte Aenderungen vorhanden sind, zum Speichern auffordern
	if(changed) {
		dlg = new WDialog("$DlgUnsavedChanges$", MODULE_LPRE, { modal: true, css: { "width": "450px" },
			btnright: [{onclick: function(e, btn, _self) {
				saveSettings();
				deck.show(newPageId);
				_self.hide();
			}, label: "$DlgBtnSave$"},
			{onclick: function(e, btn, _self) {
				deck.show(newPageId);
				_self.hide();
			}, label: "$DlgBtnSkip$"},
			"cancel"]});

		dlg.setContent('<description>$DlgUnsavedConfigChangesDesc$</description>');
		dlg.show();
		return true;
	}
	return false;
}

var changeNeedsRestart = false;

function isShortcutAlreadyInUse(shortcut, pfx) {
	var conflicted = getModuleDefByPrefix(pfx).keyb_conflictedmodules;
	if(conflicted)
		conflicted = conflicted.split(";");

	for(var key in _mainwindow.customKeyBindings) {
		if(_mainwindow.customKeyBindings[key] == shortcut) {
			if(!pfx)
				return key;
			else {
				var prefix = key.match(/(.*?)_.+/i);
				if(!prefix || !prefix[1] || prefix[1] == pfx)
					return key;

				if(!conflicted)
					return false;
				prefix = prefix[1];
				var modname = getModuleDefByPrefix(prefix).modulename;

				for(var i = 0; i < conflicted.length; i++)
					if(RegExp("^" + conflicted[i].replace("*", ".*") + "$").test(modname))
						return key;
			}
		}
	}

	return false;
}

function onLanguageSelected(obj) {
	setConfigData("Global", "Language", obj.selectedItem.value);
	changeNeedsRestart = true;
}

function togglePage( id, stackId, button) {
	// calc node index in parent element
	var index = 0, child = $("#" + id).parent()[0];

	while((child = child.previousSibling) != null)
		index ++;

	$("#settings-deck").attr("selectedIndex", index);
	$("#settings-nav").find(".active").removeClass("active");
	$(button).addClass("active");
}

function saveSettings() {
	$(".autoinit").each(function() {
		var sect = $(this).attr("default-cfgsect");
		var key = $(this).attr("default-cfgkey");
		if(!sect || !key)
			throw "No section or key for auto initialized settings element defined.";
		var val;

		switch($(this).prop("tagName").toLowerCase()) {
			case "checkbox":
				val = $(this).attr("checked");
				break;

			default:
				val = $(this).val();
				break;
		}

		setConfigData(sect, key, val);
	});
	Task.spawn(function*() {
		yield saveConfig();
		yield _mainwindow.saveKeyBindings();
		keybinding_changes = false;
	}).then(function() {
		EventInfo("$EI_Saved$", -1);		
		if(changeNeedsRestart)
			$("#restartBar").addClass("active");
	});
}

function filePickerOptions(id) {
	var r = {};
	switch(id) {
		case 'c4group-path':
			r = { 
				cfgsect: "Global",
				cfgkey: "C4GroupPath",
				title: "$ChooseC4GroupFile$",
				callback: function(file) {
					let expected_filename = "c4group";
					if(OS_TARGET == "WINNT")
						expected_filename = "c4group.exe";
					if(file.leafName != expected_filename || !file.isExecutable())
						return -1;
				},
				mode: Ci.nsIFilePicker.modeOpen,
				filters: Ci.nsIFilePicker.filterApps
			};
			break;

		case 'workspace-dir':
			r = { cfgsect: "CIDE", cfgkey: "WorkspaceParentDirectory", title: "$ChooseWorkspaceDirectory$", writablecheck: true };
			break;
	}

	return r;
}

function openPathDialog(id) {
	var options = filePickerOptions(id);

	//Filepicker öffnen
	let fp = _sc.filepicker(), mode = options.mode;
	if(mode == undefined)
		mode = Ci.nsIFilePicker.modeGetFolder;
	fp.init(window, Locale(options.title), mode);

	var current_path = getConfigData(options.cfgsect, options.cfgkey);
	if(current_path) {
		var dir = new _sc.file(current_path);
		if(dir.exists())
			fp.displayDirectory = dir;
	}
	if(options.filters)
		fp.appendFilters(options.filters);

	var rv = fp.show();

	//Ordner gefunden
	if(rv == Ci.nsIFilePicker.returnOK) {
		if(options.callback && options.callback(fp.file) == -1)
			return openPathDialog(id);

		setConfigData(options.cfgsect, options.cfgkey, fp.file.path);
		saveConfig();

		// ATM etwas hackig der Check da ich grad nicht weiss wie man pruefen kann ob in dem jeweiligen Ordner 
		// Dateien erstellt/geschrieben werden koennen, also ob die Rechte da sind (isWritable/isReadable bringt btw nichts)
		if(options.writablecheck) {
			try {
				var testfile = new _sc.file(fp.file.path+"/TEST.txt");
				if(testfile.exists())
					testfile.remove(false);

				testfile.create(Ci.nsIFile.NORMAL_FILE_TYPE, 0o666);
				testfile.remove(false);
				$("#"+id).removeClass("deniedAccess");
			} catch(err) {
				log(err, true);
				log(err.stack, true);
				$("#"+id).addClass("deniedAccess");
			}
		}

		$("#"+id).text(fp.file.path);
	}

	return true;
}

function openProgramDialog(obj, extApp) {
	var type = $(obj).parent().attr("id");
	type = type.replace(/row-/, "");

	//Filepicker öffnen
	var fp = _sc.filepicker();
	fp.init(window, Locale("$choose_program$"), Ci.nsIFilePicker.modeOpen);

	var current_path = getConfigData("CIDE", "ExtProg_"+type);
	if(extApp)
		current_path = extApp.path;
	if(current_path)
		if((new _sc.file(current_path)).exists())
			fp.defaultString = current_path;

	fp.appendFilters(Ci.nsIFilePicker.filterApps);

	var rv = fp.show();
	if(rv == Ci.nsIFilePicker.returnOK) {
		let path = formatPath(fp.file.path);
		if(extApp) {
			if(fp.file.leafName != extApp.needed_file) {
				warn(extApp.needed_file + " was not found.");
				return openProgramDialog(obj, extApp);
			}
			else
				extApp.path = path;
		}
		else
			setConfigData("CIDE", "ExtProg_"+type, path);

		saveConfig();

		if(extApp)
			$('[default-appid="'+extApp.identifier+'"]').find(".applist-path").val(path);
		else
			$(obj).parent().find(".view-directory-path").text(path);
	}

	return true;
}

function loadEditorThemes(path) {
	//ace-Ordner
	var f = _sc.file(path);
	if(!f.exists() || !f.isDirectory())
		return;

	//Verzeichnisse einzelnd untersuchen
	var entries = f.directoryEntries;

	while(entries.hasMoreElements()) {
		var entry = entries.getNext().QueryInterface(Ci.nsIFile);
		if(entry.leafName.split("-")[0] == "theme") //überprüfen ob die Datei mit "theme-" beginnt
			insertEditorTheme(entry);
	}
}

function insertEditorTheme(entry) {
	// cut it out
	var name = entry.leafName.substr(6, entry.leafName.length - 9);

	$('#editor-theme-list').append('<listitem label="'+name+'" class="list-acethemes" />');
}

function setAceTheme() {
	var themename = $(".list-acethemes:selected").prop("label");
	var modules = getModulesByName("scripteditor");

	for(var i = 0; i < modules.length; i++) {
		if(!modules[i] || !modules[i].contentWindow)
			continue;

		modules[i].contentWindow.applyTheme(themename);
	}

	setConfigData("CIDE", "EditorTheme", themename);
	saveConfig();

	return true;
}

function toggleContents(el) {
	$(el.nextSibling).toggle();
}

function frameWindowTitle() {}
