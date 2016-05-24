<<<tooltip

# tooltip

```fnpreview
void tooltip(HTMLElement/XULElement targetEl, string desc, [opt] string lang, [opt] int duration);
```
Bindet ein Tooltip mit der angegebenen Beschreibung an das angegebene Element welches beim Hovern erscheint.

* **targetEl:**
  Element, für das das Tooltip erscheinen soll.
* **desc:**
  Textinhalt des Tooltips.
* **lang:**
  Sprache in der das Modul geschrieben ist. Gültige Werte: "html" und "xul". Standardmäßig wird der Wert aus ```MODULE_LANG``` geladen, sollte also bereits der Sprache des Moduls entsprechen.
* **duration:**
  Dauer in Millisekunden die über das Element gehovert werden muss, damit das Tooltip erscheint. **Standardwert:** 600.