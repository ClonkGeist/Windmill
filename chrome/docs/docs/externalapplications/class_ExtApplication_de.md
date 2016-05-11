<<<class ExtApplication
# class ExtApplication

## Attribute

| Attribut | Typ | Beschreibung |
|----------|-----|--------------|
| path | string | Der in den Einstellungen eingestellte Dateipfad zur Anwendung. |
| needed_file | string | Dateiname der auf dem aktuellen Betriebssystem auszuführenden Datei, der in der JSON-Definition eingestellt wird. **Read-only.** |

## Funktionen

```fnpreview
constructor ExtApplication(object data);
```

**data:**
  JSON-Objekt mit den o.g. Werten.

```fnpreview
bool isAvailable();
```

Gibt ```true``` zurück, wenn ein gültiger Programmpfad zu einer existierenden Datei angegeben worden ist und die Anwendung somit verfügbar ist.

```fnpreview
void showError();
```

Gibt eine formatierte und lokalisierte Fehlermeldung mit Informationen zur Beschaffung der jeweiligen Anwendung aus.

```fnpreview
wmIProcess create(...pars);
```

Erstellt eine Prozessinstanz zur jeweiligen Anwedung, allerdings mit vorheriger Prüfungen auf die Richtigkeit der Angaben und entsprechender Fehlermeldungsausgabe.
Die Parameter werden direkt an die ```create```-Funktion des erstellten ```wmIProcess```-Objekts weitergegeben, sind somit die gleichen.

## Beispiel

```javascript
let git = getAppByID("git");
//Prüfen ob Git verfügbar ist
if(git.isAvailable())
	//Falls ja, Prozess erstellen und clonen
	git.create(["clone", this.cloneurl, this.path], 0x1, (exitCode) => { 
		//Wenn kein Fehler aufgetreten ist, Erstellungsprozess abschließen und Git Configwerte für Usename und Email setzen.
		if(!exitCode) {
			if(options.success)
				options.success(this);

			unlockModule();
			git.create(["config", "-f", _this.path+"/.git/config", "user.name", options.userconfig.username], 0x2);
			git.create(["config", "-f", _this.path+"/.git/config", "user.email", options.userconfig.email], 0x2);

			/Header speichern
			this.saveHeader();
		}
		else
			options.rejected();
	}, function(data) {
		//Ausgabe von Git in die Git Konsole loggen
		logToGitConsole(data);
	});
```
Führt, falls Git verfügbar ist, einen Repository-Clone-Prozess durch.