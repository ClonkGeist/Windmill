function initializeDirectory() {
	//Verzeichnis einlesen und Inhalte auflisten
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
	$("#set-pwact").click(function() {
		if($(this).hasClass("activated")) {
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
		}
	});
	$("#set-pw").change(function() {
		setConfigData("HostGame", "Password", $(this).val());
	});
	$("#set-comment").change(function() {
		setConfigData("HostGame", "Comment", $(this).val());
	});

	if(getConfigData("HostGame", "PasswordActivated")) {
		$("#set-pwact").val(Locale("$activated$"));
		$("#set-pwact").addClass("activated");
		$("#set-pw").removeClass("deactivated");
	}

	$("#set-pw").val(getConfigData("HostGame", "Password"));
	$("#set-comment").val(getConfigData("HostGame", "Comment"));

	//General Settings

	var fnswitch = function(id, sect, key, reversed = false) { 
		if(getConfigData(sect, key)^reversed)
			$(id).addClass("activated");

		return function(e) { 
			$(this)[$(this).hasClass("activated")?"removeClass":"addClass"]("activated");
			setConfigData(sect, key, $(this).hasClass("activated")==!reversed, true);
		};
	}
	$("#set-gleague").click(fnswitch("#set-gleague", "HostGame", "League"));
	$("#set-grtj").click(fnswitch("#set-grtj", "HostGame", "RunTimeJoin"));
	$("#set-geditor").click(fnswitch("#set-geditor", "HostGame", "Fullscreen", true));
	$("#set-grecord").click(fnswitch("#set-grecord", "StartGame", "Record"));
	$("#set-ginternet").click(fnswitch("#set-ginternet", "HostGame", "SignUp"));

	//Start Game button
	$("#btn-startgame").click(function() {
		var sel = getCurrentTreeSelection();
		if(sel)
			handleTreeEntry($(sel));
	});

	//Switch type
	$("#select-nwgame").click(function() {
		if($(this).hasClass("selected"))
			return;

		$(".selectgamemode").removeClass("selected");
		$(this).addClass("selected");

		$(".networkgame-ctrl").stop(true, false).fadeIn(300);

		setConfigData("HostGame", "Network", true, true);
	});
	$("#select-spgame").click(function() {
		if($(this).hasClass("selected"))
			return;

		$(".selectgamemode").removeClass("selected");
		$(this).addClass("selected");
		
		$(".networkgame-ctrl").stop(true, false).fadeOut(300);
		
		setConfigData("HostGame", "Network", false, true);
	});

	//Vorauswählen
	$(getConfigData("HostGame", "Network")?"#select-nwgame":"#select-spgame").trigger("click");
});

function initializeContextMenu() {}
function onTreeItemBlur() {}

function hideFileExtension(fext) {
	var ext = ["ocf", "ocs"];
	if(ext.indexOf(fext) != -1)
		return false;

	return true;
}

function getTreeEntryData(entry, fext) {
	if(!entry.isDirectory())
		return false;

	var data = {};
	var title = readFile(entry.path+"/Title.txt");
	if(title) {
		lines = title.split('\n');
		var titleUS;
		for(var i = 0; i < lines.length; i++) {
			if(__l["ClonkLangPrefix"] != "US" && lines[i].search(/US:/) != -1)
				titleUS = lines[i].match(/:(.+)/)[1];

			if(lines[i].search(RegExp(__l["ClonkLangPrefix"]+":", "i")) != -1) {
				data.title = lines[i].match(/:(.+)/)[1];
				break;
			}
		}

		if(!data.title && titleUS)
			data.title = titleUS;
	}
	var icon = _sc.file(entry.path+"/Icon.png");
	if(icon.exists()) {
		if(OS_TARGET == "WINNT")
			data.icon = "file://"+icon.path.replace(/\\\\/, "/");
		else
			data.icon = "file://"+icon.path;
	}

	return data;
}

function noContainer(fext) {return fext == "ocs"; }
function noDragDropItem() {return true;}

function onTreeDeselect(obj) { $("#previewimage").attr("src", ""); }
function onTreeSelect(obj) {
	var path = _sc.clonkpath() + getTreeObjPath(obj);
	if(!_sc.file(path).exists())
		return;

	if(_sc.file(path+"/Title.png").exists()) {
		if(OS_TARGET == "WINNT")
			$("#previewimage").attr("src", "file://"+path.replace(/\\/, "/")+"/Title.png");
		else
			$("#previewimage").attr("src", "file://"+path+"/Title.png");
	}
	else
		$("#previewimage").attr("src", "");

	var prefix = Locale("$ClonkLangPrefix$", -1);
	if(!_sc.file(path+"/Desc"+prefix+".txt").exists())
		prefix = "US";

	if(_sc.file(path+"/Desc"+prefix+".txt").exists()) {
		var text = readFile(path+"/Desc"+prefix+".txt"); //.
		$("#previewdesc").text(text); //HTML/XUL in Beschreibungen deaktivieren
		$("#previewdesc").html($("#previewdesc").html().replace(/\n/g, '<br xmlns="http://www.w3.org/1999/xhtml"/>'));
	}
	else
		$("#previewdesc").html("");

	return true;
}

function onTreeExpand(obj) {
	//Verzeichnis schon geladen
	if($(obj).children("li")[0])
		return;

	loadDirectory(_sc.workpath(obj)+getTreeObjPath(obj), $(obj));
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

	args.push(path);
	log(args);

	saveConfig(["HostGame", ["StartGame", "Record"]]);

	return args;
}

var specialData = {
	0: {ext: "ocf", img: "chrome://windmill/content/img/icon-fileext-ocf.png"},
	1: {ext: "ocs", img: "chrome://windmill/content/img/icon-fileext-ocs.png"},
}
