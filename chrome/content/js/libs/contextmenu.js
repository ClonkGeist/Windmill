var CTX_MENUITEM_ID_COUNTER = 0;

/**
 * Erstellt und bindet ein Kontextmenü an eines (oder mehreren) Objekt.
 * ContextMenu(onShowing, entryarray, langpre, options)
 *  - [function] onShowing: 
 *      Callback kurz bevor das Menue erscheint. Uebergebener Parameter by_obj (Objekt auf das das Kontextmenü geoeffnet worden ist). 
 *      Wird in Objektkontext gecalled. (this = ContextMenu-Objekt)
 *  - [2d-array] entryarray: 
 *      2 dimensionales Array das die einzelnen Eintraege enthaelt. [[label, id, clickHadnler, subMenu, options]] (s. addEntry)
 *      Kann auch als Eintrag "seperator" enthalten, um einen Seperator an der jeweiligen Stelle hinzuzufuegen.
 *  - [string] langpre:
 *      Lokalisierungspraefix das fuer das Kontextmenü genutzt wird.
 *  - [object] options:
 *      Objekt mit folgenden moeglichen Optionen:
 *        - [function] post_opening_callback: 
 *		      Callback der nach Oeffnen des Menues aufgerufen wird. Rest wie bei onShowing.
 *        - [[int] function] fnCheckVisibility:
 *            Funktion die fuer Sichtbarkeitschecks der Eintraege aufgerufen wird.
 *            Uebergebene Parameter:
 *              [object] obj_by: Objekt auf das das Kontextmenü geoeffnet worden ist
 *              [string] identifier: Identifier des jeweiligen Menueeintrag.
 *            Moegliche Rueckgabewerte:
 *              0: Eintrag normal sichtbar.
 *              1: Eintrag wird deaktiviert.
 *              2: Eintrag wird versteckt.
 *        - [bool] allowIcons:
 *            Falls true, zeigt Icons im Menue an.
 */

//:_.
const DIR_Right = 0, DIR_Left = 1;

class _ContextMenuEntry {
	constructor(topMenu, label, id, clickHandler, subMenu, langpre, options = {}) {
		this.label = Locale(label, langpre);
		this.id = CTX_MENUITEM_ID_COUNTER++;
		this.clickHandler = clickHandler;
		this.subMenu = subMenu;
		this.topMenu = topMenu;
		this.options = options;
		
		if(this.subMenu)
			this.subMenu.submenu = true;
		
		this.disabled = false;
		this.visible = true;
	}

	addEntryToObject(obj, target) {
		if(this.topMenu.getOption("fnCheckVisibility")) {
			var state = this.topMenu.getOption("fnCheckVisibility")(target, this.options.identifier);
			if(!state) {
				this.disabled = false;
				this.visible = true;
			}
			if(state == 1)
				this.disabled = true;
			if(state == 2)
				this.visible = false;
		}
	
		if(!this.visible)
			return false;
		
		var icon = "";
		if(this.topMenu.getOption("allowIcons")) {
			var icstr = "";
			if(this.options && this.options.iconsrc) {
				if(MODULE_LANG == "xul")
					icstr = `<image src="${this.options.iconsrc}" width="20" height="20"/>`;
				else
					icstr = `<img src="${this.options.iconsrc}" />`;
			}
			
			if(MODULE_LANG == "xul")
				icon = `<vbox class="ctx-menuicon">${icstr}</vbox>`;
			else
				icon = `<div class="ctx-menuicon">${icstr}</div>`;
		}

		//Element erstellen
		if(MODULE_LANG == "xul")
			this.element = $(`<hbox class="ctx-menuitem" id="context-${this.id}">${icon}<vbox>${this.label}</vbox></hbox>`).get(0);
		else
			this.element = $(`<div class="ctx-menuitem" id="context-${this.id}">${icon}${this.label}</div>`).get(0);

		$(this.element).appendTo($(obj));
		
		//Ist Container bzw. hat Untermenue
		if(this.subMenu)
			$(this.element).addClass("ctx-container");
		
		//ggf. deaktivieren
		if(this.disabled)
			$(this.element).addClass("ctx-disabled");
		else {
			$(this.element).hover((e) => { // Untermenue ggf. schließen
				var item = $(this.topMenu.element).find(".ctx-menuitem.selected");
				if(item[0] == e.target) // Nicht das eigene Menue
					return false;

				if(item[0]) { // Untermenue gefunden
					this.topMenu.getEntryById(parseInt(item.attr("id").replace(/context-/, ""))).hideMenu();
					$(this.topMenu.element).focus(); // Fokus wieder auf dieses Menue setzen
				}

				$(this.topMenu.element).find(".ctx-menuitem.selected").removeClass("selected");
			},function() {});
		
			if(!this.subMenu) {
				$(this.element).click((e) => {
					this.clickHandler(target, e.target, this);
					if($(".contextmenu").prop("contextmenu_obj"))
						$(".contextmenu").prop("contextmenu_obj").hideMenu();
				});
			}
			else {
				$(this.element).hover((e) => {
					if(jQuery.contains(document, this.subMenu.element))
						return;
				
					//Untermenue öffnen
					$(e.target).addClass("selected");
					
					if(MODULE_LANG == "xul")
						this.subMenu.showMenu(0, 0, target, window.screenX+$(e.target).offset().left+$(e.target).outerWidth(), window.screenY+$(e.target).offset().top, e.target, this);
					else
						this.subMenu.showMenu($(e.target).offset().left+$(e.target).outerWidth(), $(e.target).offset().top, target, 0, 0, e.target, this);
				}, function() {});
			}
		}
	}
	
	hideMenu() {
		if(!this.subMenu)
			return;
		
		this.subMenu.hideMenu();
	}
}
 
class _ContextMenu {
	constructor(onShowing, entryarray = [], langpre, options = {}) {				
		this.entries = [];
		this.showingSubMenu = 0;
		this.showing = onShowing;
		this.langpre = langpre;
		this.options = options;
		this.direction = DIR_Right;
		
		for(var i = 0; i < entryarray.length; i++) {
			var entry = entryarray[i];
			
			if(entry == "seperator")
				this.addSeperator();
			else
				this.addEntry(...entry);
		}
	}

	getOption(identifier) {
		return this.options[identifier];
	}

	addEntry(label, id, clickHandler, subMenu, options) {
		this.entries.push(new ContextMenuEntry(this, label, id, clickHandler, subMenu, this.langpre, options));
		return this.entries[this.entries.length];
	}
	clearEntries() { 
		this.entries.length = 0;
		return;
	}
	addSeperator() {
		this.entries.push(new ContextMenuEntry());
		this.entries[this.entries.length-1].seperator = true;
		return true;
	}
	getEntryById(id) {
		for(var i = 0; i < this.entries.length; i++) {
			if(this.entries[i] && this.entries[i].id == id)
				return this.entries[i];
		}
	}
	getEntryByIndex(index) {
		return this.entries[index];
	}
	bindToObj(obj, forced) {
		if(this.submenu)
			return false;

		$(obj).mouseup((e) => {
			if(e.button == 2) {
				this.showMenu(e.clientX, e.clientY, e.currentTarget, e.screenX, e.screenY);
				return !forced;
			}
			
			return true;
		});
	}
	showMenu(x, y, obj_by, screenX, screenY, menuitem, menuitemobj) { // Kontextmenü anzeigen
		this.opened_by = obj_by;
		if(!this.submenu)
			if($(".contextmenu").prop("contextmenu_obj"))
				$(".contextmenu").prop("contextmenu_obj").hideMenu();
	
		if(typeof this.showing == "function")
			this.showing(obj_by);
	
		if(MODULE_LANG == "xul") {
			this.element = $("<panel class='contextmenu'></panel>")[0];
			$(this.element).appendTo($(document.documentElement));
			this.element.openPopup();

			this.body = $("<vbox class='ctx-wrapper'></vbox>")[0];
			$(this.element).append(this.body);
			
			for(var entry in this.entries) { // Menü füllen
				if(this.entries[entry].seperator)
					$(this.body).append('<hbox class="ctx-menuseperator"></hbox>');
				else if(this.entries[entry])
					this.entries[entry].addEntryToObject(this.body, obj_by);
			}
			
			var pscr = _sc.screenmgr().screenForRect(screenX, screenY, 1, 1);
			var scx = {}, scy = {}, scwdt = {}, schgt = {};
			pscr.GetAvailRect(scx,scy,scwdt,schgt);
			if(screenX+$(this.element).outerWidth()-scx.value > scwdt.value || (menuitemobj && menuitemobj.topMenu.direction == DIR_Left)) {
				if(menuitem)
					screenX = Math.max(0, screenX-($(menuitem).outerWidth()+5+$(this.element).outerWidth()));
				else
					screenX = Math.max(0, scx.value+scwdt.value-$(this.element).outerWidth());

				this.direction = DIR_Left;
			}
			else if(!menuitem) {
				this.direction = DIR_Right;
			}

			if(screenX||screenY)
				this.element.moveTo(screenX, screenY);
			else
				this.element.moveTo(x, y+$(this.element).outerHeight());
		}
		else {
			this.element = $('<div class="contextmenu" tabindex="-1"></div>')[0];
			$(this.element).appendTo($("body"));
			$(this.element).css("left", x+"px").css("top", y+"px");
			$(this.element).css("position", "absolute");

			for(var entry in this.entries) { // Menü füllen
				if(this.entries[entry].seperator)
					$(this.element).append('<hr class="ctx-menuseperator"></hr>');
				else if(this.entries[entry])
					this.entries[entry].addEntryToObject(this.element, obj_by);
			}
		}

		this.element.contextmenu_obj = this;
		$(this.element).focus();

		$(this.element).blur(() => {
			//Neuer Fokus wird nicht sofort gesetzt, daher um 1ms verzögert prüfen
			setTimeout(() => {
				if(!$(":focus").hasClass("contextmenu"))
					this.hideMenu();
			}, 1);
		});

		if(this.getOption("post_opening_callback"))
			this.options.post_opening_callback(obj_by);
	}
	hideMenu() {
		if(!this.element)
			return;

		for(var i = 0; i < this.entries.length; i++)
			this.entries[i].hideMenu();

		$(this.element).remove();
		this.element = 0;

		$(this.opened_by).focus();
		this.opened_by = 0;
	}
}

function ContextMenu(...pars) { return new _ContextMenu(...pars); }
function ContextMenuEntry(...pars) { return new _ContextMenuEntry(...pars); }
