var audioobj, audiofile;

function getReloadPars() {
	var str = "";
	for(var id in playerArray) {
		if(playerArray[id])
			str += id + "=" + encodeURI(playerArray[id].f.path) + "&";
	}

	return str;
}

hook("load", function() {
	var query = location.search.substr(1).split('&');
	if(query) {
		for(var i = 0; i < query.length; i++) {
			if(!query[i].length)
				continue;

			var split = query[i].split("=");
			loadFile(decodeURI(split[1]), parseInt(split[0]), true);
		}
	}

	initiliazePlayer();
	function updateProgress(e) {
		let wdt = $(this).outerWidth(), p = e.pageX/wdt;
		if(audioobj)
			audioobj.currentTime = Math.round(audioobj.duration*p);
		$(this).find("#progressneedle").css("width", p*100+"%")
	}
	let lmbdown;
	$("#progressmeter").mousedown(function(e) {
		if(e.button == 0) {
			lmbdown = true;
			$(this).find("#progressneedle").addClass("no-update");
			updateProgress.call(this, e);
		}
	}).mousemove(function(e) {
		if(lmbdown)
			updateProgress.call(this, e);
		$("#time-tooltip").addClass("active");
		let wdt = $(this).outerWidth(), p = e.pageX/wdt;
		let time = Math.floor(audioobj.duration*p);
		$("#time-tooltip").text(pad(Math.floor(time/60),2) + ":" + pad((time%60), 2));

		let ttpwdt = $("#time-tooltip").outerWidth();
		$("#time-tooltip").css("left", Math.max(Math.min(e.pageX-ttpwdt/2, $(this).outerWidth()-ttpwdt), 0)+"px");
		e.stopImmediatePropagation();
	}).mouseup(function(e) {
		if(e.button == 0) {
			lmbdown = false;
			$(this).find("#progressneedle").removeClass("no-update");
		}
	}).mouseout(function(e) {
		$("#time-tooltip").removeClass("active");
	});
	$("body").mousemove(function(e) {
		//Da mouseout/mouseleave nicht immer alles mitbekommen nochmal doppelt.
		if(!$(e.relatedTarget).parents("#progressmeter")[0])
			$("#time-tooltip").removeClass("active");
	});

	function updateVolume(e) {
		let wdt = $(this).outerWidth()-10, p = Math.min(Math.max((e.pageX-$(this).offset().left)/wdt, 0), 1);
		if(audioobj)
			audioobj.volume = p;
	}

	$("#currentvolume-wrapper").mousedown(function(e) {
		if(e.button == 0) {
			lmbdown = true;
			updateVolume.call(this, e);
		}
	}).mousemove(function(e) {
		if(lmbdown)
			updateVolume.call(this, e);
	}).mouseup(function(e) {
		if(e.button == 0) {
			lmbdown = false;
			saveConfig(["Audiomodule"]);
		}
	});
	return true;
});

function loadFile(path) {
	if(audioobj && !audioobj.paused)
		pauseAudio();

	audiofile = { path };
	if(OS_TARGET == "WINNT")
		audioobj = new Audio(encodeURI("file://"+path.replace(/\\/gi, "/")).replace(/#/g, "%23"));
	else
		audioobj = new Audio(encodeURI("file://"+path).replace(/#/g, "%23"));

	initializeAudiofile();
	return true;
}

function pad(num, size) {
    var s = num+"";
    while(s.length < size) s = "0" + s;
    return s;
}

function initializeAudiofile() {
	//Eventhandling
	audioobj.addEventListener("durationchange", function() {
		var dur = Math.round(this.duration);
		$("#timeend").text(pad(Math.floor(dur/60), 2) + ":" + pad((dur % 60), 2));
	});
	audioobj.addEventListener("pause", function() {
		var btn = $("#button-play");
		btn.removeClass("pause");
	});
	audioobj.addEventListener("timeupdate", function() {
		if($("#progressneedle").hasClass("no-update"))
			return;

		var s = Math.floor(this.currentTime);
		var p = Math.floor(this.currentTime/this.duration * 100);
		$("#timecurrent").text(pad(Math.floor(s/60),2) + ":" + pad((s % 60), 2));
		$("#progressneedle").css("width", p+"%");
	});
	audioobj.addEventListener("ended", function() {
		//Soll am Ende der Audiodatei die gleiche Zeit anzeigen wie der angezeigt Endzeitpunkt
		var dur = Math.round(this.duration);
		$("#timecurrent").text(pad(Math.floor(dur/60), 2) + ":" + pad((dur % 60), 2));
	});
	audioobj.addEventListener("volumechange", function() {
		setConfigData("Audiomodule", "Volume", audioobj.volume*100);
		$("#currentvolume").css("width", audioobj.volume*100+"%");
	});
	audioobj.addEventListener("error", function(e) {	
		var error = e.target.error;
		var msgstart = "$err_loadfile$\n\n";

		switch(error.code) {
			case error.MEDIA_ERR_DECODE:
				warn(msgstart+"MEDIA_ERR_DECODE:\n$errmsg_media_decode$");
				break;
			case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
				//TODO: Vorschlagen, Datei über ein angegebenes externes Programm zu öffnen.
				//Liste für unterstützte Codecs: https://support.mozilla.org/en-US/kb/viewing-html5-audio-and-video
				warn(msgstart+"MEDIA_ERR_SRC_NOT_SUPPORTED:\n$errmsg_media_src_not_supported$");
				break;
			default:
				warn("Error code " + error.code + ":\n$errmsg_unknown_error$");
				break;
		}
	});

	audioobj.volume = getConfigData("Audiomodule", "Volume")/100;
	audioobj.loop = getConfigData("Audiomodule", "Loop");
	audioobj.autoplay = getConfigData("Audiomodule", "Autoplay");

	return true;
}

function initiliazePlayer(player, id) {
	//Start/Pausier Button
	$("#button-play").click(function() {
		//Pausieren
		if($(this).hasClass("pause")) {
			pauseAudio();
			$(this).removeClass("pause");
		}
		else {
			playAudio();
			$(this).addClass("pause");
		}
	});

	//Stop/Zum Beginn springen
	$("#button-stop").click(function() {
		pauseAudio();
		setTime(0);
	});

	//Zeitauswahl
	/*$(".timeslider").get(0).addEventListener("input", function() {
		var val = $(this).val();
		var max = getDuration();
		var newsec = Math.round(val/100 * max);

		setTime(newsec);
	});*/

	//Lautstärkeregler
	/*$(".volumeslider").get(0).addEventListener("input", function() {
		setVolume($(this).val()/100);
	});*/
	// Lautstärkeregler anzeigen
	$("#button-volume").click(function() {
		$("#volume-overlay").addClass("visible");
	});
	// ... und verstecken
	$("#close-volume-overlay").click(function() {
		$("#volume-overlay").removeClass("visible");
	});
	$("#toggle-volume").click(function() {
		$(".volumn-btn").toggleClass("muted");
	});

	//Loopen
	$("#button-loop").click(function() {
		if(toggleLoop()) {
			$(this).addClass("active");
			setConfigData("Audiomodule", "Loop", true);
		}
		else {
			$(this).removeClass("active");
			setConfigData("Audiomodule", "Loop", false);
		}
		saveConfig();
	});

	if(getConfigData("Audiomodule", "Loop"))
		$("#button-loop").addClass("active");

	//Slider auf Startpositionen setzen
	/*$(".timeslider").val(0);
	$(".volumeslider").val(getConfigData("Audiomodule", "Volume"));*/
	$("#currentvolume").css("width", audioobj.volume*100+"%");

	return true;
}

function fileLoaded(path) {
	if(audiofile.path == path)
		return true;

	return false;
}

/*-- Current Audio Controls --*/

function playAudio() {
	if(audioobj.currentTime == audioobj.duration) {
		$("#progressneedle").addClass("no-update");
		$("#progressneedle").css("width", "0px");
		setTimeout(function() {
			//Muss um ein Frame verzoegert werden, da CSS spaeter als Javascript ausgefuehrt wird (und die Transitions dann wieder aktiv waeren)
			$("#progressneedle").removeClass("no-update");
		}, 1);
		audioobj.currentTime = 0;
	}
	audioobj.play();

	return true;
}

function pauseAudio() {
	audioobj.pause();

	return true;
}

function getVolume() { return audioobj.volume; }
function setVolume(val) {
	audioobj.volume = Math.max(Math.min(1.0, val), 0);

	return true;
}

function doVolume(change) {
	setVolume(getVolume()+change);

	return true;
}

function toggleLoop() {
	audioobj.loop = !audioobj.loop;

	return audioobj.loop;
}

function toggleMute() {
	audioobj.muted = !audioobj.muted;

	return audioobj.muted;
}

function setTime(time) {
	audioobj.currentTime = time;

	return true;
}

function getCurrentTime() {
	audioobj.currentTime;

	return -1;
}

function getDuration(id) {
	audioobj.duration;

	return -1;
}