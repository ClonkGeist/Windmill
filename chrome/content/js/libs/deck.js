var decks = [];

// global functions
function addDeck(container, navEl, lang)
{
	decks[decks.length] = new Deck(container, navEl, lang, decks.length);
	
	return decks[decks.length - 1];
}

function togglePage(deckId, itemId)
{
	//Mittlerer Mausklick auf Tabs nicht zum Seitenwechseln benutzen (Tab blendet sich sonst beim Schliessen kurz ein)
	decks[deckId].show(itemId);
}

function closePage(event, deckId, itemId)
{
	if(event)
		event.stopPropagation();
	
	decks[deckId].detachItem(itemId);
}

function getChildPosition(el)
{
	// calc node index in parent element
	var index = 0,
		child = el;
	// TODO: Check for display property to ignore them as <deck> does
	while((child = child.previousSibling) != null)
		index ++;
	
	return index;
}

const DECK_SCROLLERUPDATERATE = 200;

// Deck functionality
class Deck extends WindmillObject {
	constructor(container, navEl, lang, id) {
		super();
		
		this.container = container;
		this.buttonContainer = navEl;
		this.buttons = [];
		
		// only html and xul allowed
		if(lang != "html")
			lang = "xul";
			
		this.lang = lang;
		
		this.id = id;
		this.previd = undefined;
		this.selectedIndex;
		this.selectedId;
		this.nextId = 0;
		
		this.items = [];
		this.deligated = [];
		this.options = [];
		
		this.element = $('<deck selectedIndex="0" flex="1"></deck>')[0];
		$(this.element).appendTo(container);
		if(lang == "xul")
			$(this.element).append(`<box flex="1" style="overflow-y: hidden">
					<description class="deck-desc" id="deck-${id}-description" style="padding: 1.5em; display: none"></description>
				</box>`);
		
			
		$(this.element).resize(() => {
			this.updateNavigation();
		});
	}
	
	updateScroller() {
		if(!this.buttonContainer)
			return;
		
		var target =  $(this.buttonContainer).parent().parent();
		var scrollL = $(this.buttonContainer).scrollLeft();
		var width = $(this.buttonContainer).width();
		var w = target.find(".deck-nav-scrollbar").width();
		var scrollW = this.buttonContainer.scrollWidth;

		target.find(".deck-nav-scrollingspace-l").css("width", scrollL/scrollW*w+"px");
		target.find(".deck-nav-scroller").css("width", width/scrollW*w+"px");

		//Scrollbuttons aktivieren/deaktivieren, wenn einer der Ränder erreicht wurde
		if(scrollL > 0)
			$(target).find(".deckbtn-scrollLeft").removeClass("deckbtn-scrollDisabled");
		else
			$(target).find(".deckbtn-scrollLeft").addClass("deckbtn-scrollDisabled");
		
		if(Math.round(scrollL+$(this.buttonContainer).outerWidth()) < scrollW)
			$(target).find(".deckbtn-scrollRight").removeClass("deckbtn-scrollDisabled");
		else
			$(target).find(".deckbtn-scrollRight").addClass("deckbtn-scrollDisabled");
	}
	
	//Navigation-Scrolling
	updateNavigation() {
		if(!this.buttonContainer)
			return;
		
		var target = $(this.buttonContainer).parent().get(0);
	
		//Buttons erstellen
		if(!$(target).find(".deckbtn-scroll").get(0)) {
			var tagName = "button";

			$(target).append('<vbox class="deckbtn-scroll deckbtn-scrollLeft" />\
							  <vbox class="deckbtn-scroll deckbtn-scrollRight" />');
			var clearfunc = function(e) { clearTimeout(parseInt($(this).attr("data-timeout"))); }
			$(target).find('.deckbtn-scrollLeft').mousedown((e) => {
				if($(e.target).hasClass("scrollDisabled"))
					return;
			
				$(this.buttonContainer).scrollLeft($(this.buttonContainer).scrollLeft()-Math.floor($(this.buttonContainer).width()/3));

				$(e.target).attr("data-timeout", setTimeout(function() {
					$(e.target).trigger("mousedown");
				}, DECK_SCROLLERUPDATERATE));
			}).mouseup(clearfunc).mouseleave(clearfunc);
			$(target).find('.deckbtn-scrollRight').mousedown((e) => {
				if($(e.target).hasClass("scrollDisabled"))
					return;
			
				$(this.buttonContainer).scrollLeft($(this.buttonContainer).scrollLeft()+Math.floor($(this.buttonContainer).width()/3));
				$(e.target).attr("data-timeout", setTimeout(function() {
					$(e.target).trigger("mousedown");
				}, DECK_SCROLLERUPDATERATE));
			}).mouseup(clearfunc).mouseleave(clearfunc);

			$(target).find('.deckbtn-scroll').mousedown((e) => {
				this.updateScroller();
			});
		}
		
		this.updateScroller();

		//Wenn nichts außerhalb vom Scrollbereich ist, Scrollbuttons verstecken
		if(Math.round($(this.buttonContainer).width()) >= this.buttonContainer.scrollWidth) {
			$(target).find(".deckbtn-scroll").addClass("deckbtn-scrollhide");
			$(target).parent().find(".deck-nav-scrollbar").addClass("deckbtn-scrollhide");
		}
		//Falls kein Scrollbutton sichtbar ist, einen anzeigen
		else if(!$(target).find(".deckbtn-scroll:not(.deckbtn-scrollhide)")[0]) {
			$(target).find(".deckbtn-scroll").removeClass("deckbtn-scrollhide");
			$(target).find(".deckbtn-scrollLeft").addClass("deckbtn-scrollDisabled");
			$(target).find(".deckbtn-scrollRight").removeClass("deckbtn-scrollDisabled");
			$(target).parent().find(".deck-nav-scrollbar").removeClass("deckbtn-scrollhide");
		}
	}
	
	checkIfLabelIsUsed(label, ignoreID) {
		for(var i = 0; i < this.options.length; i++) {
			if(i == ignoreID)
				continue;

			if(this.options[i].label == label)
				return true;
		}

		return false;
	}
	
	getModuleId(name, index) {
		for(var i = 0; i < this.items.length; i++) {
			if($(this.items[i]).attr("name") == name) {
				if(!index)
					return i;
				else
					--index;
			}
		}
		
		return -1;
	}
	
	//Wird die Funktion hier ueberhaupt noch supportet?
	desc(text, prefix) {
		$(this.element).find("#deck-"+this.id+"-description").text(Locale(text, prefix));
	}
	
	add(el, label, fDeligate = false, fCloseable, fPreventShow, options = {}) {
		var index = this.nextId;
		this.nextId++;
		
		// if not appended yet | caution: this will cause an iframe to reload
		if(el.parentNode != this.element) {
			$(el).appendTo(this.element);
			$(el).addClass("deck-"+this.id+"-item-"+index);
		}
		
		//Deck Overload fuer _sc.workpath (Workpath ueber DeckItemId)
		if(!el.contentWindow.readyState) {// && el.contentWindow._sc) {
			el.contentWindow.addEventListener("load", () => {
			var workpathov = _sc.workpath;

			el.contentWindow._sc.workpath = (data, noWorkspaceName = false) => {
				if(typeof data == "number") {
					if(this.options[data]) {
						if(this.options[data].filepath)
							data = formatPath(this.options[data].filepath);
						else if(this.options[data].file)
							data = formatPath(this.options[data].file.path);
					}
				}
				
				var ovdata = workpathov(data);
				if(noWorkspaceName)
					ovdata = ovdata.replace(/\/[^/]+$/g, "");

				return ovdata;
			}});
		}

		this.items[index] = el;
		this.options[index] = options;
		if(!this.options[index].label)
			this.options[index].label = label;
		
		if(label)
			this.addButton(label, index, fCloseable);

		if(!fPreventShow)
			this.show(index, true);
		
		// save deligate property to be accessible through an index
		this.deligated[index] = fDeligate;
		
		this.execHook("addItem", this, index);

		return index;
	}
	
	addButton(label, id, fCloseable) {
		if(this.lang == "xul") {
			var tagName = "button";
			if(this.buttonContainer.tagName.toLowerCase() == "toolbar")
				tagName = "toolbarbutton";

			var icon = "";
			if(this.options[id].icon)
				icon = '<image src="'+this.options[id].icon+'" width="22" height="22"/>';

			if(fCloseable)	{		
				$(this.buttonContainer).append(`<hbox 
					align="center" 
					class="deck-${this.id}-button-${id} deck-nav-elm">${icon}
					<description>${label}</description>
					<box class="close-button icon-x" onclick="closePage(event, ${this.id}, ${id})" />
					</hbox>`);
				
				var deckId = this.id;
				$(".deck-"+this.id+"-button-"+id).click(event => { if(event.which == 2) closePage(event, deckId, id); });
			}
			else	{
				$(this.buttonContainer).append(`<${tagName} class="deck-${this.id}-button-${id}" 
												 label="${label}" oncommand="togglePage(${this.id}, ${id}) />`);
			}
			
			this.buttons[id] = $(".deck-"+this.id+"-button-"+id)[0];
			var did = this.id;
			$(this.buttons[id]).mousedown((e) => {
				if(e.button != 1)
					togglePage(did, id);
				
				var scrollL = $(this.buttonContainer).scrollLeft();
				var width = $(this.buttonContainer).width();

				//Da .position() irgendwie auch das Offset wiedergibt?!
				var pos = $(e.target).offset().left-$(this.buttonContainer).offset().left+scrollL;

				if(width < $(e.target).outerWidth() || scrollL > pos)
					$(this.buttonContainer).scrollLeft(Math.floor(pos));
				else if(scrollL+width < pos+$(e.target).outerWidth())
					//+3 damit beim letzten Item auch bis ans Ende (wegen padding oder so) gescrollt wird.
					$(this.buttonContainer).scrollLeft(Math.floor(pos+$(e.target).outerWidth()-width+3)); 
				
				this.updateNavigation();
			});
			
			this.execHook("btnCreated", this, this.buttons[id], id);

			$(this.buttonContainer).scrollLeft(this.buttonContainer.scrollWidth);
			this.updateNavigation();
		}
		// TODO: html
	}
	
	detachItem(itemId) {
		// delete button
		$(".deck-"+this.id+"-button-"+itemId).remove();
		
		if(this.deligated[itemId]) {
			if(this.items[itemId].tagName.toLowerCase() != "iframe")
				Components.utils.reportError("Error: Cannot deligate to non iframe element");
			
			try {
				this.items[itemId].contentWindow.removeDeckItem(itemId);
			} catch(e) {
				log("Deck error at iframe deligation (removeDeckItem)", true);
				log(e, true);
			}
		}
		
		// clean up item-array
		this.items[itemId] = undefined;
		this.options[itemId] = {};
		
		// if actual object is shown we have to set another item to be shown
		if(itemId == this.selectedId) {
			var id = itemId - 1;
			while(!this.items[id]) {
				if(--id < 0)
					break;
			}
			
			if(id > -1)
				this.show(id);
			else {
				id = itemId + 1;
				while(!this.items[id]) {
					if(++id > this.items.length)
						break;
				}
				if(this.items[id])
					this.show(id);
				else
					this.showDesc();
			}
		}
		
		this.execHook("itemDetached", this, itemId);
		
		this.updateNavigation();
	}
	
	isEmpty() {
		for(var i = 0; i < this.items.length; i++)
			if(this.items[i] != undefined)
				return false;
		
		return true;
	}
	
	show(itemId, noFocus) {
		this.execHook("preShowItem", this, itemId);

		// button
		$(this.buttonContainer).find(".active").removeClass("active");
		$(this.buttonContainer).find(".deck-"+this.id+"-button-"+itemId).addClass("active");
		
		// item
		var index = getChildPosition(this.items[itemId]);
		$(this.element).attr("selectedIndex", index);
		
		[this.selectedIndex, this.previd, this.selectedId] = [index, this.selectedId, itemId];

		// deligate to iframe for custom handling
		if(this.deligated[itemId]) {
			if(this.items[itemId].tagName.toLowerCase() != "iframe")
				Components.utils.reportError("Error: Cannot deligate to non iframe");
			
			try {
				this.items[itemId].contentWindow.showDeckItem(itemId);
			} catch(e) {
				log("Deck error at iframe deligation (showDeckItem)", true);
				log(e, true);
			}
		}
		
		try {
			if(this.items[itemId].contentWindow.frameWindowTitle 
			&& this.items[itemId].contentWindow.frameWindowTitle() 
			&& this.items[itemId].contentWindow.frameWindowTitle() != -1)
				setWindowTitle(this.items[itemId].contentWindow.frameWindowTitle() + " - Windmill");
			else
				setWindowTitle("Windmill");
			
			updateChildFrameWindowFocus(this.items[itemId].contentWindow);
		} catch(e) { 
			log("Deck error at window title change", true);
			log(e, true);
		}

		this.execHook("showItem", this, itemId);
		
		if(!noFocus)
			$(this.items[itemId]).focus();
	}

	showDesc() {
		$(this.element).attr("selectedIndex", 0);
		this.selectedIndex = 0;
		this.selectedId = undefined;
	}
	
	addSpacer(fFlex) {
		if(this.lang == "xul")
			$(this.buttonContainer).append('<spacer '+(fFlex?'flex="1" ':'')+'/>');
		else
			err("addSpacer is not supported yet for html");
	}
}
