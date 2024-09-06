import { compare } from 'compare-versions'
import pLimit from 'p-limit'
import { HandleResult, Plugin, PluginList } from '../global'
import { QCheck } from './components'
import { config, fetchWithTimeout, getRandomItem, localFetch, originMirrors, initConfig, useMirror, SortType, thisSlug, isSameDay } from './utils'

const listUrl = {
  repo: 'LiteLoaderQQNT/Plugin-List',
  branch: 'v4',
  file: 'plugins.json'
}

const defaultIcon = 'local://root/src/settings/static/default.png'

const domParser = new DOMParser()
type DialogOptions = {
  title: string
  confirm?: string
  cancel?: string
  message?: string
} & (
  | {
      content?: string | HTMLElement
      type: 'message' | 'confirm'
    }
  | {
      type: 'prompt'
      textarea?: boolean
      default?: string
      placeholder?: string
    }
)
let listLoadingPromise: Promise<void[]>

type PluginItemElement = ReturnType<typeof createItemComponent>

const typeMap = {
  extension: '扩展',
  theme: '主题',
  framework: '框架'
}

let pluginList: PluginList
let currentItem: Plugin
let currentManifest: Manifest
let showDialog: <T extends boolean | string | undefined>(option: DialogOptions) => Promise<T>
let filterInput: HTMLInputElement
const filterTypes = {
  extension: {
    label: '扩展',
    checked: true,
    qc: {} as QCheck
  },
  theme: {
    label: '主题',
    checked: true,
    qc: {} as QCheck
  },
  framework: {
    label: '框架',
    checked: true,
    qc: {} as QCheck
  }
}

export function onSettingWindowCreated(view: HTMLElement) {
  initConfig()
  localFetch('/assets/view.html')
    .then(e => e.text())
    .then(async res => {
      const doms = domParser.parseFromString(res, 'text/html')
      filterInput = doms.querySelector<HTMLInputElement>('#list-search')!
      const typeFilterEl = doms.querySelector<HTMLDivElement>('.list-filter-type-checkbox')!
      typeFilterEl.replaceChildren(
        ...Object.keys(filterTypes).map(e1 => {
          const e = filterTypes[e1]
          const qc = new QCheck({
            label: e.label,
            checked: e.checked,
            type: 'checkbox'
          })
          qc.inputEl.addEventListener('change', () => {
            e.checked = qc.inputEl.checked
          })
          e.qc = qc
          return qc.labelEl
        })
      )
      const refreshBtn = doms.querySelector<HTMLButtonElement>('.refresh-btn')!
      const totalEl = doms.querySelector<HTMLSpanElement>('.total-text')!
      const dialogInstall = doms.querySelector<HTMLDialogElement>('.list-dialog-install')!
      const dialogInstallClose = doms.querySelector<HTMLButtonElement>('.list-dialog-install-btn-close')!
      const scrollToTopBtn = doms.querySelector<HTMLButtonElement>('.scroll-to-top-btn')!
      scrollToTopBtn.addEventListener('click', () => {
        view.parentElement!.scrollTo({
          top: 0,
          behavior: 'smooth'
        })
      })
      const versionEl = doms.querySelector<HTMLSpanElement>('.version-text')!
      const versionA = doms.createElement('a')
      versionA.onclick = () => {
        LiteLoader.api.openExternal('https://github.com/' + LiteLoader.plugins[thisSlug].manifest.repository.repo)
      }
      versionA.innerText = LiteLoader.plugins[thisSlug].manifest.version
      versionEl.append(versionA)
      const listRepoA = doms.querySelector<HTMLAnchorElement>('a.list-repo')
      listRepoA!.onclick = () => {
        LiteLoader.api.openExternal(`https://github.com/${listUrl.repo}/tree/${listUrl.branch}`)
      }
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
      let dialogResolve: (value?: boolean) => void
      const dialog = doms.querySelector<HTMLDialogElement>('.list-dialog')!
      const dialogClose = doms.querySelector<HTMLButtonElement>('.list-dialog-btn-close')!
      dialogClose.addEventListener('click', () => {
        dialog.close()
        dialogResolve()
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
      showDialog = <T extends boolean | string | undefined>(option: DialogOptions) => {
        let dialogInput: HTMLInputElement | HTMLTextAreaElement
        dialogTitle.innerText = option.title
        config.debug && console.log('showDialog', JSON.parse(JSON.stringify(option)))
        if (option.type === 'confirm' || option.type === 'message') {
          dialogContent.innerText = option.message || ''
          if (option.content) {
            if (typeof option.content === 'string') {
              dialogContent.innerHTML = option.content
            } else {
              dialogContent.replaceChildren(option.content)
            }
          }
          if (option.type === 'message') {
            dialogCancel.style.display = 'none'
          } else {
            dialogCancel.style.removeProperty('display')
          }
        } else if (option.type === 'prompt') {
          dialogInput = option.textarea ? document.createElement('textarea') : document.createElement('input')
          dialogInput.placeholder = option.placeholder ?? '请输入内容'
          dialogInput.value = option.default ?? ''
          dialogInput.style.width = '100%'
          dialogInput.style.background = 'var(--background_02)'
          dialogInput.style.color = 'var(--bg_white_light)'
          dialogInput.style.marginTop = '10px'

          dialogContent.replaceChildren(option.message || '', dialogInput)
        }
        dialogConfirm.innerText = option.confirm || '确定'
        dialogCancel.innerText = option.cancel || '取消'
        return new Promise<T>(resolve => {
          dialog.showModal()
          dialogResolve = (bool?: boolean) => {
            if (option.type === 'prompt') {
              config.debug && console.log('prompt result:', bool ? dialogInput.value : undefined)
              resolve((bool ? dialogInput.value : undefined) as T)
            } else {
              config.debug && console.log('dialog result:', bool)
              resolve(bool as T)
            }
          }
        })
      }
      const mirrorSwitch = doms.querySelector<HTMLInputElement>('.mirror-switch')!
      mirrorSwitch.toggleAttribute('is-active', config.useMirror)
      mirrorSwitch.onclick = () => {
        const isActive = mirrorSwitch.hasAttribute('is-active')
        mirrorSwitch.toggleAttribute('is-active', !isActive)
        config.useMirror = !isActive
      }
      const mirrorAddBtn = doms.querySelector<HTMLButtonElement>('.mirror-add-btn')!
      mirrorAddBtn.onclick = () => {
        showDialog<string>({
          title: '添加镜像',
          type: 'prompt',
          placeholder: '请输入镜像地址，每行一个',
          message: `请输入镜像地址，每行一个，如果代理方式是完整url在地址后面，比如
https://mirror/https://github.com/xx/xx，则需要写
https://mirror/https://github.com/
如果代理方式是 path在地址后面，比如
https://mirror/xx/xx，则需要写https://mirror
jsdelivr镜像直接按默认那个写就行
内置三个镜像'https://mirror.ghproxy.com', 'https://ghproxy.net', 'https://github.moeyy.xyz'
使用时默认优先使用第一个，如果没有响应才会使用其他镜像`,
          textarea: true,
          default: config.mirrors.downloadUrl.join('\n')
        }).then(res => {
          if (typeof res === 'string') {
            config.mirrors.downloadUrl = res.split('\n')
          }
        })
      }
      const proxySwitch = doms.querySelector<HTMLInputElement>('.proxy-switch')!
      proxySwitch.toggleAttribute('is-active', config.proxy.enabled)
      proxySwitch.onclick = () => {
        const isActive = proxySwitch.hasAttribute('is-active')
        proxySwitch.toggleAttribute('is-active', !isActive)
        config.proxy.enabled = !isActive
        console.log(isActive);
        
      }
      const proxySetBtn = doms.querySelector<HTMLButtonElement>('.proxy-set-btn')!
      proxySetBtn.onclick = () => {
        showDialog<string>({
          title: '设置代理',
          type: 'prompt',
          placeholder: '请输入代理地址',
          message: `请输入代理地址，支持 http、socks，比如 socks://127.0.0.1:10808`,
          default: config.proxy.url
        }).then(res => {
          if (typeof res === 'string') {
            config.proxy.url = res
          }
        })
      }
      const githubtokenSetBtn = doms.querySelector<HTMLButtonElement>('.githubtoken-set-btn')!
      githubtokenSetBtn.onclick = () => {
        showDialog<string>({
          title: '设置GithubToken',
          type: 'prompt',
          placeholder: '请输入GithubToken',
          message: `请输入GithubToken，如果没有请留空，设置了GithubToken可以减少出现请求速领限制的问题
前往 https://github.com/settings/tokens 获取，scope 选择 repo > public_repo`,
          default: config.githubToken
        }).then(res => {
          if (res) {
            config.githubToken = res
          }
        })
      }

      const sortListFunc = (type: SortType) => {
        listLoadingPromise.then(() => {
          config.debug && console.log('开始排序', type)
          switch (type) {
            case 'default':
              pluginListDom.replaceChildren(...Array.from<PluginItemElement>(pluginListDom.children as any).sort((a, b) => (Number(a.dataset.index) || 0) - (Number(b.dataset.index) || 0)))
              break
            case 'installed':
              pluginListDom.replaceChildren(...Array.from<PluginItemElement>(pluginListDom.children as any).sort((a, b) => (Number(b.dataset.installed) || 0) - (Number(a.dataset.installed) || 0)))
              break
            case 'outdated':
              pluginListDom.replaceChildren(...Array.from<PluginItemElement>(pluginListDom.children as any).sort((a, b) => (Number(b.dataset.update) || 0) - (Number(a.dataset.update) || 0)))
              break
            default:
              break
          }
        })
      }

      const sortSelect = doms.querySelector<HTMLSelectElement>('.sort-select')!
      doms.querySelector<HTMLDivElement>(`[data-value="${config.listSortType}"]`)?.setAttribute('is-selected', '')
      sortSelect.addEventListener('selected', (e: any) => {
        config.debug && console.log('列表排序方式改变', e.detail)
        if (config.listSortType !== e.detail.value) {
          sortListFunc(e.detail.value)
        }
        config.listSortType = e.detail.value
      })

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

      const getList1 = (noCache = false) => {
        refreshBtn.setAttribute('is-disabled', '')
        sortSelect.setAttribute('is-disabled', '')
        if (!noCache && !isSameDay(config.listLastForceUpdate)) {
          noCache = true
        }
        listLoadingPromise = getList(noCache)
          .then(async list => {
            if (noCache) {
              config.listLastForceUpdate = +new Date()
            }
            if (typeof list === 'string') {
              showDialog({
                title: '获取列表失败',
                type: 'message',
                message: list
              })
              return []
            }
            pluginList = list
            totalEl.innerText = list.length.toString()
            const promArr: Promise<void>[] = []
            const limit = pLimit(3)
            list.forEach((plugin, i) => {
              const dom = document.createElement('plugin-item') as PluginItemElement
              dom.dataset.name = plugin.repo
              dom.dataset.description = plugin.branch
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
          .finally(() => {
            refreshBtn.removeAttribute('is-disabled')
            sortSelect.removeAttribute('is-disabled')
          })
      }

      refreshBtn.addEventListener('click', () => {
        pluginListDom.replaceChildren()
        getList1(true)
        sortListFunc(config.listSortType)
      })
      getList1()
      sortListFunc(config.listSortType)
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
      config.debug && console.log('组件创建', this)
      if (this.#initialized) return
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
                console.log('安装成功', res)
                if (res.success) {
                  this.dataset.installed = '1'
                  this.dataset.inactive = '1'
                  if (update) {
                    delete this.dataset.update
                    if (res.data?.isManual) {
                      this.dataset.manualUpdate = '1'
                      showDialog<boolean>({
                        title: '手动更新',
                        message: '请手动更新插件，在退出 qq 后，删除原文件夹，重命名带"[list-viewer-updated]"的新文件夹，',
                        type: 'confirm',
                        confirm: '打开插件文件夹',
                        cancel: '稍后再去'
                      }).then(e => {
                        if (e) {
                          LiteLoader.api.openPath(LiteLoader.path.plugins)
                        }
                      })
                    }
                  }
                  config.inactivePlugins.push(this.manifest!.slug)
                  this.updateOpenDirEvent()
                } else {
                  showDialog({ title: '安装失败', message: res.message, type: 'message' })
                }
              })
              .catch(e => {
                console.log('安装失败', e)
                showDialog({ title: '安装失败', message: e.message, type: 'message' })
              })
              .finally(() => {
                console.log('安装结束')
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
        showDialog<boolean>({ title: '卸载', message: `确定要卸载插件 ${this.manifest!.name} 吗？`, type: 'confirm' }).then(e => {
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
        if (manifest !== 404) {
          this.manifest = manifest
        }
        updateElProp(this, manifest, this.dataset.failed!)
        this.retryBtnEl!.innerText = '重试'
        this.retryBtnEl!.removeAttribute('is-disabled')
      })
      this.detailBtnEl = this.shadowRoot!.querySelector('.detail')!
      this.detailBtnEl.addEventListener('click', async () => {
        LiteLoader.api.openExternal(`https://github.com/${pluginList[Number(this.dataset.index)].repo}/tree/${pluginList[Number(this.dataset.index)].branch}`)
      })
      filterInput.addEventListener('input', () => this.updateHidden())
      for (const key in filterTypes) {
        const item = filterTypes[key as keyof typeof filterTypes]
        item.qc.inputEl.addEventListener('change', () => this.updateHidden())
      }
      this.updateHidden()
      this.updateOpenDirEvent()
      this.#initialized = true
      this.#initPromiseResolve?.()
    }

    static get observedAttributes() {
      return ['data-name', 'data-version', 'data-description', 'data-authors', 'data-icon', 'data-failed', 'data-type', 'data-dependencies', 'data-platforms']
    }

    attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null) {
      config.debug && console.log('attributeChangedCallback', name, newValue)
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
                if (this.iconEl!.src === defaultIcon) {
                  // 防止下次出现 https://github.com/ltxhhz/LL-plugin-list-viewer/issues/30
                  return
                }
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
        if ((!filterInput.value || str.toLowerCase().includes(filterInput.value.toLowerCase())) && (filterTypes[this.dataset.type!]?.checked ?? true)) {
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

function updateElProp(el: PluginItemElement, manifest: Manifest | null | 404, repo: string) {
  if (manifest !== 404 && manifest !== null) {
    el.id = `item-${manifest.slug}`
    el.dataset.name = manifest.name
    el.manifest = manifest
    el.updateOpenDirEvent()
    el.dataset.description = manifest.description
    el.dataset.lower4 = Number(manifest.manifest_version) >= 4 ? '' : '1'
    el.dataset.authors = manifest.authors ? '1' : ''
    el.dataset.platforms = manifest.platform.join(' | ')
    el.dataset.installed = LiteLoader.plugins[manifest.slug] ? '1' : ''
    el.dataset.slug = manifest.slug
    el.dataset.icon = getIconUrls(pluginList[Number(el.dataset.index)], manifest).toString()
    el.dataset.defaultIcon = defaultIcon
    el.dataset.type = manifest.type
    el.dataset.dependencies = manifest.dependencies?.length ? '1' : ''
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
      }
    }
  } else {
    el.dataset.failed = repo
    if (manifest === 404) {
      el.dataset.run = '1'
    }
  }
}

async function getList(noCache = false, again = false): Promise<PluginList | string> {
  let url = ''
  if (config.useMirror) {
    const m = getGithubMirror(!again)
    url = useMirror(`https://github.com/${listUrl.repo}/raw/${listUrl.branch}/${listUrl.file}`, m || getRandomItem(originMirrors), !!m)
  } else {
    url = `https://github.com/${listUrl.repo}/raw/${listUrl.branch}/${listUrl.file}`
  }
  return await fetchWithTimeout(url, {
    cache: noCache ? 'no-cache' : 'default'
  })
    .then(res => (res.status === 200 ? JSON.parse(res.str) : null))
    .catch(err => {
      if (again) {
        console.error(`getList ${url}`, err)
        return String(err)
      } else {
        console.warn(`getList ${url}`, err)
        return getList(noCache, true)
      }
    })
}

async function getManifest(item: Plugin, noCache = false, again = false): Promise<Manifest | null | 404> {
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
  let url: string

  let m = getGithubMirror(!again)
  if (config.useMirror) {
    url = useMirror(`https://github.com/${item.repo}/raw/${item.branch}/manifest.json`, m || getRandomItem(originMirrors), !!m)
  } else {
    url = `https://github.com/${item.repo}/raw/${item.branch}/manifest.json`
  }
  return await fetchWithTimeout(url, {
    cache: noCache ? 'no-cache' : 'default'
  })
    .then(res => {
      if (res.status === 200) {
        return JSON.parse(res.str)
      } else {
        m = getGithubMirror(!again)
        if (config.useMirror) {
          url = useMirror(`https://github.com/${item.repo}/raw/${item.branch}/package.json`, m || getRandomItem(originMirrors), !!m)
        } else {
          url = `https://github.com/${item.repo}/raw/${item.branch}/package.json`
        }
        return fetchWithTimeout(url, {
          cache: noCache ? 'no-cache' : 'default'
        }).then(async res1 => {
          if (res1.status === 200) {
            const pkg = JSON.parse(res1.str)
            const obj = pkg.liteloader_manifest
            if (obj) {
              obj.version = pkg.version
              obj.description = pkg.description
              obj.authors = typeof pkg.author === 'string' ? [{ name: pkg.author, link: `https://github.com/${pkg.author}` }] : [pkg.author]
              return obj
            }
          } else {
            if (res.status === 404 || res1.status === 404) {
              return 404
            }
          }
          return null
        })
      }
    })
    .catch(err => {
      if (again) {
        console.error(`getManifest ${url}`, err)
        return null
      } else {
        console.warn(`getManifest ${url}`, err)
        return getManifest(item, noCache, true)
      }
    })
}

async function install(release = false): Promise<HandleResult> {
  let url: string
  config.debug && console.log('install', currentItem)

  if (release) {
    const urlObj = await getLatestReleaseUrl(currentItem, currentManifest)
    if (urlObj.zip) {
      url = urlObj.zip
    } else if (urlObj.message) {
      return {
        success: false,
        message: `github api 获取资产包失败\n\n${urlObj.message}`
      }
    } else {
      const res = await showDialog<boolean>({
        title: '未发现zip资产包',
        message: '是否使用源代码包安装？',
        type: 'confirm'
      })
      if (res) {
        url = urlObj.ball
      } else {
        url = ''
      }
    }
    if (url === '') {
      return {
        success: false,
        message: ''
      }
    }
    if (!url) {
      return {
        success: false,
        message: '获取release包失败'
      }
    }
  } else {
    url = getArchiveUrl(currentItem)
  }
  // throw new Error('not implemented')
  if (config.useMirror) {
    const m = getGithubMirror()
    return ListViewer.getPkg(currentManifest.slug, useMirror(url, m || getRandomItem(originMirrors), !!m))
  } else {
    return ListViewer.getPkg(currentManifest.slug, url)
  }
}

function getIconUrls(item: Plugin, manifest: Manifest): [string?, string?] {
  if (manifest.icon) {
    const iconPath = manifest.icon.replace(/^\.?\//, '')
    const m = getGithubMirror(true)
    const m1 = getGithubMirror()
    if (config.useMirror) {
      return [
        useMirror(`https://github.com/${item.repo}/raw/${item.branch}/${iconPath}`, m || getRandomItem(originMirrors), !!m),
        useMirror(`https://github.com/${item.repo}/raw/${item.branch}/${iconPath}`, m1 || getRandomItem(originMirrors), !!m1)
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

function getGithubMirror(first = false): string | undefined {
  //https://cdn.jsdelivr.net/gh/[user/repo]@[branch]/[file]
  if (first) {
    return config.mirrors.downloadUrl[0]
  }
  return getRandomItem(config.mirrors.downloadUrl.splice(1))
}

function getArchiveUrl(item: Plugin) {
  return `https://github.com/${item.repo}/archive/refs/heads/${item.branch}.zip`
}

async function getLatestReleaseUrl(item: Plugin, manifest: Manifest): Promise<{ zip: string | undefined; ball: string; message: string | undefined }> {
  const url = `https://api.github.com/repos/${item.repo}/releases/latest`
  const headers: Record<string, string> = {}
  if (config.githubToken) {
    headers.Authorization = `Bearer ${config.githubToken}`
  }
  const body = await fetchWithTimeout(url, {
    headers
  })
    .then(e => JSON.parse(e.str))
    .catch(err => {
      throw new Error(`${err.message} \n${url}`)
    })
  const zipFile =
    body.assets?.find?.(asset => asset.name === `${manifest.slug}.zip`) ??
    body.assets?.find?.(asset => asset.name === `${manifest.name}.zip`) ??
    body.assets?.find?.(asset => asset.name.endsWith('.zip'))
  return {
    zip: zipFile?.browser_download_url,
    ball: `https://github.com/${item.repo}/archive/refs/tags/${body.tag_name}.zip`, //body.zipball_url
    message: body.message
  }
}
