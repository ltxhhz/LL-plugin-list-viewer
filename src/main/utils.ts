import http from 'http'
import https from 'https'
import { URL } from 'url'
import fs from 'fs'
import path from 'path'

import { HttpsProxyAgent } from 'https-proxy-agent'
import { HttpProxyAgent } from 'http-proxy-agent'
import { SocksProxyAgent } from 'socks-proxy-agent'
import type { Config, RequestOptions } from '../global'

const thisSlug = 'list-viewer'
export function request(
  url: string,
  options: RequestOptions = {}
): Promise<{
  data: Buffer
  str: string
  status?: number
  statusText?: string
  url?: string
}> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const protocol = urlObj.protocol === 'https:' ? https : http

    const isPost = options.method === 'POST'
    const headers = {
      ...(isPost && options.body ? { 'Content-Length': Buffer.byteLength(typeof options.body === 'object' ? JSON.stringify(options.body) : options.body), 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
    if (
      !Object.keys(headers)
        .map(e => e.toLowerCase())
        .includes('user-agent')
    ) {
      headers['user-agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0'
    }
    const requestOptions: http.RequestOptions | https.RequestOptions = {
      host: urlObj.host,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      protocol: urlObj.protocol,
      hostname: urlObj.hostname,
      timeout: options.timeout || 3e4,
      method: options.method || 'GET',
      headers,
      agent: options.proxy
        ? options.proxy.startsWith('socks')
          ? new SocksProxyAgent(options.proxy)
          : urlObj.protocol === 'https:'
          ? new HttpsProxyAgent(options.proxy, {
              rejectUnauthorized: false
            })
          : new HttpProxyAgent(options.proxy, {
              rejectUnauthorized: false
            })
        : options.agent,
      rejectUnauthorized: false
    }

    const req = protocol.request(requestOptions, res => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400) {
        return resolve(request(res.headers.location!, options)) // 处理重定向
      }

      const chunks: any[] = []
      res.on('error', error => reject(error))
      res.on('data', chunk => chunks.push(chunk))
      res.on('end', () => {
        const data = Buffer.concat(chunks)
        const obj = {
          data: data,
          str: data.toString('utf-8'),
          status: res.statusCode,
          statusText: res.statusMessage,
          url: res.url
        }
        output(obj)
        resolve(obj)
      })
    })

    req.on('error', reject)
    req.on('timeout', () => reject(new Error('请求超时')))

    if (isPost && options.body) {
      req.write(typeof options.body === 'object' ? JSON.stringify(options.body) : options.body)
    }

    req.end() // 完成请求
  })
}

export function output(...args: any[]) {
  try {
    if ((LiteLoader.api.config.get<Config>(thisSlug) as Config).debug) {
      fs.appendFileSync(
        path.join(LiteLoader.plugins[thisSlug].path.data, 'debug.log'),
        `[${new Date().toLocaleString()}] ${args
          .map(e =>
            JSON.stringify(
              e,
              (_key, value) => {
                if (typeof value === 'bigint') return value.toString()
                else if (value?.type === 'Buffer' && Array.isArray(value.data)) return `Buffer<${value?.data?.length}>`
                return value
              },
              2
            )
          )
          .join(' ')}\n`
      )
    }
  } catch (error) {
    console.warn('\x1b[32m[ListViewer]\x1b[0m', '输出到日志文件失败', error)
  }

  console.log('\x1b[32m[ListViewer]\x1b[0m', ...args)
}
