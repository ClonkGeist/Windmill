var imported;
onmessage = function(event) {
	if(!imported) {
		importScripts('chrome://windmill/content/modules/modmanager/js/prism.js');
		imported = true;
		
		//require.config({paths: { "ace" : "chrome://windmill/content/modules/cide/editor/js/ace"}});
	}

	let codeblocks = event.data, result = [];
	for(var i = 0; i < codeblocks.length; i++) {
		let match = codeblocks[i].match(/<code.class="lang-(.+?)">((.|\n)+?)<\/code>/);
		let lang = match[1];
		let content = match[2];
		
		let c = i;
		if(lang != "fnpreview")
			result[i] = '<code class="lang-'+lang+'">'+Prism.highlight(content, Prism.languages[lang])+'</code>';
		else
			result[i] = content;
	}
	postMessage(result);
}