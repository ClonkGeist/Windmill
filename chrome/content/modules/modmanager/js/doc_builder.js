
let marked = Cu.import("resource://docs/marked.jsm").export_marked;
marked.setOptions({
	renderer: new marked.Renderer(),
	gfm: true,
	breaks: true,
	sanitize: true
});
let html_template, html_template_path = _sc.chpath + "/docs/windmilldoc_template.html";

function buildDoc(path = _sc.chpath + "/docs/docs", __rec) {
	if(!__rec)
		log("Starting doc building process...");
	let task = Task.spawn(function*() {
		if(!html_template) {
			log("Loading HTML Template from " + html_template_path);
			html_template = yield OS.File.read(html_template_path, {encoding: "utf-8"});
		}
		if(!__rec)
			log("Collecting information");
		let iterator = new OS.File.DirectoryIterator(path), md_files = [];
		while(true) {
			let entry;
			try { entry = yield iterator.next(); }
			catch(e) {
				if(e != StopIteration)
					throw e;
				break;
			}
			if(entry.isDir)
				md_files = md_files.concat(yield buildDoc(entry.path, true));
			else if(entry.name.search(/\.md$/) != -1) {
				md_files.push(entry);
			}
		}
		iterator.close();
		if(!__rec) {
			log("Preparing information (" + md_files.length + " files)");
			let lang_md_files = [], files_by_path = {};
			for(var i = 0; i < md_files.length; i++) {
				let file = md_files[i];
				let match = file.name.match(/_(..)\.md/);
				if(!match)
					continue;
				let lang = match[1];
				if(!lang_md_files[lang])
					lang_md_files[lang] = [];

				log("loading " + file.path);
				let content = yield OS.File.read(file.path, {encoding: "utf-8"});
				let temp_content = content.split("\n");
				let title = file.name;
				if(temp_content[0].match(/<<<.+/)) {
					title = temp_content[0].match(/<<<(.+)/)[1];
					temp_content.shift();
					content = marked(temp_content.join("\n"));
				}

				let path = formatPath(file.path).replace(_sc.chpath+"/docs/docs", "");
				let parent_path = formatPath(file.path).split("/");
				let file_obj = { 
					path: path, 
					filepath: formatPath(file.path), 
					name: file.name, 
					content, 
					title, 
					parent_path: parent_path.slice(0, parent_path.length-1).join("/")
				};
				lang_md_files[lang].push(file_obj);
				files_by_path[file_obj.path] = file_obj;
			}
			for(var lang in lang_md_files) {
				log("Language: " + lang);
				log("Building html files (" + lang_md_files[lang].length + ")");
				let encoder = new TextEncoder();
				let definitely_exists = {};
				yield OS.File.makeDir(_sc.chpath+"/docs/build");
				for(var i = 0; i < lang_md_files[lang].length; i++) {
					let file = lang_md_files[lang][i], dest = _sc.chpath + "/docs/build" + file.path;
					log("build " + file.path + " at " + dest);
					
					let navigation = "", ulstack = 0;
					for(var j = lang_md_files[lang].length-1, relpath = undefined; j >= 0; j--) {
						let linkedfile = lang_md_files[lang][j];
						if(relpath && linkedfile.filepath.search(relpath) == -1) {
							let splitted = relpath.split("/");
							while(splitted.pop() && linkedfile.filepath.search(splittet.join("/")) == -1 && ulstack) {
								navigation += "</ul>\r\n";
								ulstack--;
							}
							relpath = linkedfile.parent_path;
						}
						let linked_splitted_path = linkedfile.path.split("/"), path = "", splitted_path = file.path.split("/");
						splitted_path.pop();

						while(linked_splitted_path[0] == splitted_path[0] && linked_splitted_path.length) {
							linked_splitted_path.shift();
							splitted_path.shift();
						}
						while(splitted_path.shift())
							path += "../";
						var part;
						while(part = linked_splitted_path.shift())
							path += part+"/";
						path = path.replace(/md\/$/, "html");
						
						if(linkedfile.name == "__head_"+lang+".md") {
							relpath = linkedfile.parent_path;
							navigation += `<li class="navigation-elm"><a href="${path}">${linkedfile.title}</a></li><ul class="navigation-sublist">\r\n`;
							ulstack++;
						}
						else
							navigation += `<li class="navigation-elm"><a href="${path}">${linkedfile.title}</a></li>\r\n`;
					}
					while(ulstack--)
						navigation += "</ul>\r\n";
					let output = html_template;
					output = output.replace(/\${PAGE_TITLE}/g, file.title);
					output = output.replace(/\${PAGE_NAVIGATION}/g, navigation);
					output = output.replace(/\${PAGE_CONTENT}/g, file.content);
					let from = _sc.chpath + "/docs/build/";
					relpath = file.parent_path.replace(_sc.chpath+"/docs/docs/", "").split("/");
					for(var j = 0; j < relpath.length; j++) {
						from += relpath[j];
						if(!definitely_exists[from]) {
							yield OS.File.makeDir(from);
							definitely_exists[from] = true;
						}
						from += "/";
					}
					
					output = output.replace(/\${STYLESHEET}/g, relpath.join("/").replace(/(.+?)(\/|$)/g, "../")+"windmill_doc.css");

					let htmlfile = yield OS.File.open(dest.substr(0, dest.length-2)+"html", { truncate: true });
					yield htmlfile.write(encoder.encode(output));
					yield htmlfile.close();
				}
			}
		}
		return md_files;
	});
	task.then(function() {
		if(!__rec) {
			log("***********************************");
			log("Building process finished.");
		}
	}, function(reason) {
		log("***********************************");
		log("Error while building:");
		log(reason);
		log("***********************************");
	});
	return task;
}

