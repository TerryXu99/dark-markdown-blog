# 夜航笔记 Markdown 博客

这是一个深色风格的个人博客网站，支持：

- 首页个人介绍
- Markdown 写文章
- 文章类型自动归类
- 友链展示
- 浏览人数统计
- 通过局域网或部署到服务器给别人访问

## 启动

```bash
npm install
npm run dev
```

打开：

```text
http://localhost:3000
```

同一个局域网里给别人看时，先启动服务，然后把你的电脑 IP 发给对方：

```text
http://你的电脑IP:3000
```

服务默认监听 `0.0.0.0`，所以同一网络下的设备可以访问。公网访问需要部署到云服务器，或用内网穿透工具把 `3000` 端口映射出去。

## 部署到 GitHub Pages

项目已经包含 `.github/workflows/deploy-pages.yml`。推送到 GitHub 的 `main` 分支后，GitHub Actions 会自动运行：

```bash
npm ci
npm run build
```

然后发布 `dist` 目录。

第一次部署前，在 GitHub 仓库里打开：

```text
Settings -> Pages -> Build and deployment -> Source -> GitHub Actions
```

保存后，推送代码即可。部署完成后，仓库的 Actions 页面会显示网站地址。

静态版访问统计使用不蒜子脚本显示总浏览、访客和页面阅读数。如果你需要完全自己掌控统计数据，可以继续使用本地 Node 服务版本并部署到能运行 Node 的平台。

## 写文章

在 `content/posts` 里新建 `.md` 文件：

```md
---
title: "我的新文章"
slug: "my-new-post"
date: "2026-06-02"
category: "学习"
summary: "这是一段文章摘要。"
---

这里写正文，支持 Markdown。
```

`category` 就是博客类型。写一个新类型，首页和分类页会自动出现。

## 修改友链

编辑 `content/friends.json`：

```json
[
  {
    "name": "朋友的网站",
    "url": "https://example.com",
    "description": "一句简短介绍"
  }
]
```

## 访问统计

访问量保存在 `data/stats.json`。文件会在第一次启动或访问时自动创建。
