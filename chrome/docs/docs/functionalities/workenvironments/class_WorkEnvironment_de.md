<<<class WorkEnvironment

# class WorkEnvironment

```fnpreview
constructor WorkEnvironment(string path, int Type, id, [opt] object options);
```
Erstellt eine WorkEnvironment-Instanz mit den angegebenen Werten.

* **path:**
  Pfad zum Arbeitsverzeichnis.
* **Type:**
  Sorte des Arbeitsverzeichnisses. Gültige Werte: ```WORKENV_TYPE_ClonkPath``` (1) und ```WORKENV_TYPE_Workspace``` (2).
* **id:**
  ID des Arbeitsverzeichnisses.
* **options:**
  Weitere Optionen. Siehe das ```options```-Attribut für weitere Erklärungen.

```fnpreview
void setOptions(object options);
```
Setzt die Optionen.

* **options:**
  Die Optionen die zu Setzen sind. Siehe das ```options```-Attrbut für weitere Erklärungen.

```fnpreview
bool isValid(string path, [opt] object options);
```
Prüft, ob der angegebene Pfad ein gültiger Pfad zu einem Arbeitsverzeichnis ist. Dabei wird auch auf schon vorhandene Arbeitsverzeichnisse und auf Hierarche geprüft, letzteres heißt also dass neue Arbeitsverzeichnisse nur als Unterverzeichnis eines anderen Arbeitsverzeichnisses gelten können, wenn diese spezifisch als Elternarbeitsverzeichnis festgelegt sind.

* **path:**
  Pfad der geprüft werden soll.
* **options:**
  Weitere Optionen:
  * **parent:**
    Das jeweilige Elternarbeitsverzeichnis, dem das neue Arbeitsverzeichnis untergeordnet werden soll.

```fnpreview
bool setupWorkEnvironment([opt] Array filelist, [opt] object options);
```
Erstellt das Arbeitsverzeichnis auf der Festplatte und migriert die angegebenen Dateien in das neue Verzeichnis rüber bzw. clonet stattdessen das angegebene Git Repository falls ```options.repository``` angegeben ist.

* **filelist:**
  Array von Dateinamen ausgehend von ```options.sourcedir```. (```options.sourcedir``` muss hierfür gesetzt sein)
* **options:**
  Weitere Optionen:
  * **parent:**
    Gibt das Elternarbeitsverzeichnis an.
  * **repository:**
    Gibt an, ob das Arbeitsverzeichnis ein (Git-)Repository ist und startet entsprechend den Clone-Prozess.
  * **userinfo:**
    Gibt die Benutzerdaten für den Repository-Zugriff (```userinfo.username``` und ```userinfo.password```) an.
  * **userconfig:**
	Gibt weitere Benutzerkonfigurationen für das Repository (```userconfig.username``` und ```userconfig.email```) an. Diese werden in der Git Config lokal gespeichert.
  * **cloneurl:**
    URL die zum Clonen benutzt wird.
  * **sourcedir:**
    Ursprungsverzeichnis aus dem die Dateien aus ```filelist``` genommen werden sollen.
  * **success:**
    Callback der aufgerufen wird, wenn der jeweilige Prozess erfolgreich abgeschlossen wurde. Erhält das WorkEnvironment-Objekt als Parameter.
  * **rejected:**
    Callback der aufgerufen wird, wenn der jeweilige Prozess fehlschlägt.

```fnpreview
void loadHeader();
```
Liest die Headerdatei des jeweiligen Arbeitsverzeichnisses ein.

```fnpreview
void saveHeader();
```
Speichert die Headerdatei des Arbeitsverzeichnisses.

```fnpreview
void unload();
```
Lädt das Arbeitsverzeichnis wieder aus. Clonkverzeichnisse werden auch aus ```Global::ClonkDirectories``` entfernt.

```fnpreview
void addChildWorkEnv(WorkEnvironment workenv);
```
Fügt das angegebene Arbeitsverzeichnis als Kinder-Arbeitsverzeichnis hinzu.

```fnpreview
Array getWorkEnvChildren();
```
Gibt einen lückenlosen Array mit allen Kinder-Arbeitsverzeichnissen zurück.

## Attribute

| Attrbute | Typ | Beschreibung |
|----------|-----|--------------|
| id | any | ID des Arbeitsverzeichnisses |
| header | object | Enthält die Inhalte der Headerdatei. |
| path | string | Pfad zum jeweiligen Arbeitsverzeichnis. Verknüpfte Arbeitsverzeichnisse werden dabei auch berücksichtigt. |
| truepath | string | Gibt den tatsächlichen Pfad zum Arbeitsverzeichnis zurück. Dies ist nützlich um bspw. auf die Headerdatei bei verknüpften Arbeitsverzeichnissen zuzugreifen, da ```path``` in solchen Fällen den verlinkten Pfad zurückgibt. |
| type | int | Gibt die Art des Arbeitsverzeichnisses wieder. Gültige Werte: ```WORKENV_TYPE_ClonkPath``` (1) und ```WORKENV_TYPE_Workspace``` (2).
| alwaysexplode | bool | Gibt an, ob Groupdateien im Arbeitsverzeichnis immer zerlegt werden sollen. Nur gültig falls ```type``` auf ```WORKENV_TYPE_ClonkPath``` gesetzt ist, da es andernfalls Standardverhalten ist. |
| linkedTo | string | Gibt den Pfad der Verknüpfung zu dem eigentlichen Arbeitsverzeichnis an. 
| unloaded | bool | Gibt an, ob das geladene Arbeitsverzeichnis ausgeladen worden ist. In dem Falle ist das ```WorkEnvironment```-Objekt weitgehend unbrauchbar. |

## Events

### Globale Events

```fnpreview
onWorkenvSetup: function(WorkEnvironment workenv);
```
Wird aufgerufen, nachdem die Einrichtung einer Arbeitsumgebung ([setupWorkEnvironment](#)) abgeschlossen worden ist.

```fnpreview
onWorkenvUnloaded: function(WorkEnvironment workenv);
```
Wird aufgerufen, wenn eine Arbeitsumgebung ausgeladen worden ist. Die Arbeitsumgebung ist zu dem Zeitpunkt bereits nicht mehr im Array aller Arbeitsumgebungen vorhanden und wird der Garbage Collection überlassen.