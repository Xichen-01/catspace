# CATSPACE V3

脏兮兮的猫的个人观测站。探索模式通过场景进入各区域，浏览模式提供可滚动的作品、实验和手记索引。两种模式共用 URL、内容和当前区域。

- V3 的发布目录是 `v3/`，Vite 源码在 `app/`。
- 仓库根目录的 `index.html` 与 `v2.html` 分别是 V1、V2。
- [视觉拆解与验收标准](docs/visual-direction.md)

## 本地开发与发布

```sh
npm --prefix app ci
npm --prefix app run dev
npm --prefix app run build
npm --prefix app run build:pages
```

`build` 生成独立的 `app/dist/`，可部署到静态服务。GitHub Pages 读取主分支根目录时，使用 `build:pages` 生成 `v3/`，与源码一起提交即可发布。Vite 使用相对路径，区域通过 URL hash 表示，直接访问深链接无需服务器重写。Vercel 可将根目录设为 `app`，构建输出设为 `dist`。

## 内容与场景

- `app/src/content.ts` 维护两种模式共用的作品、实验与空间锚点。
- `app/src/station.ts` 包含深度投影、镜头、猫和核心曲面的实时场景。
- `app/src/shaders.ts` 维护生命体的虹彩、呼吸和能量反馈着色器。
- `app/public/assets/` 存放桌面及手机构图底图、核心图和自托管的标题字体。字体授权见同目录。

在网址上加 `?still` 可检查静态场景和降级交互，例如 `/v3/?still#explore/laboratory`。
