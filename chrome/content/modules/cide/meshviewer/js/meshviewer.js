
var session;

var scenes = {};
var sceneMeta = {};
var clrpckr;
var CM_PATHALIAS = "fpath";

function TabManager() { return scenes; }

function initModelviewer(filepath, idMdl) {
	if(!session) {
		session = _mv.init(document.getElementById("renderer"));
		session.enableViewControls();
		session.ontextureload = initTextureResource;
		session.ontextureloaderror = loadTextureResourceErr;
		session.ontextureloadsucces = loadTextureResourceSucc;
		
		session.onmatload = insertMaterial;
	}
	
	if(!clrpckr) {
		clrpckr = createColorPicker(document.getElementById("clrpick"));
		clrpckr.onchange = function(clr) {
			session.setOption("OVERLAY_COLOR", clr);
		};
	}
	
	scenes[idMdl] = session.addScene();
	var scene = scenes[idMdl];
	scene.addMesh(filepath).then(null, function(reason) {
		log("An error occured during the loading process.", 0, "error");
		log("********************************************", 0, "error");
		log(`${reason.message} (${reason.fileName}:${reason.lineNumber})`, 0, "error");
		log(reason.stack, 0, "error");
	});
	scene.onskeletonset = function(skeleton, fReplacesOldSkeleton) {
		
		var l = skeleton.animations.length;
		scene.animList = new Array(l);
		
		for(var i = 0; i < l; i++)
			scene.animList[i] = skeleton.animations[i].name;
		
		scene.currentAnimIndex = -1;
		updateAnimationUI(scene);
		
		// reveal animation-ui section
		document.getElementById("anim-section").className = "";
	};
	
	session.onskeletonasked = function(name, sceneId) {
		var $el = $(".skeleton-entry.draft").clone();
		
		$el.removeClass("draft").find(".se-name").attr("value", name);
		
		sceneMeta[sceneId].$resUiEl.find(".skeleton-resources").append($el);
		
		var e = $el.get(0);
		
		e.addEventListener("dragenter", function(e) {
			let list = e.dataTransfer.files;
			showObj2(list, 1);
			$el.addClass("highlighted");
		});
		
		e.addEventListener("dragleave", function() {
			$el.removeClass("highlighted");
		});
	};
	
	sceneMeta[idMdl] = {
		moduleId: idMdl,
		$resUiEl: $(".resource-list.draft").clone(),
		texture_units: [],
		skeletons: [],
		$matEls: {},
	};
	
	$("#resource-page").append(sceneMeta[idMdl].$resUiEl.removeClass("draft").get(0));
	
	resize();
	
	showDeckItem(idMdl);
}

function createCideToolbar() {}

function showDeckItem(idMdl) {
	if(!scenes[idMdl])
		return;
	
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
		if(scenes[idMdl]._anim)
			document.getElementById("anim-section").className = "";
		else
			document.getElementById("anim-section").className = "hidden";
	}
	else
		document.getElementById("anim-section").className = "hidden";
	
	setBackground("light");
	frameUpdateWindmillTitle();
	
	$(".resource-list.visible2").removeClass("visible2");
	sceneMeta[idMdl].$resUiEl.addClass("visible2");
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

function updateAnimationUI(scene) {
	var l = scene.animList.length,
		el = document.getElementById("animation-list");
	
	el.removeAllItems();
	for(var i = 0; i < l; i++)
		el.appendItem(scene.animList[i], i);
	
	el.selectedIndex = scene.currentAnimIndex || 0;
}

function initTextureResource(mesh, key, src, img) {
	var idMdl = mesh.parentMesh._scene.id;
	
	var $el = $(".texture-unit-entry.draft").clone();
	
	sceneMeta[idMdl].$resUiEl.find(".s-texture-units").append($el);
	
	$el.removeClass("draft").addClass("fade-in").delay(3000).removeClass("fade-in");
	
	var tu = {
		src,
		key,
		img,
		mesh,
		$el
	};
	
	sceneMeta[idMdl].texture_units[sceneMeta[idMdl].texture_units.length] = tu;
	
	return tu;
}

function loadTextureResourceSucc() {
	
}

function loadTextureResourceErr() {
	
}

function updateResourceUi(id) {
	
}

function insertMaterial(mat, id, referredName) {
	var $el = $(".mat-file.draft").clone();
	log(referredName)
	if(!mat)
		$el.find(".mf-texture-units").text(Locale("$not_found$"));
	
	$el.find(".mf-name").attr("value", Locale("$material$")+ " " + referredName);
	$el.removeClass("draft");
	sceneMeta[id].$resUiEl.find(".mf-wrapper").append($el);
	
	$el.addClass("fade-in").delay(3000).removeClass("fade-in");
	
	
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
	
	$(".settings-page-nav").children().click(function() {
		
		let child = this;
			
		let index = 0;
		while((child = child.previousSibling) != null ) 
			index++;
		
		$(".settings-page-nav").children().removeClass("enabled");
		$(this).addClass("enabled");
		
		$(".settings-page.visible").removeClass("visible");
		$(".settings-page").eq(index).addClass("visible");
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

window.onresize = function(e) {
	resize();
};
