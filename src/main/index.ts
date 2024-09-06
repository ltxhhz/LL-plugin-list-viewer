import { ipcMain, IpcMainEvent, dialog, IpcMainInvokeEvent } from 'electron'
import type { GlobalMethods, HandleResult, Config } from '../global'
import fs from 'fs'
import path from 'path'
import StreamZip from 'node-stream-zip'
import { request } from './utils'
import { ProxyAgent } from 'proxy-agent'

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
  const cfg = LiteLoader.api.config.get<Config>(thisSlug) as Config
  cfg.debug && output(args)
})

handle('getPkg', async (_, slug, url) => {
  output('安装', slug, url)
  const cfg = LiteLoader.api.config.get<Config>(thisSlug) as Config
  return await request(url, {
    proxy: cfg.proxy.enabled ? cfg.proxy.url : undefined,
    agent: cfg.proxy.enabled && !cfg.proxy.url ? new ProxyAgent() : undefined
  })
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

handle('request', async (_, url, opt): Promise<HandleResult> => {
  const cfg = LiteLoader.api.config.get<Config>(thisSlug) as Config
  output('正在请求', cfg, url, opt)
  try {
    const res = await request(url, {
      ...opt,
      proxy: cfg.proxy.enabled ? cfg.proxy.url : undefined,
      agent: cfg.proxy.enabled && !cfg.proxy.url ? new ProxyAgent() : undefined
    })
    return {
      success: true,
      data: res
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message
    }
  }
})

function output(...args: any[]) {
  console.log('\x1b[32m[ListViewer]\x1b[0m', ...args)
}

async function installPlugin(cache_file_path: string, slug: string): Promise<HandleResult> {
  const { plugins } = LiteLoader.path
  let plugin_path = LiteLoader.plugins[slug]?.path?.plugin || path.join(plugins, slug)
  let isManual = false
  try {
    // 解压并安装插件
    if (fs.existsSync(plugin_path)) {
      try {
        fs.rmSync(plugin_path, { recursive: true, force: true })
      } catch (error: any) {
        // if (error.code === 'EPERM') {
        output('删除旧插件失败，使用手动方式', error)
        isManual = true
        plugin_path += '[list-viewer-updated]'
        if (fs.existsSync(plugin_path)) {
          throw new Error(`你真tm 够懒的，重命名都不会吗：${plugin_path}`)
        }
        // }
        // throw error
      }
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
      success: true,
      data: {
        isManual
      }
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
