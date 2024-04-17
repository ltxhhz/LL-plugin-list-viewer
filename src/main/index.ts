import { ipcMain, BrowserWindow } from 'electron';

ipcMain.on('LLTemplate-Vite.Greeting', (e, name: string) => {
  console.log('Hello, ' + name + '!');
});

export const onBrowserWindowCreated = (window: BrowserWindow) => {
  console.log('A window has just been created');
  console.log(window);
};