// 接口来自 https://github.com/XIU2/UserScript/blob/master/GithubEnhanced-High-Speed-Download.user.js

const mirrorRepo = 'https://github.com/XIU2/UserScript/blob/master/GithubEnhanced-High-Speed-Download.user.js'
const hostReg = /^https?:\/\/[^/]+/

export const originMirrors = ['https://mirror.ghproxy.com/', 'https://ghproxy.net/', 'https://github.moeyy.xyz/']
export const thisSlug = 'list-viewer'

export type SortType = 'default' | 'installed' | 'outdated'

export interface Config {
  debug: boolean
  inactivePlugins: string[]
  mirrors: {
    downloadUrl: string[]
    // rawUrl: string[]
  }
  useMirror: boolean
  listSortType: SortType
}
export let config: Config

export async function initConfig() {
  const defaultConfig = {
    inactivePlugins: [],
    debug: false,
    useMirror: true,
    mirrors: {
      downloadUrl: ['https://cdn.jsdelivr.net/gh']
      // rawUrl: []
    },
    listSortType: 'default'
  }
  config = await (LiteLoader.api.config.get(thisSlug, defaultConfig) as PromiseLike<Config>)
  const save = debounce((obj: Config) => {
    const objCloned = JSON.parse(JSON.stringify(obj))
    config.debug && console.log('save obj', objCloned)
    LiteLoader.api.config.set(thisSlug, objCloned)
  }, 1e3)
  config = deepWatch(config, () => {
    save(config)
  })
}
export function getDynamicMirror() {
  const m = getRandomItem(originMirrors)
  const url = useMirror(mirrorRepo, m, false)
  return fetchWithTimeout(url)
    .then(e => {
      if (e.status === 200) {
        return e.text().then(str => {
          const reg = /(\w+)\s?=\s?(\[[\s\S]+?\n\s+\]),/g
          let res = reg.exec(str)
          let download_url_us: string[][] = [],
            download_url: string[][] = [],
            raw_url: string[][] = []
          while (res) {
            // console.log(res)
            switch (res[1]) {
              case 'download_url_us':
                download_url_us = eval(res[2].replaceAll('&#10;', '\n'))
                break
              case 'download_url':
                download_url = eval(res[2].replaceAll('&#10;', '\\n'))
                break
              case 'raw_url':
                raw_url = eval(res[2].replaceAll('&#10;', '\\n'))
                raw_url.shift()
                break
              default:
                break
            }
            res = reg.exec(str)
          }
          return {
            download_url_us,
            download_url,
            raw_url
          }
        })
      } else {
        throw new Error(`Fetch mirror failed: ${e.statusText}`)
      }
    })
    .catch(err => {
      throw new Error(`error message: ${err.message}\nurl: ${url}`)
    })
}

export function getRandomItem(arr?: undefined): undefined
export function getRandomItem<T>(arr: Array<T>): T
export function getRandomItem<T>(arr: Array<T> | undefined): T | undefined
export function getRandomItem<T>(arr: Array<T> | undefined): T | undefined {
  return arr ? arr[Math.floor(Math.random() * arr.length)] : undefined
}

export function useMirror(url: string, mirror: string, removeHost = true) {
  if (/\/gh$/.test(mirror) && mirror.includes('jsdelivr')) {
    return (
      mirror +
      url
        .replace(hostReg, '')
        .replace('/raw/', '@')
        .replace(/@v(?!v)/, '@vv')
    )
  } else {
    return mirror + (removeHost ? url.replace(hostReg, '') : url)
  }
}

export function useGeneralMirror(url: string, mirror: string) {
  return mirror + url
}

export function localFetch(path: string, plugin = 'list-viewer') {
  return fetch(`local:///${LiteLoader.plugins[plugin].path.plugin.replace(':\\', '://').replaceAll('\\', '/')}/${path.startsWith('/') ? path.slice(1) : path}`)
}

export function fetchWithTimeout(url: string, options?: RequestInit, timeout = 3e3): Promise<Response> {
  url = getRedirectedGitHubUrl(url) || url
  config.debug && console.log('fetchWithTimeout', url)

  return new Promise((resolve, reject) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
      reject(new Error('请求超时'))
    }, timeout)

    fetch(url, { ...options, signal: controller.signal })
      .then(response => {
        clearTimeout(timeoutId)
        resolve(response)
      })
      .catch(error => {
        clearTimeout(timeoutId)
        reject(error)
      })
  })
}

export function debounce(func: (...args: any[]) => any, delay: number) {
  let timeoutId: any
  return function (...args: any[]) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      func(...args)
    }, delay)
  }
}

export function deepWatch<T extends object>(obj: T, callback: () => void): T {
  const observer = new Proxy(obj, {
    set(target, key, value, receiver) {
      const oldValue = target[key]
      if (oldValue !== value) {
        // 如果值发生变化，调用回调函数
        callback()
        // 对象属性也是对象时，进行深度监听
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          deepWatch(value, callback)
        }
      }
      // 设置新的值
      return Reflect.set(target, key, value, receiver)
    }
  })

  return observer
}

export function getRedirectedGitHubUrl(url: string) {
  const regex = /https:\/\/github\.com\/([^/]+)\/([^/]+)\/raw\/([^/]+)\/(.+)/
  const match = url.match(regex)

  if (match) {
    const user = match[1]
    const repo = match[2]
    const branch = match[3]
    const filePath = match[4]
    return `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${filePath}`
  } 
  // throw new Error('Invalid GitHub URL')
  return
}
