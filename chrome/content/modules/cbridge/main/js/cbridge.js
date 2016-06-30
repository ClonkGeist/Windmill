let maindeck = {}, deck;

window.addEventListener("load", function(){
	deck = addDeck($("#modules-wrapper")[0], 0);
	/*var modules = [createModule("showgames", deck.element),
				   createModule("cbexplorer", deck.element)];

	var deckitems = [deck.add(getModule(modules[0], true), 0),
					 deck.add(getModule(modules[1], true), 0, false, false, true)];*/
	/*_mainwindow.addNavigationItem(Locale("$NavNetworkGames$"), "cbridge", true, 0, function() {
		if(maindeck.deckid !== undefined)
			_mainwindow.togglePage(maindeck.deckid, maindeck.tabid);
		togglePage(deck.id, deckitems[0]);
	});
	_mainwindow.addNavigationItem(Locale("$NavHostGame$"), "cbridge", 0, 0, function() {
		if(maindeck.deckid !== undefined)
			_mainwindow.togglePage(maindeck.deckid, maindeck.tabid);
		togglePage(deck.id, deckitems[1]);
	});*/
	createNavigation();
});

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
	for(let i = 0; i < cbridgemodules.length; i++) {
		let module = cbridgemodules[i];
		let clone = $(".modules-nav-entry.draft").clone();
		clone.removeClass("draft");
		clone.find(".modules-nav-label").attr("value", Locale(module.navigationlabel || module.modulename, module.languageprefix));
		clone.click(function() {
			$(".modules-nav-entry.selected").removeClass("selected");
			$(this).addClass("selected");
			let index = deck.getModuleId(module.name);
			if(index == -1)
				index = deck.add(getModule(createModule(module.name, deck.element), true), 0, false, false, true);
			togglePage(deck.id, index);
		});
		if(!module.isAddon)
			deck.add(getModule(createModule(module.name, deck.element), true), 0, false, false, true);
		clone.appendTo($("#modules-nav"));
		if(!i)
			clone.click();
	}
}

hook("addedToDeck", function(deckid, tabid, deck) {
	maindeck = { deckid, tabid };
});

function frameWindowTitle() {}