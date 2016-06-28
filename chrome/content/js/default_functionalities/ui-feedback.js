/*-- UI Funktionen fuer Userfeedback --*/

/*-- Tooltips --*/

var tooltipTimeout, tooltipEl;

function tooltip(targetEl, desc, lang = MODULE_LANG, duration, options = {}) {
	desc = Locale(desc, options.lpre);
	if(!duration)
		duration = 600; // ms

	$(targetEl).mouseenter(function() {
		clearTooltip();
		
		let target = this;
		if(options.target)
			target = options.target;
		tooltipTimeout = setTimeout(() => {
			let wdw = window;
			if(options.window)
				wdw = options.window;
			var el = $('<'+(lang === "html"?'div':'panel noautofocus="true" noautohide="true"')+' class="windmill-tooltip"></'+(lang == "html"?'div':'panel')+'>', wdw.document)[0];
			
			if(options.css)
				$(el).css(options.css);

			$(lang === "html"?"body":document.documentElement, wdw.document).append(el);
			$(el).text(desc);

			let {width, height, top, left} = target.getBoundingClientRect();
			// something is positioning all tooltips 5px too far to the bottom right (though its position absolute in html or relies on screen coordinates in xul)
			top -= 5;
			left -= 5;
			// panels need to be opened, so the size values are set
			if(lang != "html")
				el.openPopup();
			
			if(options.offset) {
				top += options.offset.top || 0;
				left += options.offset.left || 0;
			}
			// if its too near to the upper border
			if(top-$(el).height() < 0)
				top += $(target).height();
			else // otherwise lift it so the original element is still visible
				top -= $(el).height();

			// center the x position relative to the original element and bound it in the window
			left = Math.min(Math.max(0, left+(width/2 - $(el).width()/2)), $(wdw).width());
			top += $(lang === "html"?"body":wdw.document.documentElement, wdw.document).scrollTop();
			if(lang == "html") {
				$(el).css({
					top: top + "px",
					left: left + "px",
					position: "absolute"
				});
			}
			else
				el.moveTo(left+wdw.document.documentElement.boxObject.screenX, top+wdw.document.documentElement.boxObject.screenY);

			// store for remove (as weak reference, in case the object dies)
			tooltipEl = Cu.getWeakReference(el);
		}, duration);
	});
	
	$(targetEl).mouseleave(function(e) {
		clearTooltip();
	});
}

function clearTooltip() {
	clearTimeout(tooltipTimeout);
	if(!tooltipEl)
		return;

	let elm = tooltipEl.get();
	if(elm && elm.hidePopup)
		elm.hidePopup();
	$(elm).remove();
	tooltipEl = undefined;
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