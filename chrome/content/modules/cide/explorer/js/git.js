/* Explorer Git Funktionalitaeten */

function gitContextMenu() {
	return new ContextMenu(0, [
		["$CtxGit_Commit$", 0, openGitCommitDialog, 0, { iconsrc: "chrome://windmill/content/img/icon-fileext-ocd.png", identifier: "ctxGitCommit" }],
		["$CtxGit_Pull$", 0, function() {
			getAppByID("git").create(["-C", getFullPathForSelection(), "pull"], 0x1, function() {
				EventInfo("$EI_PullingComplete$");
			}, function(data) {
				logToGitConsole(data);
			});
		}, 0, { iconsrc: "chrome://windmill/content/img/icon-fileext-ocd.png", identifier: "ctxGitPull" }],
		["$CtxGit_Push$", 0, function() {
			getAppByID("git").create(["-C", getFullPathForSelection(), "push"], 0x1, function() {
				EventInfo("$EI_PushingComplete$");
			}, function(data) {
				logToGitConsole(data);
			});
		}, 0, { iconsrc: "chrome://windmill/content/img/icon-fileext-ocd.png", identifier: "ctxGitPush" }],
		["$CtxGit_Revert$", 0, openGitRevertDialog, 0, { iconsrc: "chrome://windmill/content/img/icon-fileext-ocd.png", identifier: "ctxGitRevert" }],
		["$CtxGit_FetchRemote$", 0, openGitFetchRemoteDialog, 0, { iconsrc: "chrome://windmill/content/img/icon-fileext-ocd.png", identifier: "ctxGitRemote" }],
		
		"seperator",
		
		/*["$CtxGit_Diff$", 0, function() {
			
		}, 0, { iconsrc: "chrome://windmill/content/img/icon-fileext-ocd.png", identifier: "ctxGitDiff" }],*/

		"seperator",
		
		["$CtxGit_Add$", 0, openGitAddDialog, 0, { iconsrc: "chrome://windmill/content/img/icon-fileext-ocd.png", identifier: "ctxGitAdd" }],
		["$CtxGit_Remove$", 0, function() {
			var entry = getCurrentTreeSelection();
			getAppByID("git").create(["-C", _sc.workpath(getFullPathForSelection()), "rm", getTreeObjPath(entry).substr(1)], 0x3, function() {
				removeTreeEntry(entry);
				EventInfo("$EI_Removed$");
			}, function(data) {
				logToGitConsole(data);
			});
		}, 0, { iconsrc: "chrome://windmill/content/img/icon-fileext-ocd.png", identifier: "ctxGitRemove" }],
		["$CtxGit_Move$", 0, openGitMoveDialog, 0, { iconsrc: "chrome://windmill/content/img/icon-fileext-ocd.png", identifier: "ctxGitMove" }],

		"seperator",
		
		["$CtxGit_Checkout$", 0, openGitCheckoutDialog, 0, { iconsrc: "chrome://windmill/content/img/icon-fileext-ocd.png", identifier: "ctxGitCheckout" }],
		["$CtxGit_Merge$", 0, function() {
			EventInfo("Not supported");
		}, 0, { iconsrc: "chrome://windmill/content/img/icon-fileext-ocd.png", identifier: "ctxGitMerge" }]
	], MODULE_LPRE, { allowIcons: true, fnCheckVisibility: gitHideContextItems });
}

function openGitAddDialog() {
	var path = getFullPathForSelection();
	var dlg = new WDialog("$DlgGitAdd$", MODULE_LPRE, { btnright: [{ preset: "accept",
			onclick: function(e, btn, _self) {
				var args = ["-C", path, "add"];
				$(_self.element).find(".dlg-checklistitem.selected").each(function() {
					args.push($(this).text());
				});
				getAppByID("git").create(args, 0x3, 0, function(data) {
					logToGitConsole(data);
				});
			}
		}, "cancel"]});
	
	dlg.setContent('<vbox class="dlg-checklistbox" id="git-addfiles">$LoadingUnversionedFiles$</vbox>');

	getAppByID("git").create(["-C", path, "ls-files", "--other", "--exclude=.windmillheader"], 0x1, function() {
		if(!$(dlg.element).find("#git-addfiles .dlg-checklistitem")[0])
			$(dlg.element).find("#git-addfiles").html(Locale('$NoUnversionedFilesFound$<hbox class="dlg-checklistitem" style="visibility: hidden; width: 1px;"></hbox>'));
	}, function(data) {
		$(dlg.element).find("#git-addfiles").empty();
		var lines = data.split("\n");
		for(var i = 0; i < lines.length; i++)
			if(lines[i].length)
				$('<hbox class="dlg-checklistitem"></hbox>').appendTo($(dlg.element).find("#git-addfiles")).text(lines[i]);
		
	});
	
	dlg.show();
}

function openGitCheckoutDialog(by_obj) {
	var path = getFullPathForSelection(), current_branch;
	var dlg = new WDialog("$DlgGitCheckout$", MODULE_LPRE, { btnright: [{ preset: "accept",
			onclick: function(e, btn, _self) {
				var branchname = $(_self.element).find("#git-checkoutlist").val();
				if(!branchname || branchname == current_branch)
					return e.stopImmediatePropagation();

				var msg = "$EI_BranchCreated$";
				if($(_self.element).find('menuitem[label="'+branchname+'"]')[0]) {
					var args = ["-C", path, "checkout", branchname];
					msg = sprintf(Locale("$SwitchToBranch$"), branchname);
				}
				else
					var args = ["-C", path, "checkout", "-b", branchname];
				getAppByID("git").create(args, 0x3, 0, function(data) {
					logToGitConsole(data);
				});
				$(by_obj).attr("data-special", " ("+branchname+")");
				EventInfo(msg);
			}
		}, "cancel"]});

	dlg.setContent(`<description>$DlgGitCheckoutDesc$</description>
					<hbox>
						<label value="$DlgGitCurrentBranch$:" flex="1"/>
						<label id="git-currentBranch" value="$loading$" flex="1"/>
					</hbox>
					<menulist editable="true" id="git-checkoutlist"><menupopup></menupopup></menulist>`);
	dlg.show();

	getAppByID("git").create(["-C", path, "branch"], 0x1, 0, function(data) {
		if(!data || !data.length || data.search(/\w/) == -1) {
			$(dlg.element).find("#git-checkoutlist").insertBefore("<description>$UnknownError$</description>");
			return;
		}
		var lines = data.split("\n");
		for(var i = 0; i < lines.length; i++)
			if(lines[i].length) {
				if(lines[i][0] == "*") {
					current_branch = lines[i].substr(2);
					continue;
				}

				$('<menuitem label="'+lines[i].substr(2)+'"></menuitem>').appendTo($(dlg.element).find("#git-checkoutlist > menupopup"));
			}

		$(dlg.element).find("#git-checkoutlist")[0].selectedIndex = 0;
		$(dlg.element).find("#git-currentBranch").val(current_branch);
	});
}

function openGitCommitDialog() {
	var path = getFullPathForSelection();
	var dlg = new WDialog("$DlgGitCommit$", MODULE_LPRE, { btnright: [{ preset: "accept", title: "$DlgGitCommitBtn$",
			onclick: function(e, btn, _self) {
				if(!$(_self.element).find("#git-files .dlg-list-item").length || !$(_self.element).find("#git_commitmsg").val())
					return e.stopImmediatePropagation();
				writeFile(_sc.file(_sc.profd+"/windmilltmpcommit.txt"), $(_self.element).find("#git_commitmsg").val(), true);
				var args = ["-C", path, "commit", "-F", _sc.profd+"/windmilltmpcommit.txt"];
				getAppByID("git").create(args, 0x1, function() {
					EventInfo("$EI_Commited$");
				}, function(data) {
					logToGitConsole(data);
				});
			}
		}, "cancel"]});
	
	dlg.setContent(`<textbox multiline="true" id="git_commitmsg" flex="1" rows="8" placeholder="$DlgGitCommitMsg$"></textbox>
	<vbox class="dlg-listbox" id="git-files" data-noselect="true">
		<hbox class="dlg-list-head">Files:</hbox>
	</vbox>`);

	dlg.show();

	getAppByID("git").create(["-C", path, "status", "--short"], 0x1, function() {
		if(!$(dlg.element).find("#git-files .dlg-list-item").length)
			$(dlg.element).find("#git-files").append(Locale('<hbox>$NoChangesFound$</hbox>'));
	}, function(data) {
		if(!data || !data.length || data.search(/\w/) == -1) {
			$(dlg.element).find("#git-files").insertBefore("<description>$UnknownError$</description>");
			return;
		}
		var lines = data.split("\n"), index = 0;
		for(var i = 0; i < lines.length; i++)
			if(lines[i].length && lines[i].substr(3) != ".windmillheader") {
				var icons = "", iconfn = (chr, clr) => {
					var iconclasses = {
						M: "icon-git-modified",
						A: "icon-git-added",
						D: "icon-git-deleted",
						R: "icon-git-renamed",
						C: "icon-git-copied",
						U: "icon-git-updatedUnmerged",
						"?": "icon-git-untracked"
					};
					if(iconclasses[chr])
						return '<box class="dlg-list-icon '+iconclasses[chr]+'" style="color: '+clr+'"></box>';
					return "";
				}
				icons += iconfn(lines[i][0], "green") + iconfn(lines[i][1], "red");

				$('<hbox class="dlg-list-item"><hbox style="width: 32px;">'+icons+'</hbox>'+lines[i].substr(3)+'</hbox>')
					.appendTo($(dlg.element).find("#git-files"));
			}
	});
}

function openGitMoveDialog() {
	var path = _sc.workpath(getCurrentTreeSelection()), relpath = getFullPathForSelection().replace(path+"/", "");
	var dlg = new WDialog("$DlgGitMove$", MODULE_LPRE, { btnright: [{ preset: "accept",
			onclick: function(e, btn, _self) {
				var args = ["-C", path, "mv", relpath, $(_self.element).find("#git_movename").val()];
				getAppByID("git").create(args, 0x3, 0, function(data) {
					logToGitConsole(data);
				});
				EventInfo("$EI_Moved$");
			}
		}, "cancel"]});
	
	var wsname = path.split("/")[path.split("/").length-1];
	dlg.setContent('<description>$DlgGitMoveDesc$</description><hbox><hbox>'+wsname
				  +'/</hbox><textbox flex="1" id="git_movename" value="'+relpath+'"></textbox></hbox>');
	
	dlg.show();
}

function openGitRevertDialog() {
	var path = getFullPathForSelection();
	var dlg = new WDialog("$DlgGitRevert$", MODULE_LPRE, { btnright: [{ preset: "accept",
			onclick: function(e, btn, _self) {
				var args = ["-C", path, "revert", $(_self.element).find("#git-revert-commits").val()];
				getAppByID("git").create(args, 0x3, 0, function(data) {
					logToGitConsole(data);
				});
				EventInfo("$EI_Reverted$");
			}
		}, "cancel"]});
	
	dlg.setContent(`<hbox>
						<label value="$DlgGitRevertCommits$:" flex="1"/>
						<textbox id="git-revert-commits" flex="1"/>
						<button id="git-browsecommits" label="$DlgGitBrowseCommits$"></button>
					</hbox>`);
	dlg.show();
	
	$(dlg.element).find("#git-browsecommits").click(function() {
		openGitCommitLogDialog(path, function(commits) {
			$(dlg.element).find("#git-revert-commits").val(commits);
		});
	});
}

function openGitFetchRemoteDialog() {
	var path = getFullPathForSelection();
	var dlg = new WDialog("$DlgGitFetchRemote$", MODULE_LPRE, { btnright: [{ preset: "accept",
			onclick: function(e, btn, _self) {
				var option = $(_self.element).find("radiogroup > :selected"), args, msg = "", 
					selected_remote = $(_self.element).find("#git-remotelist").val();
				switch(option.attr("id")) {
					case "git-fetch":
						args = ["fetch", selected_remote];
						msg = "$EI_Fetched$";
						break;
					
					case "git-remote-add":
						var name = $(_self.element).find("#git-remote-shortname").val();
						var url = $(_self.element).find("#git-remote-url").val();
						//TODO: Eingaben auf Validitaet ueberpruefen
						if(!name || !url) {
							warn("No name/url.");
							return e.stopImmediatePropagation();
						}

						args = ["remote", "add", name, url];
						msg = "$EI_RemoteAdded$";
						break;

					case "git-remote-rename":
						var newname = $(_self.element).find("#git-remote-newname").val();
						if(!newname) {
							warn("No new name.");
							return e.stopImmediatePropagation();
						}

						args = ["remote", "rename", selected_remote, newname];
						msg = "$EI_RemoteRenamed$";
						break;

					case "git-remote-push":
						args = ["remote", "push", selected_remote, $(_self.element).find("#git-branchlist").val()];
						msg = "$EI_RemotePushed$";
						break;

					case "git-remote-remove":
						args = ["remote", "remove", selected_remote];
						msg = "$EI_RemoteRemoved$";
						break;
				}

				getAppByID("git").create(args, 0x1, function() {
					EventInfo(msg);
				}, function(data) {
					logToGitConsole(data);
				});
			}
		}, "cancel"]});
	
	dlg.setContent(`<radiogroup>
						<radio id="git-fetch" label="$DlgGitFetch$" selected="true"/>
						<radio id="git-remote-add" label="$DlgGitRemoteAdd$"/>
						<radio id="git-remote-rename" label="$DlgGitRemoteRename$"/>
						<radio id="git-remote-push" label="$DlgGitRemotePush$"/>
						<radio id="git-remote-remove" label="$DlgGitRemoteRemove$"/>
					</radiogroup>
					<menulist id="git-remotelist" style="display: none"><menupopup></menupopup></menulist>
					<vbox id="git-remote-add-box" class="git-groupbox">
						<hbox>
							<label value="$DlgGitRemoteShortname$:" flex="1"/>
							<textbox id="git-remote-shortname" flex="1"/>
						</hbox>
						<hbox>
							<label value="$DlgGitRemoteURL$:" flex="1"/>
							<textbox id="git-remote-url" flex="1"/>
						</hbox>
					</vbox>
					<hbox id="git-remote-rename-box" class="git-groupbox">
						<label value="$DlgGitRemoteRenameTo$:" flex="1"/>
						<textbox id="git-remote-newname" flex="1"/>
					</hbox>
					<hbox id="git-remote-push-box" class="git-groupbox">
						<label value="$DlgGitRemoteBranch$:" flex="1"/>
						<menulist id="git-branchlist" flex="1"><menupopup></menupopup></menulist>
					</hbox>`);
	dlg.show();
	
	$(dlg.element).find("radiogroup > radio").on("command", function() {
		$(dlg.element).find(".git-groupbox").css("display", "none");
		$(dlg.element).find("#git-remotelist").css("display", "");
		$(dlg.element).find("#"+this.id+"-box").css("display", "");
	});
	$(dlg.element).find("#git-remote-add").on("command", function() {
		$(dlg.element).find("#git-remotelist").css("display", "none");
	});
	$(dlg.element).find("#git-fetch").trigger("command");

	getAppByID("git").create(["-C", path, "remote", "-v"], 0x1, 0, function(data) {
		if(!data || !data.length || data.search(/\w/) == -1) {
			$(dlg.element).find("#git-remotelist").insertBefore("<description>$UnknownError$</description>");
			return;
		}
		var lines = data.split("\n");
		for(var i = 0; i < lines.length; i++)
			if(lines[i].length) {
				var id = lines[i].match(/^(.+?)\W/)[1], url = lines[i].match(/\W(.+)\W/)[1];
				if(url.search(/https:\/\/.+?:.+@/) != -1)
					url = url.replace(/(https:\/\/.+?:)(.+?)@/, function(a, b, c) { return b+"********@"});

				if($(dlg.element).find('#git-remotelist > menupopup > menuitem[data-id="'+id+'"]')[0])
					continue;

				$(`<menuitem label="${id} (${url})" data-id="${id}"></menuitem>`).appendTo($(dlg.element).find("#git-remotelist > menupopup"));
			}

		if(!$(dlg.element).find("#git-remotelist > menupopup > menuitem").length) {
			$(dlg.element).find("#git-remote-rename,#git-remote-push,#git-remote-remove,$git-fetch").prop("disabled", "true");
			$(dlg.element).find("$git-remote-add").trigger("command");
		}
		$(dlg.element).find("#git-remotelist")[0].selectedIndex = 0;
	});
	getAppByID("git").create(["-C", path, "branch"], 0x1, 0, function(data) {
		if(!data || !data.length || data.search(/\w/) == -1) {
			$(dlg.element).find("#git-branchlist").insertBefore("<description>$UnknownError$</description>");
			return;
		}
		var lines = data.split("\n"), index = 0;
		for(var i = 0, j = 0; i < lines.length; i++)
			if(lines[i].length) {
				if(lines[i][0] == "*")
					index = j;

				$('<menuitem label="'+lines[i].substr(2)+'"></menuitem>').appendTo($(dlg.element).find("#git-branchlist > menupopup"));
				j++;
			}

		$(dlg.element).find("#git-branchlist")[0].selectedIndex = index;
	});
}

function openGitCommitLogDialog(path, callback) {
	var dlg = new WDialog("$DlgGitCommitLog$", MODULE_LPRE, { css: { width: "800px" },
			btnright: [{ preset: "accept", onclick: function(e, btn, _self) {
				var commits = $(_self.element).find(".dlg-list-item.selected");
				for(var i = 0, str = ""; i < commits.length; i++)
					str += $(commits[i]).find(".git-commitid").text() + (i!=commits.length-1?" ":"");

				callback(str, _self);
			}
		}, "cancel"]});
	
	dlg.setContent(`<vbox id="git-commitlog" class="dlg-listbox" flex="1" data-multiselect="true">
						<hbox class="dlg-list-head"><vbox flex="1">$DlgCommitLogHeadCommitID$</vbox><vbox flex="5">$DlgCommitLogHeadCommitMsg$</vbox></hbox>
					</vbox>`);
	dlg.show();

	getAppByID("git").create(["-C", path, "log", "--oneline"], 0x1, 0, function(data) {
		if(!data || !data.length || data.search(/\w/) == -1) {
			$(dlg.element).find("#git-checkoutlist").insertBefore("<description>$UnknownError$</description>");
			return;
		}
		var lines = data.split("\n");
		for(var i = 0; i < lines.length; i++)
			if(lines[i].length) {
				var commitid = lines[i].substr(0, 7);
				var commitmsg = lines[i].substr(8);

				$(`<hbox class="dlg-list-item"><vbox flex="1" class="git-commitid">${commitid}</vbox><vbox flex="5">${commitmsg}</vbox></hbox>`)
					.appendTo($(dlg.element).find("#git-commitlog"));
			}

		dlg.updatePseudoElements();
	});
}

/*-- Sichtbarkeit --*/

function gitHideContextItems(by_obj, identifier) {
	var workenv = $(by_obj).hasClass("workenvironment");
	switch(identifier) {
		case "ctxGitRevert":
		case "ctxGitRemote":
			return workenv?0:2;
		case "ctxGitRemove":
		case "ctxGitMove":
		case "ctxGitIgnore":
			return workenv?2:0;
	}
}


