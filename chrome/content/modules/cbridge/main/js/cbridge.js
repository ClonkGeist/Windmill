
window.addEventListener("load", function(){
	var deck = addDeck($("#modules-wrapper")[0], 0);
	var modules = [createModule("showgames", deck.element),
				   createModule("cbexplorer", deck.element)];

	var deckitems = [deck.add(getModule(modules[0], true), 0),
					 deck.add(getModule(modules[1], true), 0, false, false, true)];
	_mainwindow.addNavigationItem("Network games", "cbridge", true, 0, function() {
		togglePage(deck.id, deckitems[0]);
	});
	_mainwindow.addNavigationItem("Host game", "cbridge", 0, 0, function() {
		togglePage(deck.id, deckitems[1]);
	});
});

function frameWindowTitle() {}