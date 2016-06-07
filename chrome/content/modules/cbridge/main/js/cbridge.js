let maindeck = {};

window.addEventListener("load", function(){
	var deck = addDeck($("#modules-wrapper")[0], 0);
	var modules = [createModule("showgames", deck.element),
				   createModule("cbexplorer", deck.element)];

	var deckitems = [deck.add(getModule(modules[0], true), 0),
					 deck.add(getModule(modules[1], true), 0, false, false, true)];
	_mainwindow.addNavigationItem(Locale("$NavNetworkGames$"), "cbridge", true, 0, function() {
		if(maindeck.deckid !== undefined)
			_mainwindow.togglePage(maindeck.deckid, maindeck.tabid);
		togglePage(deck.id, deckitems[0]);
	});
	_mainwindow.addNavigationItem(Locale("$NavHostGame$"), "cbridge", 0, 0, function() {
		if(maindeck.deckid !== undefined)
			_mainwindow.togglePage(maindeck.deckid, maindeck.tabid);
		togglePage(deck.id, deckitems[1]);
	});
});

hook("addedToDeck", function(deckid, tabid, deck) {
	maindeck = { deckid, tabid };
});

function frameWindowTitle() {}