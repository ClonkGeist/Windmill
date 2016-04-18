
// stylesheet-definitionlist
var ssDefs

function generateCssFile(index) {
	reloadStylesheet(ssDefs[index].fScss, ssDefs[index])
}

hook("load", function() {
	var f = _sc.file(_sc.chpath+"/styles/scss/stylesheet_defs.json")

	if(!f.exists())
		return log("SS Obsever: styleshett deflist not found")
	
	var str = readFile(f)
	
	if(!str || !str.length)
		return log("SS Obsever: styleshett deflist not viable")
	
	ssDefs = JSON.parse(str)
	
	for(var i in ssDefs) {
		let def = ssDefs[i]
		def.scss = formatPath(def.scss)
		def.cssTarget = formatPath(def.cssTarget)
		
		def.index = i
		let s = def.scss.split("/")
		def.leafName = s[s.length - 1]
		def.fScss = _sc.file(_sc.chpath+"/styles/scss/" + def.scss)
		def.children = []
		
		// ensure such file exists and get last modified time
		if(def.fScss.exists())
			def.modified = def.fScss.lastModifiedTime
		else
			def.fScss = false
		
		if(def.observe && def.observe !== "main" && !getModuleDef(def.observe))
			log("To observe module definition hasn't been found: " + def.observe);
		
		$("#ss-deflist").append("<row id=\"ss-def-"+i+"\" align=\"center\">"+
				"<label value=\""+def.leafName+"\" flex=\"1\" />"+
				"<label value=\""+(def.observe || "Global")+"\" flex=\"1\"/>"+
				"<label class=\"update-date\" value=\"unknown\" flex=\"1\"/>"+
				"<button label=\"Generate CSS File\" onclick=\"generateCssFile("+i+")\" />"+
			"</row>")
	}
	
	for(var i in ssDefs)
		// add as a child to libraries to be updated too
		if(ssDefs[i].require)
			ssDefs[i].require.split("|").forEach(v => {
				getSSDefByName(v).children.push(ssDefs[i])
			})
	
	setInterval(function() {
		for(let i = 0; i < ssDefs.length; i++) {
			let f = _sc.file(_sc.chpath+"/styles/scss/" + ssDefs[i].scss)
			if(!f.exists())
				continue
			if(f.lastModifiedTime !== ssDefs[i].modified) {
				log("Sass: Scss-File modification detected: " + (ssDefs[i].name || ssDefs[i].index))
				reloadStylesheet(f, ssDefs[i])
				ssDefs[i].modified = f.lastModifiedTime
			}
		}
	}, 1500)
})

function getSSDefByName(name) {
	
	for(let i = 0; i < ssDefs.length; i++)
		if(ssDefs[i].name === name)
			return ssDefs[i]
	
	return false
}

function alreadySubject(index) {
	for(let i = 0; i < subjects.length; i++)
		if(subjects[i].index === index)
			return true
	
	return false
}

Sass.options({
	precision: 3,
	comments: false,
	//style: Sass.style.compressed
})

function reloadStylesheet(fScss, def) {
	log("Sass: trying to reload definition '" + (def.name || def.index ) + "'")
	if(def.children && def.children.length)
		def.children.forEach(child => reloadStylesheet(child.fScss, child))
	
	var module = def.observe
	
	if(!def.cssTarget) {
		// update info
		var d = new Date()
		$("#ss-def-" + def.index).find(".update-date")
			.attr("value", d.getHours() + ":" + (d.getMinutes()<10?'0':'') + d.getMinutes())
		return
	}
	
	if(def.observe === "main")
		module = _mainwindow
	else
		module = module.contentWindow
	
	var headstring = ""
	if(def.require) {
		var imports = def.require.split("|")
		for(let i = 0; i < imports.length; i++) {
			let imp = getSSDefByName(imports[i])
			if(!imp)
				log("Sass error: Required import def not found ("+imports[i]+")")
			
			let f = _sc.file(_sc.chpath+"/styles/scss/" + imp.scss)
			
			if(!f.exists())
				log("Sass error: Required import scss not found ("+imports[i]+")")
			else
				headstring += readFile(f) + "\n"
		}
	}
	Sass.compile(headstring + (readFile(fScss) || ""), function(result) {
		if(result.message) {
			log("Sass.compile() error: " + result.message)
			log(result.formatted)
			log(fScss.path);
		}
		else {
			var mdls = getModulesByName(def.observe)
			if(mdls && mdls.length) {
				var uri = _mainwindow._sc.ioserv().newURI(OS.Path.toFileURI(_sc.chpath + "/" + def.cssTarget), null, null)
				log("Sass: Write file: " + _sc.chpath + "/" + def.cssTarget)
				
				var mdls = getModulesByName(def.observe)
				mdls.forEach(m => {
					let u = m.ownerGlobal.domwu
					if(!u)
						return
					u.removeSheet(uri, u.USER_SHEET)
					writeFile(_sc.file(_sc.chpath + "/" + def.cssTarget), result.text, true)
					u.loadSheet(uri, u.USER_SHEET)
					u.redraw();
				})
			}
			else {
				log("Sass: Write file: " + _sc.chpath + "/" + def.cssTarget)
				writeFile(_sc.file(_sc.chpath + "/" + def.cssTarget), result.text, true)
			}
			
			
			// update info
			var d = new Date()
			$("#ss-def-" + def.index).find(".update-date")
				.attr("value", d.getHours() + ":" + (d.getMinutes()<10?'0':'') + d.getMinutes())
		}
	})
}