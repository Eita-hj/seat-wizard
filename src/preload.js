const { contextBridge, ipcRenderer } = require("electron/renderer");

contextBridge.exposeInMainWorld("electronAPI", {
	savedata: (key, value) => ipcRenderer.sendSync("savedata", { key, value }),
	loaddata: (key) => ipcRenderer.sendSync("loaddata", { key }),
	deletedata: (key) => ipcRenderer.sendSync("deletedata", { key }),
	output: () => ipcRenderer.invoke("output"),
});
