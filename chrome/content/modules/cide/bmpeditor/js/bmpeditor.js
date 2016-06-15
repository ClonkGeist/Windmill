
var editlayer, editObj = { mode: 0 }, rulerData = {};
var activeId;

var sceneMeta = new Array();

const OC_KEYCOLOR = 0x0;
const MAX_UNDO_STACKSIZE = 32;

$(window).ready(function() {
	//Bei Reload Tabdaten Laden
	var query = location.search.substr(1).split('&');
	if(query) {
		for(var i = 0; i < query.length; i++) {
			if(!query[i].length)
				continue;

			var split = query[i].split("=");
			loadImage(decodeURI(split[1]), parseInt(split[0]), true);
		}
	}
	
	//Modesettings
	$("#mds_thickness_range").mousemove(function(e) {
		$("#mds_thickness_nr").val($(this).val());
	});
	$("#mds_thickness_nr").keydown(function(e) {
		if((e.which < 48 || e.which > 57) && (e.which < 96 || e.which > 105) && e.which != 8)
			e.stopPropagation();
	}).keyup(function(e) {
		updateBrushGenerator(activeId);
		$("#mds_thickness_range").val($(this).val());
	});
	$("#mds_linethickness_range").mousemove(function(e) {
		$("#mds_linethickness_nr").val($(this).val());
	});
	$("#mds_linethickness_nr").keydown(function(e) {
		if((e.which < 48 || e.which > 57) && (e.which < 96 || e.which > 105) && e.which != 8)
			return false;

		$("#mds_linethickness_range").val($(this).val());
	});
	$("#mds_filled").click(function(e) {
		modesettings.filled = !modesettings.filled;
		if(!modesettings.filled)
			$("#mds_linethickness").addClass("settings-active");
		else
			$("#mds_linethickness").removeClass("settings-active");
		
		$(this).toggleClass("active");
	});
	
	//Toolbarbuttons
	$(".group1").click(function() {
		$(".group1.active").removeClass("active");
		$(this).addClass("active");
		
		if($(this).attr("id") != "md_default") {
			//Verschiebung deaktivieren
			if($("#movinglayer").hasClass("active")) {
				//Callback ausführen
				if(sceneMeta[activeId].rtdata.moving_callback)
					sceneMeta[activeId].rtdata.moving_callback();
				else { //Alternativ: Bilddaten durchgehen und Transparente Pixel aussortieren
					var mvcnv = $("#movinglayer").get(0);
					var mvctx = mvcnv.getContext('2d');
					var ctx2 = $(".visible").get(0).getContext("2d");
					var zoom = sceneMeta[activeId].z;
					
					var offset = $("#movinglayer").offset();
					var cnv_offset = $(".visible").offset();
					var mvImageData = mvctx.getImageData(0, 0, mvcnv.width, mvcnv.height);
					var nImageData = ctx2.getImageData(Math.floor((offset.left-cnv_offset.left)/zoom),
													   Math.floor((offset.top-cnv_offset.top)/zoom),
													   mvcnv.width, mvcnv.height);
					
					//Transparente Pixel nicht übernehmen
					for(var i = 0; i < nImageData.data.length; i += 4) {
						if(!mvImageData.data[i+3])
							continue;
						
						nImageData.data[i] = mvImageData.data[i];
						nImageData.data[i+1] = mvImageData.data[i+1];
						nImageData.data[i+2] = mvImageData.data[i+2];
					}
					
					//Bilddaten einfügen
					ctx2.putImageData(nImageData, Math.floor((offset.left-cnv_offset.left)/zoom), Math.floor((offset.top-cnv_offset.top)/zoom));
				}
				$("#movinglayer").removeClass("active");
			}
		}
	});
	
	//Materialpalette
	var matpalette = $("#material-palette").get(0);
	matpalette.width = 160;
	matpalette.height = 80;
	
	//Material per Klick auswählen
	$(matpalette).click(function(e) {
		var rect = matpalette.getBoundingClientRect();
		var mx = e.clientX - rect.left, my = e.clientY - rect.top;
		var index = Math.floor(my/10)*16+Math.floor(mx/10);
		
		var id = activeId;//parseInt($(".visible").attr("id").replace(/bmpCanvas-/, ""));
		var indices = sceneMeta[id].matindices;
		var bg_mode = sceneMeta[id].rtdata.matmode_underground;
		if(bg_mode)
			index += 128;
		
		//Nicht benutzte Materialien ausblenden
		if(!indices[index%128] && getConfigData("BMPEditor", "HideUnusedMat"))
			index = -1;
		
		if(e.ctrlKey) {
			var elm = $(".spalette-elm.active");
			if(!elm.get(0) || elm.hasClass("autoselect")) {
				//Material bereits in Palette vorhanden
				if($(".spalette-elm[mat-index='"+index+"']").get(0))
					return;
				
				elm = $(".spalette-elm[mat-index='-1']").first();
				$(elm).addClass("autoselect");
			}
			else if($(".spalette-elm[mat-index='"+index+"']").get(0) && index != -1) {
				sceneMeta[id].rtdata.sidepalette[$(".spalette-elm").index($(".spalette-elm[mat-index='"+index+"']").get(0))] = -1;
				$(".spalette-elm[mat-index='"+index+"']").css("background-color", "#000").attr("mat-index", -1);
			}

			if(!elm.get(0))
				return;
			
			$(elm).css("background-color", getColorByIndex(id, index)).attr("mat-index", index);
			sceneMeta[id].rtdata.sidepalette[$(".spalette-elm").index(elm)] = index;
		}

		selectColorIndex(id, index);
	}).mousemove(function(e) { //Hover-Informationen
		if($("#current-material-name > input").is(":focus"))
			return;
	
		var rect = matpalette.getBoundingClientRect();
		var mx = e.clientX - rect.left, my = e.clientY - rect.top;
		var index = Math.floor(my/10)*16+Math.floor(mx/10);
		
		var id = activeId;//parseInt($(".visible").attr("id").replace(/bmpCanvas-/, ""));
		var indices = sceneMeta[id].matindices;
		var bg_mode = sceneMeta[id].rtdata.matmode_underground;
		if(bg_mode)
			index += 128;
		
		//Nicht benutzte Materialien ausblenden
		if(!indices[index%128] && getConfigData("BMPEditor", "HideUnusedMat"))
			index = -1;
		
		$("#current-material-clr").css("background-color", getColorByIndex(id, index));
		$("#current-material-name > input").val(getMaterialByIndex(id, index));
	}).mouseleave(function(e) { //Anzeige zurücksetzen
		if($("#current-material-name > input").is(":focus"))
			return;

		var current_mat = sceneMeta[activeId].rtdata.current_matidx;
	
		$("#current-material-clr").css("background-color", getColorByIndex(activeId, current_mat));
		$("#current-material-name > input").val(getMaterialByIndex(activeId, current_mat));
	}).contextmenu(function(e) {
		var rect = matpalette.getBoundingClientRect();
		var mx = e.clientX - rect.left, my = e.clientY - rect.top;
		var index = Math.floor(my/10)*16+Math.floor(mx/10);
		
		var id = activeId;
		var indices = sceneMeta[id].matindices;
		var bg_mode = sceneMeta[id].rtdata.matmode_underground;
		if(bg_mode)
			index += 128;

		var cmat = "";
		var ctex = "";
		if(index >= 0 && indices[index%128]) {
			cmat = indices[index%128].match(/(.+?)-/)[1];
			ctex = indices[index%128].match(/-(.+)-?/)[1];
		}
			
		//Nicht benutzte Materialien ausblenden
		if(!indices[index%128] && getConfigData("BMPEditor", "HideUnusedMat"))
			index = -1;

		//Dialog öffnen
		var dlg = new WDialog("$ChangeMaterial$", MODULE_LPRE, { modal: false, css: { "width": "450px" }, btnright: [{ preset: "accept",
			onclick: function(e, btn, _self) {
				var nmat = $(_mainwindow.$("#dlgbmpMat").get(0).selectedItem).val();
				var ntex = $(_mainwindow.$("#dlgbmpTex").get(0).selectedItem).val();
				var clr = parseInt(_mainwindow.$("#dlgbmpClrPicker").val().substr(1), 16);
				
				//Material-Textur-Kombination existiert bereits woanders
				if(indices.indexOf(nmat+"-"+ntex) != -1 && indices.indexOf(nmat+"-"+ntex) != (index%128))
					return;
				
				//Farbe existiert bereits woanders
				if(sceneMeta[id].coloridx.indexOf(clr) != -1 && sceneMeta[id].coloridx.indexOf(clr) != index)
					return;
				
				//Falls Farbe geändert wurde: Farbe auf dem Bild auch abändern
				if(sceneMeta[id].coloridx.indexOf(clr) != index) {
					var cnv = sceneMeta[id].c;
					var ctx = cnv.getContext('2d');
					var idata = ctx.getImageData(0, 0, cnv.width, cnv.height);
					var data = idata.data;
					var nclr = clr.num2byte(4);
					for(var i = 0; i < data.length; i+=4) {
						var pxclr = [data[i+2], data[i+1], data[i], 0].byte2num();
						
						//Farben ggf. austauschen
						if(pxclr == sceneMeta[id].coloridx[index]) {
							data[i+2] = nclr[0];
							data[i+1] = nclr[1];
							data[i]   = nclr[2];
						}
					}
						
					idata.data = data;
					ctx.putImageData(idata, 0, 0);
				}
				sceneMeta[id].matindices[index%128] = nmat+"-"+ntex;
				sceneMeta[id].coloridx[index] = clr;
				
				drawMaterialPalette(id);
				return true;
			}
		}, "cancel"]});
		var content = '<hbox><description>$SelectMaterialAndTexture$</description></hbox><hbox><menulist id="dlgbmpMat"><menupopup>';
		
		//Materialauswahl füllen
		for(var i = 0; i < sceneMeta[id].materials.length; i++)
			content += '<menuitem id="dlgbmp-mat-'+sceneMeta[id].materials[i]+'" label="'+sceneMeta[id].materials[i]+'" value="'+sceneMeta[id].materials[i]+'"/>';
		
		content += '</menupopup></menulist><menulist id="dlgbmpTex"><menupopup>';
		
		//Texturauswahl füllen
		for(var i = 0; i < sceneMeta[id].textures.length; i++)
			content += '<menuitem id="dlgbmp-tex-'+sceneMeta[id].textures[i]+'" label="'+sceneMeta[id].textures[i]+'" value="'+sceneMeta[id].textures[i]+'"/>';
		
		content += '</menupopup></menulist></hbox><hbox><description>$PickColor$</description></hbox><hbox id="dlgbmpClrPickCnt"></hbox>';
		dlg.setContent(content);
		dlg.show();
		
		//Aktuelle Materialien auswählen
		_mainwindow.$("#dlgbmpMat").get(0).selectedIndex = sceneMeta[id].materials.indexOf(cmat);
		_mainwindow.$("#dlgbmpTex").get(0).selectedIndex = sceneMeta[id].textures.indexOf(ctex);
		
		//Clrpicker hinzufügen
		var clrpicker = document.createElementNS("http://www.w3.org/1999/xhtml", "input");
		$(clrpicker).attr("type", "color");
		$(clrpicker).attr("id", "dlgbmpClrPicker");
		$(clrpicker).val(getColorByIndex(id, index));
		_mainwindow.$("#dlgbmpClrPickCnt").append(clrpicker);
		dlg = 0;
	});
	
	//Materialsuche
	$("#current-material-name > input").focus(function() {
		$(this).val('');
	}).focusout(function() {
		var input = $(this).val(), cmat, ctext;
		var id = activeId;
		
		//Suggestionbox ausblenden
		$("#material-suggestion-box").removeClass("active");

		//Sky-Eingabe behandeln
		if(input.toUpperCase() == "SKY")
			return selectColorIndex(id, -1);
		
		//Falls Eingabe gefunden wurde, Material setzen
		if(sceneMeta[id].matindices.indexOf(input) >= 0)
			selectColorIndex(id, sceneMeta[id].matindices.indexOf(input)+128*!!(sceneMeta[id].rtdata.matmode_underground));
		else //Ansonsten vorheriges Material anzeigen
			$(this).val(getMaterialByIndex(id, sceneMeta[id].rtdata.current_matidx));
	}).keydown(function(e) {
		if(e.key == "Enter") {
			if($("#material-suggestion-box").find(".selected").get(0))
				$(this).val($("#material-suggestion-box").find(".selected").find(".suggestion-box-name").text());

			$(this).blur();
		}
		//Tastaturauswahl fuer Suggestionbox
		else if(e.key == "Down") {
			if($("#material-suggestion-box").hasClass("active")) {
				if($("#material-suggestion-box").find(".selected").get(0)) {
					var nx = $("#material-suggestion-box").find(".selected").next();
					$("#material-suggestion-box").find(".selected").removeClass("selected");
					$(nx).addClass("selected");
				}
				else
					$("#material-suggestion-box").children(":not(.draft)").first().addClass("selected");
			}
			return false;
		}
		else if(e.key == "Up") {
			if($("#material-suggestion-box").hasClass("active")) {
				if($("#material-suggestion-box").find(".selected").get(0)) {
					var pv = $("#material-suggestion-box").find(".selected").prev(":not(.draft)");
					$("#material-suggestion-box").find(".selected").removeClass("selected");
					$(pv).addClass("selected");
				}
				else
					$("#material-suggestion-box").children().last().addClass("selected");
			}
			return false;
		}
	}).keyup(function(e) {
		var id = activeId;
		var current_selection = $("#material-suggestion-box").find(".selected").find(".suggestion-box-name").text();
		
		//Vorschlagsbox leeren
		$("#material-suggestion-box > :not(.draft)").remove();
		
		if(!$(this).val().length)
			return $("#material-suggestion-box").removeClass("active");
	
		//Vorschlaege auflisten
		var suggestion_cnt = 0;
		for(var i = -1; i < 128; i++) {
			//Material aussuchen
			if(i >= 0) {
				var clr = sceneMeta[id].coloridx[i+128*!!sceneMeta[id].rtdata.matmode_underground].toString(16);
				var matname = sceneMeta[id].matindices[i];
			}
			else {
				var clr = OC_KEYCOLOR.toString(16);
				var matname = "Sky";
			}
			
			//Pruefen ob Material vorhanden und mit Eingabe uebereinstimmt
			if(!matname)
				continue;
			
			if(matname.search(RegExp("^"+$(this).val(), "gi")) == -1)
				continue;
			
			//Maximal 6 Eintraege
			if(suggestion_cnt >= 6)
				break;

			//Eintrag erstellen, Daten setzen und der Vorschlagsbox hinzufuegen
			var clone = $(".suggestion-box-entry.draft").clone();
			clone.removeClass("draft");

			for(var j = clr.length; j < 6; j++)
				clr = "0" + clr;
			
			clone.find(".suggestion-box-name").text(matname);
			clone.find(".suggestion-box-matchedclr").css("background", "#"+clr);
			
			if(matname == current_selection)
				clone.addClass("selected");
			
			clone.appendTo($("#material-suggestion-box"));
			
			clone.mousedown(function() { $("#current-material-name > input").val($(this).find(".suggestion-box-name").text());});
			
			suggestion_cnt++;
		}
		
		//Vorschlagsbox positionieren
		var off = $(this).offset();
		$("#material-suggestion-box").css({ left: off.left, top: off.top+$(this).outerHeight(), width: $(this).outerWidth() });

		//Vorschlagsbox anzeigen / ausblenden
		if(suggestion_cnt)
			$("#material-suggestion-box").addClass("active");
		else
			$("#material-suggestion-box").removeClass("active");
	});
	
	rulerData = {
		left: $("#ruler-left-display"),
		top: $("#ruler-top-display"),
		mirrorLeft: $("#ruler-left-display"),
		mirrorTop: $("#ruler-left-display"),
		fq: 0 
	};
	
	//Maussteuerung
	$(document).mousedown(function(e) {
		if($(".color-matching-wizard.visible2").get(0))
			return;
	
		var id = activeId;
		sceneMeta[id].rtdata.mousedown = true;
		sceneMeta[id].rtdata.mousepos = [e.clientX, e.clientY];
	}).mouseup(function(e) {
		if($(".color-matching-wizard.visible2").get(0))
			return;

		sceneMeta[activeId].rtdata.mousedown = false;
		
		//Bearbeitungsvorgang abbrechen wenn Maustaste außerhalb des Canvas losgelassen wird
		/*
		if(editObj.mode != mdSelectPoly)
			editObj = {};
		*/
	}).mousewheel(function(e) {
		if($(".color-matching-wizard.visible2").get(0))
			return;

		//Zoomen
		var id = activeId;
		if(e.ctrlKey) {
			if(e.deltaY > 0)
				changeZoom(id);
			else if(e.deltaY < 0)
				changeZoom(id, true);
			else
				onUpdateZoom(id);
		}
		//Horizontales Scrolling
		else if(e.altKey) {
			if(e.deltaY > 0)
				$(document).scrollLeft($(document).scrollLeft()-100);
			else if(e.deltaY < 0)
				$(document).scrollLeft($(document).scrollLeft()+100);
		}
	}).scroll(function(e) {
		$("#ruler-left").css("left", $(this).scrollLeft()+"px");
		$("#ruler-top").css("top", $(this).scrollTop()+"px");
	});
	document.addEventListener("mousemove", function(e) {
		if($(".color-matching-wizard.visible2").get(0))
			return;

		/* Lineal */
		rulerData.fq = (rulerData.fq + 1)%3;
		if(rulerData.fq)
			return;
		if(activeId === null)
			return;
		
		$(".rulerdisplay.hidden").removeClass("hidden");

		var mx = e.clientX, my = e.clientY;
		
		rulerData.left.css("top", my+"px");
		rulerData.top.css("left", mx+"px");
		
		let $el = $(".brush-indicator");
		$el.css("left", mx+"px");
		$el.css("top", my+"px");
	});
	$(window).resize(function() {
		updateRulers();
		centerCanvas(activeId);
	});
	$("#switch-material-mode").click(function() {
		switchMaterialMode();
	});
	
	//Color-Matching-Wizard: Visuelles Feedback fuer Fastselect per Druck auf Ctrl
	$(document).keydown(function(e) {
		var wrapper = $("#cmw-wrapper-"+activeId);
		if(!wrapper.get(0))
			return;
		
		if(e.ctrlKey && !wrapper.find(".cmw-selectcolor-palette-fastselect").hasClass("activated"))
			wrapper.find(".cmw-selectcolor-palette-fastselect").addClass("activated").addClass("ctrlKeyPressed");
	});
	$(document).keyup(function(e) {
		var wrapper = $("#cmw-wrapper-"+activeId);
		if(!wrapper.get(0))
			return;

		if(!e.ctrlKey && wrapper.find(".cmw-selectcolor-palette-fastselect").hasClass("ctrlKeyPressed"))
			wrapper.find(".cmw-selectcolor-palette-fastselect").removeClass("activated ctrlKeyPressed");
	});
	
	//Zoominput
	$("#info-zoom").click(function() { 
		$(this).html('<input type="text" value="'+$(this).text().substr(0, $(this).text().length-1)+'" />%');
		$(this).find("input").keypress(function(e) {
			if(!e.ctrlKey) {
				if(e.which < 48 || e.which > 57)
					if([8,9,13,37,38,39,40].indexOf(e.keyCode) == -1)
						return false;
			}
			else if(e.key.toUpperCase() == "V")
				return false;

			if(e.keyCode == 13)
				$(this).trigger("focusout");
		}).focusout(function() {
			let id = activeId;
			var zoomlvl = Math.max(1, Math.min(32, parseInt($(this).val())/100 || sceneMeta[activeId].z));
			sceneMeta[id].z = zoomlvl;
			$(this).parent().text(zoomlvl + "%");
			onUpdateZoom(id);
		}).focus();
	});
	
	//Stift als erstes auswählen
	$("#md_point").trigger('click');
	
	// palette verschiebbar machen
	setDraggable($("#material-h").get(0), $("#material-b").get(0), $("#material-toolbar").get(0));
	
	$(".toolbar-collapse").click(function() {
		$(this).toggleClass("active");
		
		if($(this).hasClass("active")) {
			$(this).text("◀");
			$(this).parent().parent().find(".toolbar-body").css("display", "none");
		}
		else {
			$(this).text("▼");
			$(this).parent().parent().find(".toolbar-body").css("display", "");
		}
	});
	
	//Seitenpalette
	setDraggable($("#spalette-h").get(0), $("#spalette-b").get(0), $("#side-palette").get(0));
	$(".spalette-elm").click(function(e) {
		if(e.ctrlKey) {
			$(this).removeClass("active");
			$(this).attr("mat-index", -1);
			$(this).css("background-color", "#000");
			sceneMeta[activeId].rtdata.sidepalette[$(".spalette-elm").index(this)] = -1;
			return;
		}
		selectColorIndex(activeId, $(this).attr("mat-index") || -1);
		$(this).addClass("active");
		sceneMeta[activeId].rtdata.current_sideindex = $(".spalette-elm").index(this);
	}).contextmenu(function() {
		if(!$(".spalette-elm.active").get(0))
			return;

		$(".spalette-elm.active").removeClass("active");
		selectColorIndex(activeId, -1);
	});
	
	// brush panel
	setDraggable($("#bp-h").get(0), $("#bp-b").get(0), $("#brush-panel").get(0));
	
	$("#bp-preview").click(function() {
		$("#brush-panel").removeClass("collapsed");
	});
	
	$("#rounded-brush").change(function(e) {
		sceneMeta[activeId].brushData.rounded = this.checked;
		updateBrushGenerator(activeId);
	});
	
	$("#mds_thickness_range").on("input", function() {
		updateBrushGenerator(activeId);
	});
	
	/*-- Key Bindings --*/
	
	//Speichern
	bindKeyToObj(new KeyBinding("Save", "Ctrl-S", function() { saveCanvas(activeId); }));
	//Zoom
	bindKeyToObj(new KeyBinding("ZoomIn", "Ctrl-+", function() { changeZoom(activeId); }));
	bindKeyToObj(new KeyBinding("ZoomOut", "Ctrl--", function() { changeZoom(activeId, true); }));
	//Undo/Redo
	bindKeyToObj(new KeyBinding("Undo", "Ctrl-Z", function() { undoImageData(); }));
	bindKeyToObj(new KeyBinding("Redo", "Ctrl-Y", function() { redoImageData(); }));
	//Mirror H/V
	bindKeyToObj(new KeyBinding("MirrorH", "Ctrl-Shift-H", function() { mirrorImage(); }));
	bindKeyToObj(new KeyBinding("MirrorV", "Ctrl-Shift-V", function() { mirrorImage(true); }));
	//Rotieren
	bindKeyToObj(new KeyBinding("RotateACW", "Ctrl-,", function() { rotateImage(-90); }));
	bindKeyToObj(new KeyBinding("RotateICW", "Ctrl-.", function() { rotateImage(90); }));
	// Select Eyedropper method
	bindKeyToObj(new KeyBinding("SelectEyedropper", "I", function() {
		$("#md_getclr").click(function() {
			setSelMode(Mode_Eyedropper)
		})
	}));
	
	createCideToolbar(true);
	
	return true;
});

/*-- Cide-Toolbar --*/

var btn_undo, btn_redo;

function createCideToolbar(startup) {
	addCideToolbarButton("icon-save", function() { saveCanvas(activeId); });
	addCideToolbarButton("seperator");
	addCideToolbarButton("icon-reflect-h", function() { mirrorImage(); });
	addCideToolbarButton("icon-reflect-v", function() { mirrorImage(true); });
	addCideToolbarButton("seperator");
	addCideToolbarButton("icon-canvas-scale", function() { openScalingDialog(); });
	addCideToolbarButton("icon-cw", function() { rotateImage(-90); });
	addCideToolbarButton("icon-ccw", function() { rotateImage(90); });
	addCideToolbarButton("seperator");
	btn_redo = addCideToolbarButton("icon-redo", function() {
		if($(btn_redo).hasClass("deactivated"))
			return false;
		
		redoImageData();
	});
	btn_undo = addCideToolbarButton("icon-undo", function() {
		if($(btn_undo).hasClass("deactivated"))
			return false;
		
		undoImageData();
	});

	if($("#cmw-wrapper-"+activeId).get(0) || startup)
		hideCideToolbar();
	
	return true;
}

/*-- Brush panel and generator --*/

function updateBrushGenerator(id) {
	var seed = $("#bp-gen-seed").val();
	var size = parseInt($("#mds_thickness_nr").val());
	
	sceneMeta[id].brushData.size = size;
	
	var c = $("#bp-preview-gen").get(0);	
	var ctx = c.getContext("2d");
	c.width = size;
	c.height = size;
	
	ctx.clearRect(0, 0, size, size);
	
	var imgData = ctx.getImageData(0, 0, size, size),
		data = imgData.data;
	
	var m = size/2
	let offset = 0
	
	if(size % 2 === 0)
		offset = 0.5;
	
	sceneMeta[id].brushData.offset = offset;
	
	var inDist = (x, y) => {
		let xm = m - x
		let ym = m - y
		
		return Math.sqrt(xm*xm + ym*ym) < m
	}
	
	if(sceneMeta[id].brushData.rounded) {
		for(let x = 0; x < size; x++)
			for(let y = 0; y < size; y++) {
				
				if(!inDist(x + 0.5, y + 0.5))
					continue;
				
				let index = (x + y*size)*4;
				
				data[index  ] = 0;
				data[index+1] = 0;
				data[index+2] = 0;
				data[index+3] = 255;
			}
	}
	else {
		for(let x = 0; x < size; x++)
			for(let y = 0; y < size; y++) {
				let index = (x + y*size)*4;
				data[index  ] = 0;
				data[index+1] = 0;
				data[index+2] = 0;
				data[index+3] = 255;
			}
	}
	
	ctx.putImageData(imgData, 0, 0);
	
	var dataURL = c.toDataURL("image/png", 1.0);
	
	document.getElementById("bp-preview").src = dataURL;
	
	$("#bp-preview-main").css("background-image", "url(" + dataURL + ")");
	
	updateCursor(id, dataURL);
}

function updateCursor(id, dataURL) {
	
	if(selectedMode === Mode_Draw_Shape) {
		
		var size = sceneMeta[id].brushData.size*sceneMeta[id].scene.zoomFactor;
		var radius = sceneMeta[id].brushData.rounded?size:0;
		
		$(".brush-indicator").css({
			marginLeft: -size/2 + "px",
			marginTop: -size/2 + "px",
			height: size + "px",
			width: size + "px",
			borderRadius: radius + "px",
			MozOutlineRadius: radius + "px",
		})
	}
}



/*-- Seitenpalette --*/

function updateSidePalette(id) {
	if(id == undefined)
		id = activeId;

	if(!sceneMeta[id].rtdata.sidepalette)
		sceneMeta[id].rtdata.sidepalette = [];
	
	var spelements = $(".spalette-elm");
	$(".spalette-elm.active").removeClass("active");
	for(var i = 0; i < spelements.length; i++) {
		var index = sceneMeta[id].rtdata.sidepalette[i];
		if(index == undefined)
			index = -1;

		$($(spelements).get(i)).attr("mat-index", index);
		$($(spelements).get(i)).css("background-color", getColorByIndex(id, index));
	}

	if(sceneMeta[id].rtdata.current_sideindex != undefined && sceneMeta[id].rtdata.current_sideindex >= 0)
		$($(spelements).get(sceneMeta[id].rtdata.current_sideindex)).addClass("active");
	return true;
}

/*-- Rotation --*/
/** @deprecated */
//Rotation in 90°-Schritten
function rotateImage(angle) {
	angle = (angle - (angle % 90)) % 360;
	if(!angle)
		return;
	
	var id = activeId;
	var cnv = sceneMeta[id].c, ctx = cnv.getContext("2d");
	var idata = ctx.getImageData(0, 0, cnv.width, cnv.height), nidata;
	if(angle && angle != 180)
		nidata = ctx.createImageData(cnv.height, cnv.width);
	else
		nidata = ctx.createImageData(cnv.width, cnv.height);

	for(var y = 0; y < cnv.height; y++)
		for(var x = 0; x < cnv.width; x++) {
			var off = (y*(idata.width*4)) + (x*4);
			switch(angle) {
				case 90:
				case -270:
					no = (x*(nidata.width*4)) + ((cnv.height-y-1)*4);
					break;
				
				case 180:
				case -180:
					no = ((cnv.height-y-1)*(nidata.width*4)) + ((cnv.width-x-1)*4);
					break;
				
				case 270:
				case -90:
					no = ((cnv.width-x-1)*(nidata.width*4)) + (y*4);
					break;
				
				default:
					no = off;
					break;
			}

			nidata.data[no] = idata.data[off];
			nidata.data[no+1] = idata.data[off+1];
			nidata.data[no+2] = idata.data[off+2];
			nidata.data[no+3] = 255;
		}
	
	if(angle && angle != 180) {
		var twdt = cnv.width;
		cnv.width = cnv.height;
		cnv.height = twdt;
		$(cnv).css("width", cnv.width);
		$(cnv).css("height", cnv.height);
	}
	
	ctx.putImageData(nidata, 0, 0);
	stockUndoStack();
	
	return true;
}

/*-- Spiegelung --*/
/** @deprecated */
function mirrorImage(fVertically) {
	var id = activeId, cnv = sceneMeta[id].c;
	if($("#movinglayer.active").get(0))
		cnv = $("#movinglayer.active").get(0);

	var ctx = cnv.getContext("2d");
	var idata = ctx.getImageData(0, 0, cnv.width, cnv.height);
	var bdata = jQuery.extend({}, idata.data);
	
	if(!fVertically) {
		for(var y = 0; y < idata.height; y++)
			for(var x = 0; x < Math.floor(idata.width/2); x++) {
				var x2 = idata.width-x;
				var off1 = (y*(idata.width*4)) + (x*4),
					off2 = (y*(idata.width*4)) + (x2*4);
				
				idata.data[off2] = idata.data[off1];
				idata.data[off2+1] = idata.data[off1+1];
				idata.data[off2+2] = idata.data[off1+2];
				idata.data[off2+3] = 255;
				
				idata.data[off1] = bdata[off2];
				idata.data[off1+1] = bdata[off2+1];
				idata.data[off1+2] = bdata[off2+2];
				idata.data[off1+3] = 255;
			}
	}
	else {
		for(var y = 0; y < Math.floor(idata.height/2); y++)
			for(var x = 0; x < idata.width; x++) {
				var y2 = idata.height-y;
				var off1 = (y*(idata.width*4)) + (x*4),
					off2 = (y2*(idata.width*4)) + (x*4);
				
				idata.data[off2] = idata.data[off1];
				idata.data[off2+1] = idata.data[off1+1];
				idata.data[off2+2] = idata.data[off1+2];
				idata.data[off2+3] = 255;
				
				idata.data[off1] = bdata[off2];
				idata.data[off1+1] = bdata[off2+1];
				idata.data[off1+2] = bdata[off2+2];
				idata.data[off1+3] = 255;
			}
	}
	
	ctx.putImageData(idata, 0, 0);
	if(!$("#movinglayer.active").get(0))
		stockUndoStack();
}

/*-- Skalierung --*/
/** @needsReview */
function openScalingDialog() {
	var dlg = new WDialog("$DlgScaleImage$", MODULE_LPRE, { modal: true, css: { "width": "470px" }, 
			btnright: [{preset: "accept", onclick: function(e, btn, _self) {
				var cnv = sceneMeta[activeId].c;
				var ctx = cnv.getContext("2d");
				var nWdt = parseInt($(_self.element).find("#dbmp_newImageWidth").val()) || 1;
				var nHgt = parseInt($(_self.element).find("#dbmp_newImageHeight").val()) || 1;
				var idata = ctx.getImageData(0, 0, cnv.width, cnv.height);

				cnv.width = nWdt;
				cnv.height = nHgt;
				$(cnv).css("width", nWdt);
				$(cnv).css("height", nHgt);
				
				ctx.fillStyle = "#000";
				ctx.fillRect(0, 0, nWdt, nHgt);

				//Bildinhalte skalieren (nearest neighbor)
				if(!$(_self.element).find("#dbmp_scalecanvas").prop("checked")) {
					var newIdata = ctx.getImageData(0, 0, nWdt, nHgt);
					for(var y = 0; y < nHgt; y++)
						for(var x = 0; x < nWdt; x++) {
							var nx = Math.floor((x-1)*(idata.width-1)/(cnv.width-1)+1),
								ny = Math.floor((y-1)*(idata.height-1)/(cnv.height-1)+1);
							
							var off1 = (y*(nWdt*4)) + (x*4),
								off2 = (ny*(idata.width*4)) + (nx*4);

							newIdata.data[off1] = idata.data[off2];
							newIdata.data[off1+1] = idata.data[off2+1];
							newIdata.data[off1+2] = idata.data[off2+2];
							newIdata.data[off1+3] = 255;
						}
					
					idata = newIdata;
				}
				
				ctx.putImageData(idata, 0, 0);
				stockUndoStack();
				setConfigData("BMPEditor", "ScaleCanvas", $(_self.element).find("#dbmp_scalecanvas").prop("checked"));
				saveConfig([["BMPEditor", "ScaleCanvas"]]);
			}}, "cancel"]});
	
	dlg.setContent('<hbox><description style="width: 400px;">$DlgScaleImageDesc$</description></hbox>' +
				   '<hbox><grid><columns><column flex="1" /><column flex="2" /><column/></columns>'+
				   '<rows><row><label value="$DlgWidth$"/><textbox id="dbmp_newImageWidth" /><label value="px"/></row>' +
				   '<row><label value="$DlgHeight$"/><textbox id="dbmp_newImageHeight" /><label value="px"/></row>' +
				   '<row><checkbox id="dbmp_proportional" label="$DlgProportionalValues$" /></row>' +
				   '<row><checkbox id="dbmp_scalecanvas" label="$DlgScaleCanvas$" checked="'+getConfigData("BMPEditor", "ScaleCanvas")+'" /></row>' +
				   '</rows></grid></hbox>');
	dlg.show();
	
	var id = activeId;
	
	$(dlg.element).find("#dbmp_newImageWidth").keypress(function(e) {
		if(!e.ctrlKey)
			if(e.which < 48 || e.which > 57)
				if([8,9,13,37,38,39,40].indexOf(e.keyCode) == -1)
					return false;
	}).on("input", function(e) {
		if(_mainwindow.$("#dbmp_proportional").prop("checked")) {
			var cnv = sceneMeta[activeId].c;
			var p = cnv.height/cnv.width;
			_mainwindow.$("#dbmp_newImageHeight").val(Math.floor(parseInt($(this).val())*p) || 1);
		}
	}).val(sceneMeta[id].c.width);
	
	$(dlg.element).find("#dbmp_newImageHeight").keypress(function(e) {
		if(!e.ctrlKey)
			if(e.which < 48 || e.which > 57)
				if([8,9,13,37,38,39,40].indexOf(e.keyCode) == -1)
					return false;
	}).on("input", function(e) {
		if(_mainwindow.$("#dbmp_proportional").prop("checked")) {
			var cnv = sceneMeta[activeId].c;
			var p = cnv.width/cnv.height;
			_mainwindow.$("#dbmp_newImageWidth").val(Math.floor(parseInt($(this).val())*p) || 1);
		}
	}).val(sceneMeta[id].c.height);
	
	dlg = 0;
}
/** @deprecated */
/*-- Undostack --*/
/** @deprecated */
function stockUndoStack(imgdata, id, fSaved) {
	if(id == undefined)
		id = activeId;

	if(!sceneMeta[id].rtdata.undoStack)
		sceneMeta[id].rtdata.undoStack = [];
	
	//Falls es zu groß wird, vorne entfernen
	if(sceneMeta[id].rtdata.undoStack.length+1 > MAX_UNDO_STACKSIZE)
		sceneMeta[id].rtdata.undoStack.shift();
	
	//Falls aktuell mitten im Stack positioniert, nachfolgende Eintraege loeschen
	if(sceneMeta[id].rtdata.undoStackPosition < sceneMeta[id].rtdata.undoStack.length-1)
		sceneMeta[id].rtdata.undoStack.splice(sceneMeta[id].rtdata.undoStackPosition+1);
	
	if(!imgdata)
		imgdata = sceneMeta[id].c.getContext("2d").getImageData(0, 0, sceneMeta[id].c.width, sceneMeta[id].c.height);
	
	sceneMeta[id].rtdata.undoStack.push({ data: imgdata, saved: fSaved });
	sceneMeta[id].rtdata.undoStackPosition = sceneMeta[id].rtdata.undoStack.length-1;

	$(btn_undo).removeClass("deactivated");
	$(btn_redo).addClass("deactivated");
	return true;
}
/** @deprecated */
function canUndoImageData() {
	if(true)return
	var id = activeId;
	if(!sceneMeta[id].rtdata.undoStack)
		return false;
	
	if(sceneMeta[id].rtdata.undoStack.length < 2)
		return false;
	
	if(!sceneMeta[id].rtdata.undoStackPosition)
		return false;

	return true;
}
/** @deprecated */
function undoImageData() {
	var id = activeId;

	if(!canUndoImageData())
		return;
	
	sceneMeta[id].rtdata.undoStackPosition--;
	
	var imgdata = sceneMeta[id].rtdata.undoStack[sceneMeta[id].rtdata.undoStackPosition].data;
	var cnv = sceneMeta[id].c;
	cnv.width = imgdata.width;
	cnv.height = imgdata.height;
	$(cnv).css("width", imgdata.width);
	$(cnv).css("height", imgdata.height);
	cnv.getContext("2d").putImageData(imgdata, 0, 0);
	
	$(btn_redo).removeClass("deactivated");	
	if(!canUndoImageData())
		$(btn_undo).addClass("deactivated");
	return true;
}

function canRedoImageData() {
	var id = activeId;
	if(!sceneMeta[id].rtdata.undoStack)
		return false;
	
	if(sceneMeta[id].rtdata.undoStack.length == sceneMeta[id].rtdata.undoStackPosition+1)
		return false;
	
	if(!sceneMeta[id].rtdata.undoStackPosition+1 == MAX_UNDO_STACKSIZE)
		return false;

	return true;
}
/** @deprecated */
function redoImageData() {
	var id = activeId;
	
	if(!canRedoImageData())
		return;
	
	sceneMeta[id].rtdata.undoStackPosition++;

	var imgdata = sceneMeta[id].rtdata.undoStack[sceneMeta[id].rtdata.undoStackPosition].data;
	var cnv = sceneMeta[id].c;
	cnv.width = imgdata.width;
	cnv.height = imgdata.height;
	$(cnv).css("width", imgdata.width);
	$(cnv).css("height", imgdata.height);
	cnv.getContext("2d").putImageData(imgdata, 0, 0);
	
	$(btn_undo).removeClass("deactivated");
	if(!canRedoImageData())
		$(btn_redo).addClass("deactivated");
	return true;
}

/*-- Infotoolbar --*/

function updateInfotoolbar(x, y) {
	var id = activeId, zoom = sceneMeta[id].z;
	if(x != undefined && y != undefined) {
		x = Math.floor(x); y = Math.floor(y);
		var rect = editlayer.getBoundingClientRect();
		if(!editObj.active) {
			if(x < 0 || y < 0 || x > (rect.width)/zoom || y > (rect.height)/zoom)
				$("#info-coordinates").text("");
			else
				$("#info-coordinates").text("X: " + x + ", Y:" + y);
			
			$("#info-size").text("");
		}
		else {
			$("#info-coordinates").text("X: " + x + ", Y:" + y);
			if([mdRect, mdCircle, mdSelectCircle, mdSelectRect].indexOf(editObj.mode) != -1) {
				var sx = Math.floor(editObj.startx), sy = Math.floor(editObj.starty);
				$("#info-size").text("Wdt: " + Math.min(Math.abs(sx-x), (sx < x)?Math.floor(rect.width/zoom)-sx:sx) +
									 ", Hgt: " + Math.min(Math.abs(sy-y), (sy < y)?Math.floor(rect.height/zoom)-sy:sy));
			}
		}
	}
	
	if(!$("#info-zoom > input").get(0))
		$("#info-zoom").text(100*zoom+"%");
}

function changeZoom(id, fZoomOut) {
	if(!fZoomOut && sceneMeta[id].z < 32)
		sceneMeta[id].z *= 2;
	else if(fZoomOut && sceneMeta[id].z > 1)
		sceneMeta[id].z /= 2;
	else
		return;

	sceneMeta[id].z = Math.max(1, Math.min(32, sceneMeta[id].z));
	
	a_S.zoomFactor = sceneMeta[id].z;
	
	onUpdateZoom(id);
	return true;
}

function centerCanvas() {
	if(!a_S)
		return

	var cnv = $(".canvas-wrapper");
	
	var [neededWidth, neededHeight] = a_S.getNeededDimensions();
	
	var wdwwdt = $(window).width(),
		wdwhgt = $(window).height();
	
	var nx = (wdwwdt - neededWidth)/2,
		ny = (wdwhgt - neededHeight)/2;
	
	if(neededWidth > wdwwdt)
		nx = 20;
	if(neededHeight > wdwhgt)
		ny = 20;
	
	
	//Canvas zentrieren
	cnv.css("top", ny+"px").css("left", nx+"px");

	return true;
}

function onUpdateZoom(id) {
	// viewport anpassen
	a_S.updateZoom()
	
	//Canvas zentrieren
	centerCanvas();
	
	//Lineal neu zeichnen
	updateRulers();
	
	//Infoleiste aktualisieren
	updateInfotoolbar();
	
	// cursor anpassen
	updateBrushGenerator(id);
	
	return true;
}

function selectIndexByPixel(id, x, y) {
	var ctx2 = $("#bmpCanvas-"+id).get(0).getContext('2d');
	var idata = ctx2.getImageData(x, y, 1, 1).data;
	var clr = [idata[2], idata[1], idata[0], 0].byte2num();
	var index = sceneMeta[id].coloridx.indexOf(clr);
	
	if(sceneMeta[id].matindices[index%128]) {
		selectColorIndex(id, index);
		if((index >= 128 && !sceneMeta[id].rtdata.matmode_underground) || (index < 128 && sceneMeta[id].rtdata.matmode_underground))
			switchMaterialMode();
	}
	else
		selectColorIndex(id, -1);
	
	return true;
}

function switchMaterialMode() {
	var id = activeId;
	sceneMeta[id].rtdata.matmode_underground = !sceneMeta[id].rtdata.matmode_underground;
	drawMaterialPalette(id);
}

function pointInPolygon(px, py, poly) {
    for(var inside = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i) {
		if((poly[i][1] <= py&& py < poly[j][1]) || (poly[j][1] <= py && py < poly[i][1]))
			if(px < (poly[j][0] - poly[i][0]) * (py - poly[i][1]) / (poly[j][1] - poly[i][1]) + poly[i][0])
				inside = !inside;
	}
    return inside;
}

function updateRulers() {
	if(!a_S)
		return;

	var rulerl = $("#ruler-left").get(0);
	var lctx = rulerl.getContext('2d');
	var rulert = $("#ruler-top").get(0);
	var tctx = rulert.getContext('2d');
	
	var nwidth = $(document).width(), nheight = $(document).height();

	var cnvpos = $(".draw-canvas").offset();
	var xoff = cnvpos.left, yoff = cnvpos.top;

	if(nwidth > $(".visible").outerWidth()+xoff)
		nwidth = $(window).width();
	if(nheight > $(".visible").outerHeight()+yoff)
		nheight = $(window).height();
	
	$(rulerl).css("height", nheight+"px");
	$(rulert).css("width", nwidth+"px");
	
	rulerl.height = $(rulerl).height();
	rulerl.width = $(rulerl).width();
	rulert.height = $(rulert).height();
	rulert.width = $(rulert).width();
	
	//Leeren
	lctx.fillStyle = "rgb(235, 235, 235)";
	lctx.fillRect(0, 0, rulerl.width, rulerl.height);
	tctx.fillStyle = "rgb(235, 235, 235)";
	tctx.fillRect(0, 0, rulert.width, rulert.height);
	
	lctx.lineWidth = 1;
	tctx.lineWidth = 1;

	//Startposition markieren
	setRulerMarker(rulerl, false, yoff);
	setRulerMarker(rulert, true, xoff);
	
	//Einzelne Striche einzeichnen
	var zoom = sceneMeta[activeId].z;
	var step = Math.max(1, Math.floor(10/zoom)), pxsize = zoom;

	for(var i = step, j = 1; i*zoom < rulerl.height; i+=step) {
		var size = 0.3;
		if(!(j % 2))
			size = 0.5;
		if(!(j % 10))
			size = 1;

		setRulerMarker(rulerl, false, yoff+i*zoom, size, i);
		
		j++;
	}

	//Für oberes Lineal auch
	for(var i = step, j = 1; i*zoom < rulert.width; i+=step) {
		var size = 0.3;
		if(!(j % 2))
			size = 0.5;
		if(!(j % 10))
			size = 1;

		setRulerMarker(rulert, true, xoff+i*zoom, size, i);
		
		j++;
	}
	
	return true;
}

function setRulerMarker(canvas, top, offset, size, text) {
	if(!size)
		size = 1;
	if(!offset)
		offset = 0;
	if(!text)
		text = 0;
	
	offset += 0.5;
	var cnvpos = $(".visible").offset();
	var context = canvas.getContext('2d');

	//Striche zeichnen
	context.beginPath();
	if(top) {
		context.moveTo(offset, canvas.height);
		context.lineTo(offset, canvas.height-size*canvas.height);
	}
	else {
		context.moveTo(canvas.width, offset);
		context.lineTo(canvas.width-size*canvas.width, offset);
	}

	context.closePath();
	context.strokeStyle = "rgb(160, 160, 160)";
	context.stroke();
	
	//Bei vollen Strichen: Pixelzahl anzeigen
	if(size == 1) {
		context.font = "10px Arial";
		context.fillStyle = "rgb(128, 128, 128)";
		if(top)
			context.fillText(text, offset+3, 10);
		else
			context.fillText(text, 0, offset+10);
	}
	
	return true;
}

function getUnsavedFiles() {
	var files = [];
	for(var id in sceneMeta)
		if(sceneMeta[id] && sceneMeta[id].rtdata.undoStack)
			if(!sceneMeta[id].rtdata.undoStack[sceneMeta[id].rtdata.undoStackPosition].saved)
				files.push({ filepath: sceneMeta[id].f.path, index: id, module: window });
	
	return files;
}

function saveCanvas(id) {
	var num2byte = function(num, size) {
		var ar = [];
		for(var i = 0; i < size; i++) {
			ar.push(num & 0xFF);
			num >>= 8;
		}
		
		return ar;
	};
	
	var c = sceneMeta[id].c;
	var ifheader = sceneMeta[id].header;
	
	var rowsize = ((ifheader.bpp*c.width+31)/32)*4;
	
	//BMP-Header erstellen
	var header = [0x42, 0x4d];
	header = header.concat(num2byte(1078+rowsize*c.height, 4)); //Dateigröße (Noch ohne Pixelstorage)
	header = header.concat([0, 0, 0, 0,]); //Reserved
	header = header.concat(num2byte(1078, 4)); //Offset bis zum bitmap image data

	//DIB-Header erstellen
	var dibheader = num2byte(40, 4);
	dibheader = dibheader.concat(num2byte(c.width, 4));
	dibheader = dibheader.concat(num2byte(c.height, 4));
	dibheader = dibheader.concat([1, 0, 8, 0,
								  0, 0, 0, 0]); // compression
	dibheader = dibheader.concat(num2byte(rowsize*c.height,4)); // image size
	dibheader = dibheader.concat([0, 0, 0, 0, 0, 0, 0, 0, // resolution
								  0, 1, 0, 0, // color palette (256)
								  0, 1, 0, 0]); // important colors (256)

	var colortable = [];
	
	//Colortable generieren
	for(var i = 0; i < ifheader.clrcnt; i++)
		colortable = colortable.concat(num2byte(sceneMeta[id].coloridx[i], 4));

	var pixelstorage = [];
	var imgdata = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;

	//Pixelstorage erstellen (von unten links nach oben rechts)
	var padding_bytes = (4-(c.width%4))%4;
	for(var i = c.height-1; i >= 0; i--) {
		for(var x = 0; x < c.width*4; x+=4) {
			var pos = i*(c.width*4)+x;
			var px = [imgdata[pos+2], imgdata[pos+1], imgdata[pos], 0];
			var index = sceneMeta[id].coloridx.indexOf(px.byte2num());//getPixelIndex(id, px);
			pixelstorage.push(index);
		}
		
		//Um Padding Bytes auffüllen
		for(var j = 0; j < padding_bytes; j++)
			pixelstorage.push(0);
	}
	
	//Daten zusammenstellen
	var data = header.concat(dibheader).concat(colortable).concat(pixelstorage);
	
	//Datei schreiben
	var f = sceneMeta[id].f;
	var fstr = _sc.ofstream(f, _scc.PR_WRONLY|_scc.PR_TRUNCATE, 0x200);
	var bstr = _sc.bostream();

	bstr.setOutputStream(fstr);
	bstr.writeByteArray(data, data.length);
	
	bstr.close();
	fstr.close();
	
	EventInfo("$EI_Saved$", -1);
	
	//Verhalten zum Speichern der TexMaps:
	// 0: Automatisch Speichern sofern Aenderung festgestellt
	// 1: Bei jedem Speicherversuch nachdem eine Aenderung festgestellt wurde nachfragen
	// 2: Nie speichern
	var behaviour = parseInt(getConfigData("BMPEditor", "SaveTexMapBehaviour"));
	if(behaviour == 2)
		return true;
	
	//sollten TexMap-Eintraege veraendert worden sein: Neue TexMap generieren
	var texmap_changed = false;
	for(var i = 0; i < 128; i++) {
		if(sceneMeta[id].matindices[i] != sceneMeta[id].start_matindices[i]) {
			texmap_changed = true;
			break;
		}
	}
	
	//Neue TexMap generieren
	if(texmap_changed) {
		if(!behaviour)
			saveTexMap(id);
		else {
			var dlg = new WDialog("$DlgSaveTexMap$", MODULE_LPRE, { modal: true, css: { "width": "482px" }, 
				btnright: [{preset: "accept", onclick: function(e, btn, _self) { 
								if($(_self.element).find("#dbmp_stm_nodialog").attr("checked"))
									setConfigData("BMPEditor", "SaveTexMapBehaviour", 0);
								if($(_self.element).find("#dbmp_stm_backup").attr("checked"))
									setConfigData("BMPEditor", "BackupTexMap", true);		
								else
									setConfigData("BMPEditor", "BackupTexMap", false);
								
								saveTexMap(id);
								saveConfig(["BMPEditor", "SaveTexMapBehaviour", "BackupTexMap"]);
							}}, "cancel"]});
			
			dlg.setContent('<description style="width: 450px">$DlgSaveTexMapDesc$</description>'+
						   '<checkbox label="$DlgDontShowAgain$" id="dbmp_stm_nodialog"/>'+
						   '<checkbox label="$DlgBackupTexMap$" id="dbmp_stm_backup" checked="'+getConfigData("BMPEditor", "BackupTexMap")+'"/>');
			dlg.show();
		}
	}
	
	// sceneMeta[id].rtdata.undoStack[sceneMeta[id].rtdata.undoStackPosition].saved = true;
	return true;
}

class BMPImage {
	constructor() {
		this.fileheader = {
		}
		
		this.dibheader = {
		}
		
		this.data = {
		}
	}
}

function saveTexMap(id) {
	var f = new _sc.file(sceneMeta[id].f.parent.path+"/Material.ocg/TexMap.txt");
	if(!f.exists())
		f.create(Ci.nsIFile.NORMAL_FILE_TYPE, 0o777);
	//Ggf. Backup erstellen
	else if(getConfigData("BMPEditor", "BackupTexMap")) {
		var counter = 1, dstr = (new Date()).toLocaleString().replace(/[\.: ]/gi, "-");
		var tf = new _sc.file(sceneMeta[id].f.parent.path+"/Material.ocg/TexMap-"+dstr+".txt");
		if(tf.exists()) {
			while((tf = new _sc.file(sceneMeta[id].f.parent.path+"/Material.ocg/TexMap-"+dstr+" ("+counter+").txt")).exists())
				counter++;

			f.renameTo(undefined, "TexMap-"+dstr+" ("+counter+").txt");
		}
		else
			f.renameTo(undefined, "TexMap-"+dstr+".txt");
			
		
		f = new _sc.file(sceneMeta[id].f.parent.path+"/Material.ocg/TexMap.txt");
		f.create(Ci.nsIFile.NORMAL_FILE_TYPE, 0o777);
	}
	
	var tmdata = "# Automatically generated texmap\r\n# Index +128 for underground materials\r\n\r\n";
	for(var i = 0; i < 128; i++)
		if(sceneMeta[id].matindices[i])
			tmdata += i + "=" + sceneMeta[id].matindices[i] + "\r\n";

	
	var fstr = _sc.ofstream(f, _scc.PR_WRONLY|_scc.PR_TRUNCATE, 0x200);
	var cstr = _sc.costream();

	cstr.init(fstr, "utf-8", tmdata.length, Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
	cstr.writeString(tmdata);
	
	cstr.close();
	fstr.close();
	
	//Gespeicherte Indices als Startindices festlegen
	sceneMeta[id].start_matindices = jQuery.extend({}, sceneMeta[id].matindices);
	
	//Im Explorer ggf. neu laden
	getModuleByName("cide-explorer").contentWindow.loadDirectory(f.path, 0, true);
	
	return true;
}

function getBitmapInfoHeader(data) {
	var headersize = data.splice(0, 4).byte2num();
	if(headersize != 40) //Nur BITMAPINFOHEADER wird supportet
		return false;
	
	return [{
		size: headersize,
		width: data.splice(0,4).byte2num(),
		height: data.splice(0,4).byte2num(),
		colorplane: data.splice(0,2).byte2num(),
		bpp: data.splice(0,2).byte2num(),
		compression: data.splice(0,4).byte2num(),
		imagesize: data.splice(0,4).byte2num(),
		h_res: data.splice(0,4).byte2num(),
		v_res: data.splice(0,4).byte2num(),
		clrcnt: data.splice(0,4).byte2num(),
		important_clr: data.splice(0,4).byte2num()
	}, data];
}

function getBitmapHeader(data) {
	return [{
		type: data.splice(0,2).byte2str(),
		size: data.splice(0,4).byte2num(),
		reserved1: data.splice(0,2).byte2num(),
		reserved2: data.splice(0,2).byte2num(),
		offset_pxarray: data.splice(0,4).byte2num()}, data]; 
}

function loadImageFileData(file, id) {
	var fs = _sc.ifstream(file, 1, 0, false),
		bs = _sc.bistream(),
		result = {};
	
	bs.setInputStream(fs);
	
	var data = bs.readByteArray(file.fileSize);
	
	bs.close();
	fs.close();

	//BMP- und DIB-Header auslesen
	var r = getBitmapHeader(data);
	var bitmap_header = r[0];
	data = r[1];

	if(bitmap_header.type != "BM")
		return -1;
	
	r = getBitmapInfoHeader(data);
	var clr_index = [];
	if(!r)
		return -1;
	else {
		var infoheader = r[0];
		data = r[1];
		
		//Keine Kompression
		if(infoheader.compression)
			return -1;
	
		//Farbtiefe ab mind. 8-Bit
		if(infoheader.bpp < 8)
			return -1;
		
		if(!infoheader.clrcnt)
			infoheader.clrcnt = Math.pow(2, infoheader.bpp);
		
		//Farbindizes auslesen und speichern
		for(var i = 0; i < infoheader.clrcnt; i++)
			clr_index[i] = data.splice(0, 4).byte2num();
	}
	
	return [infoheader, clr_index, data, bitmap_header];
}

function loadImage(path, id, fShow) {
	let file = path;
	//Da am BMPEditor noch gearbeitet wird, fuers erste die nsIFile-Variante verwenden. Spaeter dann auf OS.File umsteigen.
	if(!(path instanceof Ci.nsIFile))
		file = _sc.file(path);
	var r = loadImageFileData(file, id);
	
	if(r === -1)
		return loadUnsupportedImage(file, id, fShow);

	var [infoheader, clr_index, data, bitmap_header] = r;
	
	let gl = getGl()
	
	if(!gl)
		return
	
	var scene = addScene(gl, document.getElementById("draw-canvas"))
	scene.useAsRect($(".ui-rect").get(0))
	scene.assignColorPalette(clr_index)
	// showObj2(clr_index)
	sceneMeta[id] = { 
		scene, 
		f: file,
		header: infoheader,
		coloridx: clr_index,
		rtdata: {},
		z: 1, // of depcrecated use
		brushData: {
			size: 1,
			rounded: true,
			// seed and distribution factor go here
		}
	};
	
	var num2byte = function(num, size) {
		var ar = [];
		for(var i = 0; i < size; i++) {
			ar.push(num & 0xFF);
			num >>= 8;
		}
		
		return ar;
	};
	
	//ggf. zum Pixel Array springen
	if(1078 < bitmap_header.offset_pxarray)
		data.splice(0, bitmap_header.offset_pxarray-1078);
	
	//Bild aus Pixelstorage generieren
	/*
	var j = 0;
	var padding_bytes = (4-(infoheader.width%4))%4;
	for(var i = Math.abs(infoheader.height)-1; i >= 0; i--) {
		for(var x = 0; x < (infoheader.width)*4; x+=4) {
			var pos = i*(infoheader.width*4)+x;
			var index = data[j++]; 
			var px = num2byte(sceneMeta[id].coloridx[index], 4);
			
			//Canvas-Alpha: 255 = sichtbar
			imgdata.data[pos] = px[2]; imgdata.data[pos+1] = px[1]; imgdata.data[pos+2] = px[0]; imgdata.data[pos+3] = 255;
		}
		
		j += padding_bytes;
	}
	*/
	var texData = new Uint8Array()
	var w = infoheader.width
	/*
	for(let i = Math.abs(infoheader.height)-1; i >= 0; i--) {
		for(let x = 0; x < (infoheader.width)*4; x+=4) {
			let pos = i*(infoheader.width*4)+x;
			let index = data[j++]; 
			let px = num2byte(sceneMeta[id].coloridx[index], 4);
			
			//Canvas-Alpha: 255 = sichtbar
			data[pos] = px[2]
			data[pos+1] = px[1]
			data[pos+2] = px[0]
		}
	}*/
	
	//scene.initWithData()
	scene.initWithTexture(file.path)
	
	//Bitmap anzeigen
	//stockUndoStack(imgdata, id, true);
	
	//Materialien und Texturen laden
	loadMaterials(id);

	//Canvas zentrieren
	centerCanvas(id);
	
	//Canvas ggf. anzeigen
	if(fShow || !a_S)
		showDeckItem(id);

	return true;
}

function loadMaterials(id) {
	var f = sceneMeta[id].f;
	var scenario = _sc.file(f.parent.path+"/Scenario.txt");
	
	//Nur bei gültigem Szenario
	if(!scenario.exists())
		return warn("cannot load materials");
	
	//Materialien und Texturen aus Hauptverzeichnis laden
	var root_materials = _sc.file(_sc.workpath(id) + "/Material.ocg");
	if(!root_materials.exists())
		return warn("no default materials found");
	
	var files = [root_materials];
	var temp = 0;
	
	//Nach Origin-Datei suchen (inkl. dessen übergeordneter Rundenordner)
	
	//Übergeordneter Rundenordner
	if(f.parent.parent.leafName.search(/\.ocf$/) != -1) {
		temp = _sc.file(f.parent.parent.path + "/Material.ocg");
		if(temp.exists())
			files.push(temp);
	}
	
	//Eigene Materialien
	temp = _sc.file(f.parent.path + "/Material.ocg");
	if(temp.exists())
		files.push(temp);
	
	//Daten laden und in Listen speichern
	var list_materials = [], list_textures = [], list_indices = [];
	for(var i = 0; i < files.length; i++) {
		var mdata = loadMaterialData(files[i]);
		list_materials = list_materials.concat(mdata[0]);
		list_textures = list_textures.concat(mdata[1]);
		list_indices = list_indices.concat(mdata[2]);
	}
	
	//In sceneMeta speichern
	sceneMeta[id].materials = list_materials;
	sceneMeta[id].textures = list_textures;
	
	var indices = [];
	for(var i = 0; i < list_indices.length; i++)
		indices[list_indices[i].index] = list_indices[i].mattex;

	sceneMeta[id].matindices = indices;
	sceneMeta[id].start_matindices = jQuery.extend({}, indices);
	//sceneMeta[id].indices = list_indices;
	
	return true;
}

function loadMaterialData(file) {
	var materials = [], textures = [], indices = [];
	
	//Materialordner durchgehen
	var entries = file.directoryEntries;
	while(entries.hasMoreElements()) {
		var f = entries.getNext().QueryInterface(Ci.nsIFile);
		if(f.isDirectory())
			continue;

		var t = f.leafName.split("."), fext = t[t.length-1].toLowerCase();
		switch(fext) {
			case "ocm":
				materials.push(f.leafName.substr(0, f.leafName.length-4));
				break;
			
			case "png":
			case "jpg":
				textures.push(f.leafName.substr(0, f.leafName.length-4));
				break;
		
			case "txt":
				if(f.leafName.toLowerCase() != "texmap.txt")
					break;

				//Indizes laden
				//TODO: Overloads checken
				var content = readFile(f.path);
				var lines = content.split('\n');
				for(var i = 0; i < lines.length; i++) {
					var line = lines[i];
					if(line.search(/[[#]/) != -1)
						continue;
					
					if(line.search(/.+=.+/) == -1)
						continue;
					
					var match = line.match(/(.+)=(.+)/);
					indices.push({index: parseInt(match[1]), mattex: match[2]});
				}
				break;
		}
	}
	
	return [materials, textures, indices];
}

/* Bildreperatur */

function loadUnsupportedImage(file, id, fShow, clridxtbl) {
	//Canvas erstellen und Bild anzeigen
	$("body").append("<canvas id='bmpCanvas-"+id+"' class='image-canvas'></canvas>");
	var canvas = document.getElementById("bmpCanvas-"+id);
	
	hideCideToolbar();
	
	if(!canvas)
		return;
	
	//Farbtabelle mit 256 leeren Eintragen (nicht undefined!) erzeugen
	var cidxt = [];
	for(var i = 0; i < 256; i++)
		cidxt[i] = 0;
	
	if(clridxtbl)
		cidxt = clridxtbl;

	sceneMeta[id] = { c: canvas, f: file, header: 0, coloridx: cidxt, rtdata: {}, z: 1 };
		
	var clone = $(".color-matching-wizard.draft").clone();
	clone.attr("id", "cmw-wrapper-"+id);
	
	//TODO: Ladeanzeige einfügen
	
	$("body").append(clone);
	clone.removeClass("draft");
	clone.addClass("visible2");
	
	var context = canvas.getContext('2d');
	var imageObj = new Image();
	imageObj.addEventListener("load", function() {
		//Canvas-Grundeinstellungen
		sceneMeta[id].wdt = canvas.width = this.naturalWidth;
		sceneMeta[id].hgt = canvas.height = this.naturalHeight;
		context.drawImage(imageObj, 0, 0, this.naturalWidth, this.naturalHeight);
		
		//Header erstellen
		var bmpiheader = getBitmapInfoHeader([40,0,0,0]);
		bmpiheader.width = this.naturalWidth;
		bmpiheader.height = this.naturalHeight;
		bmpiheader.bpp = 8;
		bmpiheader.clrcnt = 256;
		bmpiheader.colorplane = bmpiheader.compression = bmpiheader.h_res = bmpiheader.v_res = bmpiheader.important_clr = 0;
		sceneMeta[id].header = bmpiheader;
		
		//Canvas durchgehen und Farben sammeln
		var imgdata = context.getImageData(0, 0, this.naturalWidth, this.naturalHeight);
		var colors = [], data = imgdata.data;
		
		//Startdaten in Undostack speichern
		stockUndoStack(imgdata, id, true);
		
		//Ggf. Farben aus importierter Palette laden
		if(clridxtbl) {
			for(var i = 0; i < clridxtbl.length; i++)
				if(clridxtbl[i])
					colors.push(clridxtbl[i]);
		}
		else {
			for(var i = 0; i < data.length; i += 4) {
				var clr = [data[i+2], data[i+1], data[i], 0].byte2num();
				if(colors.indexOf(clr) == -1)
					colors.push(clr);
			}
		}

		var wrapper = $("#cmw-wrapper-"+id);

		//Materialien und Texturen laden
		loadMaterials(id);

		//Preview-Canvas einfügen
		wrapper.find(".cmw-map-full").append('<canvas class="cmw-map-full-canvas cmw-preview-canvas">');
		wrapper.find(".cmw-mat-only").append('<canvas class="cmw-mat-only-canvas cmw-preview-canvas">');
		
		var mapfullcnv = wrapper.find(".cmw-map-full-canvas").get(0);
		mapfullcnv.width = this.naturalWidth;
		mapfullcnv.height = this.naturalHeight;
		mapfullcnv.getContext('2d').drawImage(imageObj, 0, 0, this.naturalWidth, this.naturalHeight);
		
		var matonlycnv = wrapper.find(".cmw-mat-only-canvas").get(0);
		matonlycnv.width = this.naturalWidth;
		matonlycnv.height = this.naturalHeight;
		
		//Größe der Vorschau einstellen (Mit Scaling auf 200px)
		var scalefac = 200/Math.max(this.naturalWidth, this.naturalHeight);
		var pre_wdt = this.naturalWidth*scalefac, pre_hgt = this.naturalHeight*scalefac;
		$(matonlycnv).css({"width":pre_wdt+"px", "height":pre_hgt+"px"});
		$(mapfullcnv).css({"width":pre_wdt+"px", "height":pre_hgt+"px"});
			
		wrapper.attr("name", "-1");
	
		//Palette erzeugen
		for(var i = 0; i < colors.length; i++) {
			//Sky ueberspringen
			if(colors[i] == OC_KEYCOLOR)
				continue;
			
			//Paletteneintraege zu nicht vorhandenen Mattex-Kombinationen ueberspringen (Bei Palettenimport)
			if(clridxtbl && !sceneMeta[id].matindices[clridxtbl.indexOf(colors[i])])
				continue;

			var clr = colors[i].toString(16);
			for(var j = clr.length; j < 6; j++)
				clr = "0" + clr;
		
			var palette_elm = $('<div class="cmw-selectcolor-palette-element cmw-unassigned-clr" materialcolor="'+colors[i]+'"></div>');
			$(palette_elm).css("background-color", '#'+clr);
			wrapper.find(".cmw-selectcolor-palette-container").append(palette_elm);
			if(clridxtbl && sceneMeta[id].matindices[clridxtbl.indexOf(colors[i])])
				$(palette_elm).removeClass("cmw-unassigned-clr");
			
			$(palette_elm).click(function(color) { return function() {
				wrapper.find(".cmw-selected-clr").removeClass("cmw-selected-clr");
				$(this).addClass("cmw-selected-clr");

				var matpreview = wrapper.find(".cmw-mat-only-canvas").get(0);
				var matctx = matpreview.getContext('2d');
				var fullprev_cnv = wrapper.find(".cmw-map-full-canvas").get(0);
				var matdata = fullprev_cnv.getContext('2d').getImageData(0, 0, fullprev_cnv.width, fullprev_cnv.height);
				var bgra = color.num2byte(4);
				var darkness = 1-(0.299*bgra[2] + 0.587*bgra[1] + 0.114*bgra[0])/255;

				//Nur das ausgesuchte Material anzeigen
				for(var i = 0; i < matdata.data.length; i += 4) {
					if([matdata.data[i+2], matdata.data[i+1], matdata.data[i], 0].byte2num() != color) {
						matdata.data[i] = 0;
						matdata.data[i+1] = 0;
						matdata.data[i+2] = 0;
						if(darkness > 0.81)
							matdata.data[i+3] = 0;
					}
				}
				
				if(darkness > 0.81)
					$(matpreview).addClass("darkness");
				else
					$(matpreview).removeClass("darkness");

				matctx.putImageData(matdata, 0, 0);
			}; }(colors[i]));
		}
		
		//Materialauswahl erstellen
		var matsel = wrapper.find(".cmw-material-selection");
		var hexDigits = new Array("0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f"); 
		function rgb2hex(rgb) {
			rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
			return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
		}

		function hex(x) {
			return isNaN(x) ? "00" : hexDigits[(x - x % 16) / 16] + hexDigits[x % 16];
		}

		for(var i = 0; i < 128; i++) {
			var mattex = sceneMeta[id].matindices[i];

			if(!mattex)
				continue;
			
			//Eintrag erstellen
			var clone = wrapper.find(".cmw-material-selection-option.draft").clone();
			clone.removeClass("draft");
			clone.find(".cmw-material-selection-option-name").text(mattex);
			clone.attr("material-index", i);
			if(sceneMeta[id].coloridx[i]) {
				var clr = sceneMeta[id].coloridx[i].toString(16);
				for(var j = clr.length; j < 6; j++)
					clr = "0" + clr;
				clone.find(".cmw-material-selection-option-matchedclr").css("background", "#"+clr);
				clone.attr("assignedclr", sceneMeta[id].coloridx[i]);
			}
			
			matsel.append(clone);
			
			//Per Klick Farbe zuweisen
			clone.click(function(e) {
				var selected_clr_obj = wrapper.find(".cmw-selected-clr");
				if(!selected_clr_obj.get(0)) {
					//Bei Schnellauswahl das erste Palettenelement auswaehlen
					if(e.ctrlKey || wrapper.find(".cmw-selectcolor-palette-fastselect").hasClass("activated"))
						$(wrapper.find(".cmw-selectcolor-palette-element:first")).trigger("click");
					
					selected_clr_obj = wrapper.find(".cmw-selected-clr");

					//Sollte trotzdem keins ausgewaehlt sein, abbrechen
					if(!selected_clr_obj.get(0))
						return;
				}
				
				var bgmode = wrapper.find(".cmw-material-selection-switchbg").hasClass("activated");
				var selected_clr = parseInt(rgb2hex(selected_clr_obj.css("background-color")).substr(1), 16);
				
				//Falls Farbe schon zugewiesen, diese entsprechend wieder abziehen
				wrapper.find(".cmw-material-selection-option").each(function(index) {
					if($(this).attr("assignedclr") == selected_clr) {
						$(this).find(".cmw-material-selection-option-matchedclr").css("background", "");
						$(this).attr("assignedclr", undefined);
						$(this).removeClass("cmw-material-selection-color-assigned");
						sceneMeta[id].coloridx[parseInt($(this).attr("material-index"))+bgmode*128] = 0;
					}
				});
				
				//Doppelte Eintraege entfernen (-> Backgroundmode)
				while(selected_clr && sceneMeta[id].coloridx.indexOf(selected_clr) != -1)
					sceneMeta[id].coloridx[sceneMeta[id].coloridx.indexOf(selected_clr)] = 0
				
				//Vorheriges Farbfeld auf unzugewiesen setzen
				if($(this).attr("assignedclr"))
					wrapper.find(".cmw-selectcolor-palette-element[materialcolor='"+$(this).attr("assignedclr")+"']").addClass("cmw-unassigned-clr");

				//Farbfeld auf zugewiesen setzen
				wrapper.find(".cmw-selectcolor-palette-element[materialcolor='"+selected_clr+"']").removeClass("cmw-unassigned-clr");
				
				//Farbe und Klasse setzen
				$(this).attr("assignedclr", selected_clr);
				$(this).find(".cmw-material-selection-option-matchedclr").css("background", selected_clr_obj.css("background-color"));
				$(this).addClass("cmw-material-selection-color-assigned");
				sceneMeta[id].coloridx[parseInt($(this).attr("material-index"))+bgmode*128] = selected_clr;
				
				//Schnellauswahl ueber Strg+Mausklick
				if(e.ctrlKey || wrapper.find(".cmw-selectcolor-palette-fastselect").hasClass("activated")) {
					var next = wrapper.find(".cmw-selectcolor-palette-element[materialcolor='"+selected_clr+"']")
							.nextAll(".cmw-selectcolor-palette-element.cmw-unassigned-clr").get("0");
					if(next)
						$(next).trigger("click");
				}
			});
		}
		
		//Schnellauswahl
		wrapper.find(".cmw-selectcolor-palette-fastselect").click(function() {
			$(this).toggleClass("activated");
		});
		
		//Hintergrundfarben umschalten
		wrapper.find(".cmw-material-selection-switchbg").click(function() {
			$(this).toggleClass("activated");
			
			var bgmode = $(this).hasClass("activated");
			wrapper.find(".cmw-material-selection-option").each(function() {
				var nclr = sceneMeta[id].coloridx[parseInt($(this).attr("material-index"))+128*bgmode];
				
				//Ggf. neue Farbe setzen
				if(!nclr) {
					$(this).find(".cmw-material-selection-option-matchedclr").css("background", "");
					$(this).removeClass("cmw-material-selection-color-assigned");
					$(this).attr("assignedclr", undefined);
				}
				else {
					var nclrstr = nclr.toString(16);
					for(var i = nclrstr.length; i < 6; i++)
						nclrstr = "0" + nclr;

					$(this).find(".cmw-material-selection-option-matchedclr").css("background", "#"+nclrstr);
					$(this).addClass("cmw-material-selection-color-assigned");
					$(this).attr("assignedclr", nclr);
				}
				
			});
		});
		
		//Palette importieren
		var importPalette = function() {
			var fp = _sc.filepicker();
			fp.init(window, Locale("$ImportPaletteDlg$"), Ci.nsIFilePicker.modeOpen);
			fp.appendFilter("Bitmap", "*.bmp");
			
			var current_path = getConfigData("Global", "ClonkPath");
			if(current_path) {
				var dir = new _sc.file(current_path);
				if(dir.exists())
					fp.displayDirectory = dir;
			}

			var rv = fp.show();
			
			//Bilddatei gefunden
			if(rv == Ci.nsIFilePicker.returnOK) {
				var r = loadImageFileData(fp.file, id);
				if(r == -1)
					warn("$ImportUnsucessful$");
				else {
					//Bereits zugewiesene Farben uebernehmen
					for(var i = 0; i < sceneMeta[id].coloridx.length; i++)
						if(sceneMeta[id].coloridx[i]) {
							//Doppelte Farbzuweisungen vermeiden
							if(r[1].indexOf(sceneMeta[id].coloridx[i]) != -1)
								r[1][r[1].indexOf(sceneMeta[id].coloridx[i])] = 0;
							r[1][i] = sceneMeta[id].coloridx[i];
						}

					$("#cmw-wrapper-"+id).remove();
					sceneMeta[id] = undefined;

					loadUnsupportedImage(file, id, fShow, r[1]);
				}
			}
		};
		
		wrapper.find(".cmw-importpalette").click(function() {
			//Ggf. Informations-Dialogfeld anzeigen
			if(!getConfigData("BMPEditor", "CMW_NoImportDialog")) {
				var dlg = new WDialog("$DlgImportNote$", MODULE_LPRE, { modal: true, css: { "width": "482px" }, 
						btnright: [{preset: "accept", onclick: function(e, btn, _self) {
							if(_mainwindow.$("#dbmp_cmw_nodialog").prop("checked")) {
								setConfigData("BMPEditor", "CMW_NoImportDialog", true);
								saveConfig([["BMPEditor", "CMW_NoImportDialog"]]);
							}

							importPalette();
						}}, "cancel"]});
				
				dlg.setContent('<hbox><description style="width: 450px;">$DlgImportNoteDesc$</description></hbox>' +
							   '<hbox><checkbox label="$DlgDontShowAgain$" id="dbmp_cmw_nodialog"/></hbox>');
				dlg.show();
			}
			else
				importPalette();
		});

		wrapper.find(".cmw-finish").click(function() {
			//Pruefen ob bestimmte Materialien noch nicht zugeordnet worden sind
			var unassigned_clr = false;
			for(var i = 0; i < colors.length; i++) {
				if(sceneMeta[id].coloridx.indexOf(colors[i]) == -1) {
					unassigned_clr = true;
					break;
				}
			}
			
			var closeWizard = function() {
				wrapper.remove();
				
				//Canvas zentrieren
				centerCanvas(id);
				
				//Canvas ggf. anzeigen
				showDeckItem(id);
				
				showCideToolbar();
			}; 

			//Ggf. Dialog oeffnen
			if(unassigned_clr) {
				var dlg = new WDialog("$DlgWarnUnassignedColor$", MODULE_LPRE, { modal: true, css: { "width": "482px" }, 
						btnright: [{preset: "accept", onclick: closeWizard }, "cancel"]});
				
				dlg.setContent('<hbox><description style="width: 450px;">$DlgWarnUnassignedColorDesc$</description></hbox>' +
							   '<div class="dlg-show-unassigned-colors" style="width: 440px;" xmlns="http://www.w3.org/1999/xhtml"></div>' +
							   '<hbox><description style="width: 450px;">$DlgWarnUnassignedColorDesc2$</description></hbox>');
				dlg.show();
				
				//Unzugewiesene Materialien anzeigen
				for(var i = 0; i < colors.length; i++) {
					if(sceneMeta[id].coloridx.indexOf(colors[i]) == -1) {
						var clr = colors[i].toString(16);
						for(var j = clr.length; j < 6; j++)
							clr = "0" + clr;

						$(dlg.element).find(".dlg-show-unassigned-colors")
						.append('<box style="width: 20px; height: 20px; margin: 2px; background-color: #'+clr+'; border: 1px solid black;"></box>');
					}
				}
				
				dlg = 0;
			}
			else
				closeWizard();
		});
		
		showDeckItem(id);
	});
	if(OS_TARGET == "WINNT")
		imageObj.src = encodeURI("file://"+file.path.replace(/\\/gi, "/")).replace(/#/g, "%23");
	else
		imageObj.src = encodeURI("file://"+file.path).replace(/#/g, "%23");
}

/* Farbabfragen */

function getCurrentColor(id = activeId) {
	return getColorByIndex(id, sceneMeta[id].rtdata.current_matidx);
}

function getColorByIndex(id, index) {
	var clridx = sceneMeta[id].coloridx, clr = OC_KEYCOLOR.toString(16);
	if(index != -1)
		clr = clridx[index].toString(16);
	
	while(clr.length < 6)
		clr = "0" + clr;

	return "#"+clr;
}

function getCurrentRGB(id) {
	return hexToRGB(getColorByIndex(id, sceneMeta[id].rtdata.current_matidx));
}

function hexToRGB(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : null;
}


function getMaterialByIndex(id, index) {
	var selection = "Sky";
	if(index != -1)
		selection = sceneMeta[id].matindices[index%128];
	
	return selection;
}

//Farbe auswählen
function selectColorIndex(id, index, deckupdate) {
	var selection = getMaterialByIndex(id, index);
	var clr = getColorByIndex(id, index);

	$("#current-material-clr").css("background-color", clr);
	$("#current-material-name > input").val(selection);
	
	sceneMeta[id].rtdata.current_matidx = index;

	$(".spalette-elm.active").removeClass("active");
	sceneMeta[id].rtdata.current_sideindex = -1;
	
	if(index != -1 && $(".spalette-elm[mat-index='"+index+"']").get(0)) {
		$(".spalette-elm[mat-index='"+index+"']").addClass("active");
		sceneMeta[id].rtdata.current_sideindex = $(".spalette-elm").index($(".spalette-elm[mat-index='"+index+"']").get(0));
	}

	$(".spalette-elm[mat-index!='"+index+"']").removeClass("autoselect");

	return true;
}

function drawMaterialPalette(id) {
	var clr_index = sceneMeta[id].coloridx;
	var indices = sceneMeta[id].matindices;
	
	var canvas = $("#material-palette").get(0);
	var ctx = canvas.getContext('2d');
	
	//Leeren
	ctx.fillType = "#000";
	ctx.fillRect(0, 0, 160, 160);	
	var bgmode = sceneMeta[id].rtdata.matmode_underground;
	if(!bgmode)
		bgmode = 0;

	//Und neu füllen
	for(var i = 0; i < 128; i++) {
		ctx.fillStyle = "#000";
		if(indices[i] || !getConfigData("BMPEditor", "HideUnusedMat"))
			ctx.fillStyle = getColorByIndex(id, i+128*bgmode);
		
		var x = (i % 16)*10, y = Math.floor(i/16)*10;
		ctx.fillRect(x, y, 10, 10);
	}
	
	return true;
}

/* Deck functionalities */

function saveFileByPath(path) {
	for(var id in sceneMeta)
		if(sceneMeta[id])
			if(sceneMeta[id].f.path == path)
				return saveCanvas(id);
	
	return -1;
}

function fileLoaded(path) {
	for(var id in sceneMeta)
		if(sceneMeta[id])
			if(sceneMeta[id].f.path == path)
				return id;
	
	return -1;
}

function showDeckItem(id) {
	//Auswahl deaktivieren bei Tabwechsel
	if(id !== activeId)
		$("#movinglayer").removeClass("active");
	
	//Fuer Color-Matching-Wizard die Toolbar deaktivieren
	if($("#cmw-wrapper-"+id).get(0))
		hideCideToolbar();
	else
		showCideToolbar();

	//TODO: Bearbeitungsmodus setzen
	drawMaterialPalette(id);
	updateSidePalette(id);
	
	//Startmaterial auswählen
	if(sceneMeta[id].rtdata.current_matidx == undefined)
		selectColorIndex(id, -1);
	else
		selectColorIndex(id, sceneMeta[id].rtdata.current_matidx);

	$(".visible").removeClass("visible");
	$("#cmw-wrapper-"+id).addClass("visible");
	
	/*
	if(canUndoImageData())
		$(btn_undo).removeClass("deactivated");
	else
		$(btn_undo).addClass("deactivated");
	
	if(canRedoImageData())
		$(btn_redo).removeClass("deactivated");
	else
		$(btn_redo).addClass("deactivated");
	*/
	
	a_S = _SCENES[id]
	activeId = id
	a_S.onShow()
	
	//Lineal und Zoom aktualisieren
	onUpdateZoom(id);
	
	updateBrushGenerator(id);
		
	frameUpdateWindmillTitle();
}

function frameWindowTitle() { 
	if(sceneMeta[activeId])
		return formatPath(sceneMeta[activeId].f.path).substr(_sc.workpath(activeId, true).length+1);
	return "";
}

function removeDeckItem(id) {
	sceneMeta[id] = null;
}


function getReloadPars() {
	var str = "";
	for(var id in sceneMeta) {
		if(sceneMeta[id])
			str += id + "=" + encodeURI(sceneMeta[id].f.path) + "&";
	}

	return str;
}

function getTabData(tabid) {
	var cnv = sceneMeta[tabid];
	var data = {
		file: cnv.f,
		wdt: cnv.wdt,
		hgt: cnv.hgt
	};
	
	return data;
}

function dropTabData(data, tabid) {
	loadImage(data.file, tabid, true);
	
	var cnv = sceneMeta[tabid];
	cnv.width = data.wdt;
	cnv.height = data.hgt;
	cnv.c.getContext('2d').putImageData(data.imgdata, 0, 0);
	
	return true;
}

var mouse_x,
	mouse_y,
	dragged,
	offset_x = 0,
	offset_y = 0;

document.addEventListener("mousemove", function(e) {
	mouse_x = e.screenX;
	mouse_y = e.screenY;
});

document.addEventListener("mouseup", function(e) {
	dragged = false;
});

function setDraggable(el, exclude, target) {
	if(!el)
		return false;
	
	$(el).mousedown(function(e) {
		if($(this).is(exclude))
			return;
		
		var tEl = target || this;
		
		if($(tEl).hasClass("immovable"))
			return;
		
		offset_x = mouse_x - $(tEl)[0].offsetLeft;
		offset_y = mouse_y - $(tEl)[0].offsetTop;
		dragged = tEl;
		
		var fn = () => {
			if(!dragged)
				return
			
			$(dragged).offset({ top: mouse_y - offset_y, left: mouse_x - offset_x})
			requestAnimationFrame(fn)
		}
		
		requestAnimationFrame(fn)
	});
}