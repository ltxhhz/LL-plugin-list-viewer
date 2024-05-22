import { compare } from 'compare-versions'
import pLimit from 'p-limit'
import { HandleResult, Plugin, PluginList } from '../global'

import { config, fetchWithTimeout, getDynamicMirror, getRandomItem, localFetch, originMirrors, initConfig, useDownloadMirror, useRawMirror, thisSlug } from './utils'

const listUrl = {
  repo: 'LiteLoaderQQNT/Plugin-List',
  branch: 'v4',
  file: 'plugins.json'
}

const defaultIcon = 'local://root/src/setting/static/default.png'

const domParser = new DOMParser()
interface DialogOptions {
  title: string
  message?: string
  content?: string
  confirm?: string
  cancel?: string
  type: 'message' | 'confirm'
}

type PluginItemElement = ReturnType<typeof createItemComponent>

const typeMap = {
  extension: '扩展',
  theme: '主题',
  framework: '框架'
}

let pluginList: PluginList
let currentItem: Plugin
let currentManifest: Manifest
let showDialog: (option: DialogOptions) => Promise<boolean>
let filterInput: HTMLInputElement

export function onSettingWindowCreated(view: HTMLElement) {
  initConfig().then(async () => {
    if (!config.mirrors) {
      const res = await getDynamicMirror().catch(err => {
        console.error('获取镜像地址失败', err)
      })
      if (res) {
        config.mirrors = {
          downloadUrl: res.download_url.concat(res.download_url_us),
          rawUrl: res.raw_url
        }
      }
    }
  })
  // const ss = SettingElementStyleSheets.styleSheets
  // https://github.com/LiteLoaderQQNT/LiteLoaderQQNT/pull/293
  // for (let i = 0; i < ss[0].cssRules.length; i++) {
  //   const rule = ss[0].cssRules[i]
  //   if (rule.start === ':host(setting-panel)') {
  //     console.log(rule)
  //     rule.cssRules[0].style.overflow = 'visible'
  //     rule.cssRules[0].style.width = '100%'
  //     rule.cssRules[0].style.display = 'inline-block'
  //   }
  // }
  localFetch('/assets/view.html')
    .then(e => e.text())
    .then(async res => {
      const doms = domParser.parseFromString(res, 'text/html')
      filterInput = doms.querySelector<HTMLInputElement>('#list-search')!
      const refreshBtn = doms.querySelector<HTMLButtonElement>('.refresh-btn')!
      const totalEl = doms.querySelector<HTMLSpanElement>('.total-text')!
      const dialogInstall = doms.querySelector<HTMLDialogElement>('.list-dialog-install')!
      const dialogInstallClose = doms.querySelector<HTMLButtonElement>('.list-dialog-install-btn-close')!
      // const mirrorSelect = doms.querySelector<HTMLSelectElement>('.select-mirror')!
      let resFunc: (value?: boolean | PromiseLike<boolean>) => void
      dialogInstallClose.addEventListener('click', () => {
        dialogInstall.close()
        resFunc()
      })
      const useRepo = doms.querySelector<HTMLButtonElement>('.list-dialog-btn-repo')!
      useRepo.addEventListener('click', () => {
        // install()
        dialogInstall.close()
        resFunc(false)
      })
      const useRelease = doms.querySelector<HTMLButtonElement>('.list-dialog-btn-release')!
      useRelease.addEventListener('click', () => {
        // install(true)
        dialogInstall.close()
        resFunc(true)
      })
      let dialogResolve: (value: boolean) => void
      const dialog = doms.querySelector<HTMLDialogElement>('.list-dialog')!
      const dialogClose = doms.querySelector<HTMLButtonElement>('.list-dialog-btn-close')!
      dialogClose.addEventListener('click', () => {
        dialog.close()
      })
      const dialogTitle = doms.querySelector<HTMLDivElement>('.list-dialog-title')!
      const dialogContent = doms.querySelector<HTMLDivElement>('.list-dialog-content')!
      const dialogConfirm = doms.querySelector<HTMLButtonElement>('.list-dialog-btn-confirm')!
      dialogConfirm.addEventListener('click', () => {
        dialog.close()
        dialogResolve(true)
      })
      const dialogCancel = doms.querySelector<HTMLButtonElement>('.list-dialog-btn-cancel')!
      dialogCancel.addEventListener('click', () => {
        dialog.close()
        dialogResolve(false)
      })
      showDialog = option => {
        dialogTitle.innerText = option.title
        if (option.message) {
          dialogContent.innerText = option.message
        }
        if (option.content) {
          dialogContent.innerHTML = option.content
        }
        dialogConfirm.innerText = option.confirm || '确定'
        dialogCancel.innerText = option.cancel || '取消'
        if (option.type === 'message') {
          dialogCancel.style.display = 'none'
        }
        return new Promise<boolean>(resolve => {
          dialog.showModal()
          dialogResolve = resolve
        })
      }
      const mirrorSwitch = doms.querySelector<HTMLInputElement>('.mirror-switch')!
      mirrorSwitch.toggleAttribute('is-active', config.useMirror)
      mirrorSwitch.onclick = () => {
        const isActive = mirrorSwitch.hasAttribute('is-active')
        mirrorSwitch.toggleAttribute('is-active', !isActive)
        config.useMirror = !isActive
        LiteLoader.api.config.set(thisSlug, config)
      }

      doms.body.childNodes.forEach(dom => {
        view.appendChild(dom)
      })
      const showInstallDialog = () =>
        new Promise<boolean | undefined>(resolve => {
          dialogInstall.showModal()
          resFunc = resolve
        })

      createItemComponent(await localFetch('/assets/list-item.html').then(e => e.text()), showInstallDialog)

      const pluginListDom = view.querySelector('#plugin-list')!

      const getList1 = (noCache = false) =>
        getList(noCache).then(async list => {
          pluginList = list
          totalEl.innerText = list.length.toString()
          const promArr: Promise<void>[] = []
          const limit = pLimit(3)
          list.forEach((plugin, i) => {
            const dom = document.createElement('plugin-item') as PluginItemElement
            pluginListDom.appendChild(dom)
            promArr.push(
              limit(async () => {
                const manifest = await getManifest(plugin, noCache)
                dom.dataset.index = i + ''
                config.debug && console.log(plugin, manifest)
                updateElProp(dom, manifest, plugin.repo)
              })
            )
          })
          return Promise.all(promArr)
        })

      refreshBtn.addEventListener('click', () => {
        pluginListDom.replaceChildren()
        getList1(true)
      })
      getList1()
    })
    .catch(console.error)
}

function createItemComponent(innerHtml: string, showInstallDialog: () => PromiseLike<boolean | undefined>) {
  class PluginListClass extends HTMLElement {
    titleEl?: HTMLSpanElement
    descriptionEl?: HTMLSpanElement
    versionEl?: HTMLSpanElement
    authorsEl?: HTMLDivElement
    manipulateEl?: HTMLDivElement
    iconEl?: HTMLImageElement
    updateBtnEl?: HTMLButtonElement
    installBtnEl?: HTMLButtonElement
    uninstallBtnEl?: HTMLButtonElement
    detailBtnEl?: HTMLButtonElement
    retryBtnEl?: HTMLButtonElement
    typeEl?: HTMLSpanElement
    dependenciesItemsEl?: HTMLSpanElement
    platformsEl?: HTMLSpanElement
    manifest: Manifest | null = null

    #initPromise: Promise<void>
    #initPromiseResolve: ((e: void | PromiseLike<void>) => void) | undefined
    #initialized = false

    constructor() {
      super()
      const shadow = this.attachShadow({ mode: 'open' })
      shadow.innerHTML = innerHtml
      this.#initPromise = new Promise(resolve => {
        this.#initPromiseResolve = resolve
        if (this.#initialized) resolve()
      })
    }

    connectedCallback() {
      this.titleEl = this.shadowRoot!.querySelector('.title')!
      this.descriptionEl = this.shadowRoot!.querySelector('.description')!
      this.versionEl = this.shadowRoot!.querySelector('.version')!
      this.authorsEl = this.shadowRoot!.querySelector('.authors')!
      this.manipulateEl = this.shadowRoot!.querySelector('.manipulate')!
      this.iconEl = this.shadowRoot!.querySelector('.icon')!
      this.typeEl = this.shadowRoot!.querySelector('.type')!
      this.dependenciesItemsEl = this.shadowRoot!.querySelector('.dependencies>.items')!
      this.platformsEl = this.shadowRoot!.querySelector('.platforms')!

      this.updateBtnEl = this.shadowRoot!.querySelector('.update')!
      const installEvent = async (update = false) => {
        currentItem = pluginList[Number(this.dataset.index)]
        currentManifest = this.manifest!
        showInstallDialog().then(res => {
          if (res !== undefined) {
            if (update) {
              this.updateBtnEl!.setAttribute('is-disabled', '')
              this.updateBtnEl!.innerText = '安装中...'
            } else {
              this.installBtnEl!.setAttribute('is-disabled', '')
              this.installBtnEl!.innerText = '安装中...'
            }
            install(res)
              .then(res => {
                if (res.success) {
                  this.dataset.installed = '1'
                  this.dataset.inactive = '1'
                  if (update) delete this.dataset.update
                  config.inactivePlugins.push(this.manifest!.slug)
                  LiteLoader.api.config.set(thisSlug, config)
                  this.updateOpenDirEvent()
                } else {
                  showDialog({ title: '安装失败', message: res.message, type: 'message' })
                }
              })
              .catch(e => {
                showDialog({ title: '安装失败', message: e.message, type: 'message' })
              })
              .finally(() => {
                if (update) {
                  this.updateBtnEl!.removeAttribute('is-disabled')
                  this.updateBtnEl!.innerText = '更新'
                } else {
                  this.installBtnEl!.removeAttribute('is-disabled')
                  this.installBtnEl!.innerText = '安装'
                }
              })
          }
        })
      }
      this.updateBtnEl.addEventListener('click', () => installEvent(true))
      this.installBtnEl = this.shadowRoot!.querySelector('.install')!
      this.installBtnEl.addEventListener('click', () => installEvent())
      this.uninstallBtnEl = this.shadowRoot!.querySelector('.uninstall')!
      this.uninstallBtnEl.addEventListener('click', async () => {
        config.debug && console.log('uninstall', this.manifest!.name)
        currentItem = pluginList[Number(this.dataset.index)]
        currentManifest = this.manifest!
        showDialog({ title: '卸载', message: `确定要卸载插件 ${this.manifest!.name} 吗？`, type: 'confirm' }).then(e => {
          if (e) {
            this.uninstallBtnEl!.innerText = '卸载中...'
            this.uninstallBtnEl!.setAttribute('is-disabled', '')
            uninstall().then(res => {
              if (res.success) {
                this.uninstallBtnEl!.innerText = '卸载'
                this.uninstallBtnEl!.removeAttribute('is-disabled')
                delete this.dataset.installed
                if (config.inactivePlugins.includes(this.manifest!.slug)) {
                  this.dataset.inactive = '0'
                  config.inactivePlugins = config.inactivePlugins.filter(e => e !== this.manifest!.slug)
                  LiteLoader.api.config.set(thisSlug, config)
                }
                this.updateOpenDirEvent()
              } else {
                showDialog({ title: '卸载失败', message: res.message, type: 'message' })
              }
            })
          }
        })
      })
      this.retryBtnEl = this.shadowRoot!.querySelector('.retry')!
      this.retryBtnEl.addEventListener('click', async () => {
        this.retryBtnEl!.innerText = '重试中...'
        this.retryBtnEl!.setAttribute('is-disabled', '')
        const manifest = await getManifest(pluginList[Number(this.dataset.index)])
        this.manifest = manifest
        updateElProp(this, manifest, this.dataset.failed!)
        this.retryBtnEl!.innerText = '重试'
        this.retryBtnEl!.removeAttribute('is-disabled')
      })
      this.detailBtnEl = this.shadowRoot!.querySelector('.detail')!
      this.detailBtnEl.addEventListener('click', async () => {
        LiteLoader.api.openExternal(`https://github.com/${pluginList[Number(this.dataset.index)].repo}/tree/${pluginList[Number(this.dataset.index)].branch}`)
      })
      filterInput.addEventListener('input', () => this.updateHidden())
      this.updateHidden()
      this.updateOpenDirEvent()
      this.#initialized = true
      this.#initPromiseResolve?.()
    }

    static get observedAttributes() {
      return ['data-name', 'data-version', 'data-description', 'data-authors', 'data-icon', 'data-failed', 'data-type', 'data-dependencies', 'data-platforms']
    }

    attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null) {
      this.#initPromise.then(() => {
        try {
          switch (name) {
            case 'data-failed':
              if (newValue) {
                this.titleEl!.innerText = newValue
                this.titleEl!.style.color = 'red'
                this.descriptionEl!.innerText = '获取失败'
              } else {
                this.titleEl!.style.removeProperty('color')
              }
              break
            case 'data-name':
              this.titleEl!.innerText = newValue || '插件名'
              this.titleEl!.title = newValue || ''
              break
            case 'data-version':
              this.versionEl!.innerText = newValue || '版本'
              this.versionEl!.title = newValue || ''
              break
            case 'data-description':
              this.descriptionEl!.innerText = newValue || '插件描述'
              this.descriptionEl!.title = newValue || ''
              break
            case 'data-authors': {
              const arr: Array<{ name: string; link: string }> = newValue === '1' ? this.manifest!.authors! : []

              this.authorsEl!.append(
                ...arr
                  .map(author => {
                    const a = document.createElement('a')
                    a.title = author.link
                    a.innerText = author.name
                    a.onclick = () => LiteLoader.api.openExternal(author.link)
                    return a
                  })
                  .reduce((p, v, i) => {
                    p[i * 2] = v
                    if (i) p[i * 2 - 1] = ' | '
                    return p
                  }, [] as Array<string | Element>)
              )
              break
            }
            case 'data-type':
              this.typeEl!.innerText = typeMap[newValue + ''] || 'unknown'
              break
            case 'data-platforms':
              this.platformsEl!.title = this.platformsEl!.innerText = newValue || ''
              break
            case 'data-dependencies': {
              const arr: string[] = newValue === '1' ? this.manifest!.dependencies! : []

              this.dependenciesItemsEl!.append(
                ...arr
                  .map(e => {
                    const a = document.createElement('a')
                    a.title = e
                    a.innerText = e
                    a.onclick = () => {
                      const item = document.getElementById(`item-${e}`)
                      if (item) {
                        item.scrollIntoView?.()
                        item.classList.add('highlight-item')

                        setTimeout(() => {
                          item.classList.remove('highlight-item')
                        }, 2e3)
                      }
                    }
                    return a
                  })
                  .reduce((p, v, i) => {
                    p[i * 2] = v
                    if (i) p[i * 2 - 1] = ' | '
                    return p
                  }, [] as Array<string | Element>)
              )
              break
            }
            case 'data-icon': {
              const [src, src1] = (newValue || '').split(',')
              this.iconEl!.src = src || defaultIcon
              let num = 0
              this.iconEl!.addEventListener('error', () => {
                if (src1 && num < 3) {
                  //兼容打包方式（路径相对src，打包后才正常）
                  const iconPath = this.manifest!.icon!.replace(/^\.?\//, '')
                  switch (num) {
                    case 0:
                      this.iconEl!.src = src.replace(iconPath, `src/${iconPath}`)
                      break
                    case 1:
                      this.iconEl!.src = src1
                      break
                    case 2:
                      this.iconEl!.src = src1.replace(iconPath, `src/${iconPath}`)
                      break
                  }
                } else {
                  this.iconEl!.src = defaultIcon
                }
                num++
              })
              break
            }
            default:
              break
          }
        } catch (error) {
          console.error(this.dataset.name || this.dataset.failed, error)
        }
      })
    }

    updateOpenDirEvent() {
      if (this.manifest && LiteLoader.plugins[this.manifest.slug] && this.dataset.installed === '1') {
        this.titleEl!.title = '点击打开插件所在目录'
        this.titleEl!.addEventListener('click', () => {
          LiteLoader.api.openPath(LiteLoader.plugins[this.manifest!.slug].path.plugin)
        })
        this.titleEl!.style.cursor = 'pointer'
      }
    }

    /**
     * 过滤用，判断是否应该隐藏
     */
    updateHidden() {
      try {
        const authors: Array<{ name: string; link: string }> = this.dataset.authors === '1' ? this.manifest!.authors : []
        const str = (this.dataset.name || '') + (this.dataset.version || '') + (this.dataset.description || '') + (this.dataset.version || '') + authors.map(e => e.name).join('')
        if (!filterInput.value || str.toLowerCase().includes(filterInput.value.toLowerCase())) {
          this.hidden = false
        } else {
          this.hidden = true
        }
      } catch (error) {
        console.error(this.manifest?.slug || this.dataset.name, error)
      }
    }
  }
  customElements.define('plugin-item', PluginListClass)
  return new PluginListClass()
}

function updateElProp(el: PluginItemElement, manifest: Manifest | null, repo: string) {
  if (manifest) {
    el.id = `item-${manifest.slug}`
    el.dataset.name = manifest.name
    el.manifest = manifest
    el.updateOpenDirEvent()
    el.dataset.description = manifest.description
    el.dataset.lower4 = Number(manifest.manifest_version) >= 4 ? '' : '1'
    el.dataset.authors = manifest.authors ? '1' : ''
    el.dataset.platforms = manifest.platform.join('|')
    el.dataset.installed = LiteLoader.plugins[manifest.slug] ? '1' : ''
    el.dataset.slug = manifest.slug
    el.dataset.icon = getIconUrls(pluginList[Number(el.dataset.index)], manifest).toString()
    el.dataset.defaultIcon = defaultIcon
    el.dataset.type = manifest.type
    el.dataset.dependencies = manifest.dependencies ? '1' : ''
    delete el.dataset.failed
    if (LiteLoader.plugins[manifest.slug]) {
      el.dataset.version = LiteLoader.plugins[manifest.slug].manifest.version
      config.debug && console.log(manifest.slug, LiteLoader.plugins[manifest.slug], manifest)
      el.dataset.update = compare(manifest.version, LiteLoader.plugins[manifest.slug]?.manifest?.version ?? manifest.version, '>') ? '1' : ''
      el.shadowRoot!.querySelector<HTMLElement>('.newer-version')!.innerText = `-> ${manifest.version}`
    } else {
      el.dataset.version = manifest.version
    }
    if (config.inactivePlugins.includes(manifest.slug)) {
      if (!LiteLoader.plugins[manifest.slug]) {
        el.dataset.inactive = '1'
      } else {
        config.inactivePlugins = config.inactivePlugins.filter(v => v !== manifest.slug)
        LiteLoader.api.config.set(thisSlug, config)
      }
    }
  } else {
    el.dataset.failed = repo
  }
}

async function getList(noCache = false): Promise<PluginList> {
  let url
  try {
    return await fetchWithTimeout((url = `https://cdn.jsdelivr.net/gh/${listUrl.repo}@${listUrl.branch.replace(/^v(?!v)/, 'vv')}/${listUrl.file}`), {
      cache: noCache ? 'no-cache' : 'default'
    }).then(res => (res.status === 200 ? res.json() : null))
  } catch (err) {
    console.warn(`getList jsdelivr ${url}`, err)
    return await fetchWithTimeout(`${getGithubMirror()}https://raw.githubusercontent.com/${listUrl.repo}/${listUrl.branch}/${listUrl.file}`, {
      cache: noCache ? 'no-cache' : 'default'
    })
      .then(res => (res.status === 200 ? res.json() : null))
      .catch(err => {
        console.error(`getList ${url}`, err)
        return null
      })
  }
}

async function getManifest(item: Plugin, noCache = false): Promise<Manifest | null> {
  // if (item.repo === 'ltxhhz/LL-plugin-list-viewer') {
  //   return Promise.resolve({
  //     $schema: './manifest_schema.json',
  //     manifest_version: 4,
  //     type: 'extension',
  //     name: '插件列表查看',
  //     slug: 'list-viewer',
  //     description: '插件列表查看·安装·更新',
  //     version: '9.9.9',
  //     authors: [
  //       {
  //         name: 'ltxhhz',
  //         link: 'https://github.com/ltxhhz'
  //       }
  //     ],
  //     platform: ['win32', 'linux', 'darwin'],
  //     injects: {
  //       main: './main/index.js',
  //       preload: './preload/index.js',
  //       renderer: './renderer/index.js'
  //     },
  //     repository: {
  //       repo: 'ltxhhz/LL-plugin-list-viewer',
  //       branch: 'master'
  //     }
  //   } as any)
  // }
  let url: any

  let m = getGithubMirror()
  if (config.useMirror) {
    url = useRawMirror(`https://github.com/${item.repo}/raw/${item.branch}/manifest.json`, m || getRandomItem(originMirrors), !!m)
  } else {
    url = `https://github.com/${item.repo}/raw/${item.branch}/manifest.json`
  }
  return await fetchWithTimeout(url, {
    cache: noCache ? 'no-cache' : 'default'
  })
    .then(res => {
      if (res.status === 200) {
        return res.json()
      } else {
        m = getGithubMirror()
        if (config.useMirror) {
          url = useRawMirror(`https://github.com/${item.repo}/raw/${item.branch}/package.json`, m || getRandomItem(originMirrors), !!m)
        } else {
          url = `https://github.com/${item.repo}/raw/${item.branch}/package.json`
        }
        return fetchWithTimeout(url, {
          cache: noCache ? 'no-cache' : 'default'
        }).then(async res1 => {
          if (res1.status === 200) {
            const pkg = await res1.json()
            const obj = pkg.liteloader_manifest
            if (obj) {
              obj.version = pkg.version
              obj.description = pkg.description
              obj.authors = typeof pkg.author === 'string' ? [{ name: pkg.author, link: `https://github.com/${pkg.author}` }] : [pkg.author]
              return obj
            }
          }
          return null
        })
      }
    })
    .catch(err => {
      config.debug && console.log(`getManifest ${url}`, err)
      return null
    })
}

async function install(release = false): Promise<HandleResult> {
  let url: string
  config.debug && console.log('install', currentItem)

  if (release) {
    url = await getLatestReleaseUrl(currentItem)
    if (!url) {
      return Promise.resolve({
        success: false,
        message: '获取release包失败'
      })
    }
  } else {
    url = getArchiveUrl(currentItem)
  }
  // throw new Error('not implemented')
  if (config.useMirror) {
    const m = getGithubMirror()
    return ListViewer.getPkg(currentManifest.slug, useDownloadMirror(url, m || getRandomItem(originMirrors), !!m))
  } else {
    return ListViewer.getPkg(currentManifest.slug, url)
  }
}

function getIconUrls(item: Plugin, manifest: Manifest): [string?, string?] {
  if (manifest.icon) {
    const iconPath = manifest.icon.replace(/^\.?\//, '')
    const m = getGithubMirror()
    if (config.useMirror) {
      return [
        `https://cdn.jsdelivr.net/gh/${item.repo}@${item.branch.replace(/^v(?!v)/, 'vv')}/${iconPath}`,
        useDownloadMirror(`https://github.com/${item.repo}/raw/${item.branch}/${iconPath}`, m || getRandomItem(originMirrors), !!m)
      ]
    } else {
      return [`https://github.com/${item.repo}/raw/${item.branch}/${iconPath}`]
    }
  }
  return []
}

function uninstall() {
  return ListViewer.removePkg(currentManifest.slug)
}

function getGithubMirror() {
  //https://cdn.jsdelivr.net/gh/[user/repo]@[branch]/[file]
  return getRandomItem(config.mirrors?.downloadUrl?.map?.(e => e[0]))
}

function getArchiveUrl(item: Plugin) {
  return `https://github.com/${item.repo}/archive/refs/heads/${item.branch}.zip`
}

async function getLatestReleaseUrl(item: Plugin) {
  const url = `https://api.github.com/repos/${item.repo}/releases/latest`
  const body = await fetchWithTimeout(url)
    .then(e => e.json())
    .catch(err => {
      throw new Error(`${err.message} \n${url}`)
    })
  const zipFile = body.assets.find(asset => asset.name.endsWith('.zip'))
  return zipFile.browser_download_url
}
