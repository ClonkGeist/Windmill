<<<CTypes / Windmill Interface
# CTypes

Um Windmill um Funktionen erweitern zu können, die standardmäßig durch Mozillas Libraries nicht (vollständig) bereitgestellt werden, kann die JS-Ctypes Library verwendet werden, womit sich C-Libraries einlesen lassen und somit über JavaScript C-Funktionen zur Verfügung stehen.

Link zur offiziellen Dokumentation von JS-CTypes: https://developer.mozilla.org/en-US/docs/Mozilla/js-ctypes

Die einzelnen Scripts werden über JavaScript Module geladen, die sich in den jeweiligen Unterverzeichnissen für das entsprechende Betriebssystem befinden.

**Achtung:** Geladene JavaScript Module werden gecachet, was dazu führen kann, dass die Modulscripts (zumindest unter Windows-Betriebssysteme) während der Entwicklung manchmal nicht neu geladen werden.
Um den Cache manuell zu leeren kann man die Datei ```C:\Users\[Username]\AppData\Local\Windmill\windmill\Profiles\[Profilname]\startupCache\startupCache.4.little``` löschen oder alternativ durch eine schreibgeschützte, leere Datei ersetzen um das Caching komplett zu deaktivieren.
