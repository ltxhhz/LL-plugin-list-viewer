# LiteLoaderQQNT Plugin 插件列表查看

> [!NOTE]
> 该插件仅在 Windows 环境下测试开发，未对其他平台进行测试，不保证可用性
>
> 喜欢的话不要吝啬你 star~

## 功能

- 插件列表查看
- 插件检查更新
- 插件安装（支持镜像）
- 插件卸载
- 插件查找

![](./imgs/1.png)

- 依赖查找

![gif](./imgs/2.gif)

## 使用方法

支持 LiteLoader 1.x

### 下载发行版

1. 下载[发行版（release）](https://github.com/ltxhhz/LL-plugin-list-viewer/releases/latest)并解压到某个文件夹中
2. 将解压到的文件夹移动至 `LiteLoaderQQNT数据目录/plugins/` 下面
3. 重启 QQNT

### 使用 git clone

1. clone 本仓库 `git clone https://github.com/ltxhhz/LL-plugin-list-viewer.git`
2. 运行以下命令

```bash
npm i
npm run build
```

3. 如果 clone 到了 `plugins` 目录下，修改 `manifest.json` 中 `inject` 为

```json
"injects": {
    "main": "./dist/main/index.js",
    "preload": "./dist/preload/index.js",
    "renderer": "./dist/renderer/index.js"
}
```

> 否则可以将 `dist` 目录移动到 `LiteLoaderQQNT数据目录/plugins/` 目录下

## 插件开发者注意

`manifest.json` 文件需要严格按照 [LiteLoader 的文档要求](https://liteloaderqqnt.github.io/docs/introduction.html#manifest-json) 进行编写。

> p.s.有一部分插件将字段 `authors:[{}]` 写成了 `author:{}`，这会导致插件开发者显示为空(LiteLoader 中也会)，这里不会做适配。

如果插件的发行版中除了 LiteLoader 插件还有其他压缩包，如 [NapCatQQ](https://github.com/NapNeko/NapCatQQ)，建议将 LiteLoader 插件压缩包以 `mainifest.json` 中 `slug` 或 `name` 命名。

## 已知的问题

> 暂时没有计划修复或无法修复

- 查询慢或者不稳，因为内置的几个镜像是随机使用，可以重新刷新或安装以使用另一个接口
- ~~dialog 展示一次后列表顶部多出一部分空白，并且出现折叠图标，点击无效，同样是 LiteLoader 的组件，可能是 dialog 导致样式改变~~ [已修复#266](https://github.com/LiteLoaderQQNT/LiteLoaderQQNT/issues/266)
- release 更新时需要调用 `api.github.com` ，但没有镜像可用，可能需要配合代理

## 鸣谢

- [ltxhhz](https://github.com/ltxhhz) 辛苦我了
- [LiteLoaderQQNT](https://github.com/LiteLoaderQQNT/LiteLoaderQQNT)
- [LiteLoaderQQNT-PluginTemplate-Vite](https://github.com/MisaLiu/LiteLoaderQQNT-PluginTemplate-Vite)
