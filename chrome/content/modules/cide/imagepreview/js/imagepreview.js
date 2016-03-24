var canvasArray = new Array();

var __iP = new imagePreview(document.getElementById("wrapper"));

function TabManager() { return __iP._sessions; }
function alternativeActiveId() { return __iP.activeSession.tabId; }

function imagePreview(wrapper) {
	
	var _ref = this;
	
	this._sessions = new Array();
	
	this.initSession = function(tabId) {
		
		this._sessions[tabId] = new this.Session(tabId);
		
		return this._sessions[tabId];
		/*
		if(!this.activeSession)
			showDeckItem(tabId);*/
	};
	
	this.Session = function(tabId) {
		this.tabId = tabId;
		this.zoomLevel = 1.0;
		
		this.loadImage = function(file, imageElement) {
			this.f = file;
			this.path = file.path;
			
			if(!imageElement)
				return;
			
			var session = this;
			
			this.imgEl = imageElement;
			
			imageElement.addEventListener("load", function() {
				session.imageWidth = this.naturalWidth;
				session.imageHeight = this.naturalHeight;
				
				session.zoom(0);
				
				session.updatePosition();
			});
			
			if(OS_TARGET == "WINNT")
				imageElement.src = "file://"+file.path.replace(/\\/gi, "/");
			else
				imageElement.src = "file://"+file.path;

			$(imageElement).mousemove(function(e) {
				var rect = this.getBoundingClientRect();
				var mx = e.clientX - rect.left, my = e.clientY - rect.top;
			});
			
			this.$p = $(this.imgEl.parentNode);
			
			this.$p.height(this.imageHeight + "px");
			this.$p.width(this.imageWidth + "px");
		};
		
		this.setBackground = function(mode) {
		
			if(mode != "light" || mode != "dark" || mode != "transparent")
				return;
			
			this.background = mode;
		};
		
		this.setBackground("light");
		
		this.zoom = function(delta) {
			
			var imgPos = this.$p.get(0).getBoundingClientRect();
			
			// calculate recent midpoint of view, relative to image offset
			var x = $(window).width()/2 - this.$p.get(0).offsetLeft + _ref.wrapper.scrollLeft;
			var y = $(window).height()/2 - this.$p.get(0).offsetTop + _ref.wrapper.scrollTop;
			
			var newX, newY;
			
			if(delta > 0) {
				this.zoomLevel *= 2;
				newX = x*2;
				newY = y*2;
			}
			else if(delta < 0) {
				this.zoomLevel /= 2;
				newX = x/2;
				newY = y/2;
			}
			
			// cap at 50%;
			if(this.zoomLevel < 0.5)
				this.zoomLevel = 0.5;
			else if(this.zoomLevel > 16)
				this.zoomLevel = 16;
			
			this.actualWidth = this.imageWidth * this.zoomLevel;
			this.actualHeight = this.imageHeight * this.zoomLevel;
			
			// apply zoom
			this.$p.height(this.actualHeight + "px");
			this.$p.width(this.actualWidth + "px");
			
			this.updatePosition();
			this.updateGrid();
			
			// scroll to calculated midpoint
			_ref.wrapper.scrollLeft += newX - x;
			_ref.wrapper.scrollTop += newY - y;
		};
		
		this.updatePosition = function() {
			
			if($(_ref.wrapper).width() < this.$p.width())
				this.$p.get(0).style.left = 0;
			else {
				this.$p.get(0).style.left = (($(_ref.wrapper).width() - this.$p.width())/2) + "px";
			}
			
			if($(_ref.wrapper).height() < this.$p.height())
				this.$p.get(0).style.top = 0;
			else {
				this.$p.get(0).style.top = (($(_ref.wrapper).height() - this.$p.height())/2) + "px";
			}
		};
		
		this.startRectDraw = function(x, y) {
			if(!this.rect) {
				this.rect = $("<div class=\"drawn-rect\"></div>").get(0);
				$(this.imgEl.parentNode).append(this.rect);
			}
			
			var pOffset = this.$p.offset();
			
			this.rectStartX = x - pOffset.left;
			this.rectStartY = y - pOffset.top;
			
			if(this.rectStartX < 0)
				this.rectStartX = 0;
			
			if(this.rectStartY < 0)
				this.rectStartY = 0;
			
			// also apply them to pixel grid
			this.rectStartX = Math.round(this.rectStartX/this.zoomLevel);
			this.rectStartY = Math.round(this.rectStartY/this.zoomLevel);
			
			// snap coords when
			// closer than 30% to grid
			if(this.snapToGrid) {
				var fx = this.rectStartX / this.gradSpaceX, ix = Math.round(fx),
					fy = this.rectStartY / this.gradSpaceY, iy = Math.round(fy);
				
				if(Math.abs(fx - ix) < 0.3)
					this.rectStartX = ix*this.gradSpaceX;
				
				if(Math.abs(fy - iy) < 0.3)
					this.rectStartY = iy*this.gradSpaceY;
			}
			
			this.rectX = this.rectStartX;
			this.rectY = this.rectStartY;
			
			
			$(this.rect).css({
				"left": this.rectStartX/this.imageWidth*100 + "%", 
				"top": this.rectStartY/this.imageHeight*100 + "%"
			});
			
			// reset position
			$(this.rect).width(0);
			$(this.rect).height(0);
			this.rectWidth = 0;
			this.rectHeight = 0;
			
			// set drawing indicator
			this.isDrawing = true;
			var session = this;
			
			var fn = function() {
				session.drawRect();
				
				if(session.isDrawing)
					window.requestAnimationFrame(fn);
			};
			
			window.requestAnimationFrame(fn);
		};
		
		this.drawRect = function() {
			var pOffset = this.$p.offset();
			
			// set relative to image container
			var x = this._rectX,
				y = this._rectY;
			
			x = x - pOffset.left;
			y = y - pOffset.top;
			
			// cap them to not extend over the image
			if(x + this.rectStartX > this.actualWidth)
				x = this.actualWidth;
			else if(x < 0)
				x = 0;
			
			if(y + this.rectStartY > this.actualHeight)
				y = this.actualHeight;
			else if(y < 0)
				y = 0;
			
			// also apply them to the pixel ratio
			x = Math.round(x/this.zoomLevel);
			y = Math.round(y/this.zoomLevel);
			
			// snap coords when
			// closer than 30% to grid
			if(this.snapToGrid) {
				var fx = x / this.gradSpaceX, ix = Math.round(fx),
					fy = y / this.gradSpaceY, iy = Math.round(fy);
				
				if(Math.abs(fx - ix) < 0.3) {
					var newX = ix*this.gradSpaceX;
					if(newX != this.rectStartX)
						x = newX;
				}
				
				if(Math.abs(fy - iy) < 0.3) {
					var newY = iy*this.gradSpaceY;
					if(newY != this.rectStartY)
						y = newY;
				}
			}
			
			this.rectWidth = Math.abs(x - this.rectStartX);
			this.rectHeight = Math.abs(y - this.rectStartY);
			
			if(x < this.rectStartX) {
				this.rectX = this.rectStartX - this.rectWidth;
				$(this.rect).css("left", this.rectX/this.imageWidth*100 + "%");
			}
			else {
				this.rectX = this.rectStartX;
				$(this.rect).css("left", this.rectStartX/this.imageWidth*100 + "%");
			}
			
			if(y < this.rectStartY) {
				this.rectY = this.rectStartY - this.rectHeight;
				$(this.rect).css("top", this.rectY/this.imageHeight*100 + "%");
			}
			else {
				this.rectY = this.rectStartY;
				$(this.rect).css("top", this.rectStartY/this.imageHeight*100 + "%");
			}
			
			$(this.rect).width(this.rectWidth/this.imageWidth*100 + "%");
			$(this.rect).height(this.rectHeight/this.imageHeight*100 + "%");
			
			this.updateSliceDisplay();
		};
		
		this.updateSliceDisplay = function() {
			$("#slice-display").html(
				this.rectX + ", " +
				this.rectY + ", " +
				this.rectWidth + ", " +
				this.rectHeight
			);
		};
		
		this.stopRectDraw = function() {
			this.isDrawing = false;
		};
		
		this.removeImage = function() {
			$("#wrapper-"+tabId).remove();
		};
		
		// grid
		this.showGrid = function() {
			if(!this.grid1) {
				this.grid1 = $("<div class=\"grid\"></div>").get(0);
				$(this.imgEl.parentNode).append(this.grid1);
			}
			
			if(!this.grid2) {
				this.grid2 = $("<div class=\"grid\"></div>").get(0);
				$(this.imgEl.parentNode).append(this.grid2);
			}
			
			$(this.grid1).show();
			$(this.grid2).show();
			
			this.updateGrid();
			this.gridvisible = true;
		};
		
		this.hideGrid = function() {
			$(this.grid1).hide();
			$(this.grid2).hide();
			
			this.gridvisible = false;
		};
		
		this.gridIsShown = function() {
			return this.gridvisible;
		};
		
		this.setGradientSpacing = function(x, y) {
			if(x) 
				this.gradSpaceX = x;
			
			if(y)
				this.gradSpaceY = y;
			
			this.updateGrid();
		};
		
		this.doGradientXSpacing = function(v) {
			if(this.gradSpaceX === 1)
				return this.gradSpaceX;
			
			this.gradSpaceX += v;
			
			this.updateGrid();
			return this.gradSpaceX;
		};
		
		this.doGradientYSpacing = function(v) {
			if(this.gradSpaceY === 1)
				return this.gradSpaceY;
			
			this.gradSpaceY += v;
			
			this.updateGrid();
			return this.gradSpaceY;
		};
		
		this.getGradientXSpacing = function() {
			return this.gradSpaceX;
		};
		
		this.getGradientYSpacing = function() {
			return this.gradSpaceY;
		};
		
		this.gradSpaceX = 16; // clonk dimensions
		this.gradSpaceY = 20;
		this.snapToGrid = false;
		
		this.updateGrid = function() {
			if(this.gradSpaceX < 2 || this.gradSpaceY < 2)
				return false
			
			var x = this.gradSpaceX*this.zoomLevel,
				y = this.gradSpaceY*this.zoomLevel;
			
			// 0deg -> top to bottom
			$(this.grid1).css("background-image", "repeating-linear-gradient( 180deg, transparent,"+
				"transparent "+(y-1)+"px, "+this.gradientColor+" "+(y-1)+"px,"+
				this.gradientColor+" "+y+"px, transparent "+y+"px)");
			// 90deg -> left to right
			$(this.grid2).css("background-image", "repeating-linear-gradient( 90deg, transparent,"+
				"transparent "+(x-1)+"px, "+this.gradientColor+" "+(x-1)+"px,"+
				this.gradientColor+" "+x+"px, transparent "+x+"px)");
		};
		
		this.gradientColor = "rgb(45, 45, 45)";
		
		this.setGradientColor = function(str) {
			if(!str)
				str = "rgb(45, 45, 45)";
			
			this.gradientColor = str;
		};
		
		this.setSnapEnabled = function(fEnabled) {
			this.snap = fEnabled || false;
		};
	};
	
	this.getSession = function(tabId) {
		return this._sessions[tabId];
	};
	
	this.dropSession = function(tabId) {
		this._sessions[tabId].removeImage();
		this._sessions[tabId] = null;
	};
	
	this.displaySession = function(tabId) {
		
		if(this.activeSession) {
			$(wrapper).removeClass("appearance-"+this.activeSession.background);
			$("#wrapper-"+this.activeSession.tabId).removeClass("visible");
		}
		
		this.activeSession = this._sessions[tabId];
		
		$(wrapper).addClass("appearance-"+this.activeSession.background);
		$("#wrapper-"+this.activeSession.tabId).addClass("visible");
		
		setBackgroundUI(this.activeSession.background);
		
		if(this.activeSession.snap != $("#snap-to-grid").hasClass("enabled"))
			$("#snap-to-grid").toggleClass("enabled");
		
		$("#-x").val(this.activeSession.gradSpaceX + "px");
		
		$("#-y").val(this.activeSession.gradSpaceY + "px");
	};
	
	this.setBackground = function(mode) {
		
		if(mode != "light" && mode != "dark" && mode != "transparent")
			return;
		
		if(this.activeSession)
			this.activeSession.background = mode;
		
		$(wrapper).removeClass("appearance-"+this.background);
		$(wrapper).addClass("appearance-"+mode);
		
		this.background = mode;
	};
	 
	if(!wrapper)
			wrapper == "body";
	
	this.wrapper = wrapper;
	
	$(wrapper).mousewheel(function(e) {
		
		// zoom
		if(e.ctrlKey) {
			_ref.activeSession.zoom(e.deltaY);
				
			e.preventDefault();
			e.stopPropagation();
		}
		// horizontal scroll
		else if(e.altKey) {
			e.preventDefault();
			e.stopPropagation();
		}
	});
	
	$(wrapper).mousemove(function(e) {
		if(!_ref.activeSession)
			return;
		
		_ref.activeSession._rectX = e.clientX;
		_ref.activeSession._rectY = e.clientY;
	});
	
	$(wrapper).mousedown(function(e) {
		if(!_ref.activeSession)
			return;
		
		_ref.activeSession.startRectDraw(e.clientX, e.clientY);
	});
	
	$(wrapper).mouseup(function(e) {
		if(!_ref.activeSession)
			return;
		
		_ref.activeSession.stopRectDraw();
	});
	
	$("#snap-to-grid").click(function() {
		$(this).toggleClass("enabled");
		_ref.activeSession.setSnapEnabled($(this).hasClass("enabled"));
	});
	
	// background modi
	$("#bg-light").click(function() {
		__iP.setBackground("light");
		setBackgroundUI("light", wrapper);
	});
	
	$("#bg-dark").click(function() {
		__iP.setBackground("dark");
		setBackgroundUI("dark", wrapper);
	});
	
	$("#bg-transparent").click(function() {
		__iP.setBackground("transparent");
		setBackgroundUI("transparent", wrapper);
	});
	
	// grid options	
	$("#show-grid").click(function() {
		if(_ref.activeSession.gridIsShown())
			_ref.activeSession.hideGrid();
		else
			_ref.activeSession.showGrid();
	});
	
	$("#grid-increment-x").click(function() {
		$("#-x").val(_ref.activeSession.doGradientXSpacing(1) + "px");
	});
	
	$("#grid-decrement-x").click(function() {
		$("#-x").val(_ref.activeSession.doGradientXSpacing(-1) + "px");
	});
	
	$("#grid-increment-y").click(function() {
		$("#-y").val(_ref.activeSession.doGradientYSpacing(1) + "px");
	});
	
	$("#grid-decrement-y").click(function() {
		$("#-y").val(_ref.activeSession.doGradientYSpacing(-1) + "px");
	});
	
	$("#-x").blur(function() {
		var v = $(this).val();
		
		var unit;
		
		// split where numbers and units come together
		for(var i = 0; i < v.length; i++)
			if(isNaN(parseInt(v.charAt(i))))
				break;
		
		unit = v.substr(-1, i - 1);
		v = parseFloat(v.substr(0, i));
		
		// if invalid input return to old value
		if(!v) {
			$(this).val(_ref.activeSession.getGradientXSpacing() + "px");
			return;
		}
		
		// calculate percentage into image pixels
		if(unit == "%")
			v = Math.round(_ref.activeSession.imageWidth/100*cap(v, 2, 100));
		
		_ref.activeSession.setGradientSpacing(v);
		$(this).val(v + "px");
	});
	
	$("#-y").blur(function() {
		var v = $(this).val();
		
		var unit;
		
		// split where numbers and units come together
		for(var i = 0; i < v.length; i++)
			if(isNaN(parseInt(v.charAt(i))))
				break;
		
		unit = v.substr(-1, i - 1);
		v = parseFloat(v.substr(0, i));
		
		// if invalid input return to old value
		if(!v) {
			$(this).val(_ref.activeSession.getGradientYSpacing() + "px");
			return;
		}
		
		// calculate percentage into image pixels
		if(unit == "%")
			v = Math.round(_ref.activeSession.imageHeight/100*cap(v, 2, 100));
		
		_ref.activeSession.setGradientSpacing(0, v);
		$(this).val(v + "px");
	});
	
	$("#-x").keydown(function(e) {
		if(e.which == 13)
			this.blur();
		else if(e.which == 38) { // up
			$("#-x").val(_ref.activeSession.doGradientXSpacing(1) + "px");
			e.preventDefault();
		}
		else if(e.which == 40) { // down
			$("#-x").val(_ref.activeSession.doGradientXSpacing(-1) + "px");
			e.preventDefault();
		}
	});
	
	$("#-y").keydown(function(e) {
		if(e.which == 13)
			this.blur();
		else if(e.which == 38) { // up
			$("#-y").val(_ref.activeSession.doGradientYSpacing(1) + "px");
			e.preventDefault();
		}
		else if(e.which == 40) { // down
			$("#-y").val(_ref.activeSession.doGradientYSpacing(-1) + "px");
			e.preventDefault();
		}
	});
	
	$("#expand-grid-options").click(function(e) {
		$("#grid-options").addClass("visible");
	});
	
	$("#hide-grid-options").click(function(e) {
		$("#grid-options").removeClass("visible");
	});
}

function createCideToolbar() {}

function setBackgroundUI(tag, el) {
	$(el).removeClass (function (index, css) {
		return (css.match (/(^|\s)appearance-\S+/g) || []).join(' ');
	});
	
	$(el).addClass("appearance-"+tag);
	
	$(".bg-selected").removeClass("bg-selected");
	$("#bg-"+tag).addClass("bg-selected");
}

function cap(i, min, max) {
	if(i < min)
		return min;
	else if(i > max)
		return max;
	
	return i;
}

function loadImage(file, tabId, fShow) {
	
	$("#wrapper").append("\
		<div id=\"wrapper-"+tabId+"\" class=\"preview-wrapper\">\
				<img class=\"img-preview\" id=\"preview-"+tabId+"\"/>\
		</div>"
	);
	
	var session = __iP.initSession(tabId);
	
	session.loadImage(file, document.getElementById("preview-"+tabId));
	
	if(fShow || !$(".visible")[0])
			showDeckItem(tabId);
}

function showDeckItem(tabId) {
	$(".visible").removeClass("visible");
	$("#imgCanvas-"+tabId).addClass("visible");
	
	__iP.displaySession(tabId);

	frameUpdateWindmillTitle();
}

function removeDeckItem(tabId) {
	$("#imgCanvas-"+tabId).remove();
	
	__iP.dropSession(tabId);
}

function getReloadPars() {
	var str = "";
	for(var id in canvasArray) {
		if(canvasArray[id])
			str += id + "=" + encodeURI(canvasArray[id].f.path) + "&";
	}

	return str;
}

window.addEventListener("load", function(){
	var query = location.search.substr(1).split('&');
	if(query) {
		for(var i = 0; i < query.length; i++) {
			if(!query[i].length)
				continue;

			var split = query[i].split("=");
			loadImage((new _sc.file(decodeURI(split[1]))), parseInt(split[0]), true);
		}
	}
	
	return true;
});

function getTabData(tabid) {
	var cnv = canvasArray[tabid];
	var data = {
		file: cnv.f,
		zoom: cnv.z,
		imgdata: cnv.c.getContext('2d').getImageData(0, 0, cnv.wdt, cnv.hgt),
		wdt: cnv.wdt,
		hgt: cnv.hgt
	};
	
	return data;
}

function dropTabData(data, tabid) {
	loadImage(data.file, tabid, true);
	
	var cnv = canvasArray[tabid];
	//todo: zoom einfügen
	cnv.width = data.wdt;
	cnv.height = data.hgt;
	cnv.c.getContext('2d').putImageData(data.imgdata, 0, 0);
	
	return true;
}
