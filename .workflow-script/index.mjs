import { cpSync, mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import superagent from 'superagent'
// import { HttpsProxyAgent } from 'https-proxy-agent'
import pLimit from 'p-limit'

// const agent = new HttpsProxyAgent('http://127.0.0.1:10809')

const listUrl = {
  repo: 'LiteLoaderQQNT/Plugin-List',
  branch: 'v4',
  file: 'plugins.json'
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const __filename = fileURLToPath(import.meta.url)

const limit = pLimit(5)
const outPath = join(__dirname, 'output')

mkdirSync(outPath, { recursive: true })

async function main() {
  const allIconsUrls = {}
  const meta = {
    time: Date.now(),
    count: 0,
    success: 0,
    failed: 0
  }
  /** @type {Plugin[]} */
  const list = await superagent.get(getRawUrl(listUrl, listUrl.file)).then(res => JSON.parse(res.text))
  // const list = [{ repo: 'MisaLiu/LiteLoaderQQNT-QQCleaner', branch: 'master' }]
  meta.count = list.length
  const getManifestPromises = list.map((plugin, index) =>
    limit(async () => {
      console.log(`获取 ${plugin.repo}`)
      /**@type {Manifest} */
      const manifest = await superagent
        .get(getRawUrl(plugin, 'manifest.json')) //.agent(agent)
        .then(res => JSON.parse(res.text))
        .catch(async e => {
          if (e.status == 404) {
            return await superagent
              .get(getRawUrl(plugin, 'package.json')) //.agent(agent)
              .then(res => {
                const pkg = JSON.parse(res.text)
                const obj = pkg.liteloader_manifest
                if (obj) {
                  obj.version = pkg.versionre
                  obj.description = pkg.description
                  obj.authors =
                    typeof pkg.author === 'string'
                      ? [
                          {
                            name: pkg.author,
                            link: `https://github.com/${pkg.author}`
                          }
                        ]
                      : [pkg.author]
                  return obj
                }
                return null
              })
              .catch(e => {
                if (e.status == 404) {
                  return 404
                }
                console.error(e)
              })
          }
          console.error(e)
        })
      list[index].manifest = manifest || null
      if (manifest) {
        meta.success++
        allIconsUrls[manifest.slug] = getIconUrls(plugin, manifest)
      }
    })
  )
  await Promise.all(getManifestPromises)
  meta.failed = meta.count - meta.success
  console.log('插件获取完成', meta)
  writeFileSync(join(outPath, 'all-manifest.json'), JSON.stringify(list))
  console.log('all-manifest.json 已写入')
  console.log('开始获取图标', allIconsUrls)
  const allIcons = await getIcons(allIconsUrls)
  console.log(
    '图标获取完成',
    Object.keys(allIcons).filter(k => allIcons[k])
  )
  writeFileSync(join(outPath, 'all-icons.json'), JSON.stringify(allIcons))
  console.log('all-icons.json 已写入')
  writeFileSync(join(outPath, 'meta.json'), JSON.stringify(meta))
  console.log('meta.json 已写入')
  cpSync(join(__dirname, 'index.html'), join(outPath, 'index.html'), { force: true })
  console.log('index.html 已写入')
}

/**
 * @typedef {{ repo: string; branch: string }} Plugin
 * @param {Plugin} item
 * @param {'package.json'|'manifest.json'} type
 */
function getRawUrl(item, type) {
  return `https://raw.githubusercontent.com/${item.repo}/${item.branch}/${type}`
}

/**
 * @param {Plugin} item
 * @param {Manifest} manifest
 */
function getIconUrls(item, manifest) {
  if (manifest.icon) {
    const iconPath = manifest.icon.replace(/^\.?\//, '')
    return [getRawUrl(item, iconPath), getRawUrl(item, `src/${iconPath}`)]
  }
}

/**
 * @param {Record<string,ReturnType<typeof getIconUrls>>} allIcons
 */
async function getIcons(allIcons) {
  const icons = {}
  for (const repo in allIcons) {
    const urls = allIcons[repo]
    if (urls) {
      for (const url of urls) {
        const { body, type } = await superagent.get(url).catch(err => {
          if (err.status !== 404) {
            console.error(err)
          }
          return {}
        })
        if (Buffer.isBuffer(body)) {
          icons[repo] = `data:${type};base64,${body.toString('base64')}`
          break
        }
      }
    }
  }
  return icons
}

main()

// superagent.get('https://raw.githubusercontent.com/elegantland/qqMessageBlocker/main/icon.jpg').then(e => {
//   console.log(e);

// })
