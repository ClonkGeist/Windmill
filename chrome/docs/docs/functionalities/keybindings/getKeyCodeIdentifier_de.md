<<<getKeyCodeIdentifier

# getKeyCodeIdentifier

```fnpreview
string/int getKeyCodeIdentifier(int code, bool localization);
```
Gibt den KeyCode-Identifier für den angegebenen KeyCode zurück. (siehe [KeyBindings](#) für eine Liste der KeyCode-Identifier) Wird kein KeyCode-Identifier für den angegebenen KeyCode gefunden, so gibt die Funktion ```-1``` zurück.

* **code:**
  Der KeyCode der jeweils gedrückten Taste.
* **localization:**
  Falls ```true```, so wird der lokalisierte Name der jeweiligen Taste zurückgegeben.