import { ipcMain, IpcMainEvent, dialog, IpcMainInvokeEvent } from 'electron'
import { GlobalMethods, HandleResult } from '../global'
import fs from 'fs'
import path from 'path'
import StreamZip from 'node-stream-zip'
import http from 'http'
import https from 'https'

const thisSlug = 'list-viewer'

const listen = <K extends keyof GlobalMethods['ListViewer']>(channel: K, cb: (e: IpcMainEvent, ...args: Parameters<GlobalMethods['ListViewer'][K]>) => void) =>
  ipcMain.on('LiteLoader.ListViewer.' + channel, cb)
const handle = <K extends keyof GlobalMethods['ListViewer']>(
  channel: K,
  cb: (e: IpcMainInvokeEvent, ...args: Parameters<GlobalMethods['ListViewer'][K]>) => ReturnType<GlobalMethods['ListViewer'][K]>
) => ipcMain.handle('LiteLoader.ListViewer.' + channel, cb)

// export const onBrowserWindowCreated = (window: BrowserWindow) => {
//   console.log('A window has just been created')
//   console.log(window)
// }

listen('log', (_, args) => {
  output(args)
})

handle('getPkg', async (_, slug, url) => {
  output('安装', slug, url)
  return await request(url)
    .then(res => {
      output('下载完成', slug)
      const zip = path.join(LiteLoader.plugins[thisSlug].path.data, `${slug}.zip`)
      fs.writeFileSync(zip, res.data)
      output('写入', zip)
      return installPlugin(zip, slug)
    })
    .catch(err => {
      // throw new Error(`${err.message} \n${url}`)
      return {
        success: false,
        message: err.message
      }
    })
})

handle('removePkg', async (_e, slug, removeData = false): Promise<HandleResult> => {
  output('卸载', slug)
  let plugin, data
  if (LiteLoader.plugins[slug]) {
    ;({ plugin, data } = LiteLoader.plugins[slug].path)
  } else {
    output('未激活的插件，寻找路径', slug)
    plugin = findPluginPath(slug)
    if (!plugin) {
      return {
        success: false,
        message: '未找到插件路径'
      }
    }
    output('寻找到的路径', plugin)
  }
  try {
    if (removeData && data) {
      fs.rmdirSync(data, { recursive: true })
    }
    fs.rmdirSync(plugin, { recursive: true })
    output('卸载完成', slug)
    return {
      success: true
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message
    }
  }
})

// handle('request',(_,url,timeout)=>{
//   return request(url)
// })

function output(...args: any[]) {
  console.log('\x1b[32m[ListViewer]\x1b[0m', ...args)
}

function request(url: string): Promise<{
  data: Buffer
  str: string
  url?: string
}> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http
    const req = protocol.get(url)
    req.on('error', reject)
    req.on('response', res => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400) {
        return resolve(request(res.headers.location!))
      }
      const chunks = <any>[]
      res.on('error', error => reject(error))
      res.on('data', chunk => chunks.push(chunk))
      res.on('end', () => {
        const data = Buffer.concat(chunks)
        resolve({
          data: data,
          str: data.toString('utf-8'),
          url: res.url
        })
      })
    })
  })
}

async function installPlugin(cache_file_path: string, slug: string): Promise<HandleResult> {
  const { plugins } = LiteLoader.path
  const plugin_path = LiteLoader.plugins[slug]?.path?.plugin || path.join(plugins, slug)
  try {
    // 解压并安装插件
    if (fs.existsSync(plugin_path)) {
      fs.rmSync(plugin_path, { recursive: true, force: true })
    }
    fs.mkdirSync(plugin_path, { recursive: true })
    output('开始解压', cache_file_path)
    const zip = new StreamZip.async({ file: cache_file_path, skipEntryNameValidation: true })
    const entries = await zip.entries()
    const isFolder = !Object.hasOwn(entries, 'manifest.json') // 判断是否需要保留一级目录 true为不保留
    for (const entry of Object.values(entries)) {
      if (isPathUnsafe(entry.name)) {
        return {
          success: false,
          message: '压缩包中含有不安全路径'
        }
      }
      if (!entry.name.includes('.github')) {
        const pathname = `${plugin_path}/${isFolder ? entry.name.split('/').slice(1).join('/') : entry.name}`
        // 创建目录
        if (entry.isDirectory) {
          fs.mkdirSync(pathname, { recursive: true })
          continue
        } else {
          const pdir = path.dirname(pathname)
          if (!fs.existsSync(pdir)) {
            fs.mkdirSync(pdir, { recursive: true })
          }
        }
        // 创建文件 有时不会先创建目录
        try {
          if (entry.isFile) {
            await zip.extract(entry.name, pathname)
            continue
          }
        } catch (error) {
          fs.mkdirSync(pathname.slice(0, pathname.lastIndexOf('/')), { recursive: true })
          await zip.extract(entry.name, pathname)
          continue
        }
      }
    }
    await zip.close()
    output('解压完成', cache_file_path)
    fs.rmSync(cache_file_path, { force: true })
    output('删除完成', cache_file_path)
    return {
      success: true
    }
  } catch (error: any) {
    dialog.showErrorBox('插件列表查看', error.stack || error.message)
    // 安装失败删除文件
    if (!LiteLoader.plugins[slug]) fs.rmSync(plugin_path, { recursive: true, force: true })
    fs.rmSync(cache_file_path, { force: true })
    if (error.message.includes('Bad archive')) {
      return {
        success: false,
        message: '安装包异常'
      }
    }
    return {
      success: false,
      message: '安装失败 ' + error.message
    }
  }
}

function findPluginPath(slug: string) {
  const dirs = fs.readdirSync(LiteLoader.path.plugins).map(e => path.join(LiteLoader.path.plugins, e))
  const dirs1 = Object.values(LiteLoader.plugins).map(e => e.path.plugin)
  return dirs
    .filter(e => !dirs1.includes(e))
    .find(e => {
      try {
        const manifest = JSON.parse(fs.readFileSync(path.join(e, 'manifest.json')).toString())
        if (manifest.slug === slug) {
          return true
        }
      } catch (error) {
        output('findManifest', error)
      }
      return false
    })
}

function isPathUnsafe(path) {
  return /^(\/|\\|[a-zA-Z]:\\|[a-zA-Z]:\/|.*\.\..*)/.test(path)
}
