## Xingyun Hackathon Page

一个用于展示星云 Hackathon 活动信息的静态网页项目。  
本项目基于纯 `HTML + CSS + JavaScript` 实现，适合部署在 GitHub Pages、ModelScope Studio 或任意静态网站托管平台。

---

### 功能简介

- **活动主页展示**：包含 Hackathon 主题、时间、赛道、规则等核心信息。
- **日程与流程**：清晰展示活动安排，方便参赛者查看。
- **报名/链接入口**：可放置报名链接、交流群二维码或外部跳转。
- **多媒体展示**：支持嵌入图片、视频等内容，用于展示往届成果或宣传物料。

> 以上为通用说明，如需完全匹配当前页面内容，可根据你的实际文案再做微调。

---

### 本地预览

1. 克隆仓库：

   ```bash
   git clone https://github.com/leiw5173/xingyun_hackathon_page.git
   cd xingyun_hackathon_page
   ```

2. 使用浏览器直接打开 `index.html`：

   - 方法一：在资源管理器中双击 `index.html`
   - 方法二：右键使用你喜欢的浏览器打开

3. （可选）使用简易本地服务器预览（推荐）：

   - 安装 Node.js 后：

     ```bash
     npx serve .
     ```

   - 或使用 VS Code 的 Live Server 插件进行预览。

---

### 目录结构

```text
.
├─ index.html              # 页面入口文件
├─ style.css               # 页面样式
├─ update-video-covers.js  # 与视频封面更新相关的脚本
└─ README.md               # 项目说明文档（本文件）
```

---

### 开发与修改

- **修改页面结构/文案**：编辑 `index.html`
- **修改样式主题**：编辑 `style.css`，可调整配色、字体、布局等
- **修改交互/脚本逻辑**：编辑 `update-video-covers.js` 或其他脚本文件

建议在修改时使用现代浏览器的开发者工具（F12）实时查看样式和调试脚本。

---

### 部署建议

由于是纯静态页面，可以选择以下方式部署：

- **GitHub Pages**
  - 将代码推送到 GitHub 仓库（本仓库）
  - 在 GitHub 仓库的 `Settings -> Pages` 中开启 Pages
- **ModelScope Studio / 其他静态托管**
  - 直接上传本项目文件，入口文件为 `index.html`

---

### 许可证

本项目采用 **Apache License 2.0** 开源许可协议。
