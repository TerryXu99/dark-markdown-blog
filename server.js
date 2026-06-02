const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const express = require("express");
const matter = require("gray-matter");
const { marked } = require("marked");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";
const ROOT = __dirname;
const POSTS_DIR = path.join(ROOT, "content", "posts");
const FRIENDS_FILE = path.join(ROOT, "content", "friends.json");
const DATA_DIR = path.join(ROOT, "data");
const STATS_FILE = path.join(DATA_DIR, "stats.json");

marked.setOptions({
  gfm: true,
  breaks: false,
  headerIds: true,
  mangle: false
});

app.use("/public", express.static(path.join(ROOT, "public"), {
  maxAge: process.env.NODE_ENV === "production" ? "1d" : 0
}));

app.use((req, res, next) => {
  if (req.path.startsWith("/public") || req.path === "/favicon.ico") {
    next();
    return;
  }

  const visitorId = getOrCreateVisitorId(req, res);
  const stats = readStats();
  const today = new Date().toISOString().slice(0, 10);

  stats.totalViews += 1;
  stats.visitors[visitorId] = {
    firstSeen: stats.visitors[visitorId]?.firstSeen || new Date().toISOString(),
    lastSeen: new Date().toISOString()
  };
  stats.dailyViews[today] = (stats.dailyViews[today] || 0) + 1;

  writeStats(stats);
  res.locals.siteStats = publicStats(stats, today);
  next();
});

app.get("/", (req, res) => {
  const posts = getPosts();
  const featured = posts.slice(0, 3);
  const categories = getCategories(posts);
  const friends = getFriends();

  res.send(layout({
    title: "夜航笔记",
    description: "一个深色风格的个人 Markdown 博客。",
    active: "home",
    content: `
      <section class="hero section-grid">
        <div class="hero-copy">
          <p class="eyebrow">Personal Blog / Markdown Notes</p>
          <h1>你好，我是VIPER。这里记录技术、生活和那些突然发光的想法。</h1>
          <p class="hero-text">这个博客支持 Markdown 写作、文章类型管理、友链展示和访问人数统计。页面保持深色、克制、适合长时间阅读。</p>
          <div class="hero-actions">
            <a class="button primary" href="#posts">阅读文章</a>
            <a class="button" href="#friends">查看友链</a>
          </div>
        </div>
        <div class="profile-panel" aria-label="个人介绍">
          <img src="/public/images/profile-cover.jpg" alt="深色书桌与笔记本" class="profile-image">
          <div class="profile-body">
            <span class="status-dot"></span>
            <h2>关于我</h2>
            <p>喜欢把复杂问题拆小，也喜欢在深夜写一点安静的文字。这里会放项目复盘、学习笔记、工具心得和生活碎片。</p>
            <div class="profile-tags">
              <span>前端</span>
              <span>后端</span>
              <span>Markdown</span>
              <span>个人成长</span>
            </div>
          </div>
        </div>
      </section>

      ${statsStrip(res.locals.siteStats)}

      <section id="posts" class="content-band">
        <div class="section-heading">
          <p class="eyebrow">Latest Posts</p>
          <h2>最新文章</h2>
        </div>
        <div class="post-grid">
          ${featured.map(postCard).join("")}
        </div>
      </section>

      <section class="content-band">
        <div class="section-heading">
          <p class="eyebrow">Categories</p>
          <h2>文章类型</h2>
        </div>
        <div class="category-list">
          ${categories.map(categoryPill).join("")}
        </div>
      </section>

      <section id="friends" class="content-band">
        <div class="section-heading">
          <p class="eyebrow">Friends</p>
          <h2>友链</h2>
        </div>
        <div class="friend-grid">
          ${friends.map(friendCard).join("")}
        </div>
      </section>
    `
  }));
});

app.get("/posts", (req, res) => {
  const posts = getPosts();
  res.send(layout({
    title: "全部文章 - 夜航笔记",
    description: "查看所有 Markdown 博客文章。",
    active: "posts",
    content: `
      <section class="page-title">
        <p class="eyebrow">Archive</p>
        <h1>全部文章</h1>
      </section>
      <div class="post-list">
        ${posts.map(postListItem).join("")}
      </div>
    `
  }));
});

app.get("/categories/:category", (req, res) => {
  const category = decodeURIComponent(req.params.category);
  const posts = getPosts().filter((post) => post.category === category);

  if (!posts.length) {
    res.status(404).send(notFound(`没有找到「${escapeHtml(category)}」这个类型。`));
    return;
  }

  res.send(layout({
    title: `${category} - 夜航笔记`,
    description: `查看 ${category} 类型的文章。`,
    active: "posts",
    content: `
      <section class="page-title">
        <p class="eyebrow">Category</p>
        <h1>${escapeHtml(category)}</h1>
      </section>
      <div class="post-list">
        ${posts.map(postListItem).join("")}
      </div>
    `
  }));
});

app.get("/posts/:slug", (req, res) => {
  const post = getPosts().find((item) => item.slug === req.params.slug);

  if (!post) {
    res.status(404).send(notFound("文章不存在。"));
    return;
  }

  const stats = readStats();
  stats.posts[post.slug] = (stats.posts[post.slug] || 0) + 1;
  writeStats(stats);

  res.send(layout({
    title: `${post.title} - 夜航笔记`,
    description: post.summary,
    active: "posts",
    content: `
      <article class="article">
        <a class="back-link" href="/posts">返回全部文章</a>
        <header class="article-header">
          <p class="eyebrow">${escapeHtml(post.category)}</p>
          <h1>${escapeHtml(post.title)}</h1>
          <div class="article-meta">
            <time datetime="${escapeHtml(post.date)}">${formatDate(post.date)}</time>
            <span>${post.readingMinutes} 分钟阅读</span>
            <span>${(stats.posts[post.slug] || 0).toLocaleString("zh-CN")} 次阅读</span>
          </div>
        </header>
        <div class="markdown-body">
          ${post.html}
        </div>
      </article>
    `
  }));
});

app.get("/friends", (req, res) => {
  const friends = getFriends();
  res.send(layout({
    title: "友链 - 夜航笔记",
    description: "朋友们的网站链接。",
    active: "friends",
    content: `
      <section class="page-title">
        <p class="eyebrow">Friends</p>
        <h1>友链</h1>
      </section>
      <div class="friend-grid">
        ${friends.map(friendCard).join("")}
      </div>
    `
  }));
});

function layout({ title, description, active, content }) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(description)}">
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/public/styles.css">
</head>
<body>
  <header class="site-header">
    <a class="brand" href="/" aria-label="夜航笔记首页">
      <span class="brand-mark">YH</span>
      <span>夜航笔记</span>
    </a>
    <nav class="site-nav" aria-label="主导航">
      <a class="${active === "home" ? "active" : ""}" href="/">首页</a>
      <a class="${active === "posts" ? "active" : ""}" href="/posts">文章</a>
      <a class="${active === "friends" ? "active" : ""}" href="/friends">友链</a>
    </nav>
  </header>
  <main>
    ${content}
  </main>
  <footer class="site-footer">
    <span>© ${new Date().getFullYear()} 夜航笔记</span>
    <span>Markdown powered blog</span>
  </footer>
</body>
</html>`;
}

function getPosts() {
  if (!fs.existsSync(POSTS_DIR)) {
    return [];
  }

  return fs.readdirSync(POSTS_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const fullPath = path.join(POSTS_DIR, file);
      const source = fs.readFileSync(fullPath, "utf8");
      const parsed = matter(source);
      const slug = parsed.data.slug || file.replace(/\.md$/, "");
      const title = parsed.data.title || slug;
      const category = parsed.data.category || "随笔";
      const summary = parsed.data.summary || "";
      const date = parsed.data.date || "2026-06-02";
      const html = marked.parse(parsed.content);

      return {
        slug,
        title,
        category,
        summary,
        date,
        html,
        readingMinutes: estimateReadingMinutes(parsed.content)
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getCategories(posts) {
  const map = new Map();
  posts.forEach((post) => {
    map.set(post.category, (map.get(post.category) || 0) + 1);
  });
  return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
}

function getFriends() {
  if (!fs.existsSync(FRIENDS_FILE)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(FRIENDS_FILE, "utf8"));
}

function readStats() {
  ensureStatsFile();
  return JSON.parse(fs.readFileSync(STATS_FILE, "utf8"));
}

function writeStats(stats) {
  ensureStatsFile();
  fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
}

function ensureStatsFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STATS_FILE)) {
    fs.writeFileSync(STATS_FILE, JSON.stringify({
      totalViews: 0,
      visitors: {},
      dailyViews: {},
      posts: {}
    }, null, 2));
  }
}

function getOrCreateVisitorId(req, res) {
  const cookies = parseCookies(req.headers.cookie || "");
  if (cookies.blog_visitor) {
    return cookies.blog_visitor;
  }

  const visitorId = crypto.randomBytes(16).toString("hex");
  res.setHeader("Set-Cookie", `blog_visitor=${visitorId}; Path=/; Max-Age=31536000; SameSite=Lax`);
  return visitorId;
}

function publicStats(stats, today) {
  return {
    totalViews: stats.totalViews,
    uniqueVisitors: Object.keys(stats.visitors).length,
    todayViews: stats.dailyViews[today] || 0
  };
}

function parseCookies(cookieHeader) {
  return cookieHeader.split(";").reduce((cookies, part) => {
    const [key, ...valueParts] = part.trim().split("=");
    if (key) {
      cookies[key] = decodeURIComponent(valueParts.join("="));
    }
    return cookies;
  }, {});
}

function statsStrip(stats) {
  return `
    <section class="stats-strip" aria-label="访问统计">
      <div>
        <strong>${stats.totalViews.toLocaleString("zh-CN")}</strong>
        <span>总浏览</span>
      </div>
      <div>
        <strong>${stats.uniqueVisitors.toLocaleString("zh-CN")}</strong>
        <span>访客</span>
      </div>
      <div>
        <strong>${stats.todayViews.toLocaleString("zh-CN")}</strong>
        <span>今日访问</span>
      </div>
    </section>
  `;
}

function postCard(post) {
  return `
    <article class="post-card">
      <a href="/posts/${encodeURIComponent(post.slug)}">
        <span class="post-category">${escapeHtml(post.category)}</span>
        <h3>${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(post.summary)}</p>
        <div class="post-meta">
          <time datetime="${escapeHtml(post.date)}">${formatDate(post.date)}</time>
          <span>${post.readingMinutes} 分钟</span>
        </div>
      </a>
    </article>
  `;
}

function postListItem(post) {
  return `
    <article class="post-row">
      <div>
        <a class="row-title" href="/posts/${encodeURIComponent(post.slug)}">${escapeHtml(post.title)}</a>
        <p>${escapeHtml(post.summary)}</p>
      </div>
      <div class="row-meta">
        <a href="/categories/${encodeURIComponent(post.category)}">${escapeHtml(post.category)}</a>
        <time datetime="${escapeHtml(post.date)}">${formatDate(post.date)}</time>
      </div>
    </article>
  `;
}

function categoryPill(category) {
  return `
    <a class="category-pill" href="/categories/${encodeURIComponent(category.name)}">
      <span>${escapeHtml(category.name)}</span>
      <strong>${category.count}</strong>
    </a>
  `;
}

function friendCard(friend) {
  return `
    <a class="friend-card" href="${escapeHtml(friend.url)}" target="_blank" rel="noopener noreferrer">
      <span class="friend-avatar">${escapeHtml(friend.name.slice(0, 1).toUpperCase())}</span>
      <span>
        <strong>${escapeHtml(friend.name)}</strong>
        <small>${escapeHtml(friend.description)}</small>
      </span>
    </a>
  `;
}

function notFound(message) {
  return layout({
    title: "未找到 - 夜航笔记",
    description: "页面不存在。",
    active: "",
    content: `
      <section class="page-title">
        <p class="eyebrow">404</p>
        <h1>${message}</h1>
        <a class="button primary" href="/">回到首页</a>
      </section>
    `
  });
}

function estimateReadingMinutes(markdown) {
  const text = markdown.replace(/```[\s\S]*?```/g, "").replace(/[#>*_`[\]()!-]/g, "");
  const chars = text.trim().length;
  return Math.max(1, Math.ceil(chars / 450));
}

function formatDate(date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(date));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

app.listen(PORT, HOST, () => {
  console.log(`Blog is running at http://${HOST === "0.0.0.0" ? "localhost" : HOST}:${PORT}`);
  console.log("Use HOST=0.0.0.0 to make it reachable from your local network.");
});
