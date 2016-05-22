<<<displayDOM

# displayDOM

```fnpreview
void displayDOM(HTMLElement/XULElement el, [opt] string lang);
```
Zeigt das DOM ausgehend von dem angegebenen Element an. Dies wird einerseits in die Javascript-Konsole gelogt und andererseits in einem Wrapper der über das Modul gelegt wird.

* **el:**
  Element, von dem ausgehend das DOM angezeigt werden soll.
* **lang:**
  Sprache in der das Modul geschrieben ist. Gültige Werte: "xul" und "html". Standardwert: "html".