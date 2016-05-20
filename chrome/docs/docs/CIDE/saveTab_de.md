<<<saveTab
# saveTab

```fnpreview
bool saveTab(int index, ...);
```
Leitet den Speichervorgang des jeweiligen Tabs ein. Ein Aufruf von [onFileUnchanged()](#) wird hierbei übernommen, muss also nicht mehr getätigt werden.

* **index:**
  ID des Tabs der gespeichert werden soll.
* **...:**
  Weitere Parameter, die an den Callback [saveTabContent()](#) übergeben werden.