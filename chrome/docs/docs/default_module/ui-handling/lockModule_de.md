<<<lockModule

# lockModule

```fnpreview
bool lockModule([opt] string message, [opt] bool nofadein, [opt] int delay);
```
Sperrt das gesamte Modul mit einem Modal und zeigt mittig zentriert die angegebene Nachricht an.

* **message:**
  Nachricht, die mittig angezeigt werden soll.
* **nofadein:**
  Falls ```true```, so wird das Modal nicht eingefadet.
* **delay:**
  Verzögert das Einfaden des Modals um die angegebene Zeit in Millisekunden. Funktioniert nur, wenn nofadein ```false``` ist. Interaktionen wie Mausklicks funktionieren allerdings auch nicht vor Ablauf der Verzögerung, sie dient nur um bei sehr kurzen Sperrungen des Moduls ein Aufflackern zu vermeiden. **Standardwert:** 200.