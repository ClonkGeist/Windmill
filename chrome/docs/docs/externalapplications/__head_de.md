<<<Externe Anwendungen
# Externe Anwendungen

Um Windmill an manchen Stellen um Funktionalitäten zu erweitern, sind gegebenenfalls externe Anwendungen von Nöten, die der Benutzer ggf. vorher erst installieren und Windmill zur Verfügung stellen muss. Ein Beispiel dafür ist die Git Implementation in Windmill.

## Definitionen

Um Windmill mit Informationen über externe Anwendungen zu füttern, die es benutzen soll, müssen Definitionen zu diesen externen Anwendungen erstellt werden. Da alle Unterverzeichnisse von Windmill danach abgesucht werden, dürfen diese sich überall in den Unterverzeichnissen von Windmill befinden, sofern es Sinn macht. (Diese Funktion ist ggf. für mögliche Modding-Implementationen in der Zukunft so offengehalten) Bevorzugterweise sollten diese allerdings im Unterordner "external_applications" befinden.

Bei den Definitionen handelt es sich um JSON-Objekte die im Format **appdef_**Name**.json** abgespeichert werden.

**Unterstützte Keys**

Erforderliche Keys sind fett markiert.

| Name | Typ | Beschreibung |
|------|-----|--------------|
| **identifier** | string | Einzigartige ID für die externe Anwendung, über die mittels Script auf die tatsächliche Anwendung zugegriffen werden kann |
| **cfgidentifier** | string | ID-Erweiterung für die zugehörigen Config-Werte (zur Speicherung) |
| **needed_file_win** | string | Dateiname der gesuchten Datei für Windows-Betriebssysteme. Andere Dateien werden abgelehnt. |
| **needed_file_osx** | string | Dateiname der gesuchten Datei für OSX-Betriebssysteme. Andere Dateien werden abgelehnt. |
| **needed_file_linux** | string | Dateiname der gesuchten Datei für Linux-Betriebssysteme. Andere Dateien werden abgelehnt. |
| name | string | Lokalisierter Name der Applikation |
| description | string | Lokalisierte Beschreibung der Applikation |
| icon | string | Pfad zu einem Icon dass in den Einstellungen angezeigt wird |

String-Werte dürfen auch auf Lokalisierungen zugreifen. (Globaler Namespace)

**Beispiel:**
```javascript
{
	"name": "Git",
	"identifier": "git",
	"cfgidentifier": "Git",
	"description": "$ExtApp_GitDescription$",
	"howto_info": "$ExtApp_HowToGetGit$",
	"icon": "chrome://windmill/content/img/applicationicon-git.png",
	"needed_file_win": "git.exe"
}
```

## Funktionsreferenz

**[ExtApplication]** getAppById(**string** identifier);

Gibt ein ExtApplication-Objekt der jeweiligen Anwendung zurück.

- **identifier:**
  ID der Anwendung aus der JSON-Definition.

**void** registerNewApplication(**string** application_obj);

Lädt eine als String übergebene JSON-Definition zu einer externen Anwendung in die interne Liste.

- **application_obj:**
  Als String übergebene JSON-Definition.

### class ExtApplication

### Attribute

| Attribut | Typ | Beschreibung |
|----------|-----|--------------|
| path | string | Der in den Einstellungen eingestellte Dateipfad zur Anwendung. |
| needed_file | string | Dateiname der auf dem aktuellen Betriebssystem auszuführenden Datei, der in der JSON-Definition eingestellt wird. **Read-only.** |

### Funktionen

**constructor** ExtApplication(**object** data);

**data:**
  JSON-Objekt mit den o.g. Werten.

**bool** isAvailable();

Gibt ```true``` zurück, wenn ein gültiger Programmpfad zu einer existierenden Datei angegeben worden ist und die Anwendung somit verfügbar ist.

**void** showError();

Gibt eine formatierte und lokalisierte Fehlermeldung mit Informationen zur Beschaffung der jeweiligen Anwendung aus.

**[wmIProcess]** create(...pars);

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