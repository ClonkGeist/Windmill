/*-- Debugging Funktionen --*/

var domWrapper;

function displayDOM(el, lang) {
	var css = `position: absolute;
	bottom: 0;
	left: 0;
	right: 0;`;
	if(!domWrapper) {
		if(lang == "xul")
			domWrapper = $('<box style="'+css+'"></box>')[0];
		else
			domWrapper = $('<div style="'+css+'"></div>')[0];
	}
	err(parseHTML(el));
	$(domWrapper).text(parseHTML(el));
}

function showObj2(obj, depth, options = {}) {
	if(depth == undefined || depth == -1)
		depth = 10;
	var fn = function(obj, indent, d) {		
		var txt = "";

		try {
			for(var key in obj) {
				if(obj instanceof Array && options.maxArraySize) {
					if(obj.length > options.maxArraySize && !isNaN(parseInt(key)))
						if(parseInt(key) >= 2 || parseInt(key) < obj.length-2) {
							if(key == "2")
								txt += indent + "[...]\n";
							
							continue;
						}
				}
				
				if(key == "top")
					continue;
				
				var v, isObj = false;

				try {
					if(typeof obj[key] === "function")
						v = "[function]";
					else if(typeof obj[key] === "object")
						isObj = true;
					else
						v = obj[key];
				}
				catch(e) {
					v = "error";
				}
				
				if(isObj && d)
					txt += indent + "[" + key + "]: \n" + fn(obj[key], indent + "        ", d - 1);
				else if(isObj)
					txt += indent + key + "[object]\n";
				else
					txt += indent + key + ": " + v + "\n";
			}
		} catch(e) { txt = "[Prevented]"; }

		return txt;
	};
	
	if(options.avoidErr)
		return fn(obj, "", depth);
	else
		err(fn(obj, "", depth));
}

function showObj3(obj) {
	function stringify(obj, replacer, spaces, cycleReplacer) {
	  return JSON.stringify(obj, serializer(replacer, cycleReplacer), spaces)
	}

	function serializer(replacer, cycleReplacer) {
	  var stack = [], keys = []

	  if (cycleReplacer == null) cycleReplacer = function(key, value) {
		if (stack[0] === value) return "[Circular ~]"
		return "[Circular ~." + keys.slice(0, stack.indexOf(value)).join(".") + "]"
	  }

	  return function(key, value) {
		if (stack.length > 0) {
		  var thisPos = stack.indexOf(this)
		  ~thisPos ? stack.splice(thisPos + 1) : stack.push(this)
		  ~thisPos ? keys.splice(thisPos, Infinity, key) : keys.push(key)
		  if (~stack.indexOf(value)) value = cycleReplacer.call(this, key, value)
		}
		else stack.push(value)

		return replacer == null ? value : replacer.call(this, key, value)
	  }
	}
	return stringify(obj, null, 4);
}