/// <reference types="vite/client" />

export type HandleResult =
  | {
      success: true
      data?: any
    }
  | {
      success: false
      message: string
    }

export interface GlobalMethods {
  ListViewer: {
    log: (...args: any[]) => void
    getPkg: (slug: string, url: string) => Promise<HandleResult>
    removePkg: (slug: string, removeData?: boolean) => Promise<HandleResult>
    // request: (url: string, timeout: number) => Promise<HandleResult>
  }
}

export type Plugin = { repo: string; branch: string }
export type PluginList = Plugin[]
export type GetPkgType = 'repo' | 'release'

declare global {
  declare namespace LiteLoader {
    const path: ILiteLoaderPath
    const versions: ILiteLoaderVersion
    const os: ILiteLoaderOS
    const package: ILiteLoaderPackage
    const config: {
      LiteLoader: {
        disabled_plugins: string[]
      }
    }
    const plugins: Record<string, ILiteLoaderPlugin>
    const api: ILiteLoaderAPI

    interface ILiteLoaderPath {
      root: string
      profile: string
      data: string
      plugins: string
    }

    interface ILiteLoaderVersion {
      qqnt: string
      liteloader: string
      node: string
      chrome: string
      electron: string
    }

    interface ILiteLoaderOS {
      platform: 'win32' | 'linux' | 'darwin'
    }

    interface ILiteLoaderPackage {
      liteloader: object
      qqnt: object
    }

    interface ILiteLoaderPlugin {
      manifest: Manifest
      incompatible: boolean
      disabled: boolean
      path: ILiteLoaderPluginPath
    }

    interface ILiteLoaderPluginPath {
      plugin: string
      data: string
      injects: ILiteLoaderPluginPathInject
    }

    interface ILiteLoaderPluginPathInject {
      main: string
      renderer: string
      preload: string
    }

    interface ILiteLoaderAPI {
      openPath: (path: string) => void
      openExternal: (url: string) => void
      disablePlugin: (slug: string) => void
      config: ILiteLoaderAPIConfig
    }

    interface ILiteLoaderAPIConfig {
      set: <IConfig = unknown>(slug: string, new_config: IConfig) => unknown
      get: <IConfig = unknown>(slug: string, default_config?: IConfig) => IConfig | PromiseLike<IConfig>
    }
  }

  declare const ListViewer: GlobalMethods['ListViewer']

  const SettingElementStyleSheets: {
    styleSheets: CSSStyleSheet
    on: (css: CSSStyleSheet) => void
  }
  interface Manifest {
    manifest_version?: number
    /** 插件类型 */
    type?: 'extension' | 'theme' | 'framework'
    /** 插件名字 */
    name: string
    /** 代码内标识 */
    slug: string
    /** 插件描述 */
    description: string
    /** 版本号 */
    version: string
    /** 插件的图标，写入相对路径字符串 */
    icon?: string | null
    /** 置选项的图标，写入相对路径字符串 */
    thumb?: string | null
    /** 作者们的信息 */
    authors: Author[]
    /** 插件仓库信息 */
    repository: Repository
    /** 插件支持的系统平台 */
    platform: Array<'win32' | 'linux' | 'darwin'>
    /** 要注入的脚本 */
    injects: Injects
    /** 插件依赖项，写入插件slug名 */
    dependencies?: string[]
  }

  interface Injects {
    renderer: string
    main: string
    preload: string
  }

  interface Repository {
    repo: string
    branch: string
    release: Release
  }

  interface Release {
    tag: string
    file: string
  }

  interface Author {
    name: string
    link: string
  }
}

// export {}
