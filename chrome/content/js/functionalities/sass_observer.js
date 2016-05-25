
// stylesheet-definitionlist
var ssDefs

function generateCssFile(index) {
	reloadStylesheet(ssDefs[index].fScss, ssDefs[index])
}

function getSASSDefList() { return ssDefs; }

let snapshot;

function initializeSassObserver() {
	return Task.spawn(function*() {
		var path = _sc.chpath+"/styles/scss/stylesheet_defs.json"

		if(!(yield OS.File.exists(path)))
			return log("SS Obsever: styleshett deflist not found", false, "sass");
		
		let str = yield OS.File.read(path, { encoding: "utf-8" });
		if(!str || !str.length)
			return log("SS Obsever: styleshett deflist not viable", false, "sass")
		
		ssDefs = JSON.parse(str)

		for(let i in ssDefs) {
			let def = ssDefs[i];
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
				log("To observe module definition hasn't been found: " + def.observe, false, "sass");
		}
		
		for(let def of ssDefs)
			// add as a child to libraries to be updated too
			if(def.require)
				def.require.split("|").forEach(v => {
					getSSDefByName(v).children.push(def)
				})
		
		setInterval(function() {
			for(let i = 0; i < ssDefs.length; i++) {
				let f = _sc.file(_sc.chpath+"/styles/scss/" + ssDefs[i].scss)
				if(!f.exists())
					continue
				if(f.lastModifiedTime !== ssDefs[i].modified) {
					log("Sass: Scss-File modification detected: " + (ssDefs[i].name || ssDefs[i].index), false, "sass")
					reloadStylesheet(f, ssDefs[i])
					ssDefs[i].modified = f.lastModifiedTime
				}
			}
		}, 1500)

		snapshot = yield getSassSnapshot();
		for(let def of ssDefs) {
			if(!snapshot[def.scss] || snapshot[def.scss] < def.modified) {
				log("Sass: Scss-File modification detected: " + (def.name || def.index) + " (" + def.scss + ")", false, "sass")
				let f = _sc.file(_sc.chpath+"/styles/scss/" + def.scss)
				yield reloadStylesheet(f, def);
			}
		}
		yield createSassSnapshot();
	});
}

hook("sass-target-updated", function(def) {
	snapshot[def.scss] = def.modified;
});

function getSassSnapshot() {
	return Task.spawn(function*() {
		let content = "{}";
		try { content = yield OS.File.read(_sc.profd+"/sass-snapshot.json", { encoding: "utf-8" }); }
		catch(e) {}
		return JSON.parse(content);
	});
}

function createSassSnapshot() {
	return Task.spawn(function*() {
		let snapshot = {};
		for(let def of ssDefs)
			snapshot[def.scss] = def.modified || 0;
		OS.File.writeAtomic(_sc.profd+"/sass-snapshot.json", JSON.stringify(snapshot), { encoding: "utf-8" });
	});
}

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

var current_sass_loading_task;

function reloadStylesheet(fScss, def, options = {}, __rec) {
	let task = Task.spawn(function*() {
		if(current_sass_loading_task && !__rec) {
			log("Sass: Wait until current task is fulfilled.", false, "sass");
			yield current_sass_loading_task;
		}
		log("Sass: trying to reload definition '" + (def.name || def.index ) + "'", false, "sass")
		if(def.children && def.children.length)
			for(let child of def.children)
				yield reloadStylesheet(child.fScss, child, options, true);
		
		var module = def.observe
		
		if(!def.cssTarget) {
			// update info
			var d = new Date()
			execHook("sass-target-updated", def, d);
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
					log("Sass error: Required import def not found ("+imports[i]+")", false, "sass")
				
				let f = _sc.file(_sc.chpath+"/styles/scss/" + imp.scss)
				
				if(!f.exists())
					log("Sass error: Required import scss not found ("+imports[i]+")", false, "sass")
				else
					headstring += (yield OS.File.read(f.path, { encoding: "utf-8" })) + "\n"
			}
		}

		let content = yield OS.File.read(fScss.path, { encoding: "utf-8" });
		let promise = new Promise(function(resolve, reject) {
			Sass.compile(headstring + (content || ""), function(result) {
				resolve(result);
			});
		});
		let result = yield promise;
		if(result.message) {
			log("Sass.compile() error: " + result.message, false, "sass")
			log(result.formatted)
			log(fScss.path);
		}
		else {
			var mdls = getModulesByName(def.observe)
			if(mdls && mdls.length && false) {
				var uri = _mainwindow._sc.ioserv().newURI(OS.Path.toFileURI(_sc.chpath + "/" + def.cssTarget), null, null)
				log("Sass: Write file: " + _sc.chpath + "/" + def.cssTarget, false, "sass")
				
				var mdls = getModulesByName(def.observe)
				mdls.forEach(m => {
					let u = m.ownerGlobal.domwu
					if(!u)
						return
					u.removeSheet(uri, u.USER_SHEET)
					OS.File.writeAtomic(_sc.chpath + "/" + def.cssTarget, result.text, { encoding: "utf-8" });
					u.loadSheet(uri, u.USER_SHEET)
					u.redraw();
				})
			}
			else {
				log("Sass: Write file: " + _sc.chpath + "/" + def.cssTarget, false, "sass")
				OS.File.writeAtomic(_sc.chpath + "/" + def.cssTarget, result.text, { encoding: "utf-8" })
			}

			// update info
			var d = new Date()
			execHook("sass-target-updated", def, d);
		}
		if(!__rec)
			yield createSassSnapshot();
	});
	if(!__rec)
		current_sass_loading_task = task;
	task.then(function() {
		if(current_sass_loading_task == task)
			current_sass_loading_task = undefined;
	}, function(err) {
		log("An error occured while trying to reload stylesheets:", false, "error");
		log(err.message, false, "error");
		if(current_sass_loading_task == task)
			current_sass_loading_task = undefined;
	});
	return task;
}