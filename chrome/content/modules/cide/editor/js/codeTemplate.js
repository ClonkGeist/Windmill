/**	snippet format documentation
  *	https://cloud9-sdk.readme.io/docs/snippets
  */

var snippets;

hook("load", function() {
	var str = getConfigData("CIDE", "CustomSnippets");
	
	if(str)
		snippets = JSON.parse(str);
	
	if(!(snippets instanceof Array))
		snippets = ["test", "Content"];
});

function showSnippetDialog() {
	var dlg = new WDialog("$DlgSnippetManagerTitle$", MODULE_LPRE, { modal: true, css: { "width": "600px", "height" : "450px" }, btnright: ["cancel"]});
	
	var content = "<vbox class=\"dlg-snippet-page\">";
	
	for(var i = 0; i < snippets.length; i += 2)
		content += "<hbox class=\"dlg-snippet-item\">"+
					"<description flex=\"1\">"+snippets[0]+"</description>"+
					"<box style=\"display: none\" class=\"edit-snippet icon-16 icon-bars-ref-1-3\" data-snippet-index=\""+(i/2)+"\"></box></hbox>";
	
	// add snippet button
	content += "<hbox pack=\"center\"><description class=\"dlg-snippet-btn\">$new_snippet$</description></hbox>";
	
	// snippet edit page
	content += "</vbox><vbox class=\"dlg-snippet-page\" style=\"display: none\">"+
					"<textbox id=\"dlg-snippet-title\" placeholder=\"$DlgSnippetManagerTitleInput$\" />"+
					"<textbox id=\"dlg-snippet-body\" placeholder=\"$DlgSnippetManagerBodyInput$\" rows=\"12\" multiline=\"true\"/>"+
					"<hbox><description flex=\"1\" class=\"dlg-snippet-btn dlg-snippet-back\">$back_to_snippet_manager$</description>"+
					"<description align=\"center\" flex=\"1\" class=\"dlg-snippet-btn dlg-snippet-save\">$save_snippet$</description></hbox>"+
				"</vbox>";
	
	dlg.setContent(content);
	dlg.show();
	
	var $el = $(dlg.element);
	
	$el.find(".dlg-snippet-item").css("pointer-events", "auto").click(function() {
		// insert into editor
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
	
	$el.find(".edit-snippet").click(function() {
		$el.find(".dlg-snippet-page").toggle();
		
	});
	
	$el.find(".dlg-snippet-back").click(function() {
		$el.find(".dlg-snippet-page").toggle();
	});
	
	$el.find(".dlg-snippet-save").click(function() {
		dlg.hide();
	});
	
	dlg = null;
}

function addSnippetToEditors() {
	var editor;
	var snippetManager = ace.require("ace/snippets").snippetManager;
	snippetManager.insertSnippet(editor, snippet);
}