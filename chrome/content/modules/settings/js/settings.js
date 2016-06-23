let keybinding_changes = false;

hook("load", function() {
	setTimeout(function() {
		$(".view-directory-path").each(function() {
			var options = filePickerOptions($(this).attr("id"));
			if(!options)
				return;

			$(this).text(getConfigData(options.cfgsect, options.cfgkey));
		});

		let modules = getModuleDefs();
		for(let mname in modules) {
			let module = modules[mname];
			if(!module.cidemodule || !module.matchinggroup)
				continue;

			//Create module overview
			if(module.cidemodule || module.cbridgemodule) {
				let target = module.cidemodule?"#settings-page-cide":"#settings-page-cbridge";
				let clone = $(".moduleentry.draft").clone();
				clone.removeClass("draft");
				
				//Title and description
				clone.find(".moduletitle").text(Locale(module.modulename, module.languageprefix));
				tooltip(clone.find(".icon-info")[0], module.description, "xul", 150, { target: clone.find(".moduleinfo")[0], lpre: module.languageprefix, css: {"max-width": "260px", "width": "260px"} });
				tooltip(clone.find(".icon-warning")[0], "$ForcedModuleDeactivation$", "xul", 150);
				
				let gradient = "linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0) 48%, rgba(255, 255, 255, 0.8) 90%),";
				if(!module.settings.previewimage)
					clone.find(".modulebackground").css("background-image", gradient+"url(chrome://windmill/content/"+formatPath(module.relpath)+"/previewimage.png)");
				else
					clone.find(".modulebackground").css("background-image", gradient+"url(chrome://windmill/content/"+formatPath(module.relpath)+"/"+module.settings.previewimage+")");

				//[TODO/ADDONS:] Addons should not be able to use this option
				if(!module.isnotdeactivatable) {
					let state = getConfigData("Modules", module.name+"_State");
					if(state)
						clone.addClass("deactivated"+(state==2?" forced":""));
					let btn = $("<box class='modulectrl icon-togglestate icon-24'></box>");
					btn.click(function(e) {
						e.stopPropagation();
						if(getConfigData("Modules", module.name+"_State")) {
							setConfigData("Modules", module.name+"_State", 0, true);
							clone.removeClass("deactivated forced");
							return;
						}

						let forced_mode = false;
						if(e.ctrlKey)
							forced_mode = true;
						//For CIDE modules: show warning about unsaved changes.
						if(module.cidemodule) {
							function cleanUnusedModules() {
								let modules = getModulesByName(module.name);
								for(let module of modules) {
									if(forced_mode || module.contentWindow.parent.MODULE_NAME == "cide") {
										getModuleByName("cide").contentWindow.detachModule(module);
										$(module).remove();
									}
								}
								setConfigData("Modules", module.name+"_State", 1+forced_mode, true);
								clone.addClass("deactivated"+(forced_mode?" forced":""));
							}

							//Get list of all unsaved changes
							let files;
							files = getModuleByName("cide").contentWindow.getUnsavedFiles();

							if(!files || !files.length) {
								//create confirmation dialog
								dlg = new WDialog("$DlgConfirmModuleDeactivation$", MODULE_LPRE, { modal: true, css: { "width": "450px" },
									btnright: [{preset: "accept", onclick: function(e, btn, _self) {
										//remove iframes
										cleanUnusedModules();
									}}, "cancel"]});
								dlg.setContent(Locale("<description>$DlgConfirmModuleDeactivationDesc"+(forced_mode?"Forced":"")+"$</description>"));
								dlg.show();
							}
							else {
								//create dialog
								dlg = new WDialog("$DlgUnsavedChanges$", MODULE_LPRE, { modal: true, css: { "width": "450px" },
									btnright: [{preset: "accept", onclick: function(e, btn, _self) {
										$(_self.element).find(".dlg-checklistitem.selected").each(function() {
											let index = parseInt($(this).attr("data-fileindex"));

											//Save tab
											if(files[index].module.saveFileByPath)
												files[index].module.saveFileByPath(files[index].filepath);
										});
										//switch back to settings
										_mainwindow.mainDeck.show(_mainwindow.mainDeck.getModuleId("settings"));
										//remove iframes
										cleanUnusedModules();
									}}, {preset:"cancel", onclick: function() {
										//switch back to settings
										_mainwindow.mainDeck.show(_mainwindow.mainDeck.getModuleId("settings"));
									}}]});

								//Generate list of unsaved files
								let liststr = '<vbox id="dex-dlg-gffiles" class="dlg-checklistbox">';
								for(let i = 0; i < files.length; i++)
									if(files[i].module.MODULE_NAME == module.name)
										liststr += '<hbox class="dlg-checklistitem" data-fileindex="'+i+'">'+files[i].filepath.replace(_sc.workpath(files[i])+"/", "")+'</hbox>';

								liststr += "</vbox>"

								dlg.setContent('<description>$DlgUnsavedChangesDesc$</description>'+liststr+
											   '<description>$DlgUnsavedChangesDesc3$</description>'+
											   (forced_mode?"<hbox class=\"dlg-infobox\"><description>$DlgUnsavedChangesDesc3Forced$</description></hbox>":""));
								dlg.show();

								$(dlg.element).find(".dlg-checklistitem").click(function() {
									let index = parseInt($(this).attr("data-fileindex"));
									_mainwindow.mainDeck.show(_mainwindow.mainDeck.getModuleId("cide"));
									getModuleByName("cide").contentWindow.fileLoadedInModule($(files[index].module).attr("name"), files[index].filepath, true);
								});

								return;
							}
						}
						else {
							//TODO: Handling of other modules.
						}
					});
					btn.appendTo(clone.find(".modulecontrols"));
				}

				clone.appendTo($(target+" > .modulewrapper > description"));
				let showconfig = module.isconfigurable;
				if(module.cidemodule)
					for(let {externalprogramid} of module.matchinggroup)
						if(externalprogramid) {
							showconfig = true;
							break;
						}

				if(showconfig) {
					clone.addClass("configurable");
					//If we want to add an addon interface some time, "true" shall be replaced by a check if the module is an addon
					let allowscripts = true || module.settings.allowscripts;
					clone.click(function() {
						//Prepare subpage
						let subpage = $($(this).parents("stack")[0]).find(".module-subpage");
						subpage.css("display", "-moz-box").find(".module-subpage-caption").text(Locale(module.modulename, module.languageprefix));
						$(target+"-subpage .extprogram-list .extprogram:not(.draft)").remove();

						//Show external program list for this module
						if(module.cidemodule) {
							let extprogids = [];
							for(let {externalprogramid} of module.matchinggroup)
								if(externalprogramid && extprogids.indexOf(externalprogramid) == -1) {
									let clone = $(".extprogram.draft").clone();
									clone.removeClass("draft");
									clone.find(".extprogram-label").attr("value", Locale("$ExtProg_"+externalprogramid+"Lbl$"));
									if(getConfigData("CIDE", "ExtProg_"+externalprogramid))
										clone.find(".view-directory-path").text(getConfigData("CIDE", "ExtProg_"+externalprogramid));
									if(getConfigData("CIDE", "AU_"+externalprogramid))
										clone.find(".extprogram-always-use").prop("checked", true);
									clone.find(".extprogram-browse").on("command", function() {
										openProgramDialog(this, undefined, externalprogramid);
									});
									clone.find(".extprogram-always-use").on("command", function() {
										setConfigData("CIDE", "AU_"+externalprogramid, $(this).prop("checked"));
									});
									clone.find(".extprogram-clear").click(function() {
										setConfigData("CIDE", "ExtProg_"+externalprogramid, "");
										clone.find(".view-directory-path").text(Locale("$pathempty$"));
									});
									clone.appendTo($(target+"-subpage .extprogram-list"));

									//Dont show the same programid multiple times
									extprogids.push(externalprogramid);
								}
						}

						//Load settings content from module
						//TODO: Maybe some kind of check if module X was added and the user "trusted" it? So scripts will not be executed until the user allows it.
						//      Or an unexploitable script protection.. (that also includes XML Namespaces)
						if(module.isconfigurable) {
							let path = module.path.split("/");
							path.pop();
							path = path.join("/");
							path += "/"+(module.settings.path?module.settings.path:"modulesettings.xul");
							if(path.split(".").pop().toLowerCase() != "xul") {
								log(`An error occured while trying to load the settings of the ${module.modulename} module:`, "error");
								log("The specified target file is not supported. (Currently supported formats: xul)", "error");
							}

							$(target+"-subpage .module-subpage-loaded-content").empty();
							OS.File.read(path, {encoding: "utf-8"}).then(function(content) {
								//Parse XUL and add content to DOM
								//TODO: If possible warn the user if the added content wants to execute scripts
								$(target+"-subpage .module-subpage-loaded-content").append(content);
								localizeModule($(target+"-subpage .module-subpage-loaded-content"));
								//Because jQuery is in the mainwindow context, all scripts are executed in the mainwindow context.
								//Maybe we need something selfmade for this task.
								_mainwindow.execHook({ name: "onSubpageLoaded", caller: window });
								autoInitialize($(target+"-subpage .module-subpage-loaded-content"));
							}, function(reason) {
								log(`An error occured while trying to load the settings of the ${module.modulename} module:`, "error");
								log(reason, "error");
							});
						}
					});
				}
			}
			$(".module-subpage-button.module-subpage-back").click(function() {
				$($(this).parents(".module-subpage")[0]).css("display", "none");
			}).click();
		}

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

		autoInitialize();
	}, 1);
});

const TEMPORARY_DATA_PATH = _sc.profd+"/tmp";
let clearTempDataTask;

function autoInitialize(container) {
	//Simplere Einstellungselemente automatisch initialisieren
	$(".autoinit", container).each(function() {
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
	initializeTooltips(container);
}

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
		log("Temp Data calculation failed: " + reason, "error");
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
		log("Clearing temporary data failed: " + reason, "error");
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

function openProgramDialog(obj, extApp, type) {
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

function toggleContents(el) {
	$(el.nextSibling).toggle();
}

function frameWindowTitle() {}
