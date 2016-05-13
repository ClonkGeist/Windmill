<<<_keybinderCheckKeyBind

# _keybinderCheckKeyBind

```fnpreview
bool _keybinderCheckKeyBind(_KeyBinding keybind, KeyboardEvent event, [opt] string keys);
```
Prüft, ob bei dem übergebenen KeyboardEvent die entsprechende Tastenkombination des KeyBindings gedrückt worden ist.

* **keybind:**
  _KeyBinding-Objekt, dass überprüft werden soll.
* **event:**
  Event Objekt eines Keyboard Events. (```keydown``` oder ```keyup```, bei ```keypress``` könnten verschiedene Ergebnisse rauskommen)
* **keys:**
  Falls angegeben, Tastenkombination die statt des KeyBindings-Objekt im ersten Parameter überprüft werden soll.