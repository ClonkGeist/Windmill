<<<setConfigData
# setConfigData

**<ConfigEntry>** setConfigData(**string** section, **string** key, val, **bool** save, ...);
Setzt den Wert des jeweiligen Konfigurationseintrags. Falls der Eintrag noch nicht vorhanden ist, wird dieser neu erstellt.

- **section:**
  Sektion unter dem der Konfigurationseintrags gespeichert werden soll.
- **key:**
  Key des Konfigurationseintrags.
- **val:**
  Wert, auf den der Konfigurationseintrag gesetzt wird. Objekte werden hierbei über ```JSON.stringify``` in ein String-konformes Format übersetzt, welches bei ```getConfigData``` wieder aufgelöst wird.
- **save:**
  Speichert (nur) den Eintrag nachdem dieser gesetzt worden ist. Dies sollte, um IO-Zugriffe zu verringern, möglichst nur in Fällen benutzt werden, wo einzelne Einträge sofort gespeichert werden sollten. Falls mehrere Einträge gleichzeitig oder in kurzen Abständen gespeichert werden, sollte möglichst auf [saveConfig](#) zurückgegriffen werden.
- **...:**
  Weitere Parameter die an den Konstruktor von [ConfigEntry](#) übergeben werden.
