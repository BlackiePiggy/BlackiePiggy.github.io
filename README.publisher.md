# Publisher CMS 本地工作流

这个项目当前只保留本地发布方案，不再提供线上 Worker 发布能力。

## 当前架构

- Hugo：负责站点页面生成
- Publisher CMS：负责本地可视化新建、编辑、删除内容
- Local Publisher API：负责把操作落到本地仓库文件

核心入口：

- 发布页前端：`static/publisher/index.html`
- 模板生成：`scripts/generate-publisher-templates.cjs`
- 模板数据：`static/publisher/templates.json`
- 本地 API：`scripts/local-publish-server.cjs`

## 本地使用

先安装依赖并生成 CMS 模板：

```bash
npm install
npm run cms:generate
```

然后分别启动：

```bash
./scripts/start-hugo.sh
./scripts/start-publisher-api.sh
```

Windows 可双击：

- `scripts/start-hugo.bat`
- `scripts/start-publisher-api.bat`

启动后访问：

- `http://localhost:1313/publisher/`

本地 API 默认：

- 地址：`http://127.0.0.1:8790`
- 密码：`123456`

## 工作方式

Publisher CMS 的所有操作都直接作用于本地仓库：

- 新建文章：写入 `content/<template>/<slug>/index.md`
- 修改文章：覆盖原有内容文件
- 删除文章：删除对应目录
- Featured 图：写入文章目录
- 模板管理：直接修改 `archetypes/*.md`

Media Upload 也走本地 API，不依赖线上服务。

## 实际发布到线上

本地改完内容后，使用你自己的 Git 流程推送即可：

```bash
git status
git add .
git commit -m "feat: update site content"
git push
```

## 说明

- 线上 Worker 目录 `worker-api/` 已移除
- 当前推荐维护方式就是“本地编辑，本地写文件，手动推送”
- Decap CMS 相关目录和生成脚本已经移除
