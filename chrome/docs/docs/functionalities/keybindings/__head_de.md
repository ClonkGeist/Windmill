<<<Key Bindings

# Key Bindings

In Windmill können Module für sich selbst Key Bindings festlegen, die sich zentralisiert vom Benutzer in den Einstellungen einstellen lassen.

Um Key Bindings zu erstellen, muss ein ```_KeyBinding```-Objekt erstellt werden, dass anschließend über die Funktion ```bindKeyToObj``` an verschiedene Elemente gebunden werden kann. Beispiel:

```javascript
bindKeyToObj(new KeyBinding("FullRefresh", "Ctrl-F5", function() {
	$(MAINTREE_OBJ).empty();

	initializeDirectory();
}, 0, "DEX"), document);
```

Hier wird ein neues KeyBinding Objekt an das Dokument des Explorers gebunden, welches standardmäßig auf die ```Ctrl-F5``` Tastenkombination gelegt ist, sodass falls der Explorer im Fokus liegt und die Tastenkombination gedrückt wird, der Inhalt komplett neu geladen wird.

Für die Tastenkombinationen kann eine Verkettung aus den Modifier-Tasten (Ctrl, Alt, Shift) und der jeweiligen Taste die durch Bindestriche jeweils miteinander verbunden werden (Z.B. ```Ctrl-Shift-C```) angegeben werden. Speziellere Tasten, die nicht richtig anzeigbar sind, können über bestimmte KeyCode-Identifier angegeben werden, die weiter unten aufgelistet sind und in der folgenden Datei: ```chrome://windmill/content/js/functionalities/keybindings.js``` auch zu finden sind.

KeyBindings werden erst bei Start des Moduls geladen, sodass KeyBindings von den Einstellungen nur erkannt werden, wenn sie bereits schon mal gespeichert worden sind. Das heißt also, dass neue KeyBinding-Einträge auch in den Standard-KeyBindings (```chrome://windmill/content/defaultfiles/keybinding.ini```) hinterlegt werden müssen, um in jedem Falle korrekt geladen zu werden.

Die einzelnen Module können mit folgendem Format Übersetzungen für die KeyBinding-Einträge der Einstellungen festlegen: ```{LPX}_KEYB_{KeyBinding Identifer}```. Dabei steht {LPX} für den Lokalisierungspräfix des jeweiligen Moduls und {KeyBinding Identifer} für den Identifier des KeyBindings. (Z.B. ```DEX_KEYB_FullRefresh=Full refresh```)
Um den Titel des jeweiligen Abschnitts für die KeyBindings in den Einstellungen festzulegen, kann man für das jeweilige Modul den Schlüssel ```{LPX}_KeyBindingsHeaderCaption``` verwenden. (Z.B. ```DEX_KeyBindingsHeaderCaption=Explorer```)

## KeyCodes

Im folgenden eine Liste von Namen für speziellere Tasten, die keine Zeichen/Weißraumzeichen darstellen. Anzeigbare Zeichen bleiben gleich, die Funktionstasten (F1 bis F24) können auch exakt so verwendet werden.

Die häufiger genutzten Tasten werden in der Liste hervorgehoben angezeigt.

| KeyCode | Name |
|---------|------|
| 3   | CANCEL |
| 6	  | HELP |
| 8   | **BACK_SPACE** |
| 9   | **TAB** |
| 12  | CLEAR |
| 13  | **ENTER** |
| 14  | ENTER_SPECIAL |
| 16  | SHIFT |
| 17  | CONTROL |
| 18  | ALT |
| 19  | PAUSE |
| 20  | **CAPS_LOCK** |
| 21  | KANA |
| 22  | EISU |
| 23  | JUNJA |
| 24  | FINAL |
| 25  | HANJA |
| 27  | **ESCAPE** |
| 28  | CONVERT |
| 29  | NONCONVERT |
| 30  | ACCEPT |
| 31  | MODECHANGE |
| 32  | **SPACE** |
| 33  | **PAGE_UP** |
| 34  | **PAGE_DOWN** |
| 35  | **END** |
| 36  | **HOME** |
| 37  | **LEFT** |
| 38  | **UP** |
| 39  | **RIGHT** |
| 40  | **DOWN** |
| 41  | SELECT |
| 42  | PRINT |
| 43  | EXECUTE |
| 44  | PRINTSCREEN |
| 45  | **INSERT** |
| 46  | **DELETE** |
| 91  | **OS_KEY** (Windows-Taste (Windows) oder Command-Taste (Mac)) |
| 93  | **CONTEXT_MENU** (Rechte Command-Taste unter Mac) |
| 95  | SLEEP |
| 96  | **NUMPAD0** |
| 97  | **NUMPAD1** |
| 98  | **NUMPAD2** |
| 99  | **NUMPAD3** |
| 100 | **NUMPAD4** |
| 101 | **NUMPAD5** |
| 102 | **NUMPAD6** |
| 103 | **NUMPAD7** |
| 104 | **NUMPAD8** |
| 105 | **NUMPAD9** |
| 106 | **NUMPAD *** |
| 107 | **NUMPAD +** |
| 108 | SEPERATOR |
| 109 | **NUMPAD -** |
| 110 | **NUMPAD .** |
| 111 | **NUMPAD /** |
| 144 | NUM_LOCK |
| 145 | SCROLL_LOCK |
| 146 | WIN_OEM_FJ_JISHO |
| 147 | WIN_OEM_FJ_MASSHOU |
| 148 | WIN_OEM_FJ_TOUROKU |
| 149 | WIN_OEM_FJ_LOYA |
| 150 | WIN_OEM_FJ_ROYA |
| 181 | VOLUME_MUTE |
| 182 | VOLUME_DOWN |
| 183 | VOLUME_UP |
| 224 | META |
| 225 | ALTGR |
| 227 | WIN_ICO_HELP |
| 228 | WIN_ICO_00 |
| 230 | WIN_ICO_CLEAR |
| 233 | WIN_OEM_RESET |
| 234 | WIN_OEM_JUMP |
| 235 | WIN_OEM_PA1 |
| 236 | WIN_OEM_PA2 |
| 237 | WIN_OEM_PA3 |
| 238 | WIN_OEM_WSCTRL |
| 239 | WIN_OEM_CUSEL |
| 240 | WIN_OEM_ATTN |
| 241 | WIN_OEM_FINISH |
| 242 | WIN_OEM_COPY |
| 243 | WIN_OEM_AUTO |
| 244 | WIN_OEM_ENLW |
| 245 | WIN_OEM_BACKTAB |
| 246 | ATTN |
| 247 | CRSEL |
| 248 | EXSEL |
| 249 | EREOF |
| 250 | PLAY |
| 251 | ZOOM |
| 253 | PA1 |
| 254 | WIN_OEM_CLEAR |