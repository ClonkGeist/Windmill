/* Explorer Git Funktionalitaeten */

function gitContextMenu() {
	return new ContextMenu(0, [
		["$CtxGit_LaunchShell$", 0, function() {
			
		}, 0, { iconsrc: "chrome://windmill/content/img/icon-fileext-ocd.png", identifier: "ctxGitLaunchShell" }],
		
		"seperator",
		
		["$CtxGit_Commit$", 0, openGitCommitDialog, 0, { iconsrc: "chrome://windmill/content/img/icon-fileext-ocd.png", identifier: "ctxGitCommit" }],
		["$CtxGit_Pull$", 0, function() {
			getAppByID("git").create(["-C", getFullPathForSelection(), "pull"], 0x1, function() {
				EventInfo("Pulling Complete");
			}, function(data) {
				log(">> " + data);
			});
		}, 0, { iconsrc: "chrome://windmill/content/img/icon-fileext-ocd.png", identifier: "ctxGitPull" }],
		["$CtxGit_Fetch$", 0, function() {
			EventInfo("Not supported");
		}, 0, { iconsrc: "chrome://windmill/content/img/icon-fileext-ocd.png", identifier: "ctxGitFetch" }],
		["$CtxGit_Push$", 0, function() {
			getAppByID("git").create(["-C", getFullPathForSelection(), "push"], 0x1, function() {
				EventInfo("Pushing Complete");
			}, function(data) {
				log(">> " + data);
			});
		}, 0, { iconsrc: "chrome://windmill/content/img/icon-fileext-ocd.png", identifier: "ctxGitPush" }],
		
		"seperator",
		
		["$CtxGit_Diff$", 0, function() {
			EventInfo("Not supported");
		}, 0, { iconsrc: "chrome://windmill/content/img/icon-fileext-ocd.png", identifier: "ctxGitDiff" }],
		/*["$CtxGit_Show$", 0, function() {
			
		}, 0, { iconsrc: "chrome://windmill/content/img/icon-fileext-ocd.png", identifier: "ctxGitShow" }],*/
		
		"seperator",
		
		["$CtxGit_Add$", 0, openGitAddDialog, 0, { iconsrc: "chrome://windmill/content/img/icon-fileext-ocd.png", identifier: "ctxGitAdd" }],
		["$CtxGit_Remove$", 0, function() {
			var entry = getCurrentTreeSelection();
			getAppByID("git").create(["-C", _sc.workpath(getFullPathForSelection()), "rm", getTreeObjPath(entry).substr(1)], 0x3, function() {
				removeTreeEntry(entry);
				EventInfo("Removed");
			});
		}, 0, { iconsrc: "chrome://windmill/content/img/icon-fileext-ocd.png", identifier: "ctxGitRemove" }],
		["$CtxGit_Revert$", 0, function() {
			EventInfo("Not supported");
		}, 0, { iconsrc: "chrome://windmill/content/img/icon-fileext-ocd.png", identifier: "ctxGitRevert" }],
		["$CtxGit_Move$", 0, openGitMoveDialog, 0, { iconsrc: "chrome://windmill/content/img/icon-fileext-ocd.png", identifier: "ctxGitMove" }],
		
		"seperator",
		
		["$CtxGit_Checkout$", 0, openGitCheckoutDialog, 0, { iconsrc: "chrome://windmill/content/img/icon-fileext-ocd.png", identifier: "ctxGitCheckout" }],
		["$CtxGit_Merge$", 0, function() {
			EventInfo("Not supported");
		}, 0, { iconsrc: "chrome://windmill/content/img/icon-fileext-ocd.png", identifier: "ctxGitMerge" }]
	], MODULE_LPRE, { allowIcons: true });
}

function openGitAddDialog() {
	var path = getFullPathForSelection();
	var dlg = new WDialog("$DlgGitAdd$", MODULE_LPRE, { btnright: [{ preset: "accept",
			onclick: function(e, btn, _self) {
				var args = ["-C", path, "add"];
				$(_self.element).find(".dlg-checklistitem.selected").each(function() {
					args.push($(this).text());
				});
				getAppByID("git").create(args, 0x3);
			}
		}, "cancel"]});
	
	dlg.setContent('<vbox class="dlg-checklistbox" id="git-addfiles">$LoadingUnversionedFiles$</vbox>');

	getAppByID("git").create(["-C", path, "ls-files", "--other"], 0x1, 0, function(data) {
		$(dlg.element).find("#git-addfiles").empty();
		if(!data || !data.length || data.search(/\w/) == -1) {
			$(dlg.element).find("#git-addfiles").html("$NoUnversionedFilesFound$");
			return;
		}
		var lines = data.split("\n");
		for(var i = 0; i < lines.length; i++)
			if(lines[i].length)
				$('<hbox class="dlg-checklistitem"></hbox>').appendTo($(dlg.element).find("#git-addfiles")).text(lines[i]);
		
	});
	
	dlg.show();
}

function openGitCheckoutDialog() {
	var path = getFullPathForSelection(), current_branch;
	var dlg = new WDialog("$DlgGitCheckout$", MODULE_LPRE, { btnright: [{ preset: "accept",
			onclick: function(e, btn, _self) {
				var branchname = $(_self.element).find("#git-checkoutlist").val();
				if(!branchname || branchname == current_branch)
					return e.stopImmediatePropagation();

				var msg = "Branch created";
				if($(_self.element).find('menuitem[label="'+branchname+'"]')[0]) {
					var args = ["-C", path, "checkout", branchname];
					msg = "Switched to " + branchname;
				}
				else
					var args = ["-C", path, "checkout", "-b", branchname];
				getAppByID("git").create(args, 0x3);
				EventInfo(msg);
			}
		}, "cancel"]});
	
	dlg.setContent(`<description>$DlgGitCheckoutDesc$</description>
					<hbox>
						<label value="Current branch:" flex="1"/>
						<label id="git-currentBranch" value="Loading..." flex="1"/>
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
	var path = _sc.workpath(getCurrentTreeSelection());
	var dlg = new WDialog("$DlgGitCommit$", MODULE_LPRE, { btnright: [{ preset: "accept", title: "Commit",
			onclick: function(e, btn, _self) {
				writeFile(_sc.file(_sc.profd+"/windmilltmpcommit.txt"), $(_self.element).find("#git_commitmsg").val(), true);
				var args = ["-C", path, "commit", "-F", _sc.profd+"/windmilltmpcommit.txt"];
				getAppByID("git").create(args, 0x1, function() {
					EventInfo("Committed");
				}, function(data) {
					log("DATA: " + data);
				});
			}
		}, "cancel"]});
	
	dlg.setContent(`<description>$GitCommitDesc$</description>
	<textbox multiline="true" id="git_commitmsg" flex="1" rows="10"></textbox>
	<vbox style="border: 1px solid grey; background: white;">
		Staged files etc...
	</vbox>`);
	
	dlg.show();
}

function openGitMoveDialog() {
	var path = _sc.workpath(getCurrentTreeSelection()), relpath = getFullPathForSelection().replace(path+"/", "");
	var dlg = new WDialog("$DlgGitMove$", MODULE_LPRE, { btnright: [{ preset: "accept",
			onclick: function(e, btn, _self) {
				var args = ["-C", path, "mv",relpath , $(_self.element).find("#git_movename").val()];
				getAppByID("git").create(args, 0x3);
				EventInfo("Moved");
			}
		}, "cancel"]});
	
	var wsname = path.split("/")[path.split("/").length-1];
	dlg.setContent('<description>$GitMoveDesc$</description><hbox><hbox>'+wsname
				  +'/</hbox><textbox flex="1" id="git_movename" value="'+relpath+'"></textbox></hbox>');
	
	dlg.show();
}




