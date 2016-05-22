<<<Shortcuts (_sc)
# Shortcuts (_sc)

Um viel Schreibarbeit zu ersparen, verfügt Windmill über ein Shortcut-Objekt ```_sc``` das von allen Modulen aus angesteuert werden kann. Dieses Shortcut-Objekt soll das Arbeiten mit den XPCOM-Interfaces erleichtern, die sonst über eine spezielle ID der ```Components.classes``` inkl. ```createInstance()```/```getService()``` erhalten werden können.

## Funktionen

```fnpreview
nsIProcess _sc.process(nsIFile file);
```
Erzeugt eine [nsIProcess](https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIProcess)-Instanz der angegebenen Datei.

```fnpreview
nsIFile _sc.file(string path, [opt] bool failsafe);
```
Erzeugt eine [nsIFile](https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIFile)-Instanz aus dem angegeben Pfad.

* **path:**
  Pfad der Datei, zu der eine nsIFile-Instanz erzeugt werden soll.
* **failsafe:**
  Falls ```true```, so wird kein Fehler geworfen falls das Erstellen der Datei fehlschlägt. Es wird ein Objekt mit einer Funktion ```exists()``` (gleichnamig mit der Funktion ```exists()``` aus nsIFile) zurückgegeben, die ```false``` zurückgibt.

```fnpreview
nsIProperties _sc.dirserv();
```
Erzeugt eine [nsIProperties](https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIProperties)-Instanz.

```fnpreview
nsIINIParserFactory _sc.inifact();
```
Erzeugt eine [nsIINIParserFactory](https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIINIParserFactory)-Instanz.

```fnpreview
nsIFileOutputStream _sc.ofstream(nsIFile file, long ioFlags, long perm, long behaviorFlags);
```
Erzeugt eine [nsIFileOutputStream](https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIFileOutputStream)-Instanz und initialisiert diese mit den angegebenen Parametern. Für die Parameter, siehe https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIFileOutputStream#init().

```fnpreview
nsIFileInputStream _sc.ifstream(nsIFile file, long ioFlags, long perm, long behaviorFlags);
```
Erzeugt eine [nsIFileInputStream](https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIFileInputStream)-Instanz und initialisiert diese mit den angegebenen Parametern. Für die Parameter, siehe https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIFileInputStream#init().

```fnpreview
nsIBinaryOutputStream _sc.bostream();
```
Erzeugt eine [nsIBinaryOutputStream](https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIBinaryOutputStream)-Instanz.

```fnpreview
nsIBinaryInputStream _sc.binstream();
```
Erzeugt eine [nsIBinaryInputStream](https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIBinaryInputStream)-Instanz.

```fnpreview
nsIConverterOutputStream _sc.costream();
```
Erzeugt eine [nsIConverterOutputStream](https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIConverterOutputStream)-Instanz.

```fnpreview
nsIConverterInputStream _sc.cistream();
```
Erzeugt eine [nsIConverterInputStream](https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIConverterInputStream)-Instanz.

```fnpreview
nsIDragService _sc.dragserv();
```
Erzeugt eine [nsIDragService](https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIDragService)-Instanz.

```fnpreview
nsIIOService _sc.ioserv();
```
Erzeugt eine [nsIIOService](https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIIOService)-Instanz.

```fnpreview
nsITransferable _sc.transferable();
```
Erzeugt eine [nsITransferable](https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsITransferable)-Instanz.

```fnpreview
nsIServerSocket _sc.serversocket();
```
Erzeugt eine [nsIServerSocket](https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIServerSocket)-Instanz.

```fnpreview
nsISocketTransportService _sc.socktsvc();
```
Erzeugt eine [nsISocketTransportService](https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsISocketTransportService)-Instanz.

```fnpreview
nsIScriptableInputStream _sc.isstream();
```
Erzeugt eine [nsIScriptableInputStream](https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIScriptableInputStream)-Instanz.

```fnpreview
nsIInputStreamPump _sc.istreampump();
```
Erzeugt eine [nsIInputStreamPump](https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIInputStreamPump)-Instanz.

```fnpreview
nsIErrorService _sc.errsvc();
```
Erzeugt eine [nsIErrorService](https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIErrorService)-Instanz.

```fnpreview
nsIFileOutputStream _sc.sfostream();
```
Erzeugt eine [nsIFileOutputStream](https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIFileOutputStream)-Instanz.

```fnpreview
nsIScreenManager _sc.screenmgr();
```
Erzeugt eine [nsIScreenManager](https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIScreenManager)-Instanz.

```fnpreview
nsiScreen _sc.filepicker();
```
Erzeugt eine [nsiScreen](https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsiScreen)-Instanz.

```fnpreview
nsIWindowsRegKey _sc.wregkey();
```
Erzeugt eine [nsIWindowsRegKey](https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIWindowsRegKey)-Instanz.

```fnpreview
nsIClipboardHelper _sc.cbHelper();
```
Erzeugt eine [nsIClipboardHelper](https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIClipboardHelper)-Instanz.

```fnpreview
nsIClipboard _sc.clipboard();
```
Erzeugt eine [nsIClipboard](https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIClipboard)-Instanz.

```fnpreview
nsISupportsString _sc.supportsstr();
```
Erzeugt eine [nsISupportsString](https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsISupportsString)-Instanz.

```fnpreview
nsICryptoHash _sc.cryptohash();
```
Erzeugt eine [nsICryptoHash](https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsICryptoHash)-Instanz.

```fnpreview
mozIJSSubScriptLoader _sc.subscript();
```
Erzeugt eine [mozIJSSubScriptLoader](https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/mozIJSSubScriptLoader)-Instanz.

## Attribute

| Attribut | Typ | Beschreibung |
|----------|-----|--------------|
| env | [nsIEnvironment](https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIEnvironment) | nsIEnvironment-Instanz zum Arbeiten mit Umgebungsvariablen. |
| runtime | [nsIXULRuntime](https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIXULRuntime) | nsIXULRuntime-Instanz. |
| chpath | string | Gibt den Pfad bis zum chrome-Ordner (```./chrome```) als absoluten Pfad an. |
| profd | string | Gibt den Pfad zum aktuell genutzten Profil an. (Unter Windows z.B. unter ```%APPDATA%\Windmill\windmill\Profiles\[AktuellesProfil]\```) |
| clipboard2 | object | High-Level-Clipboard-API. Siehe https://developer.mozilla.org/en-US/Add-ons/SDK/High-Level_APIs/clipboard für weitere Informationen |

# Konstanten Shortcuts

Über das Shortcut-Objekt für Konstanten ```_scc``` lassen sich auch XPCOM-Konstanten benutzen. Aktuell sind folgende implementiert:

| Konstante | Wert |
|----------|-----|
| PR_RDONLY | 0x01 |
| PR_WRONLY | 0x02 |
| PR_RDWR | 0x04 |
| PR_CREATE_FILE | 0x08 |
| PR_APPEND | 0x10 |
| PR_TRUNCATE | 0x20 |
| PR_SYNC | 0x40 |
| PR_EXCL | 0x80 |
| PR_IXOTH | 0x0001 |
| PR_IWOTH | 0x0002 |
| PR_IROTH | 0x0004 |
| PR_IRWXO | 0x0007 |
| PR_IXGRP | 0x0010 |
| PR_IWGRP | 0x0020 |
| PR_IRGRP | 0x0040 |
| PR_IRWXG | 0x0070 |
| PR_IXUSR | 0x0100 |
| PR_IWUSR | 0x0200 |
| PR_IRUSR | 0x0400 |
| PR_IRWXU | 0x0700 |

# Windmill Interface Shortcuts

Für Windmill Interfaces gibt es ein spezielles Shortcut-Objekt ```_ws```.

## Funktionen

```fnpreview
wmProcess _sc.pr(...);
```
Erzeugt eine [wmProcess](#)-Instanz. Die angegebenen Parameter werden dabei direkt an den Konstruktor von wmProcess weitergeleitet. Für weitere Informationen siehe [wmProcess](#).