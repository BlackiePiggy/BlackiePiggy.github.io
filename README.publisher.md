# Publisher for GitHub Pages + Cloudflare Worker

这个方案把发布功能拆成两部分：

- GitHub Pages：托管静态发布页 `/publisher/`
- Cloudflare Worker：提供动态 API（写入 GitHub 仓库）

## 目录

- 发布页前端：`static/publisher/index.html`
- 模板生成：`scripts/generate-publisher-templates.cjs`
- 模板数据：`static/publisher/templates.json`
- Worker API：`worker-api/src/index.js`
- Wrangler 配置：`worker-api/wrangler.toml`

## 功能

- 自动读取 `archetypes/*.md` 生成动态字段
- 上传/粘贴 featured 图
- 一键发布到 `content/<template>/<slug>/...`
- 用你自己的密码鉴权（`PUBLISH_PASSWORD`）

## 本地准备

```powershell
npm install
npm run cms:generate
hugo server -D
```

访问：

- `http://localhost:1313/publisher/`

说明：本地 `hugo server` 只验证页面，不会执行 Worker。

## 部署 Worker API

1. 安装 Wrangler

```powershell
npm i -g wrangler
```

2. 登录 Cloudflare（按提示打开浏览器授权）

```powershell
wrangler login
```

3. 切到 Worker 目录并部署

```powershell
cd worker-api
wrangler deploy
```

4. 配置 Worker secrets

```powershell
wrangler secret put PUBLISH_PASSWORD
wrangler secret put GITHUB_TOKEN
```

5. 配置 Worker vars（非 secret）

```powershell
wrangler secret put GITHUB_REPO_OWNER
wrangler secret put GITHUB_REPO_NAME
wrangler secret put GITHUB_REPO_BRANCH
wrangler secret put CORS_ORIGIN
```

建议：

- `GITHUB_REPO_BRANCH` 填 `main`
- `CORS_ORIGIN` 填你的 GitHub Pages 域名，例如 `https://blackiepiggy.github.io`

部署完成后你会得到一个地址：

- `https://<worker-name>.<subdomain>.workers.dev`

实际发布 API 填这个：

- `https://<worker-host>/`（根路径就可 POST）

## 在发布页里使用

打开 `https://<your-gh-pages>/publisher/` 后：

1. `Worker API 地址` 填 Worker URL
2. 输入发布密码
3. 选择模板并填写内容
4. 上传或粘贴 featured 图
5. 点击一键发布

## 发布成功后检查

仓库会新增/更新：

- `content/<template>/<slug>/index.md`
- `content/<template>/<slug>/featured.<ext>`（如果上传了图）

## 新增模板流程

1. 在 `archetypes/` 新增模板文件
2. 运行 `npm run cms:generate`
3. 推送到 GitHub Pages
4. 重新打开 `/publisher/` 即可看到新模板

## 安全建议

- 不要把 `GITHUB_TOKEN` 写入仓库文件
- `PUBLISH_PASSWORD` 用强密码并定期轮换
- `CORS_ORIGIN` 限制为你的站点域名，不要长期使用 `*`
