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
		if(this.options.btnleft == undefined)
			this.options.btnleft = [];
		if(this.options.btnright == undefined)
			this.options.btnright = [];
	
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
			this.options.btnleft[i] = this.addButtons(btns[i], true);
		
		return true;
	}
	setBtnRight(btns) {
		this.options.btnright = btns;
		
		for(var i = 0; i < btns.length; i++)
			this.options.btnright[i] = this.addButtons(btns[i]);

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
						preset: "cancel",
						onclick: function(e, btn, dialog) { dialog.hide(); } 
					}
					break;
				
				//OK
				case "accept":
					temp = {
						label: "$DlgBtn_Accept$",
						langpre: "",
						preset: "accept",
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

		btnobj.element = btn;
		return btnobj;
	}

	lock() {
		$(this.element).find(".main-wdialog-lockoverlay").css("background", "rgba(255,255,255,0.4)");
		$(this.element).find(".main-wdialog-wrapper").css("pointer-events", "none");
	}

	unlock() {
		$(this.element).find(".main-wdialog-lockoverlay").css("background", "rgba(255,255,255,0)");
		$(this.element).find(".main-wdialog-wrapper").css("pointer-events", "");
	}
	
	submit() {
		let found, btn = {}, buttons = this.options.btnleft.concat(this.options.btnright);
		for(var i = 0; i < buttons.length; i++)
			if((btn = buttons[i]) && btn.preset == "accept")
				break;
		try {
			$(btn.element).trigger("click");
		} catch(e) { log(e, true); }
	}

	//Dialog anzeigen
	show() {
		//Kopie erstellen
		let clone = $(".main-wdialog.draft").clone(true);
		clone.attr("data-usemodal", this.options.modal);
		clone.removeClass("draft");
		this.element = clone[0];
		if(!this.options.noEscape)
			clone.keydown((e) => {
				if(e.key == "Escape") {
					if(!e.shiftKey) {
						let found, btn = {};
						if(this.options.btnleft)
							for(var i = 0; i < this.options.btnleft.length; i++)
								if((btn = this.options.btnleft[i]) && btn.preset == "cancel")
									break;
						if(this.options.btnright && btn.preset != "cancel")
							for(var i = 0; i < this.options.btnright.length; i++)
								if((btn = this.options.btnright[i]) && btn.preset == "cancel")
									break;
						try {
							$(btn.element).trigger("click");
						} catch(e) {}
					}
					this.hide();
				}
			});

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
		
		let buttons = this.options.btnleft.concat(this.options.btnright);
		if(buttons.length) {
			$(buttons[0].element).focus();
			if(buttons.length > 1)
				for(var i = 0; i < buttons.length; i++)
					if(buttons[i] && buttons[i].preset == "cancel")
						$(buttons[i].element).focus();
		}
		
		//Modal setzen
		if(this.options.modal) {
			$("#wdialogmodal").addClass("visible");
			if(this.options.cancelOnModal)
				$("#wdialogmodal").mousedown(() => { this.hide(); });
		}

		//Callbacks
		this.execHook("show");
		if(typeof this.options.onshow == "function")
			this.options.onshow();

		return this.element;
	}
	
	updatePseudoElements() {
		let dlgelm = this.element, dlg = this;

		//Checklistbox
		function prepareChecklistboxItems() {
			$(dlgelm).find(".dlg-checklistitem").unbind("click").click(function() {
				if($(this).hasClass("disabled"))
					return;

				$(this).toggleClass('selected');
			}).each(function(e) {
				$(this).attr("tabindex", "-1");
			});
		}
		prepareChecklistboxItems();
		$(dlgelm).find(".dlg-checklistbox").off("DOMSubtreeModified").on("DOMSubtreeModified", function() {
			var height = parseInt($(this).css("max-height"));
			var elmheight = $(this).find(".dlg-checklistitem:not(.hidden)").length * $(this).find(".dlg-checklistitem:not(.hidden)").height()+2;
			if(elmheight < height)
				height = elmheight;

			height += parseInt($(this).css("padding-top")) + parseInt($(this).css("padding-bottom"));
			prepareChecklistboxItems();
			$(this).css("height", height);
			dlg.updateTextNodes();
		}).attr("tabindex", "0").unbind("keydown").keydown(function(e) {
				let preventDefault = true, active = document.activeElement;
				if($(active).parents().index(this) == -1) {
					active = $(this).children()[0];
					if(e.keyCode == 38 || e.keyCode == 40) {
						$(active).focus();
						return e.preventDefault();
					}
				}
				switch(e.keyCode) {
					case 38: //Cursor Hoch
						$(active).prev().focus();
						break;
					case 40: //Cursor Runter
						$(active).next().focus();
						break;
					case 32: //Leertaste
					case 13: //Returntaste
						$(active).trigger("click");
						break;
					default:
						preventDefault = false;
						break;
				}

				if(preventDefault)
					e.preventDefault();
			});

		//Listbox
		function prepareListboxItems() {
			$(dlgelm).find(".dlg-list-item").unbind("click").click(function() {
				if($(this).hasClass("disabled") || $(this).parent().attr("data-noselect"))
					return;

				if($(this).parents(".dlg-listbox").attr("data-multiselect"))
					$(this).toggleClass("selected");
				else {
					$(this).siblings(".selected").removeClass("selected");
					$(this).addClass('selected');
				}
			}).each(function(e) {
				$(this).attr("tabindex", "-1");
			});
		}

		$(dlgelm).find(".dlg-listbox").off("DOMSubtreeModified").on("DOMSubtreeModified", function() {
			var height = parseInt($(this).css("max-height"));
			var elmheight = $(this).find(".dlg-list-item:not(.hidden)").length * $(this).find(".dlg-list-item:not(.hidden)").height()+4;
			if(elmheight < height)
				height = elmheight;

			$(this).css("height", height);
			prepareListboxItems();
			dlg.updateTextNodes();
		}).attr("tabindex", "0").unbind("keydown").keydown(function(e) {
			let preventDefault = true, active = document.activeElement;
			if($(active).parents().index(this) == -1) {
				active = $(this).children(".dlg-list-item")[0];
				if(e.keyCode == 38 || e.keyCode == 40) {
					$(active).focus();
					return e.preventDefault();
				}
			}
			switch(e.keyCode) {
				case 38: //Cursor Hoch
					$(active).prev(".dlg-list-item").focus();
					break;
				case 40: //Cursor Runter
					$(active).next(".dlg-list-item").focus();
					break;
				case 32: //Leertaste
				case 13: //Returntaste
					$(active).trigger("click");
					break;
				default:
					preventDefault = false;
					break;
			}

			if(preventDefault)
				e.preventDefault();
		});
		$(dlgelm).find("textbox,input").each(function() {
			if(!$(this).prop("hasWindmillDialogFunctionality")) {
				$(this).keypress(function(e) {
					if(e.keyCode == 13)
						dlg.submit();
				});
				$(this).prop("hasWindmillDialogFunctionality", true);
			}
		});

		//Infobox: Error
		$(dlgelm).find(".dlg-infobox.error").hide();

		let observer = new MutationObserver(function(mutations) {
			$(mutations[0].target).show();
		});
		$(dlgelm).find(".dlg-infobox.error").each(function() {
			observer.observe(this, { childList: true });
		});

		this.updateTextNodes();
	}

	updateTextNodes(objects = $(this.element).find("description")) {
		//XUL-Description Elemente in der Breite anpassen (da sie sonst komisch overflowen)
		objects.each((index, elm) => {
			let o = $(elm).offset(), op = $(this.element).find(".main-wdialog-wrapper").offset();
			let additional = $(this.element).find(".main-wdialog-content").outerWidth()-$(this.element).find(".main-wdialog-content").width();
			let owdt = $(this.element).find(".main-wdialog-wrapper").innerWidth();
			$(elm).css("width", (owdt-(o.left-op.left)-additional)+"px");
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