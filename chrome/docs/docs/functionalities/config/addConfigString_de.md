<<<addConfigString

# addConfigString

```fnpreview
ConfigEntry addConfigString(string section, string key, defaultval, ...);
```
Erstellt einen Eintrag für die Konfigurationsdatei inkl. Standardwert.

- **section:**
  Sektion unter die der Eintrag geordnet werden soll.
- **key:**
  Key des Eintrags.
- **defaultval:**
  Standardwert des Eintrags.
- **...:**
  Weitere Parameter die an [ConfigEntry](#) übergeben werden.


## Beispiel

```javascript
addConfigString("CIDE", "HideUnsupportedFiles", true);
```
Erstellt einen Konfigurationseintrag "HideUnsupportedFiles" unter "CIDE" und setzt ihn standardmäßig auf ```true```.