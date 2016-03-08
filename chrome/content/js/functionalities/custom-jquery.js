
/*
var tooltipEl,
	tooltipTimeout;

$.fn.tooltip = function(desc, lang, duration) {
	
	var _self = this;
	
	if(!duration)
		duration = 300; // ms
	
	this.mouseover(function(e) {
		
		clearTooltip();
		
		setTimeout(function() {
			var el = $("<"+(lang === "html"?"div style=\"background-color: black\"":"panel")+"></"+(lang == "html"?"div":"panel")+">").get(0);
			
			$(_self).append(el);
			
			tooltipEl = el;
			
			$(el).css(toolTipStyle).text(desc);
			
			var x = $(_self).get(0).offsetLeft,
				y = $(_self).get(0).offsetTop,
				w = $(_self).get(0).offsetWidth,
				h = $(_self).get(0).offsetHeight;
			err((lang === "html"?"div style=\"background-color: black\"":"panel"));
			// if its too near to the upper border
			if(y < el.offsetHeight)
				y += h; // then show it at the bottom
			else // otherwise lift it so the original element is still visible
				y -= el.offsetHeight;
			
			// center the x position relative to the original element
			x += (w/2 - el.offsetWidth/2);
			err(el);
			
			// if its too close to the left border
			if(x - el.offsetWidth < 0)
				x = 0;
			// same thing with right border
			//else if(x + $(el).get(0).offsetWidth > $(document).width())
			//	x = $(document).width() - $(el).get(0).offsetWidth;
			$(el).css("top", y + "px");
			$(el).css("left", x + "px");
		}, duration);
	});
	
	this.mouseleave(function(e) {
		clearTooltip();
	});
	
	return this;
};

function clearTooltip() {
	clearTimeout(tooltipTimeout);
	$(tooltipEl).remove();
}



var toolTipStyle = {
	"position": "absolute",
	"background-color": "rgb(80, 80, 80)",
	"color": "whitesmoke",
	"font-family": "\"Segoe UI\", Verdana, sans-serif",
	"z-index": "30",
	"width": "auto",
	"padding": "1px 5px",
	"transition": "opacity 0.3s"
};*/