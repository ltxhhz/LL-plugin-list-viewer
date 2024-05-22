// 接口来自 https://github.com/XIU2/UserScript/blob/master/GithubEnhanced-High-Speed-Download.user.js

const mirrorRepo = 'https://github.com/XIU2/UserScript/blob/master/GithubEnhanced-High-Speed-Download.user.js'
const hostReg = /^https?:\/\/[^/]+/

export const originMirrors = ['https://mirror.ghproxy.com/', 'https://ghproxy.net/', 'https://github.moeyy.xyz/']
export const thisSlug = 'list-viewer'

export interface Config {
  debug: boolean
  inactivePlugins: string[]
  mirrors?: {
    downloadUrl: string[][]
    rawUrl: string[][]
  }
  useMirror: boolean
}
export let config: Config

export async function initConfig() {
  const defaultConfig = {
    inactivePlugins: [],
    debug: false,
    useMirror: true
  }
  config = await (LiteLoader.api.config.get(thisSlug, defaultConfig) as PromiseLike<Config>)
  const save = debounce((obj: Config) => {
    LiteLoader.api.config.set(thisSlug, obj)
  }, 1e3)
  config = new Proxy(config, {
    set(target, key, value) {
      target[key] = value
      save(target)
      return true
    }
  })
}
export function getDynamicMirror() {
  const m = getRandomItem(originMirrors)
  const url = useRawMirror(mirrorRepo, m, false)
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

export function useDownloadMirror(url: string, mirror: string, removeHost = true) {
  return mirror + (removeHost ? url.replace(hostReg, '') : url)
}

export function useRawMirror(url: string, mirror: string, removeHost = true) {
  if (/\/gh$/.test(mirror) && mirror.includes('jsdelivr')) {
    return (
      mirror +
      url
        .replace(hostReg, '')
        .replace('/raw/', '@')
        .replace(/^v(?!v)/, 'vv')
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

export function fetchWithTimeout(url: string | URL | Request, options?: RequestInit, timeout = 3e3): Promise<Response> {
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
      func(args)
    }, delay)
  }
}
