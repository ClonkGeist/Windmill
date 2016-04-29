/** Player structure
[Player]: 
        Name: Apfel
        Comment: Ich bin neu hier.
        RankName: Clonk
        Score: 2100
        Rounds: 99
        RoundsWon: 21
        RoundsLost: 78
        TotalPlayingTime: 74480
[Preferences]: 
        Color: 3
        ColorDw: 4284132607
        Control: 0
        AutoStopControl: 1
        AutoContextMenu: 1
        ClonkSkin: 1
[LastRound]: 
        Title: "T\303\266dliche Grotte"
        Date: 1449964365
        Duration: 2743
        TotalScore: 2100
[Achievements]: 
        [...]
*/


var cPkr,
	players = [];
hook("load", function() {
	cPkr = createColorPicker(document.getElementById("ap-clrpckr"));
	
	var image = new Image();
	image.addEventListener("load", function() {
		var canvas = document.getElementById("cnv-apbigicon");
		var ctx = canvas.getContext("2d");
		canvas.width = 64;
		canvas.height = 64;
		ctx.drawImage(image, 0, 0, 64, 64);

		var px = ctx.getImageData(0, 0, canvas.width, canvas.height);
		
		cPkr.onchange = function(clr) {
			var canvas = document.getElementById("cnv-apbigicon");
			var ctx = canvas.getContext("2d");
		
			ctx.putImageData(px, 0, 0);
			var pxdata = ctx.getImageData(0, 0, canvas.width, canvas.height);
			
			var data = pxdata.data;
			for(var i = 0; i < data.length; i+=4) {
				var [r,g,b,a] = [data[i], data[i+1], data[i+2], data[i+3]];
				
				if(ClrByOwner(r,g,b)) {
					var nclr = ModulateClr([b,b,b,a], clr);
					[data[i], data[i+1], data[i+2]] = [...nclr];
					data[i+3] = a;
				}
			}

			ctx.putImageData(pxdata, 0, 0);
		};
	});
	image.src="chrome://windmill/content/img/img-defaultplr.png";
	
	var canvas = document.getElementById("cnv-apbigicon");
	var ctx = canvas.getContext("2d");
	var image = new Image();
	image.addEventListener("load", function() {
		canvas.width = 64;
		canvas.height = 64;
		ctx.drawImage(image, 0, 0, 64, 64);
	});
	image.src="chrome://windmill/content/img/img-defaultplr.png";
	
	
	//Spielerdatei aus Benutzerpfad rauslesen und in Liste eintragen
	var iterator;
	Task.spawn(function*() {
		iterator = new OS.File.DirectoryIterator(_sc.env.get("APPDATA")+"/OpenClonk");
		while(true) {
			let entry = yield iterator.next();
			let t = entry.name.split('.');
			if(t.length == 1)
				continue;

			if(t[t.length-1] == "ocp") {
				var text, img, imgstr = "chrome://windmill/content/img/DefaultPlayer.png";
				if(!entry.isDir) {
					var group = readC4GroupFile(_sc.file(entry.path));
					text = group.getEntryByName("Player.txt").data.byte2str();
					img = group.getEntryByName("BigIcon.png");
					if(img)
						imgstr = "data:image/png;base64,"+btoa(img.data.byte2str(true));
				}
				else {
					text = yield OS.File.read(entry.path+"/Player.txt", {encoding: "utf-8"});
					if(yield OS.File.exists(entry.path+"/BigIcon.png"))
						imgstr = "file://"+formatPath(entry.path)+"/BigIcon.png";
				}
				var sects = parseINI(text);
				players.push(sects);
				addPlayerlistItem(players.length - 1, entry.name, imgstr);
			}
		}
	});

	$("#img-apclonkstyle").click(function() {
		let id = parseInt($(this).attr("data-skinid"));
		if(isNaN(id))
			id = 0;
		id++;
		OS.File.exists(_sc.chpath+"/content/img/playerselection/ClonkSkin"+id+".png").then((exists) => {
			if(!exists)
				id = 0;
			$(this).attr("src", "chrome://windmill/content/img/playerselection/ClonkSkin"+id+".png").attr("data-skinid", id);
		});
	});
});

function addPlayerlistItem(id, filename, imgstr) {
	var plr = players[id],
		player = plr["Player"],
		lastround = plr["LastRound"];
	
	plr[0] = filename;
	
	var name = player["Name"] || Locale("$NewPlayerName$");
	
	var clone = $(".ps-playerlistitem.draft").clone(true);
	clone.removeClass("draft");
	clone.attr("data-playerid", id);
	clone.find(".lbl-psplayername").attr("value", name);
	clone.find(".img-psbigicon").attr("src", imgstr);
	
	clone.click(function() {
		$(".ps-playerlistitem.selected").removeClass("selected");
		$(this).addClass("selected");
	
		$("#ps-playerdetails").css("display", "-moz-box");
		
		$("#ps-pdname").text(name);
		$("#nav-playername").attr("value", name);
		$("#ps-pdscore").attr("value", player["Score"]);
		$("#ps-pdcomment").attr("value", player["Comment"]);
		$("#ps-pdrounds").attr("value", sprintf(Locale("$PDRoundsLbl$"), player["Rounds"]||0, player["RoundsWon"]||0, player["RoundsLost"]||0));
		
		var secs = player["TotalPlayingTime"]||0;
		var mins = Math.round(secs/60)%60;
		$("#ps-pdtime").attr("value", Math.round(secs/3600)+":"+(mins<10?"0":"")+mins+":"+(secs<10?"0":"")+secs%60);
		
		if(!lastround)
			return $(".lastround").css("display", "none");
		else
			$(".lastround").css("display", "-moz-box");
		
		$("#ps-pdlr-title").attr("value", lastround["Title"]);
		$("#ps-pdlr-duration").attr("value", Math.round(lastround["Duration"]/3600)+":"+Math.round(lastround["Duration"]/60)%60+":"+lastround["Duration"]%60);
		$("#ps-pdlr-score").attr("value", lastround["TotalScore"]);

		var date = new Date();
		date.setTime(lastround["Date"]*1000)
		$("#ps-pdlr-date").attr("value", sprintf(Locale("$PD_LRDateLbl$"), date.getDate(), date.getMonth()+1, date.getFullYear(), date.getHours(), date.getMinutes()));
	
		//Speichern
		var wrk = _sc.wregkey();
		wrk.open(wrk.ROOT_KEY_CURRENT_USER, "Software\\OpenClonk Project\\OpenClonk\\General", wrk.ACCESS_WRITE);
		wrk.writeStringValue("Participants", filename);
		wrk.close();
	});

	clone.appendTo($("#ps-playerlist"));
	
	var wrk = _sc.wregkey();
	wrk.open(wrk.ROOT_KEY_CURRENT_USER, "Software\\OpenClonk Project\\OpenClonk\\General", wrk.ACCESS_READ);
	var fn = wrk.readStringValue("Participants");
	wrk.close();
	
	if(fn == filename)
		$(clone).trigger("click");
	
	// remove player
	clone.find(".ps-remove-player").click(function(e) {
		var dlg = new WDialog("$DlgTitleRemovePlayer$", "", { modal: true, css: { "width": "450px" }, btnright: [{ preset: "accept",
				onclick: function(e, btn, _self) {
					removePlayer(id);
				}
			}, "cancel"]});
		dlg.setContent("<description>"+sprintf(Locale("$DlgRemovePlayer$"), name)+"</description>");
		dlg.show();
		
		e.stopPropagation();
	});
	
	// edit player
	clone.find(".ps-edit-player").click(function(e) {
		alert(Locale("$BETA_EditPlayerNotAvailable$"));
		/* Vorerst deaktiviert, da hier auf laengere Sicht nicht gearbeitet wird. (Bearbeiten von gepackten Dateien waere noetig)
		
		$("#ap-player-caption").text(Locale("$EditPlayer$"));
		switchPlrPage('page-addplayer');
		insertPlayerIntoEditPage(id);
		
		e.stopPropagation();*/
	});
	
	return clone;
}

function initNewPlayer() {
	$("#ap-player-caption").text(Locale("$AddPlayer$"));
	
	switchPlrPage('page-addplayer');
}

function switchPlrPage(pageid) {
	$(".plr-page").removeClass("plrpage-selected");
	$("#"+pageid).addClass("plrpage-selected");
	
	return true;
}

function addNewPlayer() {
	var plr = getNewPlayer();
	if($("#ap-plrname").val())
		plr["Player"]["Name"] = $("#ap-plrname").val();
	if($("#ap-plrcomment").val())
		plr["Player"]["Comment"] = $("#ap-plrcomment").val();

	var clr = cPkr.getColor();
	plr["Player"]["ColorDw"] = ((clr[0] << 16)|(clr[1] << 8)|clr[2]).toString();
	let skin = parseInt($("#img-apclonkstyle").attr("data-skinid"));
	if(skin && !isNaN(skin))
		plr["Preferences"]["ClonkSkin"] = skin;
	
	Task.spawn(function*() {
		let plrleafname = plr["Player"]["Name"].replace(/[^a-zA-Z0-9_-]/, "_")+".ocp";
		let plrpath = _sc.env.get("APPDATA")+"/OpenClonk/"+plrleafname;
		yield OS.File.makeDir(plrpath);

		let text = "";

		for(var sect in plr) {
			if(!plr[sect])
				continue;

			text += "["+sect+"]\r\n";
			for(var key in plr[sect]) {
				if(plr[sect][key] === undefined)
					continue;

				text += key+"="+plr[sect][key]+"\r\n";
			}

			text += "\r\n";
		}

		yield OS.File.writeAtomic(plrpath+"/Player.txt", text, {encoding: "utf-8"});

		//Mittels C4Group packen
		var filename = "c4group";
		if(OS_TARGET == "WINNT")
			filename = "c4group.exe";

		var process = _ws.pr(_sc.file(_sc.clonkpath() + "/" + filename));
		var args = [plrpath, "-p"];

		process.create(args, 0x1, function() {
			players.push(plr);
			addPlayerlistItem(players.length-1, plrleafname, "chrome://windmill/content/img/DefaultPlayer.png");
			switchPlrPage('page-playerselection');
		});
	});
}

function savePlayer() {
	switchPlrPage('page-playerselection');
}

function insertPlayerIntoEditPage(id) {
	var plr = players[id];
	
	$("#ap-plrname").val(plr.Player.Name);
	$("#ap-plrcomment").val(plr.Player.Comment);
	var rgb = plr.Preferences.ColorDw;
	var r = (rgb >> 16) & 0xff, g = (rgb >> 8) & 0xff, b = rgb & 0xff;
	cPkr.setColorRGB(r, g, b);
}
/**
	[Player]
	Comment=Ich bin neu hier.
	RankName=Clonk

	[Preferences]
	Color=7
	ColorDw=4293951568
	Control=0
	AutoStopControl=1
	AutoContextMenu=1
*/
function getNewPlayer() {
	
	var plr = {
		Player: {
			Name: Locale("$NewPlayerName$"),
			Comment: Locale("$NewPlayerComment$"),
			RankName: "Clonk",
		},
		
		Preferences: {
			Color: 7,
			ColorDw: 4293951568,
			Control: 0,
			AutoStopControl: 1,
			AutoContextMenu: 1
		}
	}
	
	
	return plr;
}

function removePlayer(iplr) {
	let path = "";
	if(OS_TARGET == "WINNT")
		path = _sc.env.get("APPDATA")+"/OpenClonk/";
	path += players[iplr][0];

	let promise = OS.File.remove(path, { ignoreAbsent: true });
	promise.then(function() {
		$("[data-playerid='"+iplr+"']").remove();
	}, function(reason) {
		EventInfo("An error occured while trying to remove the player.");
		log(reason);
	});
	return promise;
}