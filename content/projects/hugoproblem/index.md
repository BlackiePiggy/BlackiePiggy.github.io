---
title: hugo pages线上部署和本地不一致
date: 2026-03-12T12:46:18+08:00
image:
  filename: featured.png
  focal_point: Smart
links:
  - type: site
tags:
  - Technique
featured: true
draft: false
---

<!--more-->

## 问题描述

线上的Projects页面长这样

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153419/media-001-1773300860192.png)

主页的Projects长这样

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153419/media-002-1773300860561.png)

本地使用指令：

```Shell
git clone <你的仓库-url>
cd <你的仓库-name>
pnpm install
hugo --gc --minify
hugo server
```

验证后，在本地是这样。可以正确展示缩略图

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153419/media-003-1773300860796.png)

主页也能正确展示

![img](https://picture-jasonlee.oss-cn-shanghai.aliyuncs.com/media_20260312_153419/media-004-1773300861051.png)

## 解决方案

核验本地执行的log：

```Bash
Microsoft Windows [版本 10.0.19044.6937] (c) Microsoft Corporation。保留所有权利。  E:\>git clone git@github.com:BlackiePiggy/BlackiePiggy.github.io.git Cloning into 'BlackiePiggy.github.io'... remote: Enumerating objects: 391, done. remote: Counting objects: 100% (391/391), done. remote: Compressing objects: 100% (309/309), done. remote: Total 391 (delta 112), reused 292 (delta 57), pack-reused 0 (from 0) Receiving objects: 100% (391/391), 17.44 MiB | 5.56 MiB/s, done. Resolving deltas: 100% (112/112), done.  E:\>cd BlackiePiggy.github.io  E:\BlackiePiggy.github.io>pnpm install Lockfile is up to date, resolution step is skipped Packages: +43 +++++++++++++++++++++++++++++++++++++++++++ Progress: resolved 43, reused 43, downloaded 0, added 43, done  dependencies: + @tailwindcss/cli 4.2.1 + @tailwindcss/typography 0.5.19 + autoprefixer 10.4.24 + postcss 8.5.6 + tailwindcss 4.2.1  ╭ Warning ───────────────────────────────────────────────────────────────────────────────────╮ │                                                                                            │ │   Ignored build scripts: @parcel/watcher.                                                  │ │   Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.   │ │                                                                                            │ ╰────────────────────────────────────────────────────────────────────────────────────────────╯  Done in 524ms using pnpm v10.14.0  E:\BlackiePiggy.github.io>hugo --gc --minify Start building sites … hugo v0.157.0-7747abbb316b03c8f353fd3be62d5011fa883ee6+extended windows/amd64 BuildDate=2026-02-25T16:38:33Z VendorInfo=gohugoio  WARN  Failed to find page for cite shortcode: /publication/preprint WARN  Failed to find page for cite shortcode: /publication/conference-paper WARN  An image named avatar was not found in the /authors/jiayu-li folder WARN  An image named avatar was not found in the /authors/李嘉渝 folder                    │ EN ──────────────────┼─────  Pages            │ 105  Paginator pages  │   1  Non-page files   │  38  Static files     │   3  Processed images │ 386  Aliases          │  32  Cleaned          │   0  Total in 8459 ms  E:\BlackiePiggy.github.io>hugo server port 1313 already in use, attempting to use an available port Watching for changes in C:/Users/jason/AppData/Local/hugo_cache/modules/filecache/modules/pkg/mod/github.com/!hugo!blox/hugo-blox-builder/modules/blox-plugin-netlify@v1.1.2/src/layouts, C:/Users/jason/AppData/Local/hugo_cache/modules/filecache/modules/pkg/mod/github.com/!hugo!blox/hugo-blox-builder/modules/blox-tailwind@v0.5.2/assets/{css,dist,js,media}, C:/Users/jason/AppData/Local/hugo_cache/modules/filecache/modules/pkg/mod/github.com/!hugo!blox/hugo-blox-builder/modules/blox-tailwind@v0.5.2/data/icons, C:/Users/jason/AppData/Local/hugo_cache/modules/filecache/modules/pkg/mod/github.com/!hugo!blox/hugo-blox-builder/modules/blox-tailwind@v0.5.2/i18n, C:/Users/jason/AppData/Local/hugo_cache/modules/filecache/modules/pkg/mod/github.com/!hugo!blox/hugo-blox-builder/modules/blox-tailwind@v0.5.2/layouts/{_markup,_partials,_shortcodes,docs,landing}, C:/Users/jason/AppData/Local/hugo_cache/modules/filecache/modules/pkg/mod/github.com/!hugo!blox/hugo-blox-builder/modules/blox-tailwind@v0.5.2/package.json, E:/BlackiePiggy.github.io/archetypes, E:/BlackiePiggy.github.io/assets/media, E:/BlackiePiggy.github.io/content/{authors,event,idea,post,projects,...}, E:/BlackiePiggy.github.io/package.json, ... and 1 more Watching for config changes in E:\BlackiePiggy.github.io\config\_default, C:\Users\jason\AppData\Local\hugo_cache\modules\filecache\modules\pkg\mod\github.com\!hugo!blox\hugo-blox-builder\modules\blox-plugin-netlify@v1.1.2\config.yaml, C:\Users\jason\AppData\Local\hugo_cache\modules\filecache\modules\pkg\mod\github.com\!hugo!blox\hugo-blox-builder\modules\blox-tailwind@v0.5.2\hugo.yaml, E:\BlackiePiggy.github.io\go.mod Start building sites … hugo v0.157.0-7747abbb316b03c8f353fd3be62d5011fa883ee6+extended windows/amd64 BuildDate=2026-02-25T16:38:33Z VendorInfo=gohugoio  WARN  Failed to find page for cite shortcode: /publication/preprint WARN  Failed to find page for cite shortcode: /publication/conference-paper WARN  An image named avatar was not found in the /authors/jiayu-li folder WARN  An image named avatar was not found in the /authors/李嘉渝 folder                    │ EN ──────────────────┼─────  Pages            │ 105  Paginator pages  │   1  Non-page files   │  38  Static files     │   3  Processed images │ 386  Aliases          │  32  Cleaned          │   0  Built in 1221 ms Environment: "development" Serving pages from disk Running in Fast Render Mode. For full rebuilds on change: hugo server --disableFastRender Web Server is available at http://localhost:8538/ (bind address 127.0.0.1) Press Ctrl+C to stop
```

可以发现，本地跑的是：

```Shell
hugo v0.157.0
```

而你仓库里 Netlify 明确固定的是：

```Shell
HUGO_VERSION = "0.148.2"
```

并且生产构建命令是：

```Shell
pnpm install && hugo --gc --minify -b $URL && pnpm dlx pagefind --source 'public'
```

**同一份内容，在不同 Hugo / 主题渲染环境下，生成结果不同。**

而日志里暴露出明显差异：

- 本地：`0.157.0`
- 线上 Netlify：`0.148.2`

因此，解决方案是把 工程根目录下`netlify.toml` 里的：

```Shell
HUGO_VERSION = "0.148.2"
```

改成和本地hugo版本一致的：

```Shell
HUGO_VERSION = "0.157.0"
```

然后重新部署。

✔成功解决问题

## Github解决方案
修改deploy.yml中的
```
env:
  WC_HUGO_VERSION: '0.148.2'
  NODE_VERSION: '20'
```

为

```
env:
  WC_HUGO_VERSION: '0.157.0'
  NODE_VERSION: '20'
```
然后重新部署。

✔成功解决问题