// src/main/preload.cts
// Preload script to expose safe APIs to the renderer process

import { contextBridge, ipcRenderer} from "electron";

// Expose a safe API to the renderer process
contextBridge.exposeInMainWorld("myAPI", {

    // Add methods and properties to expose here
    exampleMethod: () => ipcRenderer.invoke("example-channel"),
});