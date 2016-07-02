
var ntf_settings = [], ntf_gameids = [];

var NTYPE_CLIENTNAME = 0,
	  NTYPE_PLAYERNAME = 1,
	  NTYPE_RESOURCE = 2,
	  NTYPE_HOSTNAME = 3,
	  //..reserviert

	  NTYPE_LEAGUE = 50, // keine Arrays mehr
	  NTYPE_MINPLAYER = 51,
	  NTYPE_MAXPLAYER = 52,
	  NTYPE_PASSWORD = 53;

function AddNotificationCondition(type, value, exception, gameid) {
	if(gameid)
		ntf_gameids.push(gameid);

	if(!ntf_settings[type] && type < 50)
		ntf_settings[type] = [];

	if(type < 50) {
		let found = false;
		//Search for duplicates and overwrite them
		for(let i = 0; i < ntf_settings[type].length; i++)
			if(ntf_settings[type][i].v == value) {
				ntf_settings[type][i].ex = exception;
				found = true;
			}
		if(!found)
			ntf_settings[type].push({v: value, ex: exception});
	}
	else
		ntf_settings[type] = {v: value, ex: exception};

	saveNotification();

	return true;
}

function CheckReference(ref) {
	//Schon durchsuchte References nicht nochmal durchsuchen
	if(ntf_gameids.indexOf(ref.GameId) != -1)
		return false;

	//Only lobby games
	if(ref.State != "Lobby")
		return false;
	var found = false;

	//Sofern nicht anders eingestellt, leere Spiele ignorieren
	if(!getConfigData("ShowGame", "NotificationsShowEmpty") && !getRefPlayerCount(ref, true))
		return;

	for(var type in ntf_settings) {
		if(found)
			break;

		type = parseInt(type);
		if(!type || isNaN(type))
			continue;

		if(!ntf_settings[type])
			continue;

		if(type < 50) {
			for(var i = 0; i < ntf_settings[type].length; i++) { //Arrays durchsuchen
				var obj = ntf_settings[type][i];

				if(found && !obj.ex)
					continue;

				switch(type) {
					case NTYPE_CLIENTNAME: // Nach Clientnamen suchen
						var clients = getRefClients(ref);
						if(!clients)
							break;

						for(var j = 0; j < clients.length; j++) {
							if(clients[j].Name == obj.v) {
								if(obj.ex)
									return false;

								found = true;
							}
						}
						break;

					case NTYPE_PLAYERNAME: // Spielername
						var clients = getRefClients(ref);
						if(!clients)
							break;

						for(var j = 0; j < clients.length; j++) {
							var players = clients[j].Player;
							if(!players)
								continue;

							for(var k = 0; k < players.length; k++) {
								if(players[k].Name == obj.v) {
									if(obj.ex)
										return false;

									found = true;
								}
							}
						}
						break;

					case NTYPE_RESOURCE: // Resources
						var resources = ref.Resource;
						if(!resources)
							return false;

						for(var j = 0; j < resources.length; j++) {
							if(resources[j].Filename == obj.v)  {
								if(obj.ex)
									return false;

								found = true;
							}
						}
						break;

					case NTYPE_HOSTNAME: // Hostname
						var client = ref.Client;
						if(!client)
							break;

						if(client[0].Name == obj.v) {
							if(obj.ex)
								return false;

							found = true;
						}
						break;
				}
			}
		} else {
			var obj = ntf_settings[type];
			switch(type) {
				/*case NTYPE_LEAGUE:

					break;*/
				case NTYPE_MINPLAYER:
					if(getPlayerCount(ref) < obj.v)
						return false;
					break;
				case NTYPE_MAXPLAYER:
					if(getPlayerCount(ref) > obj.v)
						return false;
					break;
				case NTYPE_PASSWORD:
					if(ref.PasswordNeeded && !obj.v)
						return false;
					break;
			}
		}
	}

	if(found)
		ntf_gameids.push(ref.GameId);

	return found;
}

function getHostClient(ref) {
	var client = ref.Client;
	if(!client)
		return false;

	return client[0];
}

function ShowReferenceNotification(ref) {
	var content = sprintf(Locale("$GameNotificationDesc$"), ref.Title, getHostClient(ref).Name);
	var ntf = showNotification("#04b4ae", Locale("$GameNotificationTitle$"), content.replace(/<.+?>/g, ""));
	ntf.find(".notification-content").append('<hbox flex="1"><hbox class="ntfshowgames-plrcnt"></hbox>'+
		'<spacer flex="1"/><button class="notificationbtn ntfshowgames-quickjoin" label="'+(Locale("$QuickJoin$"))+'" /></hbox>');
	ntf.find(".ntfshowgames-plrcnt").text(getRefPlayerCount(ref) + " / " + ref.MaxPlayers);
	ntf.find(".ntfshowgames-quickjoin").click(function() {
		joinGame(ref);
	});
	
	return true;
}

function loadNotification() {
	ntf_settings = getConfigData("ShowGame", "Notifications");
	if(!ntf_settings)
		ntf_settings = [];

	return true;
}

function saveNotification() {
	setConfigData("ShowGame", "Notifications", ntf_settings);
	saveConfig();
	return true;
}