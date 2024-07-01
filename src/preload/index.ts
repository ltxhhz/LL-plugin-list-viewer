import { contextBridge, ipcRenderer } from 'electron'
import { GlobalMethods } from '../global'

const aa: <K extends keyof GlobalMethods>(apiKey: K, api: GlobalMethods[K]) => void = contextBridge.exposeInMainWorld as any

aa('ListViewer', {
  getPkg: (slug, url) => ipcRenderer.invoke('LiteLoader.ListViewer.getPkg', slug, url),
  removePkg: slug => ipcRenderer.invoke('LiteLoader.ListViewer.removePkg', slug),
  log: (...args) => ipcRenderer.send('LiteLoader.ListViewer.removePkg', ...args)
  // request: (url, timeout) => ipcRenderer.invoke('LiteLoader.ListViewer.request', url, timeout)
})
