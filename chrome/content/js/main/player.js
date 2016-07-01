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
	players = [],
	playerinfoTimeoutID;

/*-- Check each 7.5s for updated player files and update player info --*/

function refreshPlayerInfo() {
	let userdatapath = _sc.env.get("APPDATA")+"/OpenClonk";
	if(playerinfoTimeoutID !== undefined)
		clearTimeout(playerinfoTimeoutID);
	let iterator = new OS.File.DirectoryIterator(userdatapath);
	let playernames = [];
	for(var key in players) {
		if(key.search(/\D/) != -1)
			playernames.push(key);
	}
	iterator.forEach(
		function onEntry(entry) {
			if(entry.name.split('.').pop() != "ocp")
				return;

			if(playernames.indexOf(entry.name) != -1)
				playernames.splice(playernames.indexOf(entry.name), 1);

			let path = entry.path;
			if(entry.isDir)
				path += "/Player.txt";

			OS.File.stat(path).then(function(stat) {
				let time = stat.lastModificationDate.getTime();
				if(!players[entry.name] || time > players[entry.name].time) {
					Task.spawn(function*() {
						yield* loadPlayerFile(entry, time);
					});
				}
			});
		}
	).then(function() {
		iterator.close();
		for(var i = 0; i < playernames.length; i++) {
			delete players[players[playernames[i]].index];
			delete players[playernames[i]];
		}
	}, function() { iterator.close(); });
	playerinfoTimeoutID = setTimeout(refreshPlayerInfo, 7500);
}

function* loadPlayerFile(entry, time) {
	let text, img, imgstr = "chrome://windmill/content/img/playerselection/DefaultPlayer.png";
	if(!entry.isDir) {
		let group = yield readC4GroupFile(_sc.file(entry.path));
		text = group.getEntryByName("Player.txt").data.byte2str();
		img = group.getEntryByName("BigIcon.png");
		if(img)
			imgstr = "data:image/png;base64,"+btoa(img.data.byte2str(true));
	}
	else {
		text = yield OS.File.read(entry.path+"/Player.txt", {encoding: "utf-8"});
		if(yield OS.File.exists(entry.path+"/BigIcon.png"))
			imgstr = encodeURI("file://"+formatPath(entry.path)+"/BigIcon.png").replace(/#/g, "%23");
	}
	let sects = parseINI(text);
	if(players[entry.name]) {
		players[players[entry.name].index] = sects;
		players[entry.name].time = time;
		players[entry.name].imgstr = imgstr;
		$(".ps-playerlistitem[data-playername='"+entry.name+"'].selected").click();
	}
	else {
		players.push(sects);
		players[entry.name] = { time: Date.now(), index: players.length-1, imgstr, 0: entry.name };
		addPlayerlistItem(players.length - 1, entry.name, imgstr);
	}
}

hook("startLoadingRoutine", function() {	
	//Spielerdatei aus Benutzerpfad rauslesen und in Liste eintragen
	let iterator, userdatapath = _sc.env.get("APPDATA")+"/OpenClonk";
	Task.spawn(function*() {
		iterator = new OS.File.DirectoryIterator(userdatapath);
		while(true) {
			let entry = yield iterator.next();
			let t = entry.name.split('.');
			if(t.length == 1)
				continue;

			if(t[t.length-1] == "ocp")
				yield* loadPlayerFile(entry);
		}
	});

	refreshPlayerInfo();
});

function getCurrentlySelectedPlayer() {
	return players[$(".ps-playerlistitem.selected").attr("data-playerid")];
}

registerInheritableObject("getCurrentlySelectedPlayer");

function initPlayerselection() {
	let playersel = new ContextMenu(function() {
		this.clearEntries();

		let wrk = _sc.wregkey();
		wrk.open(wrk.ROOT_KEY_CURRENT_USER, "Software\\OpenClonk Project\\OpenClonk\\General", wrk.ACCESS_READ);
		let selected_plr = wrk.readStringValue("Participants");
		wrk.close();

		for(let fname in players) {
			//Somehow the scope of let-declared variables inside of for-in loops seems to count for the whole loop??
			let filename = fname;
			if(typeof filename != "string" || filename.search(/\.ocp/) == -1)
				continue;
			let plrid = players[filename].index;
			plr = players[plrid];
			if(!plr)
				continue;

			let player = plr.Player || {};
			let name = player.Name || Locale("$NewPlayerName$");
			if(!players[filename])
				continue;
			this.addEntry(name, 0, function(target, menuitemelm, menuitem) {
				//Speichern
				if(menuitem.options.isSelected) {
					wrk.open(wrk.ROOT_KEY_CURRENT_USER, "Software\\OpenClonk Project\\OpenClonk\\General", wrk.ACCESS_WRITE);
					wrk.writeStringValue("Participants", filename);
					wrk.close();
				}

				$("#nav-playername").attr("value", name);
				execHook("playerselection", plr);
			}, new ContextMenu(0, [ // Submenu
				//Edit player
				["$EditPlayer$", 0, function() {
					warn("$BETA_EditPlayerNotAvailable$");
					/* Deactivated for the moment because Windmill needs to be able to work with packed data for this (or something like that.)

					$("#ap-player-caption").text(Locale("$EditPlayer$"));
					switchPlrPage('page-addplayer');
					insertPlayerIntoEditPage(plrid);
					
					e.stopPropagation();*/
				}, 0, { uicon: "icon-gear" }],
				//Remove player
				["$RemovePlayer$", 0, function() {
					let dlg = new WDialog("$DlgTitleRemovePlayer$", "", { btnright: [{ preset: "accept",
						onclick: function(e, btn, _self) {
							removePlayer(filename);
						}
					}, "cancel"]});
					dlg.setContent("<description>"+sprintf(Locale("$DlgRemovePlayer$"), name)+"</description>");
					dlg.show();
				}, 0, { uicon: "icon-trashbin" }]
			], MODULE_LPRE, {allowIcons: true}), {
				type: "radioitem", 
				isSelected: (selected_plr == filename),
				radiogroup: "playeritem",
				tooltip: Locale("$PlayerInfo$", -1, player.Score||0, player.Rounds||0, player.RoundsWon||0, player.RoundsLost||0),
				iconsrc: players[filename].imgstr
			});
		}
		this.addSeperator();
		this.addEntry("$CreatePlayer$", 0, function(target, menuitemelm, menuitem) {
			//Open a Dialog for Player creation
			let dlg = new WDialog("$DlgCreatePlayer$", "", { css: {width: "340px"}, btnright: [{ preset: "accept",
				onclick: function*(e, btn, _self) {
					yield addNewPlayer(_self.element);
				}
			}, "cancel"]});
			dlg.setContent($("#dlg-createplayer").html());
			dlg.show();

			//Create color picker
			cPkr = createColorPicker($(dlg.element).find(".ap-clrpckr")[0]);

			var image = new Image();
			image.addEventListener("load", function() {
				//Load image for colorization into the canvas
				var canvas = $(dlg.element).find(".cnv-apbigicon")[0];
				var ctx = canvas.getContext("2d");
				canvas.width = 64;
				canvas.height = 64;
				ctx.drawImage(image, 0, 0, 64, 64);

				//Grab pixel data
				let px = ctx.getImageData(0, 0, canvas.width, canvas.height);

				//Change color of color by owner areas when a color is picked
				cPkr.onchange = function(clr) {
					//Put the previous pixel data and grab it again, so we dont overwrite the default data
					ctx.putImageData(px, 0, 0);
					let pxdata = ctx.getImageData(0, 0, canvas.width, canvas.height);

					//Iterate through each pixel
					let data = pxdata.data;
					for(let i = 0; i < data.length; i+=4) {
						let [r,g,b,a] = [data[i], data[i+1], data[i+2], data[i+3]];

						//Check if the pixel should be colored (blueish colors)
						if(ClrByOwner(r,g,b)) {
							//Modulate the color to the picked color
							let nclr = ModulateClr([b,b,b,a], clr);
							[data[i], data[i+1], data[i+2]] = [...nclr];
							data[i+3] = a;
						}
					}

					//Save the changed colors
					ctx.putImageData(pxdata, 0, 0);
				};
			});
			image.src = "chrome://windmill/content/img/playerselection/img-defaultplr.png";

			//Pick clonk style
			$(dlg.element).find(".img-apclonkstyle").click(function() {
				let id = parseInt($(this).attr("data-skinid"));
				if(isNaN(id))
					id = 0;
				id++;
				//Check if another image file with the given id exists "ClonkSkin%d.png"
				OS.File.exists(_sc.chpath+"/content/img/playerselection/ClonkSkin"+id+".png").then((exists) => {
					//If not, then go back to 0
					if(!exists)
						id = 0;
					$(this).attr("src", "chrome://windmill/content/img/playerselection/ClonkSkin"+id+".png").attr("data-skinid", id);
				});
			});
		}, 0, {uicon: "icon-add-player"});
	}, [], MODULE_LPRE, { allowIcons: true, iconsize: 32 });
	playersel.bindToObj($("#showPlayerSelect"), {dropdown: true, classes: "ctx-playerselect"});
}

function addPlayerlistItem(id, filename, imgstr) {
	players[id][0] = filename;
	let wrk = _sc.wregkey();
	wrk.open(wrk.ROOT_KEY_CURRENT_USER, "Software\\OpenClonk Project\\OpenClonk\\General", wrk.ACCESS_READ);
	if(wrk.readStringValue("Participants") == filename) {
		let player = players[id].Player || {};
		let name = player.Name || Locale("$NewPlayerName$");
		$("#nav-playername").attr("value", name);
	}
	wrk.close();

	return;
}

function addNewPlayer(dlg) {
	let plr = getNewPlayer();
	if($(dlg).find(".ap-plrname").val())
		plr["Player"]["Name"] = $(dlg).find(".ap-plrname").val();
	if($(dlg).find(".ap-plrcomment").val())
		plr["Player"]["Comment"] = $(dlg).find(".ap-plrcomment").val();

	let clr = cPkr.getColor();
	plr["Player"]["ColorDw"] = ((clr[0] << 16)|(clr[1] << 8)|clr[2]).toString();
	let skin = parseInt($(dlg).find(".img-apclonkstyle").attr("data-skinid"));
	if(skin && !isNaN(skin))
		plr["Preferences"]["ClonkSkin"] = skin;
	
	return Task.spawn(function*() {
		let plrleafname = plr["Player"]["Name"].replace(/[^a-zA-Z0-9_-]/, "_")+".ocp";
		let plrpath = _sc.env.get("APPDATA")+"/OpenClonk/"+plrleafname;
		yield OS.File.makeDir(plrpath);

		let text = "";

		for(let sect in plr) {
			if(!plr[sect])
				continue;

			text += "["+sect+"]\r\n";
			for(let key in plr[sect]) {
				if(plr[sect][key] === undefined)
					continue;

				text += key+"="+plr[sect][key]+"\r\n";
			}

			text += "\r\n";
		}

		yield OS.File.writeAtomic(plrpath+"/Player.txt", text, {encoding: "utf-8"});

		let process = _ws.pr(_sc.file(getC4GroupPath()));
		let args = [plrpath, "-p"];

		let promise = new Promise(function(success, reject) {
			process.create(args, 0x1, function() {
				players.push(plr);
				EventInfo("$EIPlayerCreated$");
				success();
				refreshPlayerInfo();
			});
		});
		yield promise;
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

function removePlayer(filename) {
	let path = "";
	if(OS_TARGET == "WINNT")
		path = _sc.env.get("APPDATA")+"/OpenClonk/";
	path += filename;

	let task = Task.spawn(function*() {
		let stat = yield OS.File.stat(path);
		if(!stat.isDir)
			yield OS.File.remove(path, { ignoreAbsent: true });
		else
			yield OS.File.removeDir(path, { ignoreAbsent: true });
	});
	task.then(function() {
		refreshPlayerInfo();
		EventInfo("$EIPlayerRemoved$");
	}, function(reason) {
		EventInfo("An error occured while trying to remove the player.");
		log(reason);
	});
	return task;
}