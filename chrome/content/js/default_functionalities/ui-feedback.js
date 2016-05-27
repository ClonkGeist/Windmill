/*-- UI Funktionen fuer Userfeedback --*/

/*-- Tooltips --*/

var tooltipTimeout, tooltipEl;

function tooltip(targetEl, desc, lang = MODULE_LANG, duration) {
	desc = Locale(desc);
	if(!duration)
		duration = 600; // ms

	$(targetEl).mouseenter(function() {
		clearTooltip();
		
		tooltipTimeout = setTimeout(() => {
			var el = $('<'+(lang === "html"?'div style="background-color: black"':'panel')+'></'+(lang == "html"?'div':'panel')+'>')[0];

			$(this).append(el);

			$(el).css(toolTipStyle).text(desc);

			var [x,y,w,h] = [this.offsetLeft, this.offsetTop, this.offsetWidth, this.offsetHeight];
			
			// if its too near to the upper border
			if(y < el.offsetHeight)
				y += h; // then show it at the bottom
			else // otherwise lift it so the original element is still visible
				y -= el.offsetHeight;
			
			// center the x position relative to the original element
			x += (w/2 - el.offsetWidth/2);
			
			let doc = lang=="html"?document:document.documentElement;
			// if its too close to the left border
			if(x < 0)
				x = 0;
			// same thing with right border
			else if(x + el.offsetWidth > $(doc).width())
				x = $(doc).width() - $(el)[0].offsetWidth;

			$(el).css("top", y + "px");
			$(el).css("left", x + "px");

			// store for remove
			tooltipEl = el;
		}, duration);
	});
	
	$(targetEl).mouseleave(function(e) {
		clearTooltip();
	});
}

function clearTooltip() {
	clearTimeout(tooltipTimeout);
	$(tooltipEl).remove();
}

var toolTipStyle = {
	position: "absolute",
	"background-color": "rgb(80, 80, 80)",
	color: "whitesmoke",
	"font-family": '"Segoe UI", Verdana, sans-serif',
	"font-size": "14px",
	"line-height": "14px",
	"z-index": "30",
	width: "auto",
	padding: "1px 5px",
	transition: "opacity 0.3s"
};

function setWindowTitle(title) {
	_mainwindow.document.getElementById("window-title").setAttribute("value", title);
}

/*-- Lock Module --*/

function lockModule(message, nofadein, delay = 200) {
	if($(".windmill-modal")[0]) {
		$(".windmill-modal").html(Locale(message));
	
		return true;
	}

	let modal;
	if(MODULE_LANG == "html") {
		modal = $('<div class="windmill-modal'+(nofadein?" modal-enabled":"")+'" style="z-index: 10000"></div>');
		modal.html(Locale(message));
		$("body").append(modal);
	}
	else if(MODULE_LANG == "xul") {
		modal = $('<box class="windmill-modal'+(nofadein?" modal-enabled":"")+'"></box>');
		modal.html(Locale(message));
		if(!$("#windmill-modal-wrapper,.windmill-lockmodule-wrapper")[0])
			$(document.documentElement).children().wrapAll('<stack flex="1" id="windmill-modal-wrapper" class="temporary"></stack>');

		$("#windmill-modal-wrapper,.windmill-lockmodule-wrapper").append(modal);
	}
	if(!nofadein)
		setTimeout(function() {
			modal.addClass("modal-enabled");
		}, delay);

	return true;
}

function unlockModule() {
	$($("#windmill-modal-wrapper.temporary").children()[0]).unwrap();
	$(".windmill-modal").remove();
	return true;
}

/*-- EventInfos --*/

const EVENTINFO_DISPLAYTIME = 700;
var eventinfo_timeout;

function EventInfo(message, lpre) {
	message = Locale(message, lpre);

	if($(".eventinfo")[0]) {
		clearTimeout(eventinfo_timeout);
		$(".eventinfo").stop(true).css("opacity", "");

		var off = $(".eventinfo").last().offset();
		if(MODULE_LANG == "html")
			var nEventInfo = $('<div class="eventinfo">'+message+'</div>');
		else if(MODULE_LANG == "xul")
			var nEventInfo = $('<div class="eventinfo" xmlns="http://www.w3.org/1999/xhtml">'+message+'</div>');
		nEventInfo.appendTo(MODULE_LANG=="xul"?document.documentElement:"body");
		nEventInfo.css({ top: off.top-$(nEventInfo).outerHeight(), left: 0});
	}
	else {
		if(MODULE_LANG == "html")
			var nEventInfo = $('<div class="eventinfo">'+message+'</div>');
		else if(MODULE_LANG == "xul")
			var nEventInfo = $('<div class="eventinfo" xmlns="http://www.w3.org/1999/xhtml">'+message+'</div>');
		nEventInfo.appendTo(MODULE_LANG=="xul"?document.documentElement:"body");
		nEventInfo.css({ bottom: 0, left: 0});
	}

	eventinfo_timeout = setTimeout(function() { $(".eventinfo").fadeOut(500, function() {$(this).remove();}); }, EVENTINFO_DISPLAYTIME);
	return nEventInfo;
}