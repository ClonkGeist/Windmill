
// stylesheet-definitionlist
var ssDefs;

hook("onModuleAdd", function(mDef, modframe, id) {	
	loadModuleSheets(mDef.modulename);
});

function loadModuleSheets(moduleName) {
	for(let i in ssDefs) {
		if(ssDefs[i].observe && ssDefs[i].observe === moduleName) {
			$("#ss-deflist").append("<hbox>"+
				"<label value=\""+ssDefs[i].leafName+"\" flex=\"1\" />"+
				"<label value=\""+moduleName+"\" flex=\"1\"/>"+
				"<button label=\"Generate CSS File\" onclick=\"generateCssFile("+i+")\" />"+
				"<button label=\"Observe\" onclick=\"observeScssFile("+i+")\" />"+
			"</hbox>");
		}
	}
}

function generateCssFile(index) {
	reloadStylesheet(_sc.file(_sc.chpath+"/styles/scss/" + ssDefs[index].scss), ssDefs[index]);
}

var subjects = [];
function observeScssFile(index) {
	if(!alreadySubject(index))
		subjects.push(ssDefs[index]);
}

hook("load", function() {
	var f = _sc.file(_sc.chpath+"/styles/scss/stylesheet_defs.json");

	if(!f.exists())
		return log("styleshett deflist not found");
	
	var str = readFile(f);
	
	if(!str || !str.length)
		return log("styleshett deflist not viable");
	
	ssDefs = JSON.parse(str);
	
	for(var i in ssDefs) {
		ssDefs[i].scss = formatPath(ssDefs[i].scss);
		ssDefs[i].cssTarget = formatPath(ssDefs[i].cssTarget);
		
		ssDefs[i].index = i;
		let s = ssDefs[i].scss.split("/");
		ssDefs[i].leafName = s[s.length - 1];
		ssDefs[i].fScss = _sc.file(_sc.chpath+"/styles/scss/" + ssDefs[i].scss);
		
		// ensure such file exists and get last modified time
		if(ssDefs[i].fScss.exists())
			ssDefs[i].modified = ssDefs[i].fScss.lastModifiedTime;
		else
			ssDefs[i].fScss = false;
	}
	
	// manually add main-frame as it has no addModule-Callback
	loadModuleSheets("main");
	
	setInterval(function() {
		for(let i = 0; i < subjects.length; i++) {
			let f = _sc.file(_sc.chpath+"/styles/scss/" + subjects[i].scss);
			
			if(f.lastModifiedTime !== subjects[i].modified) {
				reloadStylesheet(f, subjects[i]);
				subjects[i].modified = f.lastModifiedTime;
			}
		}
	}, 1500);
});

function getSSDefByName(name) {
	
	for(let i = 0; i < ssDefs.length; i++)
		if(ssDefs[i].name === name)
			return ssDefs[i];
	
	return false;
}

function alreadySubject(index) {
	for(let i = 0; i < subjects.length; i++)
		if(subjects[i].index === index)
			return true;
	
	return false;
}

function reloadStylesheet(fScss, def) {
	
	if(!def.cssTarget)
		return;
	
	var headstring = "";
	if(def.require) {
		var imports = def.require.split("|");
		for(let i = 0; i < imports.length; i++) {
			let imp = getSSDefByName(imports[i]);
			if(!imp)
				log("Sass error: Required import def not found ("+imports[i]+")");
			
			let f = _sc.file(_sc.chpath+"/styles/scss/" + imp.scss);
			
			if(!f.exists())
				log("Sass error: Required import scss not found ("+imports[i]+")");
			else
				headstring += readFile(f) + "\n";
		}
	}
	Sass.compile(headstring + readFile(fScss), function(result) {
		if(result.message) {
			log("Sass.compile() error: "+ result.message);
			log(result.formatted);
		}
		else {			
			if(def.observe === "main")
				var module = _mainwindow;
			else
				var module = getModuleByName(def.observe);
			
			if(module) {
				var u = module.domwu;
				var uri = _mainwindow._sc.ioserv().newURI(OS.Path.toFileURI(_sc.chpath + "/" + def.cssTarget), null, null);
				u.removeSheet(uri, u.AGENT_SHEET);
				writeFile(_sc.file(_sc.chpath + "/" + def.cssTarget), result.text, true);
				u.loadSheet(uri, u.AGENT_SHEET);
			}
			else {
				writeFile(_sc.file(def.cssTarget), result.text, true);
			}
		}
	});
}