class _WDialog extends WindmillObject {
	constructor(title, langpre, options = {modal: true}) {
		super();
		
		//Close-Button per default; Extra-Button-Keywords wie "close"
		this.options = options;
		this.langpre = langpre;
	
		if(title)
			this.options.title = title;
		if(this.options.modal == undefined)
			this.options.modal = true;
		if(this.options.css == undefined)
			this.options.css = { width: "450px" };
	
		this.element = 0;
	}
	setContent(content) { //Inhalt festlegen
		this.options.content = content;
	}
	setFooter(content) { //Footer-Inhalt festlegen
		this.options.footer = content;
	}
	getFooterElm() {
		return $(this.element).find(".main-wdialog-footer");
	}
	
	//Buttons hinzuf・en
	setBtnLeft(btns) {
		this.options.btnleft = btns;
	
		for(var i = 0; i < btns.length; i++)
			this.addButtons(btns[i], true);
		
		return true;
	}
	setBtnRight(btns) {
		this.options.btnright = btns;
		
		for(var i = 0; i < btns.length; i++)
			this.addButtons(btns[i]);

		return true;
	}
	
	addButtons(btnobj, fLeft) {
		if(!btnobj)
			return;
		
		var temp = 0;

		//Button-Presets
		if(typeof btnobj == "string" || (typeof btnobj == "object" && btnobj.preset)) {
			var type = btnobj;
			if(typeof btnobj == "object")
				type = btnobj.preset;
			switch(type) {
				//Abbrechen
				case "cancel":
					temp = {
						label: "$DlgBtn_Cancel$",
						langpre: "",
						onclick: function(e, btn, dialog) { dialog.hide(); } 
					}
					break;
				
				//OK
				case "accept":
					temp = {
						label: "$DlgBtn_Accept$",
						langpre: "",
						onclick: function(e, btn, dialog) { dialog.hide(); }
					}
					break;
			}
			
			//Presets ・ernehmen
			if(typeof btnobj == "string") {
				btnobj = temp;
				temp = 0;
			}
			else if(btnobj.onclick) {
				[btnobj, btnobj.clickhandler] = [temp, btnobj.onclick];
				temp = 0;
			}
		}
		
		if(typeof btnobj != "object")
			return;
	
		if(!this.element)
			return;
		
		//Buttoncontainer ausw臧len
		var elm = $(this.element).find(".main-wdialog-btnright");
		if(fLeft)
			elm = $(this.element).find(".main-wdialog-btnleft");
		
		//Button-Text setzen
		var blangpre = btnobj.langpre;
		if(!blangpre && blangpre !== "")
			blangpre = this.langpre;
		var btn = $('<button class="main-wdialog-button" label="'+Locale(btnobj.label, blangpre)+'" />');
		if(btnobj.id)
			btn.attr("id", btnobj.id);
		
		//Click-Handler
		let _this = this;
		let bindfunc = function(fn, fn2) {
			btn.on("command", (e) => { 
				try {
					if(fn.isGenerator()) {
						_this.lock();
						Task.spawn(function*() {
							yield* fn(e, e.target, _this);
							if(fn2) {
								if(fn2.isGenerator())
									yield* fn2(e, e.target, _this);
								else
									fn2(e, e.target, _this);
							}
							_this.unlock();
						});
					}
					else
						fn(e, e.target, _this); 
				} catch(err) { 
					log(err, true); 
					log(err.stack, true);
					_this.hide();
				} 
			});
		}
		if(btnobj.clickhandler)
			bindfunc(btnobj.clickhandler, btnobj.onclick);
		if(btnobj.onclick && (!btnobj.clickhandler || !btnobj.clickhandler.isGenerator()))
			bindfunc(btnobj.onclick);	

		//Butonn hinzuf・en
		btn.appendTo(elm);
		return btn;
	}

	lock() {
		$(this.element).find(".main-wdialog-lockoverlay").css("background", "rgba(255,255,255,0.4)");
		$(this.element).find(".main-wdialog-wrapper").css("pointer-events", "none");
	}

	unlock() {
		$(this.element).find(".main-wdialog-lockoverlay").css("background", "rgba(255,255,255,0)");
		$(this.element).find(".main-wdialog-wrapper").css("pointer-events", "");
	}

	//Dialog anzeigen
	show() {
		//Kopie erstellen
		var clone = $(".main-wdialog.draft").clone(true);
		clone.attr("data-usemodal", this.options.modal);
		clone.removeClass("draft");
		this.element = clone.get(0);
		
		//CSS-Einstellungen ・ernehmen
		if(this.options.css)
			clone.find(".main-wdialog-wrapper").css(this.options.css);

		//Titel setzen
		clone.find(".main-wdialog-title").text(Locale(this.options.title, this.langpre));
		//TODO: Controls (> schlieﾟen)
		
		if(this.options.simple) {
			clone.find(".main-wdialog-content").remove();
			clone.find(".main-wdialog-footer").remove();
			clone.find(".main-wdialog-head").attr("flex", "1");
			clone.find(".main-wdialog-head").attr("align", "center");
			clone.find(".main-wdialog-head").attr("pack", "center");
			clone.find(".main-wdialog-head").find("spacer").remove();
		}
		else {
			//Inhalt setzen und Buttons hinzuf・en
			clone.find(".main-wdialog-content").html(Locale(this.options.content, this.langpre));
			if(this.options.footer) {
				clone.find(".main-wdialog-footer").html(Locale(this.options.footer, this.langpre));
			}
			else {
				if(this.options.btnleft)
					this.setBtnLeft(this.options.btnleft);
				if(this.options.btnright)
					this.setBtnRight(this.options.btnright);
			}
			
			this.updatePseudoElements();
		}
		
		clone.appendTo($("#mainstack"));
		$(this.element).focus();
		
		//Modal setzen
		if(this.options.modal) {
			$("#wdialogmodal").addClass("visible");
			if(this.options.cancelOnModal)
				$("#wdialogmodal").mousedown(() => { this.hide(); });
		}

		//XUL-Description Elemente in der Breite anpassen (da sie sonst komisch overflowen)
		clone.find("description").each(function() {
			var o = $(this).offset(), op = clone.find(".main-wdialog-wrapper").offset();
			var additional = clone.find(".main-wdialog-content").outerWidth()-clone.find(".main-wdialog-content").width();
			var owdt = clone.find(".main-wdialog-wrapper").innerWidth();
			$(this).css("width", (owdt-(o.left-op.left)-additional)+"px");
		});

		//Callbacks
		this.execHook("show");
		if(typeof this.options.onshow == "function")
			this.options.onshow();

		return this.element;
	}
	
	updatePseudoElements() {
		//Checklistbox
		var clickfn = function() {
			if($(this).hasClass("disabled"))
				return;

			$(this).toggleClass('selected');
		}
		$(this.element).find(".dlg-checklistitem").unbind("click").click(clickfn);
		$(this.element).find(".dlg-checklistbox").off("DOMSubtreeModified").on("DOMSubtreeModified", function() {
			var height = parseInt($(this).css("max-height"));
			var elmheight = $(this).find(".dlg-checklistitem:not(.hidden)").length * $(this).find(".dlg-checklistitem:not(.hidden)").height()+2;
			if(elmheight < height)
				height = elmheight;

			height += parseInt($(this).css("padding-top")) + parseInt($(this).css("padding-bottom"));
			$(this).css("height", height);
			$(this).find(".dlg-checklistitem").unbind("click").click(clickfn);
		});

		//Listbox
		var clickfn2 = function() {
			if($(this).hasClass("disabled") || $(this).parent().attr("data-noselect"))
				return;

			if($(this).parents(".dlg-listbox").attr("data-multiselect"))
				$(this).toggleClass("selected");
			else {
				$(this).siblings(".selected").removeClass("selected");
				$(this).addClass('selected');
			}
		}
		$(this.element).find(".dlg-list-item").unbind("click").click(clickfn2);
		$(this.element).find(".dlg-listbox").off("DOMSubtreeModified").on("DOMSubtreeModified", function() {
			var height = parseInt($(this).css("max-height"));
			var elmheight = $(this).find(".dlg-list-item:not(.hidden)").length * $(this).find(".dlg-list-item:not(.hidden)").height()+4;
			if(elmheight < height)
				height = elmheight;

			$(this).css("height", height);
			$(this).find(".dlg-list-item").unbind("click").click(clickfn2);
		});
		
		//Infobox: Error
		$(this.element).find(".dlg_infobox.error").hide();
		
		var observer = new MutationObserver(function(mutations) {
			$(mutations[0].target).show();
		});
		$(this.element).find(".dlg_infobox.error").each(function() {
			observer.observe(this, { childList: true });
		});
	}
	
	//Dialog verstecken
	hide() {		
		if(!this.element)
			return;
		
		$(this.element).remove();
		this.element = undefined;
		
		if($("#wdialogmodal").hasClass("visible") && !$('.main-wdialog[data-usemodal="true"]')[0]) {
			$("#wdialogmodal").removeClass("visible");
			if(this.options.cancelOnModal)
				$("#wdialogmodal").unbind("click"); 
		}
		return true;
	}
}

function WDialog(...pars) { return new _WDialog(...pars); }