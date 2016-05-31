
String.prototype.octToAscii = function() {
  return this.replace(/\\\d\d\d/gi, function(str) {
	var chr = parseInt(str.substr(1), 8);
	return String.fromCharCode(chr);
  }).removeHTMLTags();
};
String.prototype.parseTags = function() {
	var ret = this.replace(/&lt;c..+?&gt;/g, function(str) {
		colorcode = "36F"; //Da gelbe Farbe kaum erkennbar, lieber einheitliche Einfaerbung verwenden
		return "<c style=\"color: #" + colorcode + "\">";
	});
	ret = ret.replace(/<i>/g, "<i>");

	ret = ret.replace(/&lt;\/c&gt;/g, "</c>");
	ret = ret.replace(/\\"/g, "\"");
	var cnt = ret.match(/<c..+?>/g);
	if(!cnt)
		return ret;

	cnt = cnt.length;
	var cnt2 = ret.match(/<\/c>/g);
	if(!cnt2)
		cnt2 = 0;
	else
		cnt2 = cnt2.length;
	if(cnt > cnt2) {
		for(var i = 0; i < (cnt - cnt2); i++)
			ret += "</c>";
	}

	//Links parsen
	ret = ret.replace(/https?:\/\/[a-zA-Z-.]+?(\/[^\s<>]*|$)/, function(str) { 
		str = encodeURI(str);
		return '<a href="'+str+'">'+str+'</a>';
	});

	return ret;
}
String.prototype.removeHTMLTags = function() {
	var ret = this.replace(/&/g, "&amp;").replace(/</g, "&lt;");
	ret = ret.replace(/>/g, "&gt;");
	ret = ret.replace(/&lt;i&gt;/g, "<i>");
	ret = ret.replace(/&lt;\/i&gt;/g, "</i>");
	ret = ret.replace(/&lt;b&gt;/g, "<b>");
	ret = ret.replace(/&lt;\/b&gt;/g, "<b>");
	ret = ret.replace(/\|/g, "<br>");

	return ret;
};

//Bitmaske zur Sortierung
var REFSTATE_NoPass = 1, REFSTATE_RunTimeJoin = 2, REFSTATE_League = 4, REFSTATE_Lobby = 8;
function getRefState(ref) {
	var state = 0;
	if(ref.State == "Lobby")
		state |= REFSTATE_Lobby;
	if(ref.League)
		state |= REFSTATE_League;
	if(ref.JoinAllowed != "false")
		state |= REFSTATE_RunTimeJoin;
	if(ref.PasswordNeeded != "true")
		state |= REFSTATE_NoPass;

	return state;
}

var refreshID;

window.addEventListener("load", function(){
	startMSRefresh();
	getMasterServerInformation(showMasterServerGames);
	loadNotification();
});

function setResSaveMode() {
	$("*").addClass("ressavemode");
	$("#ressavemode-btn").click(function() {
		_mainwindow.deactivateResSaveMode();
	});
}

function pauseMSRefresh() {
	clearInterval(refreshID);
}

function startMSRefresh() {
	refreshID = setInterval(function() {
		$("#reference-list").addClass("refresh");
		getMasterServerInformation(showMasterServerGames);
	}, 20000);
}

function getRefClients(reference) {
	var infos = reference.PlayerInfos;
	if(!infos)
		return false;

	var clients = infos[0].Client;

	return clients;
}

function getRefPlayerCount(ref, ignoreScriptPlayers) {
	var clients = getRefClients(ref), plrcnt = 0;
	if(clients) {
		for(var k = 0; k < clients.length; k++) {
			var players = clients[k].Player;
			if(!players)
				continue;

			for(var j = 0; j < players.length; j++) {
				if(players[j].Flags && players[j].Flags.search(/Removed/g) != -1)
					continue;
				if(players[j].Type == "Script" && ignoreScriptPlayers)
					continue;

				plrcnt++;
			}
		}
	}

	return plrcnt;
}

var current_references = 0;

function updateTimeDisplay() {
	let starttime = parseInt($("#game-time").attr("data-starttime"));
	if(!starttime || isNaN(starttime)) {
		$("#game-time").text("");
		return;
	}

	let time = Math.floor((new Date()).getTime()/1000) - starttime;
	let hours = Math.floor(time / 3600),
		minutes = Math.floor((time % 3600) / 60),
		seconds = time % 60;
	$("#game-time").text(Locale("$InGameFor$", 0, hours, minutes, seconds));
}

function showMasterServerGames(info) {
	var obj = handleMasterservData(info);
	current_references = obj;
	$("#reference-list").removeClass("refresh");

	if(obj["Clonk Rage"]) { // <--- Bei MS-Wechsel auf Open Clonk wechseln
		$("#game-info-motd").html(obj["Clonk Rage"][0].MOTD + " <a href='"+obj["Clonk Rage"][0].MOTDURL+"'>" +
								  obj["Clonk Rage"][0].MOTDURL + " </a>");
	}

	if(!obj["Reference"]) {
		//Keine Spiele offen
		return;
	}

	obj["Reference"].items.sort(function(a, b) {
		var state1 = getRefState(a), state2 = getRefState(b);
		if(state1 < state2)
			return 1;
		else if(state1 > state2)
			return -1;
		else
			return 0;
	});

	let currentref = $(".reference.ref-selected").attr("id");
	$(".reference:not(.reference-draft").remove();

	for(var i = 0; i < obj["Reference"].length; i++) {
		if(obj["Reference"][i]) {
			let ref = obj["Reference"][i], state = getRefState(ref);
			let clone = $(".reference-draft").clone(true);
			clone.removeClass("reference-draft");
			if(ref.GameId)
				clone.attr("id", "game"+ref.GameId);
			else if(ref.Seed)
				clone.attr("id", "gameseed"+ref.Seed);
			else {
				clone.remove();
				continue;
			}

			//Referenzzustand bearbeiten
			if(!(state & REFSTATE_Lobby))
				clone.addClass("running");
			if(state & REFSTATE_RunTimeJoin)
				clone.addClass("runtimejoin");
			if(!(state & REFSTATE_NoPass))
				clone.addClass("password");
			if(state & REFSTATE_League)
				clone.addClass("league");

			if(clone.hasClass("league"))
				clone.find(".ref-icons").append('<img src="chrome://windmill/content/img/showgames/showgames-league.png" />');
			if(clone.hasClass("password"))
				clone.find(".ref-icons").append('<img src="chrome://windmill/content/img/showgames/showgames-password.png" />');

			if(clone.hasClass("running")) {
				if(clone.hasClass("runtimejoin"))
					clone.find(".ref-icons").append('<img src="chrome://windmill/content/img/showgames/showgames-runtimejoin.png" />');

				clone.find(".ref-icons").append('<img src="chrome://windmill/content/img/showgames/showgames-running.png" />');
			}
			else
				clone.find(".ref-icons").append('<img src="chrome://windmill/content/img/showgames/showgames-lobby.png" />');

			clone.find(".ref-titleimage").attr("src", "https://clonkspot.org/images/games/Title.png/"+ref.Scenario[0].Filename.replace(/\\/g, "/")+"?hash="+ref.Scenario[0].FileCRC);
			clone.find(".ref-title").html(ref.Title);
			clone.find(".ref-hostname").text(ref.Client[0].Name.replace(/&amp;/, "&"));

			var clients = getRefClients(ref), plrstr = "", plrcnt = 0;
			if(clients) {
				for(var k = 0; k < clients.length; k++) {
					var players = clients[k].Player;
					if(!players)
						continue;

					for(var j = 0; j < players.length; j++) {
						if(players[j].Flags && players[j].Flags.search(/Removed/g) != -1)
							continue;

						if(plrcnt)
							plrstr += ", ";

						plrstr += players[j].Name;
						plrcnt++;
					}
				}
			}
			clone.find(".ref-playernames").text(plrstr);
			clone.find(".ref-playercount").text(plrcnt);
			clone.find(".ref-playerlimit").text(ref.MaxPlayers || "0");

			clone.click(function() {
				$(".ref-selected").removeClass("ref-selected");
				$(this).addClass("ref-selected");
				$('#game-info').addClass("selected-ref");

				var r = 0;
				for(var i = 0; i < obj.Reference.length; i++) {
					if($(this).attr("id").search(/gameseed/) != -1) {
						if(obj.Reference[i].Seed == $(this).attr("id").replace(/gameseed/, ""))
							r = obj.Reference[i];
					}
					else if(obj.Reference[i].GameId == $(this).attr("id").replace(/game/, "")) {
						r = obj.Reference[i];
						break;
					}
				}

				$("#game-title").html(r.Title);
				$("#game-time").attr("data-starttime", !(state & REFSTATE_Lobby)?r.StartTime:0);
				$("#game-hostname").text(Locale(" $on$ ") + r.Client[0].Name);
				$("#game-comment").html(r.Comment || "");

				$("#game-playerlist").empty();

				updateTimeDisplay();
				var clients = r.PlayerInfos[0].Client;
				if(clients) {
					for(var i = 0; i < clients.length; i++) {
						//Vielleicht noch irgendwas um Spectator anzeigen zu lassen?
					
						if(clients[i].Flags && clients[i].Flags.search(/Removed/g) != -1)
							continue;

						var players = clients[i].Player;

						if(!players)
							continue;

						var clientname = "";
						for(var j = 0; j < r.Client.length; j++) {
							if(r.Client[j].ID == clients[i].ID) {
								clientname = r.Client[j].Name;
								break;
							}
						}

						for(var j = 0; j < players.length; j++) {
							if(players[j].Flags && players[j].Flags.search(/Removed/g) != -1)
								continue;

							$("#game-playerlist").append("<div><p class='game-player-name'>"+players[j].Name+"</p>"+
														 "<p class='game-player-clientname'>"+clientname+"</p></div>");
						}
					}
				}
			});
			//JoinGame
			clone.dblclick(function() {
				if(!$(this).hasClass("ref-selected"))
					return;

				var r = 0;
				for(var i = 0; i < obj.Reference.length; i++) {
					if(obj.Reference[i].GameId == $(this).attr("id").replace(/game/, "")) {
						r = obj.Reference[i];
						break;
					}
				}

				if(r)
					joinGame(r);
			});
			clone.mousemove(function(e) {
				if(!$(this).hasClass("portsopen")) {
					$("#ports-tooltip").addClass("visible");
					var wdt = $("#ports-tooltip").outerWidth(), hgt = $("#ports-tooltip").outerHeight();
					$("#ports-tooltip").css({left: Math.min(e.clientX+wdt+10, $(window).width())-wdt,
											 top: Math.min(e.clientY+hgt+10, $(window).height())-hgt });

					// Da Mouseleave und Mouseout in zu vielen Faellen nicht ausgeloest werden (bspw. schnelle Mausbewegung 
					// oder wenn der Documentbereich etwas kleiner ist etc.), Loesung mit setTimeout.
					setTimeout(function() {
						if(!$(".reference:not(.portsopen):hover")[0])
							$("#ports-tooltip").removeClass("visible");
					}, 20);
				}
			});

			$("#reference-list").append(clone);

			if(currentref == clone.attr("id"))
				clone.trigger("click");

			if(getConfigData("ShowGame", "PortScan")) {
				//Ports überprüfen
				if(!ports_checked[getRefIdentifier(ref)])
					checkIfPortsForwarded(ref);	
				else
					setPortForwardingInformation(ref);
			}
			else
				clone.addClass("portsopen");

			ctx_references.bindToObj(clone);

			//Benachrichtigung
			if(CheckReference(ref))
				ShowReferenceNotification(ref);
		}
	}
}

function joinGame(ref) {
	var f = _sc.file(getClonkExecutablePath());
	if(!f.exists())
		return alert(Locale("$err_ocexecutable_not_found$"));

	var serversocket = _sc.serversocket();
	serversocket.init(getConfigData("StartGame", "GamePort"), true, 5);
	log("SERVERSOCKET: "+serversocket.port);

	var listener = { onSocketAccepted: function(serverSocket, clientSocket) {
		log("Socket Connection accepted on "+clientSocket.host+":"+clientSocket.port);
		var output = clientSocket.openOutputStream(Ci.nsITransport.OPEN_BLOCKING, 0, 0);
		var cstr = _sc.costream();

		var httpHeader = "HTTP/1.1 200 OK\r\nContent-Length: " + ref.plainstr.length + "\r\n\r\n";
		var text = httpHeader + ref.plainstr;

		cstr.init(output, "utf-8", text.length, Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
		cstr.writeString(text);
	}};

	serversocket.asyncListen(listener);
	setTimeout(function() {
		if(serversocket) {
			serversocket.close();
			log("socket closed");
		}
	}, 30000);

	var process = _ws.pr(f);
	var args = ["--network", "clonk://localhost:"+getConfigData("StartGame", "GamePort")+"/", "--fullscreen"];
	if(getConfigData("StartGame", "Record"))
		args.push("--record");

	process.create(args);
	return true;
}

function getReferenceById(id) {
	var refs = current_references["Reference"];
	for(var i = 0; i < refs.length; i++) {
		if(refs[i].GameId == id)
			return refs[i];
	}

	return false;
}

function getContainerByRef(ref) {
	if($("#game"+ref.GameId)[0])
		return $("#game"+ref.GameId);
	if($("#gameseed"+ref.Seed)[0])
		return $("#gameseed"+ref.Seed);
	return false;
}

function getRefIdentifier(ref) {
	if(ref.GameId)
		return "game"+ref.GameId;
	else if(ref.Seed)
		return "gameseed"+ref.Seed;

	return;
}

var ports_checked = [];
const SG_PORTS_Open = 1, SG_PORTS_Closed = 2;

//Ports scannen
function checkIfPortsForwarded(ref) {
	//Adressen 
	var addresses = ref.Address.split(',');
	var addr_obj = [];
	for(var i = 0; i < addresses.length; i++) {
		var addr = addresses[i];
		var match = addr.match(/(TCP|UDP):(.+?):(.+)/);
		addr_obj[i] = { type: match[1], ipaddr: match[2], port: parseInt(match[3]) };
	}

	ports_checked[getRefIdentifier(ref)] = [];
	ports_checked[getRefIdentifier(ref)]["status"] = SG_PORTS_Closed;

	//Einzelne Ports scannen und Status setzen
	for(var i = 0; i < addr_obj.length; i++) {
		let {port, ipaddr} = addr_obj[i];
		//Private IP-Adressen überspringen
		if(ipaddr.search(/^(192\.168|10\.\d+|172\.16)\.\d+\.\d+/) != -1)
			continue;

		let last = (i == addr_obj.length-1);
		var img = new Image();
		var timeoutid = setTimeout(function() {
			if(ports_checked[getRefIdentifier(ref)][port])
				return;
			if(ports_checked[getRefIdentifier(ref)]["status"] == SG_PORTS_Open)
				return;
			
			ports_checked[getRefIdentifier(ref)][port] = SG_PORTS_Closed;
			setPortForwardingInformation(ref);
		}, 1000);
		
		img.onerror = function() {
			if(ports_checked[getRefIdentifier(ref)][port])
				return;

			ports_checked[getRefIdentifier(ref)][port] = SG_PORTS_Open;
			ports_checked[getRefIdentifier(ref)]["status"] = SG_PORTS_Open;
			setPortForwardingInformation(ref);
			
			clearTimeout(timeoutid);
		};
		img.onload = img.onerror;
		
		img.src = 'http://'+ipaddr+':'+port;
	}
}

function setPortForwardingInformation(ref) {
	var obj = getContainerByRef(ref);

	//Da es von den angebotenen Adressen geschlossene Ports geben darf, kann nur angegeben werden, dass die Ports offen sind
	//(Umgekehrt müssen alle Ports geschlossen sein um nicht joinen zu können)
	if(ports_checked[getRefIdentifier(ref)]["status"] == SG_PORTS_Open)
		$(obj).addClass("portsopen");
	else
		$(obj).removeClass("portsopen");

	return true;
}

/* toolbar setup */

var layout = getConfigData("ShowGame", "RefLayout") || "shortinfo";

var ctx_references = new ContextMenu(0, 0, MODULE_LPRE);

function getChildIndex(e) {
    var i = 0;
    while((e = e.previousSibling)!=null)
		++i;
	
    return i;
}

hook("load", function() {
	$("#ref-toggle-update").click(function() {
		if($(this).hasClass("enabled"))
			pauseMSRefresh();
		else
			startMSRefresh();

		$(this).toggleClass("enabled");
	});

	$("#ref-layout-list").click(function() {
		$($(this).children()[0]).appendTo(this);

		$("#reference-list").removeClass("ref-layout-" + layout);
		layout = $(this).children()[0].id;
		$("#reference-list").addClass("ref-layout-" + layout);	
		setConfigData("ShowGame", "RefLayout", layout, true);
	});
	$("#reference-list").addClass("ref-layout-" + layout);
	while($("#ref-layout-list").children()[0].id != layout && $("#ref-layout-list").children("#"+layout)[0])
		$($("#ref-layout-list").children()[0]).appendTo($("#ref-layout-list"));

	ctx_references.addEntry("$Notifications$", 0, 0, (new ContextMenu(0, [
		["$AddHostNotification$", 0, function(target) {
			var ref = getReferenceById(parseInt($(target).attr("id").substr(4)));
			if(!ref.Client)
				return;

			AddNotificationCondition(NTYPE_HOSTNAME, ref.Client[0].Name, 0, ref.GameId);
		}],
		["$AddScenarioNotification$", 0, function(target) {
			var ref = getReferenceById(parseInt($(target).attr("id").substr(4)));
			if(!ref.Resource)
				return;

			AddNotificationCondition(NTYPE_RESOURCE, ref.Resource[0].Filename, 0, ref.GameId);
		}],
		["$AddObjectNotification$", 0, function(target) {
			var ref = getReferenceById(parseInt($(target).attr("id").substr(4)));
			if(!ref.Resource)
				return;

			//Objektauswahl öffnen
			var dlg = new WDialog("$ChooseObject$", MODULE_LPRE, { modal: true, css: { "width": "450px" }, btnright: [{ preset: "accept",
				onclick: function(e, btn, _self) {
					if(!_mainwindow.$("#sgdlgObjList")[0].selectedItem)
						return;
				
					var name = _mainwindow.$("#sgdlgObjList")[0].selectedItem.label;
					AddNotificationCondition(NTYPE_RESOURCE, name, 0, ref.GameId);
				}
			}, "cancel"]});
			var content = '<description>$ChooseObjectFromList$</description><listbox id="sgdlgObjList">';

			//Objekte auflisten
			for(var i = 0; i < ref.Resource.length; i++) {
				var res = ref.Resource[i];
				if(res.Type == "Definitions" && res.Filename.split('.')[res.Filename.split('.').length-1] == "c4d") //TODO: Für OC auf ocd ändern!
					content += '<listitem label="'+res.Filename+'" class="sgdlg-objectlistitem"/>';
			}

			dlg.setContent(content+'</listbox>');
			dlg.show();
			dlg = 0;
		}],
		"seperator",
		["$IgnoreHostNotification$", 0, function(target) {
			var ref = getReferenceById(parseInt($(target).attr("id").substr(4)));
			if(!ref.Client)
				return;

			AddNotificationCondition(NTYPE_HOSTNAME, ref.Client[0].Name, true, ref.GameId);
		}],
		["$IgnoreScenarioNotification$", 0, function(target) {
			var ref = getReferenceById(parseInt($(target).attr("id").substr(4)));
			if(!ref.Resource)
				return;

			AddNotificationCondition(NTYPE_RESOURCE, ref.Resource[0].Filename, true, ref.GameId);
		}],
		["$IgnoreObjectNotification$", 0, function() {
			//Objektauswahl öffnen
		}]
	], MODULE_LPRE)));
	
	setInterval(updateTimeDisplay, 1000);
});

var asdid = 0;

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

var mservcache, mservtime, deactivateRequests;

function getMasterServerInformation(call) {
	var ms_url = getConfigData("ShowGame", "MasterserverURL"); //Aus Config laden
	if(!ms_url)
		ms_url = "http://league.clonkspot.org/";
	//var ms_url = "http://league.openclonk.org/league.php";
	if((mservcache && (new Date()).getTime() < mservtime + 15000) || deactivateRequests)
		return call(mservcache);

	var req, rv;
	req = new XMLHttpRequest();

	req.onreadystatechange = function() {
		if(req.readyState == 4 && req.status == 404)
			rv = -1;
		if(req.readyState == 4 && req.status == 200) {
			rv = req.responseText;	
			mservcache = rv;
			mservtime = (new Date()).getTime();
			call(rv);
		}
	}

	req.open("GET", ms_url, true);
	req.send();

	return true;
}

function handleMasterservData(text) {
	return parseHierarchicalINI(text);
}