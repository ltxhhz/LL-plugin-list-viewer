import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('LLTemplate_Vite', {
  greeting: (name: string) => {
    ipcRenderer.send('LLTemplate-Vite.Greeting', name);
  }
});