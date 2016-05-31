let marked = Cu.import("resource://docs/marked.jsm").export_marked;

marked.setOptions({
	renderer: new marked.Renderer(),
	gfm: true,
	breaks: true,
	sanitize: true
});

function initializeDirectory() {
	loadMissionAccessPasswords();

	//Verzeichnis einlesen und Inhalte auflisten
	$(MAINTREE_OBJ).attr("workpath", _sc.clonkpath());
	loadDirectory(_sc.clonkpath());
	unlockModule();
}

function explorerLoadWorkEnvironments() {
	//Verzeichnis vorbereiten (c4group-explodes)
	// TODO: CBExplorer soll keine C4Group-Explodes mehr im Rootverzeichnis machen! Es nimmt was es kriegen kann.
	PrepareDirectory(_sc.clonkpath(), function() {
		$("#msg-loading").remove();

		initializeDirectory();
	});
}

$(window).load(function() {	
	//Password input
	$("#set-password").click(function() {
		/*if($(this).hasClass("activated")) {
			$(this).removeClass("activated");
			$(this).val(Locale("$deactivated$"));
			$("#set-pw").addClass("deactivated").blur();

			setConfigData("HostGame", "PasswordActivated", false);
		}
		else {
			$(this).addClass("activated");
			$(this).val(Locale("$activated$"));
			$("#set-pw").removeClass("deactivated");
			
			setConfigData("HostGame", "PasswordActivated", true);
		}*/
		$(this).toggleClass("active");
		if($(this).hasClass("active")) {
			let dlg = new WDialog("$DlgSetPassword$", MODULE_LPRE, { btnright: [{ preset: "accept",
				onclick: (e, btn, _self) => {
					let newpassword =  $(_self.element).find("#cex-dlg-password-input").val();
					if(!newpassword)
						return $(this).click();
					setConfigData("HostGame", "Password", newpassword);
				}
			}]});
			dlg.setContent
			(`<hbox>
				<label value="$password$" flex="1"/>
				<textbox id="cex-dlg-password-input" placeholder="$DlgEnterPassword$" value="${getConfigData("HostGame", "Password")}" maxlength="1023" flex="3"></textbox>
			</hbox>`);
			dlg.show();
			dlg = 0;
			setConfigData("HostGame", "PasswordActivated", true);
		}
		else
			setConfigData("HostGame", "PasswordActivated", false);
	});
	$("#set-comment").click(function() {
		let dlg = new WDialog("$DlgSetComment$", MODULE_LPRE, { btnright: [{ preset: "accept",
			onclick: function(e, btn, _self) {
				setConfigData("HostGame", "Comment", $(_self.element).find("#cex-dlg-comment-input").val());
			}
		}]});
		dlg.setContent
		(`<hbox>
			<label value="$comment$" flex="1"/>
			<textbox id="cex-dlg-comment-input" multiline="true" maxlength="255" placeholder="$DlgEnterComment$" value="${getConfigData("HostGame", "Comment")}" flex="3"></textbox>
		</hbox>`);
		dlg.show();
		dlg = 0;
	});
	/*$("#set-pw").change(function() {
		setConfigData("HostGame", "Password", $(this).val());
	});
	$("#set-comment").change(function() {
		setConfigData("HostGame", "Comment", $(this).val());
	});*/

	if(getConfigData("HostGame", "PasswordActivated"))
		$("#set-password").addClass("active");

	$("#set-pw").val(getConfigData("HostGame", "Password"));
	$("#set-comment").val(getConfigData("HostGame", "Comment"));

	//General Settings
	var fnswitch = function(id, sect, key, reversed = false) { 
		if(getConfigData(sect, key)^reversed)
			$(id).addClass("active");

		return function(e) { 
			if($(this).parent().hasClass("inactive"))
				return;

			$(this)[$(this).hasClass("active")?"removeClass":"addClass"]("active");
			setConfigData(sect, key, $(this).hasClass("active")==!reversed, true);
		};
	}
	$("#set-gleague").click(fnswitch("#set-gleague", "HostGame", "League"));
	$("#set-grtj").click(fnswitch("#set-grtj", "HostGame", "RunTimeJoin"));
	$("#set-geditor").click(fnswitch("#set-geditor", "HostGame", "Fullscreen", true));
	$("#set-grecord").click(fnswitch("#set-grecord", "StartGame", "Record"));
	$("#set-ginternet").click(fnswitch("#set-ginternet", "HostGame", "SignUp"));

	//Start Game button
	$("#btn-startgame").click(function() {
		if(!$(current_selection)[0] || handleTreeEntry($(current_selection)) == -1)
			EventInfo("No scenario selected");
	});

	//Toggle game mode
	$("#togglegamemode").mousedown(function() {
		$(this).toggleClass("singleplayer");
		setConfigData("HostGame", "Network", !$(this).hasClass("singleplayer"), true);
		if($(this).hasClass("singleplayer"))
			$(".hostgame-group.networkgame").addClass("inactive");
		else
			$(".hostgame-group.networkgame").removeClass("inactive");
	});

	//Vorauswählen
	if(!getConfigData("HostGame", "Network"))
		$("#togglegamemode").mousedown();
	
	_mainwindow.hook("playerselection", function() {
		refreshAchievements();
	});
});

function initializeContextMenu() {}
function onTreeItemBlur() {}

function hideFileExtension(fext) {
	var ext = ["ocf", "ocs"];
	if(ext.indexOf(fext) != -1)
		return false;

	return true;
}

let mission_access = [], current_selection;

function loadMissionAccessPasswords() {
	if(OS_TARGET == "WINNT") {
		let wrk = _sc.wregkey();
		wrk.open(wrk.ROOT_KEY_CURRENT_USER, "Software\\OpenClonk Project\\OpenClonk\\General", wrk.ACCESS_READ);
		let passwordlist = wrk.readStringValue("MissionAccess").split(",");
		wrk.close();
		mission_access = passwordlist;
	}
}

function getTreeEntryData(entry, fext) {
	if(!entry.isDirectory())
		return false;

	let task = Task.spawn(function*() {
		let data = {}, title, entrypath = formatPath(entry.path);
		try { title = yield OS.File.read(entrypath+"/Title.txt", {encoding: "utf-8"}); }
		catch(e) { log(e, true); }
		let prefix = Locale("$ClonkLangPrefix$", -1);
		if(title) {
			lines = title.split('\n');
			let titleUS;
			for(var i = 0; i < lines.length; i++) {
				if(prefix != "US" && lines[i].search(/US:/) != -1)
					titleUS = lines[i].match(/:(.+)/)[1];

				if(lines[i].search(RegExp(prefix+":", "i")) != -1) {
					data.title = lines[i].match(/:(.+)/)[1];
					break;
				}
			}

			if(!data.title && titleUS)
				data.title = titleUS;
		}
		let iconpath = entrypath+"/Icon.png";
		if(yield OS.File.exists(iconpath)) {
			iconpath = encodeURI(iconpath).replace(/#/g, "%23");
			if(OS_TARGET == "WINNT")
				data.icon = encodeURI("file:///"+iconpath.replace(/^(.):\\\//, "$1:/")).replace(/#/g, "%23");
			else
				data.icon = encodeURI("file:///"+iconpath).replace(/#/g, "%23");
		}
		let fileext = entry.leafName.split(".").pop();
		if(fileext == "ocs") {
			if(!(yield OS.File.exists(entrypath+"/Script.c")))
				data.special = "tree-splitter";

			let scenario = parseINIArray(yield OS.File.read(entrypath+"/Scenario.txt", {encoding: "utf-8"}));
			data.index = parseInt(scenario["Head"]["Difficulty"]);
			if(!data.special && scenario["Head"]["MissionAccess"] && mission_access.indexOf(scenario["Head"]["MissionAccess"]) == -1) {
				data.special = "tree-no-access";
				data.additional_data = { "data-mission-access-password": scenario["Head"]["MissionAccess"] };
			}
		}
		else if(fileext == "ocf") {
			try {
				let folder = parseINIArray(yield OS.File.read(entrypath+"/Folder.txt", {encoding: "utf-8"}));
				data.index = parseInt(folder["Head"]["Index"]);
			}
			catch(e) {}
		}

		return data;
	});

	return task;
}

function noContainer(fext) {return fext == "ocs"; }
function noDragDropItem() {return true;}

function onTreeDeselect(obj) { $("#previewimage").attr("src", ""); }

let filecache = {}, refreshAchievements;

function onTreeSelect(obj) {
	Task.spawn(function*() {
		let path = _sc.clonkpath() + getTreeObjPath(obj), info;

		info = yield OS.File.stat(path);
		if(!info.isDir)
			return;

		$("#preview").attr("data-path", path);
		if(yield OS.File.exists(path+"/Title.png")) {
			if(OS_TARGET == "WINNT")
				$("#previewimage").attr("src", encodeURI("file://"+path.replace(/\\/, "/")+"/Title.png").replace(/#/g, "%23"));
			else
				$("#previewimage").attr("src", encodeURI("file://"+path+"/Title.png").replace(/#/g, "%23"));
		}
		else
			$("#previewimage").attr("src", "");

		let prefix = Locale("$ClonkLangPrefix$", -1), text;
		try {
			text = yield OS.File.read(path+"/Desc"+prefix+".txt", {encoding: "utf-8"});
		}
		catch(e) {
			try {
				text = yield OS.File.read(path+"/DescUS.txt", {encoding: "utf-8"});
			}
			catch(e) {
				$("#previewdesc").html("");
				return;
			}
		}
		function loadFromOrigins(gen, additional, return_gen) {
			let g = function*() {
				let origins = [path];
				let splitted = path.split("/");
				while(splitted.pop()) {
					if(/\.oc[sf]$/.test(splitted[splitted.length-1]))
						origins.push(splitted.join("/"));
				}
				origins = origins.concat(additional);
				for(let loadpath of origins) {
					if((yield* gen(loadpath)) == -1)
						break;
				}
			};
			return return_gen?g:g();
		}
		
		let pars = {}, achvm = {}, strings = {};
		if(!filecache[path]) {
			//Parameterdefinitionen laden
			yield* loadFromOrigins(function*(loadpath) {
				try {
					let parameters = yield OS.File.read(loadpath+"/ParameterDefs.txt", {encoding: "utf-8"});
					if(parameters) {
						let parobj = parseHierarchicalINI(parameters);
						for(var i = 0; i < parobj["ParameterDef"].length; i++) {
							let obj = parobj["ParameterDef"][i];
							if(obj.Achievement)
								achvm[obj.ID] = obj;
							else
								pars[obj.ID] = obj;
						}
					}
				} catch(e) { log(e, true, -1); }
			});
			filecache[path] = { parameters: pars, achievements: achvm };

			//StringTbl laden
			yield* loadFromOrigins(function*(loadpath) {
				try {
					let stringtbls;
					try {
						stringtbls = yield OS.File.read(loadpath+"/StringTbl"+prefix+".txt", {encoding: "utf-8"});
					} catch(e) {
						stringtbls = yield OS.File.read(loadpath+"/StringTblUS.txt", {encoding: "utf-8"});
					}

					if(stringtbls)
						jQuery.extend(true, strings, parseINIArray(stringtbls));
				} catch(e) { log(e, true, -1); }
			});
			filecache[path].strings = strings;
		}
		else {
			pars = filecache[path].parameters;
			achvm = filecache[path].achievements;
			strings = filecache[path].strings;
		}

		//Bei zu langen Ladezeiten (Wenn also schon zu einem anderen Szenario gewechselt wurde) nicht mehr das DOM bearbeiten
		if($("#preview").attr("data-path") != path)
			return;

		//Achievementliste ausblenden
		$("#achievement-list").empty();
		$("#achievements").addClass("hidden");

		//HTML/XUL in Beschreibungen deaktivieren
		let splittedtext = text.split("\n");
		if(/^ .+?$/.test(splittedtext[0]))
			splittedtext[0] = "##"+splittedtext[0];
		text = splittedtext.join("\n");
		$("#previewdesc").html(marked(text).replace(/(<[^\/]+?)>/g, '$1 xmlns="http://www.w3.org/1999/xhtml">'));

		//Lokalisierung
		function stringtbl(str) {
			return str.replace(/\$(.+?)\$/g, function(fullmatch, sub) {
				return (strings[0] && strings[0][sub]) || fullmatch;
			}).replace(/"/g, "&quot;");
		}

		//Szenarienparameter auflisten
		$(".parametersel:not(.draft)").remove();
		for(var key in pars) {
			let clone = $(".parametersel.draft").clone();
			clone.removeClass("draft");
			clone.find(".parametersel-title").attr("value", stringtbl(pars[key].Name));
			clone.attr("data-parid", key);

			let menupopup = clone.find(".parametersel-selection > menupopup");
			try {
				let options = pars[key].Options[0].Option;
				for(var i = 0; i < options.length; i++)
					menupopup.append(`<menuitem value="${options[i].Value}" label="${stringtbl(options[i].Name)}" data-description="${stringtbl(options[i].Description)}"/>`);
			}
			catch(e) {log(e + e.stack)}
			tooltip(clone, stringtbl(pars[key].Description));
			clone.appendTo($("#parameters"));
		}

		//Achievements auflisten
		//Funktion wird in globale Variable gespeichert, erspart das horten der ganzen Inhalte in globalen Objekten
		refreshAchievements = function() {
			return Task.spawn(function*() {
				$("#achievement-list").empty();
				$("#achievements").addClass("hidden");
				let player = getCurrentlySelectedPlayer();
				if(!player.Achievements)
					return;

				let relpath = path.split("/");
				for(let i = 0; i < relpath.length; i++) {
					if(!/\.oc[sf]$/.test(relpath[i])) {
						i -= relpath.splice(0, i+1).length;
						continue;
					}
					relpath[i] = relpath[i].replace(/\.oc[sf]$/, "");
				}
				relpath = relpath.join("_");
				for(let key in achvm) {
					let achv = achvm[key];
					let value = player.Achievements[relpath+"_"+achv.ID];
					if(!value)
						continue;

					$("#achievements").removeClass("hidden");
					let img = $(`<box class="achievement" width="24" height="24" data-achvid="${achv.ID}" data-achvachievement="${achv.Achievement}"></box>`), option = {};

					try {
						let options = achv.Options[0].Option;
						option = options[0];
						for(let i = 0; i < options.length; i++)
							if(options[i].Value == value)
								option = { opt: options[i], index: i};
					}
					catch(e) {log(e + e.stack)}
					if(option.opt)
						tooltip(img, stringtbl(option.opt.Description));

					yield* loadFromOrigins(function*(loadpath) {
						if(img[0] && (yield OS.File.exists(loadpath+"/Achv"+achv.ID+".png"))) {
							img.css("background-image", 'url("'+encodeURI('file://' + loadpath + '/Achv' + achv.ID + '.png')+'")');
							img.css("background-position", "-"+option.index*24+"px")
							return -1;
						}
					}, [_sc.clonkpath()+"/Graphics.ocg"]);
					img.appendTo($("#achievement-list"));
				}
			});
		}
		yield refreshAchievements();

		current_selection = obj;
	});
	return true;
}

let asdid = 0;
function showObj(obj, indent, notRecursive) {
	var text = "";
	if(!indent)
		indent = "";
	for(var data in obj) {
		if(data == "top" || data == "plainstr")
			continue;

		if(typeof obj[data] == "function")
			continue;

		text += indent + data + ": " + obj[data] + "\n";
		if(typeof obj[data] == "object" && !notRecursive) {
			asdid++;
			text += showObj(obj[data], indent + "  ");
		}
	}

	return text;
}

function onTreeExpand(obj, listitem) {
	//Verzeichnis schon geladen
	if($(obj).children("li")[0])
		return;

	loadDirectory(_sc.clonkpath()+getTreeObjPath(obj), $(obj));
	return true;
}

function onTreeCollapse(obj) {}
function onTreeFileDragDrop(cnt, f) {}
function onTreeObjRename(obj, name) {}

function getOCStartArguments(path) {
	var args = [];
	if(getConfigData("HostGame", "Network")) {
		if(getConfigData("HostGame", "PasswordActivated"))
			args.push("--pass=\""+getConfigData("HostGame", "Password").replace(/"/, "\\\"")+"\"");

		if(getConfigData("HostGame", "Comment"))
			args.push("--comment=\""+getConfigData("HostGame", "Comment").replace(/"/, "\\\"")+"\"");

		if(getConfigData("HostGame", "League"))
			args.push("--league");

		if(getConfigData("HostGame", "RunTimeJoin"))
			args.push("--runtimejoin");

		args.push("--network");
		if(!getConfigData("HostGame", "SignUp"))
			args.push("--nosignup");
	}
	else
		args.push("--nonetwork");

	if(getConfigData("StartGame", "Record"))
		args.push("--record");

	if(!getConfigData("HostGame", "Fullscreen"))
		args.push("--editor");
	else
		args.push("--fullscreen");

	$(".parametersel:not(.draft)").each(function() {
		args.push("--scenpar="+$(this).attr("data-parid")+"="+$(this).find(".parametersel-selection").val());
	});

	args.push(path);
	log(args);

	saveConfig(["HostGame", ["StartGame", "Record"]]);

	return args;
}

var specialData = {
	0: {ext: "ocf", img: "chrome://windmill/content/img/explorer/icon-fileext-ocf.png"},
	1: {ext: "ocs", img: "chrome://windmill/content/img/explorer/icon-fileext-ocs.png"},
}
