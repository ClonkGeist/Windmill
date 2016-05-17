<<<addDeck

# addDeck

```fnpreview
Deck addDeck(HTMLElement/XULElement/jQueryObject container, [opt] HTMLElement/XULElement/jQueryObject navEl, [opt] string lang);
```
Erstellt ein neues Deck indem angegebenen Container und fügt dieses der globalen Deckliste hinzu.

* **container:**
  Container-Element welches das Deck enthalten soll.
* **navEl:**
  Container-Element welches die Navigation des Decks enthalten soll.
* **lang:**
  Sprache in der das Modul geschrieben wurde. **Gültige Werte:** "html" und "xul". ("xul" ist der Standardwert.) **Hinweis:** Obwohl hier der Wert "html" erlaubt ist, werden die Decks aktuell nur unter XUL unterstützt.