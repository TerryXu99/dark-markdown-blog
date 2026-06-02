---
title: "建站记录：从文件夹到可访问的网站"
slug: "build-log"
date: "2026-05-20"
category: "建站"
summary: "记录这个博客站点的基本结构，以及如何继续扩展。"
---

这个博客由几个简单部分组成：

- `server.js`：读取 Markdown、渲染页面、统计访问量。
- `content/posts`：放所有文章。
- `content/friends.json`：维护友链。
- `public/styles.css`：控制深色界面。
- `data/stats.json`：自动保存浏览人数。

如果想添加新的文章类型，不需要改代码。只要在文章顶部把 `category` 写成新的名字，首页和分类页就会自动显示它。

```md
---
title: "我的新文章"
slug: "my-new-post"
date: "2026-06-02"
category: "学习"
summary: "这是一段文章摘要。"
---

正文内容写在这里。
```
