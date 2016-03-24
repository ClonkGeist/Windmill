
var session;

var scenes = {};
var sceneMeta = {};
var clrpckr;
var CM_PATHALIAS = "fpath";

function TabManager() { return scenes; }

function initModelviewer(file, idMdl) {
	
	if(!session) {
		session = _mv.init(document.getElementById("renderer"));
		session.enableViewControls();
		session.ontextureload = insertTextureUnit;
	}
	
	if(!clrpckr) {
		clrpckr = createColorPicker(document.getElementById("clrpick"));
		clrpckr.onchange = function(clr) {
			session.setOption("OVERLAY_COLOR", clr);
		};
	}
	
	scenes[idMdl] = session.addScene();
	scenes[idMdl].addMesh(file);
	scenes[idMdl].onskeletonload = function(skeleton, fReplacesOldSkeleton) {
		
		var l = skeleton.animations.length;
		scenes[idMdl].animList = new Array(l);
		
		for(var i = 0; i < l; i++)
			scenes[idMdl].animList[i] = skeleton.animations[i].name;
		
		scenes[idMdl].currentAnimIndex = -1;
		updateAnimationUI(scenes[idMdl]);
		
		// reveal animation-ui section
		document.getElementById("anim-section").className = "";
	};
	
	sceneMeta[idMdl] = {
		moduleId: idMdl,
		$resUiEl: $(".ressources-list.draft").clone().removeClass("draft"),
		texture_units: [],
		skeletons: []
	};
	
	resize();
	
	showDeckItem(idMdl);
}

function createCideToolbar() {}

function showDeckItem(idMdl) {
	scenes[idMdl].show();
	
	var path = scenes[idMdl].fpath.substr(_sc.workpath(idMdl).length+1);
	setWindowTitle(path + " - Windmill");
	
	$("#canvas-wrapper").removeClass (function (index, css) {
		return (css.match (/(^|\s)appearance-\S+/g) || []).join(' ');
	});
	
	$("#canvas-wrapper").addClass("appearance-"+scenes[idMdl].background?scenes[idMdl].background:"light");
	
	CM_ACTIVEID = idMdl;
	
	
	// update UI of animation panel
	if(scenes[idMdl].hasSkeletonRequirements()) {
		updateAnimationUI(scenes[idMdl]);
		document.getElementById("anim-section").className = "";
	}
	else {
		document.getElementById("anim-section").className = "hidden";
	}
	
	setBackground("light");
	frameUpdateWindmillTitle();
}

function getModuleIdBySceneId(sceneId) {
	for(let i = 0; i < sceneMeta.length; i++)
			if(sceneMeta[i].moduleId === sceneId)
					return sceneMeta[i].moduleId;
	
	return -1;
}

function removeDeckItem(id) {
	session.removeScene(scenes[id].id);
	scenes[id] = null;
}

function updateAnimationUI(frame) {
	var l = frame.animList.length,
		el = document.getElementById("animation-list");
	
	el.removeAllItems();
	for(var i = 0; i < l; i++)
		el.appendItem(frame.animList[i], i);
	
	el.selectedIndex = frame.currentAnimIndex || 0;
}

function insertTextureUnit(w, h, mesh, key, src) {
	
	showObj2(sceneMeta, 1);
	var meta = sceneMeta[mesh.parentMesh._scene.id];
	if(!meta)
		return;
	var a = src.split("/");
	tex = (meta.texture_units[mesh.id] = {w, h, key});
	
	tex.$el = $(".texture_unit_entry.draft").clone().removeClass("draft");
	
	tex.$el.find(".tue_file_name").text(a[a.length - 1]);
	
	var menu_wrapper = tex.$el.find(".tue_texture_sizes").get(0);
	
	// hardcoded node-creation because xul is weird and doesn't accept menulists that way
	var menu = document.createElement("menulist"),
		popup = document.createElement("popup");
	err(menu.appendItem);
	
	if(menu)
		return;
	for(let i = 1; i < 5; i++) {
		let subsize = w/(2*i);
		menu.appendItem(w/(2*i));
		
		if(subsize < 128)
			break;
	}
}

hook("load", function() {
	
	// background modi
	$("#bg-light").click(function() {
		setBackground("light");
	});
	
	$("#bg-dark").click(function() {
		setBackground("dark");
	});
	
	$("#bg-transparent").click(function() {
		setBackground("transparent");
	});
	
	$("#animation-list").on("command", function(e) {
		$("#anim-ctrls").removeClass("anim-played");
		scenes[CM_ACTIVEID].pauseAnimation();
		
		scenes[CM_ACTIVEID].setAnimation(document.getElementById("animation-list").selectedIndex);
		
		// make animation controls clickable
		$("#anim-ctrls").removeClass("no-animation-selected");
	});
	
	$("#play-anim").click(function(e) {
		$("#anim-ctrls").addClass("anim-played");
		scenes[CM_ACTIVEID].playAnimation();
		
		if(scenes[CM_ACTIVEID].getAnimationPosition() >= 100)
			scenes[CM_ACTIVEID].setAnimationPosition(0);
		
		window.requestAnimationFrame(updateAnimationProgressmeter);
	});
	
	$("#stop-anim").click(pauseAnimation);
	
	$("#ap-wrapper").mousedown(function() {
		dragged = true;
		pauseAnimation();
	});
	
	document.addEventListener("mousemove", function(e) {
		if(dragged) {
			var w = document.getElementById("ap-wrapper").clientWidth - 1,
				x = e.clientX - document.getElementById("ap-wrapper").getBoundingClientRect().left;
			
			if(x < 0)
				x = 0;
			else if(x > w)
				x = w;
			
			$("#ap-progress").width(x + "px");
			scenes[CM_ACTIVEID].setAnimationPosition(x/w*100);
		}
	});
	
	document.addEventListener("mouseup", function(e) {
		dragged = false;
	});
	
	$("#replay-anim").click(function() {
		$(this).toggleClass("enabled");
		
		var enabledReplay = $(this).hasClass("enabled");
		scenes[CM_ACTIVEID].replayOnFinishAnimation = enabledReplay;
	});
	
	$("#toggle-wireframe-button").click(function() {
		$(this).toggleClass("enabled");
		
		var fSet = $(this).hasClass("enabled");
		session.setOption("SHOW_WIREFRAME", fSet);
	});
	
	$("#getTrans-button").click(function() {
		var data = (scenes[CM_ACTIVEID].getIngameTransformationFormat());
		
		if(!data)
			return;
		
		if(typeof data === "string") {
			var dlg = new WDialog("$getIngameTransformationFormatTitle$", MODULE_LPRE, { modal: false, css: { }, btnright: [
			{ preset: "copy",
				onclick: function(e, btn, _self) {
					pasteTxtIntoClipboard(data);
					return true;
				}
			}, "cancel"]});
			
			dlg.setContent("\""+data+"\"");
			dlg.show();
		}
			
		var dlg = new WDialog("$getIngameTransformationFormatTitle$", MODULE_LPRE, { modal: false, css: {  }, btnright: ["cancel"]});
		
		dlg.setContent(
			"<vbox><hbox><box data-text=\""+data.rotateAxis+"\" class=\"igf-sel\" flex=\"1\">\""+data.rotateAxis+"\"</box></hbox></vbox>"
			//+
			//"<vbox><hbox><box data-text=\""+data.rotateXY+"\" class=\"igf-sel\" flex=\"1\">\""+data.rotateXY+"\"</box></hbox></vbox>"
		);
		
		dlg.show();
		
		$(dlg.element).find(".igf-sel").css("pointer-events", "auto").click(function() {
			pasteTxtIntoClipboard($(this).attr("data-text"));
			dlg.hide();
		}).mouseover(function() {
			this.style.backgroundColor = "rgba(0, 165, 207, 0.15)";
			this.style.outline = "1px solid rgba(0, 165, 207, 0.3)";
		}).mouseout(function() {
			this.style.backgroundColor = "";
			this.style.outline = "";
		});
	});
	
	$("#reset-view-button").click(function() {
		scenes[CM_ACTIVEID].resetView();
	});
});

function pasteTxtIntoClipboard(txt) {
		
	var s = new _sc.supportsstr();
	s.data = txt;
	
	//Transferable-Objekt erzeugen
	var trans = new _sc.transferable();
	trans.init(null);
	trans.addDataFlavor("text/unicode");
	
	// Text reinklatschen
	trans.setTransferData("text/unicode", s, txt.length*2);
	Services.clipboard.setData(trans, null, Services.clipboard.kGlobalClipboard);
}

function pauseAnimation() {
	$("#anim-ctrls").removeClass("anim-played");
	scenes[CM_ACTIVEID].pauseAnimation();
}

var dragged = false;

function updateAnimationProgressmeter() {
	var p = scenes[CM_ACTIVEID].getAnimationPosition();
	$("#ap-progress").width((document.getElementById("ap-wrapper").clientWidth - 1)/100*p + "px");
	
	if(p < 100)
		window.requestAnimationFrame(updateAnimationProgressmeter);
	else {
		if(scenes[CM_ACTIVEID].replayOnFinishAnimation) {
			$("#ap-progress").width(0 + "px");
			scenes[CM_ACTIVEID].setAnimationPosition(0);
			scenes[CM_ACTIVEID].playAnimation();
			window.requestAnimationFrame(updateAnimationProgressmeter);
		}
		else
			pauseAnimation();
	}
}

function setBackground(tag) {
	$(".canvas-wrapper").removeClass (function (index, css) {
		return (css.match (/(^|\s)appearance-\S+/g) || []).join(' ');
	});
	
	$(".canvas-wrapper").addClass("appearance-"+tag);
	scenes[CM_ACTIVEID].background = tag;
	$(".bg-selected").removeClass("bg-selected");
	$("#bg-"+tag).addClass("bg-selected");
}

function resize() {
	if(!session)
		return;
	
	var w = window.innerWidth;
	var h = window.innerHeight;
	session.canvas.width = w;
	session.canvas.height = h;
	
	session.gl.viewport(0, 0, w, h);
	session.setViewportCorrection(w, h);
}

var fResize = false;
window.onresize = function(e) {
	resize();
};