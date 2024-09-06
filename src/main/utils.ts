import http from 'http'
import https from 'https'
import { URL } from 'url'

import { HttpsProxyAgent } from 'https-proxy-agent'
import { HttpProxyAgent } from 'http-proxy-agent'
import { SocksProxyAgent } from 'socks-proxy-agent'
import type { RequestOptions } from '../global'

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
    const requestOptions: http.RequestOptions | https.RequestOptions = {
      host: urlObj.host,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      protocol: urlObj.protocol,
      hostname: urlObj.hostname,
      timeout: options.timeout || 3e4,
      method: options.method || 'GET',
      headers: {
        ...(isPost && options.body ? { 'Content-Length': Buffer.byteLength(typeof options.body === 'object' ? JSON.stringify(options.body) : options.body), 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {})
      },
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
        resolve({
          data: data,
          str: data.toString('utf-8'),
          status: res.statusCode,
          statusText: res.statusMessage,
          url: res.url
        })
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
