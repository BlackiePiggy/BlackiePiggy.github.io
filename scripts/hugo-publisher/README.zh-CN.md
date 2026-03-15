# Hugo 可视化发帖器

这个工具会读取 `archetypes/*.md`，自动生成发帖表单，并创建 Hugo page bundle：

- 生成：`content/<section>/<slug>/index.md`
- 可选上传封面图：`content/<section>/<slug>/featured.png|jpg|webp`
- 支持在页面里 `Ctrl+V` 粘贴图片

## 本地运行

1. 在站点根目录执行：

```bash
npm run publisher
```

2. 浏览器打开：

```text
http://localhost:4312
```

3. 在网页里选择 archetype，填写字段后点击“发布新文章”。

## 字段规则说明

- 字段来自 archetype Front Matter 顶层 key。
- 页面会标记“必选/可选”。
- 当前“必选”是按启发式判断：
  - archetype 默认值为空，且注释不包含 `optional`/`可选` 时，视为必选。
- 复杂字段（如对象、列表块）用 YAML 文本框编辑。

## 兼容性

- 你当前仓库存在 `event / idea / publications` archetypes。
- 若要发到 `projects` 等目录，可在页面的 `Section` 手动填写 `projects`。

## 与 Hugo 联动

发帖后可继续在另一个终端执行：

```bash
npm run dev
```

然后访问 Hugo 本地站点预览内容。
