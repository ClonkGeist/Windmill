<<<createModule

# createModule

```fnpreview
int createModule(string name, jQueryObject/HTMLElement/XULElement obj, [opt] bool fClearParent, [opt] bool fHide, [opt] object options);
```
Erstellt eine neue Instanz des Moduls mit dem angegebenen Namen. Zurückgegeben wird die eindeutige ID des erstellten Moduls, mit dem über [getModule](#) das iframe-Element ausgewählt werden kann.

* **name:**
  Name des Moduls das erstellt werden soll.
* **obj:**
  Element, dass als Container für das Modul dienen soll.
* **fClearParent:**
  Falls ```true```, so wird der Container von ```obj``` geleert bevor das Modul hinzugefügt wird.
* **fHide:**
  Falls ```true```, so wird das Modul unsichtbar geschaltet. (```display: none```)
* **options:**
  Weitere Optionen:
  * **prepend:**
    Falls ```true```, so wird das Modul am Anfang des Containers eingefügt, statt am Ende.