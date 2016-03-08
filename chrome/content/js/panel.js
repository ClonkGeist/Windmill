
var PANELS = [];

hook("load", "panelSetup");

function panelSetup() {
	if(!$("#panel-container").get(0)) {
		// for html
		$(document).append("<div id=\"panel-container\"></div>");
	}
}

function addPanel(lang, desc, cont) {
	var id = PANELS.length;
	
	if(!lang)
		lang == "htmlns";
	
	PANELS[id] = new Panel(lang, id, desc, cont);
	
	return PANELS[id];
}

function showPanel(id) {
	PANELS[id].show();
}

function hidePanel(id) {
	PANELS[id].hide();
}

function maxifyPanel(id) {
	PANELS[id].maxify();
}

function minifyPanel(id) {
	PANELS[id].minify();
}

function Panel(lang, id, desc, cont) {
	var ns = "";
	if(lang == "htmlns")
		ns = "http://www.w3.org/1999/xhtml";
	
	if(lang == "html" || lang == "htmlns") {
		this.cont = $("<div id=\"panel-" + id + "\" class=\"panel\"></div>")[0];
		this.header = $("<div class=\"panel-header\"></div>")[0];
		
		$(this.header).append("<span style=\"flex: 1\">"+desc+"</span>");
		
		$(this.header).append(
		"<div class=\"panel-frame-button-wrapper\">\
			<a class=\"panel-size-button icon-maximize panel-frame-button visible\" href\"#\" onclick=\"maxifyPanel("+id+")\"> </a>\
			<a class=\"panel-size-button icon-minimize panel-frame-button\" href\"#\" onclick=\"minifyPanel("+id+")\"> </a>\
			<a class=\"icon-x panel-frame-button\" onclick=\"hidePanel("+id+")\"></a>\
		</div>"
		);
		
		$(this.cont).append(this.header);
		
		this.body = $("<div class=\"panel-body\"></div>")[0];
		$(this.cont).append(this.body);
	}
	
	if(cont)
		$(cont).append(this.cont);
	else
		$("#panel-container").append(this.cont);
	
	setDraggable(this.header, ".panel-close-button", this.cont);
	
	$(this.cont).hide();
}

Panel.prototype.show = function() {
	if(this.setupFn && this.reset)
		this.setupFn.apply(this);
	
	$(this.cont).show();
}

Panel.prototype.hide = function() {
	
	if(this.reset)
		$(this.body).empty();
	
	$(this.cont).hide();
}

Panel.prototype.maxify = function() {

	var p = $(this.cont).position();
	this.posX = p.left;
	this.posY = p.top;
	
	$(this.cont).addClass("immovable");
	
	$(this.cont).css({
		top: 0,
		left: 0,
		right: 0,
		bottom: 0
	});
	
	$(this.cont).find(".panel-size-button").toggleClass("visible");
}

Panel.prototype.minify = function() {

	$(this.cont).css({
		top: this.posY + "px",
		left: this.posX + "px",
		bottom: "initial",
		right: "initial"
	});
	
	$(this.cont).find(".panel-size-button").toggleClass("visible");
	
	$(this.cont).removeClass("immovable");
}
	

Panel.prototype.setup = function(fn, fReset) {
	this.setupFn = fn;
	if(typeof fReset == "boolean")
		this.reset = fReset;
}

var mouse_x = 0,
	mouse_y = 0,
	dragged,
	offset_x,
	offset_y,
	dragEl;

document.addEventListener("mousemove", function(e) {
	
	mouse_x = e.clientX;
	mouse_y = e.clientY;
	
	if(!dragged)
		return;
	var x = mouse_x - offset_x,
		y = mouse_y - offset_y;
	
	if(x < 0)
		x = 0;
	else if(x + parseFloat(dragEl.offsetWidth) > window.innerWidth)
		x = window.innerWidth - dragEl.offsetWidth;
	
	if(y < 0)
		y = 0;
	else if(y + parseFloat(dragEl.offsetHeight) > window.innerHeight)
		y = window.innerHeight - parseFloat(dragEl.offsetHeight);
	
	$(dragged).offset({ top: y, left: x})
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
		dragEl = this;
	});
}

/* space */