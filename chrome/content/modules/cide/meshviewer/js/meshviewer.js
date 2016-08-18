
var session

var scenes = {}, // arranged by deck id
	sceneMeta = {}, // arranged by scene indices
	clrpckr,
	CM_PATHALIAS = "fpath"

function TabManager() { return scenes; }

function addCideFile(filepath, idMdl) {
	if(!session) {
		session = _mv.init(document.getElementById("renderer"));
		session.enableViewControls();
		session.ontextureload = initTextureResource;
		session.ontextureloaderror = loadTextureResourceErr;
		session.ontextureloadsucces = loadTextureResourceSucc;
		
		session.onmatload = insertMaterialEntry;
	}
	
	if(!clrpckr) {
		clrpckr = createColorPicker(document.getElementById("clrpick"));
		clrpckr.onchange = function(clr) {
			session.setOption("OVERLAY_COLOR", clr);
		};
	}
	
	scenes[idMdl] = session.addScene();
	var scene = scenes[idMdl];
	var sceneIndex = scene.id;
	
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
	}
	
	session.onskeletonasked = function(name, sceneId) {
		var $el = $(".skeleton-entry.draft").clone();
		
		name = name.replace(/.skeleton/, "");
		
		$el.removeClass("draft").find(".se-link-name").attr("value", Locale("$skeleton$") + ": " + name + ".*");
		
		sceneMeta[sceneId].$resUiEl.find(".skeleton-resources").append($el);
		
		var e = $el.find(".file-entry").get(0);
		
		e.addEventListener("dragover", function(e) {
			let list = e.dataTransfer.files;
			
			$(this).addClass("dismiss");
		});
		
		e.addEventListener("dragleave", function() {
			$(this).removeClass("dismiss");
		});
	}
	
	session.onskeletonloaderr = function(errorType, output) {
		sceneMeta[sceneIndex].$resUiEl.find(".skeleton-resources").find(".se-name").attr("value", 
			errorType === RESOURCE_ERROR_FAILED_TO_PARSE?Locale("$parsing_error$"):Locale("$not_found_error$")
		);
	}
	
	sceneMeta[sceneIndex] = {
		moduleId: idMdl,
		$resUiEl: $(".resource-list.draft").clone(),
		texture_units: [],
		skeletons: [],
		mats: {},
	}
	
	$("#resource-page").append(sceneMeta[sceneIndex].$resUiEl.removeClass("draft").get(0));
	
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
	sceneMeta[scenes[idMdl].id].$resUiEl.addClass("visible2");
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

function initTextureResource(mesh, key, src, img, matName) {
	var idMdl = mesh.parentMesh._scene.id;
	
	var $el = $(".texture-unit-entry.draft").clone();
	
	$el.removeClass("draft");
	
	sceneMeta[idMdl].mats[matName].$el.append($el);
	
	var tu = {
		src,
		key,
		img,
		mesh,
		$el
	};
	
	var e = $el.get(0);
	
	e.addEventListener("dragover", function(e) {
		if(dragEl)
			return;
		
		var valid = checkTransferForValidation(e, "png|jpeg|jpg|jpe");
		
		if(!valid)
			return;
		
		$(this).addClass("highlighted");
	});
	
	e.addEventListener("drop", function(e) {
		var validFile = checkTransferForValidation(e, "png|jpeg|jpg|jpe", true);
		
		if(!validFile)
			return;
		
		$(this).removeClass("highlighted");
		
		var img = new Image();
		
		img.onload = function() {
			//tu.mesh.reloadTexture(tu.key, img);
			//loadTextureResourceSucc(tu);
		};
		
		img.src = encodeURI("file:" + validFile.path).replace(/#/g, "%23");
		
		e.stopPropagation();
	});
	
	e.addEventListener("dragleave", function() {
		$(this).removeClass("highlighted");	
	});
	
	return tu;
}

var dragEl;

function loadTextureResourceSucc(tu) {
	tu.$el.removeClass("not-found");
	
	tu.$el.find(".tu-img").attr("src", encodeURI(tu.img.src).replace(/#/g, "%23"));
	
	let list = tu.$el.find(".tu-size").get(0);
	list.removeAllItems();
	list.appendItem(tu.img.width + "x" + tu.img.height, tu.img.width + "x" + tu.img.height);
	list.selectedIndex = 0;
}

function loadTextureResourceErr(tu) {
	tu.$el.addClass("not-found");
	
	tu.$el.find(".tu-img").addClass("error-icon");
}

function insertMaterialEntry(mat, sceneIndex, referredName) {
	var $el = $(".mat-def.draft").clone();
	
	$el.find(".mf-name").attr("value", Locale("$material$")+ " " + referredName);
	$el.removeClass("draft");
	sceneMeta[sceneIndex].$resUiEl.find(".mf-wrapper").append($el);
	
	$el.addClass("fade-in").delay(3000).removeClass("fade-in");
	
	sceneMeta[sceneIndex].mats[referredName] = {$el, mat};
	
	var e = $el.find(".file-entry").get(0);
	
	e.addEventListener("dragover", function(e) {
		var valid = checkTransferForValidation(e, "material");
		
		if(!valid) {
			$(this).addClass("dismiss");
			return;
		}
		
		$(this).addClass("highlighted");
	});
	
	e.addEventListener("drop", function(e) {
		var validFile = checkTransferForValidation(e, "material");
		
		$(this).removeClass("dismiss");
		if(!validFile)
			return;
		
		let txt
		txt = yield OS.File.read(validFile.path, {encoding: "utf-8"});
		var mat = Materials.parse(txt);
		log(mat)
		scenes[sceneMeta[sceneIndex].id].useAsMatDef(mat, referredName);
		
		$(this).removeClass("highlighted");
		e.stopPropagation();
	});
	
	e.addEventListener("dragleave", function() {
		$(this).removeClass("highlighted").removeClass("dismiss");
	});
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
		
		// untransformed
		if(!data) {
			var dlg = new WDialog("$getIngameTransformationFormatTitle$", MODULE_LPRE, { modal: false, css: { }, btnright: ["accept"]});
			
			dlg.setContent(Locale("$viewTransformationNeeded$"));
			dlg.show();
			return;
		}
		// only translation
		else if(typeof data === "string") {
			var dlg = new WDialog("$getIngameTransformationFormatTitle$", MODULE_LPRE, { modal: false, css: { }, btnright: [
			{
				label: "$copy$",
				onclick: function(e, btn, _self) {
					pasteTxtIntoClipboard(data);
					dlg.hide();
					return true;
				}
			}, "cancel"]});
			
			dlg.setContent("\""+data+"\"");
			dlg.show();
		}
		// complex transformation setup
		else {
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
				this.style.cursor = "default";
			}).mouseout(function() {
				this.style.backgroundColor = "";
				this.style.outline = "";
			});
		}
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
		
		if(index === 1)
			$("#settings-wrapper").attr("width", 120);
		else if(index === 0)
			$("#settings-wrapper").attr("width", 160);
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

// remove timer on showDeckItem
function updateAnimationProgressmeter() {
	if(!scenes[CM_ACTIVEID]._anim)
		return;
	
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

function checkTransferForValidation(e, type, deepValidation) {
	
	if(// !e.dataTransfer.types.contains("text/cidecontent") &&
		!e.dataTransfer.types.contains("text/cideexplorer") &&
	    !e.dataTransfer.types.contains("application/x-moz-file"))
			return false;
	
	
	
	let md_explorer = getModuleByName("cide-explorer");
	
	var data = e.dataTransfer.getData("text/cideexplorer");
	if(data) {
		data = parseInt(data);
		if(!md_explorer || !md_explorer.contentWindow || isNaN(data))
			return false;
		
		let obj = md_explorer.contentWindow.getTreeObjById(data);
		
		if(type && !type.match(new RegExp($(obj).attr("filename").split(".").pop(), "gi")))
			return false;
		
		if(deepValidation) {
			var file = new _sc.file(_sc.workpath(obj) + md_explorer.contentWindow.getTreeObjPath(obj));
		
			if(!file || !file.exists())
				return false;
			
			return file;
		}
		
		return true;
	}
}

/* taken from cide.js
var dropfn = function(_tdeck) { return function(e) {
		if(!e.dataTransfer.types.contains("text/cidecontent")
		&& !e.dataTransfer.types.contains("text/cideexplorer")
	    && !e.dataTransfer.types.contains("application/x-moz-file"))
			return;

		var data = e.dataTransfer.getData("text/cidecontent");
		}
		if(!data) {
			var deck = _tdeck;
			if(!$(this).hasClass("dragover-deck")) {
				deck = (_tdeck == maindeck)?sidedeck:maindeck;
				if(!$(deck.element).parents(".deckbox").hasClass("deck-visible"))
					positionSideDeck($(deck.element).parents(".deckbox"));
			}

			clearHoverEffects();
			data = e.dataTransfer.getData("text/cideexplorer");

			if(data) {
				data = parseInt(data);
				if(!md_explorer || !md_explorer.contentWindow || isNaN(data))
					return;

				let obj = md_explorer.contentWindow.getTreeObjById(data);
				var file = new _sc.file(_sc.workpath(obj) + md_explorer.contentWindow.getTreeObjPath(obj));
				if(!file || !file.exists())
					return;

				openFileInDeck(file.path, deck == sidedeck);
			}
			else {
				var dragService = _sc.dragserv();
				var dragSession = dragService.getCurrentSession();

				var _ios = _sc.ioserv();
				var files = [];

				//Überprüfen, ob von außerhalb
				if(dragSession.sourceNode)
				  return;

				//Setup a transfer item to retrieve the file data
				var trans = _sc.transferable();
				trans.addDataFlavor("application/x-moz-file");

				for(var i = 0; i < dragSession.numDropItems; i++) {
					dragSession.getData(trans, i);
					var flavor = {}, data = {}, length = {};
					trans.getAnyTransferData(flavor, data, length);

					if(data) {
						var file = data.value.QueryInterface(Ci.nsIFile);
						if(file)
							openFileInDeck(file.path, deck == sidedeck);
					}
				}
			}
			return;
		}

		var [deckid, tabid, tabname] = data.split('|');
		deckid = parseInt(deckid); tabid = parseInt(tabid);

		//Kein Nebendeck vorhanden
		var sdeck = $(".deckbox").not($(this).parent().parent()), deck = undefined;
		if(!sdeck.hasClass("deck-visible"))
			var deck = positionSideDeck(sdeck);
		else if($(this).hasClass("dragover-deck")) {
			//Auf selbes Deck verschieben
			if(deckid == _tdeck.id) {
				clearHoverEffects();
				return true;
			}

			var deck = _tdeck;
		}
		clearHoverEffects();

		//Informationen aus Tab entnehmen und anschließend in anderes Deck einfügen
		movedatafn(decks[deckid], deck, tabid, tabname);
		if(decks[deckid].isEmpty())
			$(decks[deckid].element).parent().parent().removeClass("deck-visible");

		e.preventDefault();
	};
	*/