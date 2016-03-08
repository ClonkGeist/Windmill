/** Benachrichtigungen **/
//Spielbenachrichtigung mit QuickJoin, Updatebenachrichtigung, später evtl. auch für Lorryupdates etc.

const NOTIFICATION_Time = 5000; //show notification for 5 seconds
var NOTIFICATION_ITEM_ID = 0;

const NOTIFICATION_COLOR_ERROR = "#9E0505", //Standardfarbwerte
	  NOTIFICATION_COLOR_INFO  = "#0D6F07";

class Notification2 {
	constructor() {
		this.timer = 0;
		this.npanel = 0;
	}

	showNotification(color = NOTIFICATION_COLOR_INFO, title, description, code) {
		++NOTIFICATION_ITEM_ID;

		var clone = $(".notification-item.draft").clone(true);
		clone.removeClass("draft");
		clone.attr("id", "notification-"+NOTIFICATION_ITEM_ID);

		clone.find(".notification-head").css("background-color", color).css("border-color", color);
		if(code)
			clone.find(".notification-content").html(code);
		else {
			clone.find(".notification-title").html(title);
			clone.find(".notification-desc").html(description);
		}

		if(this.npanel) {
			clearTimeout(this.timer);

			this.timer  = setTimeout(() => { this.killPanel(); }, NOTIFICATION_Time);
			clone.appendTo($(this.npanel));

			var pscr = _sc.screenmgr().primaryScreen;
			var x = {}, y = {}, wdt = {}, hgt = {};
			pscr.GetAvailRect(x,y,wdt,hgt);
			this.npanel.moveTo(x.value+wdt.value-$(this.npanel).outerWidth(), y.value+hgt.value);
		}
		else {
			var panel = $("<panel id='notification-panel' noautofocus='true' noautohide='true'></panel>").appendTo($("#wrapper"))[0];

			clone.appendTo($(panel));

			var pscr = _sc.screenmgr().primaryScreen;
			var x = {}, y = {}, wdt = {}, hgt = {};
			pscr.GetAvailRect(x,y,wdt,hgt);
			panel.openPopupAtScreen(x.value+wdt.value-$(panel).outerWidth(), y.value+hgt.value);
			panel.moveTo(x.value+wdt.value-$(panel).outerWidth(), y.value+hgt.value);

			this.npanel = panel;
			this.timer = setTimeout(() => { if(this) { this.killPanel(); }}, NOTIFICATION_Time);
		}

		//HTML-Content nochmal setzen, da das Panel sich sonst unter die Taskleiste setzt
		//(Ist oben allerdings noetig, um die richtigen Width/Height-Werte zu haben)
		clone.find(".notification-content").html(clone.find(".notification-content").html());

		return clone;
	}

	killPanel() {
		$(this.npanel).remove();
		this.npanel = undefined;
		clearTimeout(this.timer);
		return true;
	}
}

var notifier = new Notification2();
var showNotification = function(...pars) { return notifier.showNotification(...pars); }