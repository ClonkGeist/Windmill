/**	snippet format documentation
  *	https://cloud9-sdk.readme.io/docs/snippets
  */

var snippets,
	snippetManager;

hook("load", function() {
	var str = getConfigData("CIDE", "CustomSnippets");
	
	if(str && str.length)
		snippets = JSON.parse(getConfigData("CIDE", "CustomSnippets"));
	else
		snippets = {};
	
	snippetManager = ace.require("ace/snippets").snippetManager;
	
	var scopes = [
		"ocscript"
	];
	
	scopes.forEach(scope => {
		if(Object.prototype.toString.call(snippets[scope]) !== '[object Array]')
			snippets[scope] = [];
		
		ace.config.loadModule("ace/snippets/" + scope, function(m) {
			
			if(!m)
				return;
			
			let list = snippets[scope];
			
			// snippetManager.files[scope] = m;
			
			m.snippets = snippetManager.parseSnippetFile(m.snippetText);
			if(!m.snippets)
					m.snippets = [];
				
			for(let i = 0; i < list.length; i++)
				addSnippetToAceList(list[i], scope);
		});
	});
});

function snippetsAvailable(scope) {
	return !!snippets[scope];
}

function showSnippetDialog(scope) {
	var list = snippets[scope];
	
	// err:: snippet not allowed for this file
	if(!list)
		return;
	
	var dlg = new WDialog("$DlgSnippetManagerTitle$", MODULE_LPRE, { modal: true, css: { "width": "600px", "height" : "450px" }, btnright: ["cancel"]});
	
	var content = "<vbox class=\"dlg-snippet-page\">";
	
	for(var i = 0; i < list.length; i++)
		content += "<hbox class=\"dlg-snippet-item\" style=\"padding: 4px\" data-snippet-index=\""+i+"\">"+
					"<description flex=\"1\">"+list[i].name+"</description>"+
					"<box style=\"display: none\" class=\"edit-snippet icon-16 icon-bars-ref-1-3\" data-snippet-index=\""+i+"\"></box></hbox>";
	
	// add snippet button
	content += "<hbox class=\"dlg-snippet-btn dlg-add-snippet\" pack=\"center\"><box class=\"icon-plus icon-16\"></box></hbox>";
	
	// snippet edit page
	content += "</vbox><vbox class=\"dlg-snippet-page\" style=\"display: none\">"+
					"<hbox class=\"dlg-infobox error\" id=\"dlg-snippet-errorbox\">"+
					"</hbox>"+
					"<hbox align=\"center\"><label value=\"snippet \" control=\"dlg-snippet-title\"/>"+
						"<textbox flex=\"1\" id=\"dlg-snippet-title\" placeholder=\"$DlgSnippetManagerTitleInput$\" />"+
					"</hbox>"+
					"<textbox id=\"dlg-snippet-body\" placeholder=\"$DlgSnippetManagerBodyInput$\" rows=\"12\" multiline=\"true\"/>"+
					"<checkbox label=\"$DlgSuggestInAutoCompletionDlg$\" id=\"dlg-snippet-isInline\" />"+
					"<hbox>"+
						"<vbox flex=\"1\" class=\"dlg-snippet-btn dlg-snippet-back\" align=\"center\">"+
							"<box flex=\"1\" class=\"icon-16 icon-backwards\"></box>"+
						"</vbox>"+
						"<vbox flex=\"1\" class=\"dlg-snippet-btn dlg-snippet-save\" align=\"center\">"+
							"<box class=\"icon-16 icon-save\"></box>"+
						"</vbox>"+
					"</hbox>"+
				"</vbox>";
	
	dlg.setContent(content);
	dlg.show();
	
	var $el = $(dlg.element);
	var currentSnippetIndex = -1;
	
	$el.find(".dlg-snippet-item").css("pointer-events", "auto").click(function() {
		let index = parseInt($(this).attr("data-snippet-index"));
		
		//snippetManager.insertSnippet(a_E, snippetManager.parseSnippetFile(getRawSnippet(list[index])));
		snippetManager.insertSnippet(a_E, list[index].content);
		
		dlg.hide();
		a_E.focus();
	}).mouseover(function() {
		$(this).find(".edit-snippet").get(0).style.display = "";
		this.style.backgroundColor = "rgba(0, 165, 207, 0.15)";
		this.style.outline = "1px solid rgba(0, 165, 207, 0.3)";
	}).mouseout(function() {
		$(this).find(".edit-snippet").get(0).style.display = "none";
		this.style.backgroundColor = "";
		this.style.outline = "";
	});
	
	$el.find(".dlg-snippet-btn").css("pointer-events", "auto", "text-align", "center").mouseover(function() {
		this.style.backgroundColor = "rgb(220, 220, 220)";
	}).mouseout(function() {
		this.style.backgroundColor = "";
	});
	
	// edit snippet item
	$el.find(".edit-snippet").click(function(e) {
		$el.find(".dlg-snippet-page").toggle();
		let index = parseInt($(this).attr("data-snippet-index"));
		
		if(Number.isNaN(index) !== false)
			return;
		
		$el.find("#dlg-snippet-title").attr("value",  list[index].name);
		$el.find("#dlg-snippet-body").attr("value",  list[index].content);
		$el.find("#dlg-snippet-isInline").attr("checked", list[index].isInline);
		
		currentSnippetIndex = index;
		e.stopPropagation();
	});
	
	// return to snippet overview
	$el.find(".dlg-snippet-back").click(function() {
		$el.find(".dlg-snippet-page").toggle();
		currentSnippetIndex = -1;
		$el.find("#dlg-snippet-errorbox").text("");
	});
	
	// enable usage of tab indents within body
	$el.find("#dlg-snippet-body").keydown(function(e) {
		if (e.which == 9) {
			e.preventDefault();
			var start = this.selectionStart;
			
			var v = this.value;

			this.value = v.substring(0, start) + "\t" + v.substring(this.selectionEnd);
			start++;
			this.setSelectionRange(start, start);
		}
	});
	
	// save snippet
	$el.find(".dlg-snippet-save").click(function() {
		var name = $el.find("#dlg-snippet-title").val();
		var content = $el.find("#dlg-snippet-body").val();
		var isInline = $el.find("#dlg-snippet-isInline").attr("checked") || false;
		
		// check for validation
		if(!name || !name.length) {
			$el.find("#dlg-snippet-errorbox").text("$DlgSnippetErrorboxNoTitle$");
			return;
		}
		if(!content || !content.length) {
			$el.find("#dlg-snippet-errorbox").text("$DlgSnippetErrorboxNoContent$");
			return;
		}
		
		var i = getSnippetIndex(name, scope);
		
		// if another name withing this scope exists having the same name
		if(currentSnippetIndex !== i && i !== -1) {
			$el.find("#dlg-snippet-errorbox").text("$DlgSnippetErrorboxAlreadySuchSnippet$");
			return;
		}
		
		// if we are editing an existing snippet
		if(currentSnippetIndex !== -1) {
			
			var s = list[currentSnippetIndex];
			
			if(list[currentSnippetIndex].aceChild)
				removeSnippetFromAceList(list[currentSnippetIndex].aceChild, scope);
			
			// else fill in
			s.name = name;
			s.content = content;
			s.isInline = isInline;
			
			if(isInline)
				addSnippetToAceList(s, scope);
		}
		else
			addSnippet(scope, {
				name: name,
				content: content,
				isInline: isInline
			});
		
		dlg.hide();
		a_E.focus();
		
		saveSnippets();
	});
	
	// add snippet
	$el.find(".dlg-add-snippet").click(function() {
		
		$el.find("#dlg-snippet-title").attr("value",  "");
		$el.find("#dlg-snippet-body").attr("value",  "");
		
		$el.find(".dlg-snippet-page").toggle();
		currentSnippetIndex = -1;
	});
}

function addSnippet(scope = "_", snippet) {
	snippets[scope].push(snippet);
	
	if(snippet.isInline)
		addSnippetToAceList(snippet, scope);
}

function saveSnippets() {
	var str = JSON.stringify(snippets, function (k, v) {
	// exclude aceChild property as its generated at snippet initiation
	if (k === "aceChild")
		return undefined;
	else
		return v;
	});
	
	setConfigData("CIDE", "CustomSnippets", str);
	saveConfig();
}

function getRawSnippet(s) {
	var str = "snippet " + s.name;
	
	str += "\n\t" + s.content.replace("\n", "\n\t");
	
	return str;
}

function removeSnippet(scope, index) {
	var snippet = snippets[scope][index];
	
	if(snippet.isInline)
		removeSnippetFromAceList(snippet.name, scope);
	
	snippets[scope].slice(index, 1);
}

function addSnippetToAceList(snippet, scope) {
	var s = snippetManager.parseSnippetFile(getRawSnippet(snippet));
	snippet.aceChild = s;
	snippetManager.register(s, scope);
}

function removeSnippetFromAceList(aceSnippet, scope) {
	snippetManager.unregister(aceSnippet, scope);
}

function getSnippetIndex(name, scope) {
	var list = snippets[scope];
	for(let i = 0; i < list.length; i++)
		if(list[i].name === name)
			return i;
	
	return -1;	
}