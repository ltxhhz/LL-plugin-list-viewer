// 接口来自 https://github.com/XIU2/UserScript/blob/master/GithubEnhanced-High-Speed-Download.user.js
export const download_url_us = [
    ['https://gh.h233.eu.org/https://github.com', '美国', '[美国 Cloudflare CDN] - 该公益加速源由 [@X.I.U/XIU2] 提供'],
    //['https://gh.api.99988866.xyz/https://github.com', '美国', '[美国 Cloudflare CDN] - 该公益加速源由 [hunshcn/gh-proxy] 提供'], // 官方演示站用的人太多了
    ['https://gh.ddlc.top/https://github.com', '美国', '[美国 Cloudflare CDN] - 该公益加速源由 [@mtr-static-official] 提供'],
    //['https://gh2.yanqishui.work/https://github.com', '美国', '[美国 Cloudflare CDN] - 该公益加速源由 [@HongjieCN] 提供'], // 解析错误
    ['https://dl.ghpig.top/https://github.com', '美国', '[美国 Cloudflare CDN] - 该公益加速源由 [feizhuqwq.com] 提供'],
    //['https://gh.flyinbug.top/gh/https://github.com', '美国', '[美国 Cloudflare CDN] - 该公益加速源由 [Mintimate] 提供'], // 错误
    ['https://slink.ltd/https://github.com', '美国', '[美国 Cloudflare CDN] - 该公益加速源由 [知了小站] 提供'],
    //['https://git.xfj0.cn/https://github.com', '美国', '[美国 Cloudflare CDN] - 该公益加速源由 [佚名] 提供'], // 无解析
    ['https://gh.con.sh/https://github.com', '美国', '[美国 Cloudflare CDN] - 该公益加速源由 [佚名] 提供'],
    //['https://ghps.cc/https://github.com', '美国', '[美国 Cloudflare CDN] - 该公益加速源由 [佚名] 提供'], // 提示 blocked
    //['https://gh-proxy.com/https://github.com', '美国', '[美国 Cloudflare CDN] - 该公益加速源由 [佚名] 提供'], // 502
    ['https://cors.isteed.cc/github.com', '美国', "[美国 Cloudflare CDN] - 该公益加速源由 [@Lufs's] 提供"],
    ['https://hub.gitmirror.com/https://github.com', '美国', '[美国 Cloudflare CDN] - 该公益加速源由 [GitMirror] 提供'],
    ['https://sciproxy.com/github.com', '美国', '[美国 Cloudflare CDN] - 该公益加速源由 [sciproxy.com] 提供'],
    ['https://ghproxy.cc/https://github.com', '美国', '[美国 洛杉矶] - 该公益加速源由 [@yionchiii lau] 提供'],
    ['https://cf.ghproxy.cc/https://github.com', '美国', '[美国 Cloudflare CDN] - 该公益加速源由 [@yionchiii lau] 提供'],
    ['https://gh.jiasu.in/https://github.com', '美国', '[美国 Cloudflare CDN] - 该公益加速源由 [@0-RTT] 提供'],
    ['https://dgithub.xyz', '美国', '[美国 西雅图] - 该公益加速源由 [dgithub.xyz] 提供'],
    //['https://download.fgit.cf', '美国', '[美国 洛杉矶] - 该公益加速源由 [FastGit 群组成员] 提供'], // 被投诉挂了
    ['https://download.nuaa.cf', '美国', '[美国 洛杉矶] - 该公益加速源由 [FastGit 群组成员] 提供'],
    ['https://download.scholar.rr.nu', '美国', '[美国 纽约] - 该公益加速源由 [FastGit 群组成员] 提供'],
    //['https://download.njuu.cf', '美国', '[美国 纽约] - 该公益加速源由 [FastGit 群组成员] 提供'], // 域名挂了
    ['https://download.yzuu.cf', '美国', '[美国 纽约] - 该公益加速源由 [FastGit 群组成员] 提供'],
  ],
  download_url = [
    //['https://download.fastgit.org', '德国', '[德国] - 该公益加速源由 [FastGit] 提供&#10;&#10;提示：希望大家尽量多使用前面的美国节点（每次随机 4 个来负载均衡），&#10;避免流量都集中到亚洲公益节点，减少成本压力，公益才能更持久~', 'https://archive.fastgit.org'], // 证书过期
    [
      'https://mirror.ghproxy.com/https://github.com',
      '韩国',
      '[日本、韩国、德国等]（CDN 不固定） - 该公益加速源由 [ghproxy] 提供&#10;&#10;提示：希望大家尽量多使用前面的美国节点（每次随机 负载均衡），&#10;避免流量都集中到亚洲公益节点，减少成本压力，公益才能更持久~',
    ],
    [
      'https://ghproxy.net/https://github.com',
      '日本',
      '[日本 大阪] - 该公益加速源由 [ghproxy] 提供&#10;&#10;提示：希望大家尽量多使用前面的美国节点（每次随机 负载均衡），&#10;避免流量都集中到亚洲公益节点，减少成本压力，公益才能更持久~',
    ],
    [
      'https://kkgithub.com',
      '香港',
      '[中国香港、日本、新加坡等] - 该公益加速源由 [help.kkgithub.com] 提供&#10;&#10;提示：希望大家尽量多使用前面的美国节点（每次随机 4 个来负载均衡），&#10;避免流量都集中到亚洲公益节点，减少成本压力，公益才能更持久~',
    ],
    //['https://download.incept.pw', '香港', '[中国香港] - 该公益加速源由 [FastGit 群组成员] 提供&#10;&#10;提示：希望大家尽量多使用前面的美国节点（每次随机 4 个来负载均衡），&#10;避免流量都集中到亚洲公益节点，减少成本压力，公益才能更持久~'] // ERR_SSL_PROTOCOL_ERROR
  ],
  clone_url = [
    ['https://gitclone.com', '国内', '[中国 国内] - 该公益加速源由 [GitClone] 提供&#10;&#10; - 缓存：有&#10; - 首次比较慢，缓存后较快'],
    ['https://kkgithub.com', '香港', '[中国香港、日本、新加坡等] - 该公益加速源由 [help.kkgithub.com] 提供&#10;&#10; - 缓存：无（或时间很短）'],
    ['https://hub.incept.pw', '香港', '[中国香港、美国] - 该公益加速源由 [FastGit 群组成员] 提供'],
    ['https://mirror.ghproxy.com/https://github.com', '韩国', '[日本、韩国、德国等]（CDN 不固定） - 该公益加速源由 [ghproxy] 提供&#10;&#10; - 缓存：无（或时间很短）'],
    //['https://gh-proxy.com/https://github.com', '韩国', '[韩国] - 该公益加速源由 [ghproxy] 提供&#10;&#10; - 缓存：无（或时间很短）'],
    ['https://githubfast.com', '韩国', '[韩国] - 该公益加速源由 [Github Fast] 提供&#10;&#10; - 缓存：无（或时间很短）'],
    ['https://ghproxy.net/https://github.com', '日本', '[日本 大阪] - 该公益加速源由 [ghproxy] 提供&#10;&#10; - 缓存：无（或时间很短）'],
    ['https://github.moeyy.xyz/https://github.com', '新加坡', '[新加坡、中国香港、日本等]（CDN 不固定） - 该公益加速源由 [Moeyy] 提供&#10;&#10; - 缓存：无（或时间很短）'],
    //['https://slink.ltd/https://github.com', '美国', '[美国 Cloudflare CDN] - 该公益加速源由 [知了小站] 提供'] // 暂无必要
    //['https://hub.gitmirror.com/https://github.com', '美国', '[美国 Cloudflare CDN] - 该公益加速源由 [GitMirror] 提供'], // 暂无必要
    //['https://sciproxy.com/github.com', '美国', '[美国 Cloudflare CDN] - 该公益加速源由 [sciproxy.com] 提供'], // 暂无必要
    //['https://ghproxy.cc/https://github.com', '美国', '[美国 洛杉矶] - 该公益加速源由 [@yionchiii lau] 提供'], // 暂无必要
    //['https://cf.ghproxy.cc/https://github.com', '美国', '[美国 Cloudflare CDN] - 该公益加速源由 [@yionchiii lau] 提供'], // 暂无必要
    //['https://gh.jiasu.in/https://github.com', '美国', '[美国 Cloudflare CDN] - 该公益加速源由 [@0-RTT] 提供'], // 暂无必要
    //['https://dgithub.xyz', '美国', '[美国 西雅图] - 该公益加速源由 [dgithub.xyz] 提供'], // 暂无必要
    //['https://hub.fgit.cf', '美国', '[美国 洛杉矶] - 该公益加速源由 [FastGit 群组成员] 提供'], // 被投诉挂了
    //['https://hub.nuaa.cf', '美国', '[美国 洛杉矶] - 该公益加速源由 [FastGit 群组成员] 提供'], // 暂无必要
    //['https://hub.scholar.rr.nu', '美国', '[美国 纽约] - 该公益加速源由 [FastGit 群组成员] 提供'], // 暂无必要
    //['https://hub.njuu.cf', '美国', '[美国 纽约] - 该公益加速源由 [FastGit 群组成员] 提供'], // 域名挂了
    //['https://hub.yzuu.cf', '美国', '[美国 纽约] - 该公益加速源由 [FastGit 群组成员] 提供'], // 暂无必要
    //['https://hub.0z.gs', '美国', '[美国 Cloudflare CDN]'], // 域名无解析
    //['https://hub.shutcm.cf', '美国', '[美国 Cloudflare CDN]'] // 连接超时
  ],
  raw_url = [
    ['https://raw.githubusercontent.com', 'Github 原生', '[日本 东京]'],
    ['https://raw.kkgithub.com', '香港', '[中国香港、日本、新加坡等] - 该公益加速源由 [help.kkgithub.com] 提供&#10;&#10; - 缓存：无（或时间很短）'],
    ['https://mirror.ghproxy.com/https://raw.githubusercontent.com', '韩国', '[日本、韩国、德国等]（CDN 不固定） - 该公益加速源由 [ghproxy] 提供&#10;&#10; - 缓存：无（或时间很短）'],
    //['https://gh-proxy.com/https://raw.githubusercontent.com', '韩国 2', '[韩国] - 该公益加速源由 [ghproxy] 提供&#10;&#10; - 缓存：无（或时间很短）'],
    ['https://ghproxy.net/https://raw.githubusercontent.com', '日本 1', '[日本 大阪] - 该公益加速源由 [ghproxy] 提供&#10;&#10; - 缓存：无（或时间很短）'],
    [
      'https://fastly.jsdelivr.net/gh',
      '日本 2',
      '[日本 东京] - 该公益加速源由 [JSDelivr CDN] 提供&#10;&#10; - 缓存：有&#10; - 不支持大小超过 50 MB 的文件&#10; - 不支持版本号格式的分支名（如 v1.2.3）',
    ],
    ['https://fastraw.ixnic.net', '日本 3', '[日本 大阪] - 该公益加速源由 [FastGit 群组成员] 提供&#10;&#10; - 缓存：无（或时间很短）'],
    //['https://gcore.jsdelivr.net/gh', '美国', '[美国 Cloudflare CDN] - 该公益加速源由 [JSDelivr CDN] 提供&#10;&#10; - 缓存：有&#10; - 不支持大小超过 50 MB 的文件&#10; - 不支持版本号格式的分支名（如 v1.2.3）'], // 变成 美国 Cloudflare CDN 了
    ['https://cdn.jsdelivr.us/gh', '其他 1', '[韩国、美国、马来西亚、罗马尼亚等]（CDN 不固定） - 该公益加速源由 [@ayao] 提供&#10;&#10; - 缓存：有'],
    ['https://jsdelivr.b-cdn.net/gh', '其他 2', '[中国香港、台湾、日本、新加坡等]（CDN 不固定） - 该公益加速源由 [@rttwyjz] 提供&#10;&#10; - 缓存：有'],
    ['https://github.moeyy.xyz/https://raw.githubusercontent.com', '其他 3', '[新加坡、中国香港、日本等]（CDN 不固定）&#10;&#10; - 缓存：无（或时间很短）'],
    ['https://raw.cachefly.998111.xyz', '其他 4', '[新加坡、日本、印度等]（Anycast CDN 不固定） - 该公益加速源由 [@XxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxX0] 提供&#10;&#10; - 缓存：有（约 12 小时）'],
    //['https://raw.incept.pw', '香港', '[中国香港、美国] - 该公益加速源由 [FastGit 群组成员] 提供&#10;&#10; - 缓存：无（或时间很短）'], // ERR_SSL_PROTOCOL_ERROR
    //['https://ghproxy.cc/https://raw.githubusercontent.com', '美国', '[美国 洛杉矶] - 该公益加速源由 [@yionchiii lau] 提供'], // 暂无必要
    //['https://cf.ghproxy.cc/https://raw.githubusercontent.com', '美国', '[美国 Cloudflare CDN] - 该公益加速源由 [@yionchiii lau] 提供'], // 暂无必要
    //['https://gh.jiasu.in/https://raw.githubusercontent.com', '美国', '[美国 Cloudflare CDN] - 该公益加速源由 [@0-RTT] 提供'], // 暂无必要
    //['https://dgithub.xyz', '美国', '[美国 西雅图] - 该公益加速源由 [dgithub.xyz] 提供'], // 暂无必要
    //['https://raw.fgit.cf', '美国', '[美国 洛杉矶] - 该公益加速源由 [FastGit 群组成员] 提供&#10;&#10; - 缓存：无（或时间很短）'], // 被投诉挂了
    //['https://raw.nuaa.cf', '美国', '[美国 洛杉矶] - 该公益加速源由 [FastGit 群组成员] 提供'], // 暂无必要
    //['https://raw.scholar.rr.nu', '美国', '[美国 纽约] - 该公益加速源由 [FastGit 群组成员] 提供'], // 暂无必要
    //['https://raw.njuu.cf', '美国', '[美国 纽约] - 该公益加速源由 [FastGit 群组成员] 提供&#10;&#10; - 缓存：无（或时间很短）'], // 域名挂了
    //['https://raw.yzuu.cf', '美国', '[美国 纽约] - 该公益加速源由 [FastGit 群组成员] 提供&#10;&#10; - 缓存：无（或时间很短）'], // 暂无必要
    //['https://raw.gitmirror.com', '美国', '[美国 Cloudflare CDN] - 该公益加速源由 [GitMirror] 提供&#10;&#10; - 缓存：有'], // 暂无必要
    //['https://cdn.54188.cf/gh', '美国', '[美国 Cloudflare CDN] - 该公益加速源由 [PencilNavigator] 提供&#10;&#10; - 缓存：有'], // 暂无必要
    //['https://raw.fastgit.org', '德国', '[德国] - 该公益加速源由 [FastGit] 提供&#10;&#10; - 缓存：无（或时间很短）'], // 挂了
    //['https://git.yumenaka.net/https://raw.githubusercontent.com', '美国', '[美国 圣何塞]&#10;&#10; - 缓存：无（或时间很短）'], // 连接超时
  ]

export function localFetch(path: string, plugin = 'list-viewer') {
  return fetch(`local:///${LiteLoader.plugins[plugin].path.plugin.replace(':\\', '://').replaceAll('\\', '/')}/${path.startsWith('/') ? path.slice(1) : path}`)
}

export function fetchWithTimeout(url: string | URL | Request, options?: RequestInit, timeout = 3e3): Promise<Response> {
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
