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
			var el = $('<'+(lang === "html"?'div':'panel noautofocus="true"')+' class="windmill-tooltip"></'+(lang == "html"?'div':'panel')+'>')[0];

			$(lang === "html"?"body":document.documentElement).append(el);
			$(el).text(desc);

			let {width, height, top, left} = this.getBoundingClientRect();
			// panels need to be opened, so the size values are set
			if(lang != "html")
				el.openPopup();
			// if its too near to the upper border
			if(top-$(el).height() < 0)
				top += $(this).height();
			else // otherwise lift it so the original element is still visible
				top -= $(el).height();

			// center the x position relative to the original element and bound it in the window
			left = Math.min(Math.max(0, left+(width/2 - $(el).width()/2)), $(window).width());
			top += $(lang === "html"?"body":document.documentElement).scrollTop();
			if(lang == "html") {
				$(el).css({
					top: top + "px",
					left: left + "px",
					position: "absolute"
				});
			}
			else
				el.moveTo(left+document.documentElement.boxObject.screenX, top+document.documentElement.boxObject.screenY);

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
	if(tooltipEl && tooltipEl.hidePopup)
		tooltipEl.hidePopup();
	$(tooltipEl).remove();
}

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

function EventInfo(message, lpre, in_document) {
	message = Locale(message, lpre);

	if($(".eventinfo")[0]) {
		clearTimeout(eventinfo_timeout);
		$(".eventinfo").stop(true).css("opacity", "");

		var off = $(".eventinfo").last().offset();
		if(MODULE_LANG == "html")
			var nEventInfo = $('<div class="eventinfo">'+message+'</div>');
		else if(MODULE_LANG == "xul")
			var nEventInfo = $('<div class="eventinfo" xmlns="http://www.w3.org/1999/xhtml">'+message+'</div>');
		nEventInfo.appendTo(MODULE_LANG=="xul"||in_document?document.documentElement:"body");
		nEventInfo.css({ top: off.top-$(nEventInfo).outerHeight(), left: 0});
	}
	else {
		if(MODULE_LANG == "html")
			var nEventInfo = $('<div class="eventinfo">'+message+'</div>');
		else if(MODULE_LANG == "xul")
			var nEventInfo = $('<div class="eventinfo" xmlns="http://www.w3.org/1999/xhtml">'+message+'</div>');
		nEventInfo.appendTo(MODULE_LANG=="xul"||in_document?document.documentElement:"body");
		nEventInfo.css({ bottom: 0, left: 0});
	}

	eventinfo_timeout = setTimeout(function() { $(".eventinfo").fadeOut(500, function() {$(this).remove();}); }, EVENTINFO_DISPLAYTIME);
	return nEventInfo;
}