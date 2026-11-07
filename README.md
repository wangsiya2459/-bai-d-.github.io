# 生物与人工智能研讨会 · BioAI 2026

一个可以直接部署到 **GitHub Pages** 的会议官网。单页结构，纯 HTML / CSS / JavaScript，无构建步骤、无第三方依赖、无外部字体和图片请求，国内访问也不用等 Google Fonts。

> **发布前请先替换示例信息。** 日期 `2026.12.12`、地点 `上海 · 张江`、邮箱 `bioai@example.com`、议程与讲者均为占位内容。全文搜索这几项即可修改。

---

## 1. 本地预览

在项目根目录运行任意静态文件服务器：

```bash
python -m http.server 8000
```

然后打开 <http://localhost:8000>。

不要直接双击 `index.html`。`file://` 协议下部分浏览器会限制 `fetch`、剪贴板等能力；静态服务器最稳。

---

## 2. 部署到你已有的仓库

你的仓库：

```text
https://github.com/wangsiya2459/-bai-d-.github.io
```

按 GitHub 的规则，当前仓库名不是 `wangsiya2459.github.io`，所以它属于 **项目站点（Project Site）**，发布后的地址是：

```text
https://wangsiya2459.github.io/-bai-d-.github.io/
```

当前这个地址已经可以访问（线上是旧版页面）。把下面的文件上传并覆盖根目录的 `index.html` 后，Pages 会自动重新发布，不需要再新建仓库。

### 方式 A：网页上传（最简单）

1. 解压 `bioai-site.zip`。
2. 打开仓库首页，点 **Add file → Upload files**。
3. 把解压后的所有内容拖进去，确保根目录是：
   ```text
   index.html
   404.html
   README.md
   .nojekyll
   robots.txt
   sitemap.xml
   site.webmanifest
   assets/
   scripts/
   ```
   如果 GitHub 网页没有显示 `.nojekyll`，在文件管理器里开启“显示隐藏文件”。这个文件必须保留，否则 Jekyll 可能忽略某些路径。也可以在仓库里用 **Add file → Create new file** 新建一个名为 `.nojekyll` 的空文件。
4. 填写 commit message，例如 `Build BioAI 2026 symposium site`，点 **Commit changes**。
5. 进入 **Settings → Pages**。
6. **Build and deployment → Source** 选择 **Deploy from a branch**。
7. **Branch** 选择 `main`，目录选择 `/ (root)`，点 **Save**。
8. 等待 1–2 分钟，刷新 **Settings → Pages**，会看到 “Your site is live at …”。
9. 打开：
   ```text
   https://wangsiya2459.github.io/-bai-d-.github.io/
   ```

> 如果 Pages 页面显示的是 “GitHub Actions”，请改成 **Deploy from a branch**；这个项目不需要 Actions。

### 方式 B：命令行

```bash
git clone https://github.com/wangsiya2459/-bai-d-.github.io.git
cd -- -bai-d-.github.io
# 把本项目里的文件复制进仓库根目录
git add .
git commit -m "Build BioAI 2026 symposium site"
git push origin main
```

然后在仓库 **Settings → Pages** 里按上面的步骤选择 `main` / `root`。

### 想用根域名 `wangsiya2459.github.io`？

把仓库重命名为 `wangsiya2459.github.io`，Pages 地址就会变成：

```text
https://wangsiya2459.github.io/
```

重命名后记得同步更新这些位置：

- `assets/js/config.js` 里的 `siteUrl` 和 `repo`
- `index.html` 里的 `canonical`、`og:url`、`og:image`、`twitter:image`
- `index.html` 里的 JSON-LD `startDate` / `endDate`（如果改了会议日期）
- `404.html` 里的 `<base href="/-bai-d-.github.io/">`（改成 `<base href="/">`）
- `sitemap.xml` 和 `robots.txt`

---

## 3. 改成你的真实信息

### 3.1 日期、地点、邮箱（最快）

编辑 **`assets/js/config.js`**：

```js
window.BIOAI_CONFIG = {
  eventDate: "2026-12-12T09:00:00+08:00",
  eventEnd: "2026-12-12T17:00:00+08:00",
  dateLabel: "2026.12.12",
  venue: "上海 · 张江",
  format: "线下 + 线上",
  email: "bioai@example.com",
  // ...
};
```

修改后，页面上所有带 `data-site` 的位置、倒计时、日历文件、报名邮件都会同步更新。

### 3.2 议程与讲者

直接编辑 **`index.html`** 中对应的段落：

- 搜索 `03 / PROGRAM` 找到议程
- 搜索 `04 / SPEAKERS` 找到讲者卡片
- 搜索 `05 / CALL FOR POSTERS` 找到海报征集

议程筛选依赖每一行的 `data-track` 属性。可选值：

```text
all / opening / keynote / roundtable / young / industry / closing / break
```

如果新增一个环节，复制一行 `<article class="agenda-row" data-track="keynote">…</article>`，改时间、标题和标签即可。筛选按钮不需要改。

### 3.3 替换主视觉

- 分享卡片：`assets/img/og-cover.jpg`（1200 × 630）
- 关于区图片：`assets/img/about-art.webp` 与 `about-art.jpg`
- 图标：`assets/img/icon-192.png`、`icon-512.png`、`apple-touch-icon.png`
- 浏览器标签图标：`assets/favicon.svg`

这些图都是脚本生成的原创图形。想换风格，可以改 `scripts/make_assets.py` 后重新运行：

```bash
python scripts/make_assets.py
```

需要 Pillow 和 numpy；如果本机没有，直接替换图片文件也可以。

### 3.4 报名表单

表单是 **静态站点方案**，不依赖后端：

1. 用户填写信息；
2. 点击“生成报名邮件”；
3. 页面生成一封预填好的邮件，用户在自己的邮件客户端里发送；
4. 站点不存储任何数据。

因此必须把 `config.js` 里的 `email` 换成真实可用的组委会邮箱。表单的 `action` 也建议同步修改（在 `index.html` 搜索 `registration-form`），这样在 JavaScript 失效时仍有一个兜底。

如果以后想接问卷或报名系统（腾讯问卷、金数据、Formspree 等），把表单替换成对应的 iframe 或接口即可。

---

## 4. 功能清单

- 全屏首屏 + Canvas 动态 DNA 双螺旋（支持 `prefers-reduced-motion`）
- 滚动进度条、固定导航、移动端全屏菜单
- 会议倒计时
- 议程按“主旨 / 圆桌 / 青年 / 产业”筛选
- 主讲嘉宾占位卡 + “讲者提名”入口
- 海报征集与投稿要求折叠面板
- FAQ 手风琴
- 报名邮件生成器（mailto）
- “添加至日历”生成 `.ics` 文件
- 复制邮箱 / 复制报名信息
- 响应式布局（桌面 / 平板 / 手机）
- SEO：Open Graph、Twitter Card、JSON-LD `Event` 结构化数据
- 404 页面
- 无外部依赖，离线可用

---

## 5. 目录结构

```text
.
├── index.html
├── 404.html
├── README.md
├── .nojekyll
├── robots.txt
├── sitemap.xml
├── site.webmanifest
├── assets/
│   ├── css/style.css
│   ├── js/config.js
│   ├── js/main.js
│   ├── favicon.svg
│   └── img/
│       ├── about-art.jpg
│       ├── about-art.webp
│       ├── apple-touch-icon.png
│       ├── icon-192.png
│       ├── icon-512.png
│       ├── og-cover.jpg
│       └── og-cover.png
└── scripts/
    └── make_assets.py
```

---

## 6. 上线检查清单

- [ ] `config.js` 里的日期、地点、邮箱已替换
- [ ] 页面上的“讲者待公布”已替换或保留为有意为之
- [ ] 议程时间与实际安排一致
- [ ] 海报截止日期与实际征集计划一致
- [ ] `canonical` / `og:url` / `og:image` 是最终域名
- [ ] 如果改了仓库名，`404.html` 的 `<base>` 已同步
- [ ] 如果改了日期，JSON-LD 的 `startDate` / `endDate` 已同步
- [ ] `.nojekyll` 已上传
- [ ] GitHub Pages 的 Source 是 `main` / `root`
- [ ] 手机和桌面都打开检查一遍
- [ ] 点击“报名参会”走完一次邮件生成流程
- [ ] 点击“添加至日历”能下载 `.ics`

---

## 7. 说明

- 页面没有接入统计、Cookie 或第三方追踪。
- 字体使用系统字体栈，不请求外部字体。
- 所有图形、纹理和图标均为本地文件；Canvas 动画在本地实时绘制。
- 内容与文案可按活动需要自由修改。
