# BlackiePiggy.github.io

这是一个基于 `Hugo` 构建的个人博客/作品展示站点，并在模板基础上扩展了一套自建内容管理系统 `Publisher CMS`。  
当前项目已经不再是原始 Hugo Blox 模板示例，而是一个可用于实际写作、管理内容、处理富文本图片上传的个人站点工程。

## 项目概览

项目目前包含三部分核心能力：

1. Hugo 静态站点
   负责博客、项目、想法、出版物等内容页面的生成与展示。

2. 自建 Publisher CMS
   位于 `/publisher/`，提供：
   - 新建发布页面
   - 内容管理页面
   - 编辑文章页面
   - 富文本图片上传工具入口

3. 本地 Publisher API
   用一个本地 Node 服务统一提供：
   - 新建文章
   - 修改文章
   - 删除文章
   - 读取已有内容列表
   - 读取单篇内容并回填编辑
   - 富文本 Media 自动上传 OSS 工具接口
   - 富文本上传工具静态页面服务

## 主要功能

### 1. 动态模板发文

项目会自动识别 `archetypes/*.md` 模板，并生成可用于 CMS 的动态表单结构。

当前已经支持：
- 识别不同 archetype 模板
- 将 front matter 字段映射为表单
- 日期字段一键填写当前时刻
- featured 图片上传/粘贴
- 生成标准 Hugo 文章目录

生成的文章结构示例：

```text
content/projects/my-post/index.md
content/projects/my-post/featured.png
```

生成的 `index.md` 会自动满足：

```md
---
title: test
date: 2026-03-12T16:50:20+08:00
image:
  filename: featured.png
  focal_point: Smart
featured: true
draft: false
---

<!--more-->

正文内容
```

### 2. 内容管理

`/publisher/manage.html` 提供内容管理能力：

- 按分类读取 `content/<type>/<slug>/index.md`
- 卡片式展示已有文章
- 支持单列/多列切换
- 展示封面图、标题、日期、摘要
- 无图文章显示占位提示
- 点击进入编辑页面
- 删除文章并二次确认

### 3. 编辑页面

`/publisher/edit.html` 支持：

- 根据 `template + slug` 读取已有文章
- 把字段回填到表单
- 修改后覆盖原内容
- `body` 提供 Markdown 实时预览
- 更新 featured 图片

### 4. 富文本 Media 自动上传 OSS

项目中原有一个独立目录 `markdown_media_upload/`，现在它的功能已经并入统一的 Publisher API 中。

现在通过：

`/publisher/media-upload.html`

即可访问该工具，功能包括：

- 粘贴飞书/富文本内容
- 扫描其中的 media 资源
- 逐个上传到阿里云 OSS
- 将原始 media 链接替换为 OSS 链接
- 输出替换后的文本结果

注意：
- 该工具页面仍然尽量保持原逻辑
- 但服务端接口已经并入 `scripts/local-publish-server.cjs`
- 不再需要单独跑 `markdown_media_upload/server.js`

## 目录结构

主要目录如下：

```text
archetypes/                 Hugo 内容模板
assets/                     站点资源
config/                     Hugo 配置
content/                    实际内容
markdown_media_upload/      原始富文本上传工具源码（已整合进本地 API）
scripts/                    构建脚本、启动脚本、本地 API
static/publisher/           Publisher CMS 前端页面
worker-api/                 Cloudflare Worker API（用于线上发布）
```

重点文件：

- `scripts/local-publish-server.cjs`
  本地统一 API 服务

- `scripts/generate-publisher-templates.cjs`
  从 `archetypes/*.md` 生成 CMS 模板描述

- `static/publisher/index.html`
  CMS 总览页

- `static/publisher/create.html`
  新建发布页

- `static/publisher/manage.html`
  内容管理页

- `static/publisher/edit.html`
  编辑页

- `static/publisher/media-upload.html`
  富文本 Media 上传入口页

## 本地开发

### 环境要求

- Node.js
- Hugo
- npm

建议版本：

- Node.js 20+
- Hugo Extended

### 安装依赖

根目录安装：

```bash
npm install
```

如果你需要单独研究 `markdown_media_upload/` 的原始项目，也可以进入其目录使用它自己的依赖，但当前日常使用不需要单独运行它。

### 生成 CMS 模板

当你修改了 `archetypes/*.md` 后，需要重新生成 Publisher 使用的模板定义：

```bash
npm run cms:generate
```

该命令会生成：

- `static/admin/config.yml`
- `static/publisher/templates.json`

## 启动方式

项目本地运行需要启动两个服务：

1. Hugo 站点
2. Publisher 本地 API

### Windows

启动 Hugo：

双击：

- `scripts/start-hugo.bat`

启动 Publisher API：

双击：

- `scripts/start-publisher-api.bat`

### macOS

先赋予执行权限：

```bash
chmod +x scripts/start-hugo.sh
chmod +x scripts/start-publisher-api.sh
```

然后分别运行：

```bash
./scripts/start-hugo.sh
./scripts/start-publisher-api.sh
```

### 默认地址

启动完成后可访问：

- Hugo 首页：`http://localhost:1313/`
- Publisher CMS：`http://localhost:1313/publisher/`
- 新建发布：`http://localhost:1313/publisher/create.html`
- 内容管理：`http://localhost:1313/publisher/manage.html`
- Media Upload：`http://localhost:1313/publisher/media-upload.html`

本地 Publisher API 默认地址：

- `http://127.0.0.1:8790`

默认密码：

- `123456`

## Publisher API 说明

本地服务入口：

- `scripts/local-publish-server.cjs`

主要接口：

- `GET /templates`
  返回模板定义

- `GET /content?template=projects`
  返回某分类下内容列表

- `GET /content/item?template=projects&slug=my-post`
  返回单篇文章内容

- `POST /publish`
  新建文章

- `POST /update`
  覆盖修改文章

- `POST /delete`
  删除文章目录

- `POST /api/oss/test`
  测试 OSS 连接

- `POST /api/media/upload-one`
  上传单个媒体资源

- `POST /api/media/replace`
  批量替换并上传媒体资源

- `GET /media-upload-tool/*`
  提供富文本上传工具静态页面资源

## Publisher CMS 页面说明

### 总览页

路径：

- `/publisher/`

作用：

- 统一导航入口
- 进入新建发布
- 进入内容管理
- 进入 Media Upload 工具

### 新建发布页

路径：

- `/publisher/create.html`

特点：

- 动态模板表单
- featured 图上传/粘贴
- `body` Markdown 实时预览
- 日期字段“当前时刻”快捷按钮

### 内容管理页

路径：

- `/publisher/manage.html`

特点：

- 文章卡片展示
- 单列/多列切换
- 编辑入口
- 删除入口
- 删除确认弹窗

### 编辑页

路径：

- `/publisher/edit.html`

特点：

- 自动回填文章内容
- 修改后覆盖
- Markdown 实时预览
- 更新图片

### Media Upload 工具页

路径：

- `/publisher/media-upload.html`

特点：

- 加载整合后的富文本上传工具
- 默认走统一本地 API 服务
- 不再单独依赖 `3000` 端口

## 新增模板的方式

如果你想新增新的文章类型或 front matter 字段：

1. 在 `archetypes/` 新增模板，例如：

```text
archetypes/notes.md
```

2. 写好 front matter 字段

3. 运行：

```bash
npm run cms:generate
```

4. 重启 Hugo 或刷新 `/publisher/create.html`

新模板就会出现在发布页中。

## 线上发布

项目也保留了线上接口方案：

- `worker-api/`

用于 Cloudflare Worker 部署，适合：

- GitHub Pages 提供静态站点
- Cloudflare Worker 提供动态发布 API

这部分适合线上使用。  
本地调试时，推荐优先使用 `scripts/local-publish-server.cjs`。

## 常用命令

```bash
npm install
npm run build
npm run cms:generate
npm run publisher:generate
npm run publisher:local-api
```

## 当前约定

- `slug` 表示文章目录名与 URL 片段
- 发布时如果 `slug` 已存在：
  - 新建模式会报错
  - 编辑模式会覆盖
- 文章 front matter 与正文之间固定插入 `<!--more-->`
- 日期统一写为带时区格式

## 已知注意事项

- 页面中部分中文如果出现乱码，通常是旧文件编码历史问题，不影响核心逻辑
- `Media Upload` 页面会记住最近一次工具地址，如果你曾用过旧的 `3000` 端口地址，页面会自动迁移到新地址
- 本地 API 需要和 Hugo 页面同时启动，否则 CMS 页面会缺少动态功能

## 适合后续继续扩展的方向

- 搜索和筛选内容
- 内容排序和统计面板
- 草稿/发布状态管理
- 图片库管理
- 更完整的线上发布认证流程
