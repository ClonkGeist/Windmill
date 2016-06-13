var paramData = {};

var PATH_FN_DATA_JSON = _sc.chpath + "/content/modules/cide/editor/other/fnData.json";
	
var saveJson = true,
	paramDataLength = 2;

// we use this to let the data load asyncronously to the other scripts, which are initialized by hook()
window.addEventListener("load", window.loadFnData);

function loadFnData() {
	
	var jsonFile = _sc.file(PATH_FN_DATA_JSON);
	
	return Task.spawn(function*() {
		let jsonString;
		try {
			jsonString = yield OS.File.read(PATH_FN_DATA_JSON, {encoding: "utf-8"});
		}
		catch(e) {
			loadFromXmlOrigin();
		}
		paramData = JSON.parse(jsonString);
		if(!paramData)
			loadFromXmlOrigin();
	});
}

function loadFromXmlOrigin() {

	return;
	// storage
	/*var f = _sc.file(PATH_FN_DATA_ORIGIN);*/
	
	/* will die warnings nicht mehr sehen.
	if(!f.exists() || !f.isDirectory())
		return;
	
	// inspect each file on its own
	var entries = f.directoryEntries;
	
	while(entries.hasMoreElements()) {
		var entry = entries.getNext().QueryInterface(Ci.nsIFile);
		
		var s = entry.leafName.split(".");
		
		if(s[s.length - 1] == "xml") // only .xmls
			parseDocuXml(readFile(PATH_FN_DATA_ORIGIN + "/" + entry.leafName), s[0]);
	}
	
	if(saveJson) {
		writeFile(PATH_FN_DATA_JSON, JSON.stringify(paramData));
		saveJson = false;
	}
	
	err("fnData has been loaded from xml origins");*/
}

function parseDocuXml(xml, id) {
	
	paramData[id] = {};
	var data = paramData[id],
		parser = new DOMParser(),
		dom = parser.parseFromString(xml, "text/xml");
	
	var funcs = dom.getElementsByTagName("func");
	
	for(var i = 0; i < funcs.length; i++) {
	
		data.title = funcs[i].getElementsByTagName("title")[0].childNodes[0].nodeValue;
		data.returnType = funcs[i].getElementsByTagName("rtype")[0].childNodes[0].nodeValue;
		
		var params = funcs[i].getElementsByTagName("param");
		data.paramData = [];
		data.params = params.length;
		
		// save parameter information into an array
		// [p1 type, p1 name, p1 desc, p2 type, ...]
		for(var p = 0; p < params.length; p++) {
		
			var sI = p*paramDataLength;
			// some have either no type or its not declared
			if(params[p].getElementsByTagName("type")[0] &&
				params[p].getElementsByTagName("type")[0].childNodes[0])
				data.paramData[sI] = params[p].getElementsByTagName("type")[0].childNodes[0].nodeValue;
			else
				data.paramData[sI] = "";
			
			data.paramData[sI + 1] = params[p].getElementsByTagName("name")[0].childNodes[0].nodeValue;
			
			// possibly someone is interested in descrption data
			if(paramDataLength > 2)
				data.paramData[sI + 2] = params[p].getElementsByTagName("desc")[0].childNodes[0].nodeValue;
			
			if(params[p].getElementsByTagName("optional"))
				data.optional = true;
		}
		
		// get function description
		for(var p = 0; p < funcs[i].childNodes.length; p++)
			if(funcs[i].childNodes[p].tagName == "desc") {
				data.desc = $(funcs[i].childNodes[p]).text();
				break;
			}
	}
	
	/** so paramDatas will look like this:
	 * paramData[fnName]
	 * .title
	 * .returnType
	 * .desc
	 * .optional
	 * .params
	 * .paramData [p1 type, p1 name, p1 desc, p2 type, ...]
	 */
	return data;
}

var recentPositionCall = -1;

function initOCEditorBehaviour(id) {
	var session = editors[id].getSession();
	session.selection.on("changeCursor", getFunctionDetection(id, session));
	
	var fn = function() {
		var pos = session.selection.getCursor();
		
		var coords = editors[id].renderer.textToScreenCoordinates(pos.row, pos.column);
		setParamlistPosition(coords.pageX, coords.pageY);
	};
	
	session.on("changeScrollLeft", fn);
	session.on("changeScrollTop", fn);
}

var lastParamId,
	lastKey,
	paramElements = [];

hook("load", window.initParamlist);

function initParamlist() {
	
	var p = $("#paramList");
	for(var i = 0; i < 10; i++) {
		paramElements[i] = $("<span class=\"param-content\"><span>").get(0);
		var elWrapper = $("<span class=\"param-wrapper\"><span>");
		p.append(elWrapper.get(0));
		elWrapper.append(paramElements[i]);
		
		$(paramElements[i]).html(
				"<span class=\"param-ptype\"></span>"+
				"<span class=\"param-pname\"></span>");
		
		if(i)
			elWrapper.prepend(", ");
	}
	p.prepend("(")
	
	// paramElements[10] -> title
	paramElements[i] = $("<span class=\"param-title\"><span>").get(0);
	p.prepend(paramElements[i]);i++;
	
	// space inbetween
	p.prepend(" ");
	
	// paramElements[11] -> returnType
	paramElements[i] = $("<span class=\"param-rtype\"></span> ").get(0);
	p.prepend(paramElements[i]);
	
	p.append(")");
}

var paramListPositioned = false;

function updateParamlist(key, paramId) {
	if(!getConfigData("Scripteditor", "ParameterList")) {
		hideParamlist();
		return false;
	}
	
	if(key == lastKey && paramId == lastParamId)
		return true;
	
	var data = paramData[key];
	
	if(!data)	{
		hideParamlist();
		return false;
	}
	
	lastKey = key;
	lastParamId = paramId;
	
	// apply array structure param id of the focussed parameter
	
	$("#paramList").find(".param-pfocussed").removeClass("param-pfocussed");
	
	for(var i = 0; i < 10; i++) {
		if(i == paramId)
			$(paramElements[i]).addClass("param-pfocussed");
		
		if(!data.paramData[i*2]) {
			paramElements[i].parentNode.style.display = "none";
			continue;
		}
		paramElements[i].parentNode.style.display = "initial";
		paramElements[i].children[0].innerHTML  = data.paramData[i*2] || "";
		paramElements[i].children[1].innerHTML  = data.paramData[i*2 + 1] || "";
	}
	
	paramElements[10].innerHTML  = data.title;
	paramElements[11].innerHTML  = data.returnType;
	
	showParamlist();
}

function setParamlistPosition(x, y) {
	if(lastParamId !== undefined) {
		var dim = document.getElementById("paramList").getBoundingClientRect();
		var offset = paramElements[lastParamId].getBoundingClientRect().width;
		var x = (x - offset/2);
		if(x - 40 < 0)
			x = 40;
		
		$("#paramList").css("left", x + "px");
		
		dim = document.getElementById("paramList").getBoundingClientRect();
		$("#paramList").css("top", (y - dim.height) + "px");
	}
	else {
		$("#paramList").css("left", x + "px");
		$("#paramList").css("top", y + "px");
	}
}

var displayParamlist = false;

function hideParamlist() {
	$("#paramList").css("visibility", "hidden");
	
	lastKey = undefined;
	lastParamId = undefined;
}

function showParamlist() {
	$("#paramList").css("visibility", "visible");
}

var CALL_COUNT = 0,
	currentCall;

function getFunctionDetection(id, session) {
	return function() {
		window.requestAnimationFrame(
		function() {
			// save this, to break if another call has already been fired while this one is still running
			// check for infinity value? :/
			CALL_COUNT++;
			initialCallCount = CALL_COUNT;
			var pos = editors[id].selection.getCursor(),
				initialRow = pos.row,
				initialCol = pos.column;
			
			var token = session.getTokenAt(pos.row, pos.column), 
				level = 0, // bracket level
				fBreak = false,
				parameterId = 0;
			
			if(!token || !session.selection.isEmpty()) {
				hideParamlist();
				return;
			}

			while(pos.column || pos.row) {
				
				// another function call increased initial call count value?
				if(initialCallCount != CALL_COUNT)
					break;

				switch (token.type) {
					case "statement-ending": // ;
						hideParamlist();
						fBreak = true;
						break;
					
					case "paren.rparen":
						if(/^\)+$/.test(token.value))
							level += pos.column - token.start;
						break;
					
					case "paren.lparen":
						if(/^\(+$/.test(token.value))
							level -= pos.column - token.start;
						break;
					
					case "param-divide": // ,
						if(!level)
							parameterId++;
						break;
					
					case "support.function": // functionname
						if(level == -1)	{
							// move into another execution stack
							setTimeout(function() {
								updateParamlist(token.value, parameterId);
								var coords = a_E.renderer.textToScreenCoordinates(initialRow, initialCol);
								setParamlistPosition(coords.pageX, coords.pageY);
							}, 0);
							fBreak = true;
						}
						break;
				}
				
				// loop control
				if(fBreak)
					break;
				
				// next position
				if(token.start)
					pos.column = token.start;
				else {
					pos.row--;
					pos.column = session.getLine(pos.row).length;
				}
				
				// get new token
				token = session.getTokenAt(pos.row, pos.column);
				
				if(!token)	{
					hideParamlist();					
					break;
				}
			}
		});
	};
}