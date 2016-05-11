<<<wmIProcess
# wmIProcess - Prozessinterface

**Unterstützte Betriebssysteme:** Windows.

wmIProcess ist das auf js-ctypes basierte, Windmilleigene Prozessinterface welches die Funktionen des XPCOM Prozessinterfaces [nsIProcess](https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIProcess) um Funktionen wie die Inter Process Communication erweitert.

## class wmIProcess
```fnpreview
class wmIProcess extends [WindmillInterface](#)
```

### Attribute

| Attribut | Typ | Beschreibung |
|----------|-----|--------------|
| path | string | Gibt den Dateipfad an. |
| name | string | Gibt den Dateinamen an. **Read-only.** |
| exitCode | int | Gibt den ExitCode mit der der zuletzt ausgeführte Prozess unter dieser wmIProcess-Instanz geendet hat an. |
| status | int | Gibt den Status der wmIProcess-Instanz an. 0: Keine offene Prozessinstanz, 1: offene Prozessinstanz, 2: manuell geschlossene Prozessinstanz, bei der noch einmal die Routine durchlaufen wird und die stdout-Pipe eingelesen wird. |

### Methoden

```fnpreview
constructor wmIProcess(file);
```
Erstellt eine wmIProcess Instanz.

- **file:**
  Kann ein als String übergebener Dateipfad oder eine Instanz von [nsIFile](#) sein, die auf die auszuführende Datei zeigt.

```fnpreview
void create(Array args, int flags, [opt] function onProcessClosed, [opt] function outputListener);
```
Erstellt die Prozessinstanz mit den übergebenen Argumenten und Flags.

- **args:**
  Kommandozeilenargumente die dem auszuführenden Prozess übergeben werden.
- **flags:**
  Flags die zusätzliche Einstellungen festlegen:
  
| Name | Wert | Beschreibung |
|------|------|--------------|
| wmP_NO_WINDOW | 0x1 | Öffnet das Fenster ohne ein Konsolenfenster anzuzeigen. |
| wmP_BLOCKING | 0x2 | Blockt Windmill solange, bis der Prozess geendet hat. |

- **[opt] onProcessClosed:**
  Callback-Funktion die an das ```closed``` Event gebindet wird. Weitere Informationen in der Event-Liste.
- **[opt] outputListener:**
  Callback-Funktion die an das ```stdout``` Event gebindet wird. Weitere Informationen in der Event-Liste.

```fnpreview
Promise createPromise(array args, int flags, [opt] function onProcessClosed, [opt] function outputListener);
```
Erstellt die Prozessinstanz mit den übergebenen Argumenten und Flags und gibt einen Promise zurück, der gelöst wird sobald der Prozess geendet hat. Dabei wird die komplette Ausgabe des Prozesses einschließlich des ExitCodes und der wmIProcess-Instanz übergeben.

```javascript
let process = _ws.pr(getC4GroupPath());
let promise = process.createPromise([-x, "Objects.ocd"], 0x1);
promise.then(function(output, exitCode, process) {
  log(output);
});
```
Erstellt eine C4Group-Instanz die ```Objects.ocd``` exploden soll und gibt dessen Ausgabe in die Konsole aus.

Für eine Erklärung der Parameter, siehe ```create```.

```fnpreview
bool is_running();
```
Gibt zurück, ob der Prozess noch am laufen ist oder nicht.

```fnpreview
void pipe_write(string data);
```
Schreibt Daten in die stdin-Pipe des Prozesses.

- **data:**
  Daten die zu Schreiben sind.

```fnpreview
void close();
```
Schließt die offene Prozessinstanz.

### Events

```fnpreview
stdout: function(data, status);
```
Wird jedes Mal beim Lesen der stdout-Pipe aufgerufen. (alle 250ms)

- **data:**
  Gibt den neuen Inhalt der stdout-Pipe an.
- **status:**
  Gibt den Status der wmIProcess-Instanz an. Siehe das ```status```-Attribut.

```fnpreview
closed: function(exitCode);
```
Wird aufgerufen wenn der Prozess geendet hat bzw. manuell beendet worden ist.

- **exitCode:**
  Gibt den ExitCode an, mit dem der Prozess beendet worden ist.

## Beispiel

```javascript
getAppByID("git").create(["-C", path, "ls-files", "--other", "--exclude=.windmillheader"], 0x1, function() {
	if(!$(dlg.element).find("#git-addfiles .dlg-checklistitem")[0])
		$(dlg.element).find("#git-addfiles").html(Locale('$NoUnversionedFilesFound$<hbox class="dlg-checklistitem" style="visibility: hidden; width: 1px;"></hbox>'));
}, function(data) {
	$(dlg.element).find("#git-addfiles").empty();
	var lines = data.split("\n");
	for(var i = 0; i < lines.length; i++)
		if(lines[i].length)
			$('<hbox class="dlg-checklistitem"></hbox>').appendTo($(dlg.element).find("#git-addfiles")).text(lines[i]);
	
});
```
Führt die git-Anwendung mit ```-C <path> ls-files --other --exclude=.windmillheader``` aus um eine Liste der nicht versionierten Dateien zu erhalten. Die Ausgabe wird verarbeitet und als Checkliste in einem Dialog dargestellt.