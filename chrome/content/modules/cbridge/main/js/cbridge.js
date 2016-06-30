let maindeck = {}, deck;

window.addEventListener("load", function(){
	deck = addDeck($("#modules-wrapper")[0], 0);
	createNavigation();
});

//removes navigation entry of this module
function detachModule(moduleelm, module) {
	$('.modules-nav-entry[data-name="'+module.name+'"]').remove();
	deck.detachItem(deck.getModuleId(module.name));
}

//reload module navigation
function attachModule(module) {
	createNavigation();
}

function createNavigation() {
	//Iterate through modules
	let cbridgemodules = [];
	for(let mname in _mainwindow.MODULE_DEF_LIST) {
		let module = _mainwindow.MODULE_DEF_LIST[mname];

		if(module.cbridgemodule)
			cbridgemodules.push(module);
	}
	
	cbridgemodules.sort(function(a,b) {
		//Sort addons to the end
		if(a.isAddon && !b.isAddon)
			return 1;
		else if(!a.isAddon && b.isAddon)
			return -1;

		//if no navigationindex is specified, sort these modules to the end of the list
		if(isNaN(a.navigationindex) && !isNaN(b.navigationindex))
			return 1;
		else if(!isNaN(a.navigationindex) && isNaN(b.navigationindex))
			return -1;
		else if(isNaN(a.navigationindex) && isNaN(b.navigationindex))
			return 0;

		//otherwise, sort by index
		return a.navigationindex - b.navigationindex;
	});

	//Clear navigation
	$(".modules-nav-entry:not(.draft)").remove();

	//Create navigation items
	for(let i = 0, first = true; i < cbridgemodules.length; i++) {
		let module = cbridgemodules[i];
		if(getConfigData("Modules", module.name+"_State"))
			continue;

		let clone = $(".modules-nav-entry.draft").clone();
		clone.removeClass("draft");
		clone.attr("data-name", module.name)
		clone.find(".modules-nav-label").attr("value", Locale(module.navigationlabel || module.modulename, module.languageprefix));
		clone.click(function() {
			$(".modules-nav-entry.selected").removeClass("selected");
			$(this).addClass("selected");
			let index = deck.getModuleId(module.name);
			if(index == -1)
				index = deck.add(getModule(createModule(module.name, deck.element), true), 0, false, false, true);
			togglePage(deck.id, index);
		});
		if(!module.isAddon && deck.getModuleId(module.name) == -1)
			deck.add(getModule(createModule(module.name, deck.element), true), 0, false, false, true);
		clone.appendTo($("#modules-nav"));
		if(first && !module.isAddon) {
			clone.click();
			first = false;
		}
	}
}

hook("addedToDeck", function(deckid, tabid, deck) {
	maindeck = { deckid, tabid };
});

function frameWindowTitle() {}