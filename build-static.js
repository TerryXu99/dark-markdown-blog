const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { marked } = require("marked");

const ROOT = __dirname;
const OUT_DIR = path.join(ROOT, "dist");
const POSTS_DIR = path.join(ROOT, "content", "posts");
const FRIENDS_FILE = path.join(ROOT, "content", "friends.json");

marked.setOptions({
  gfm: true,
  breaks: false,
  headerIds: true,
  mangle: false
});

cleanDir(OUT_DIR);
copyDir(path.join(ROOT, "public"), path.join(OUT_DIR, "public"));

const posts = getPosts();
const friends = getFriends();
const categories = getCategories(posts);

writePage("index.html", layout({
  title: "Viper3",
  description: "一个深色风格的个人 Markdown 博客。",
  active: "home",
  depth: 0,
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
        <img src="${asset(0, "public/images/profile-cover.jpg")}" alt="深色书桌与笔记本" class="profile-image">
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

    ${staticStatsStrip()}

    <section id="posts" class="content-band">
      <div class="section-heading">
        <p class="eyebrow">Latest Posts</p>
        <h2>最新文章</h2>
      </div>
      <div class="post-grid">
        ${posts.slice(0, 3).map((post) => postCard(post, 0)).join("")}
      </div>
    </section>

    <section class="content-band">
      <div class="section-heading">
        <p class="eyebrow">Categories</p>
        <h2>文章类型</h2>
      </div>
      <div class="category-list">
        ${categories.map((category) => categoryPill(category, 0)).join("")}
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

writePage("posts/index.html", layout({
  title: "全部文章 - 夜航笔记",
  description: "查看所有 Markdown 博客文章。",
  active: "posts",
  depth: 1,
  content: `
    <section class="page-title">
      <p class="eyebrow">Archive</p>
      <h1>全部文章</h1>
    </section>
    <div class="post-list">
      ${posts.map((post) => postListItem(post, 1)).join("")}
    </div>
  `
}));

writePage("friends/index.html", layout({
  title: "友链 - 夜航笔记",
  description: "朋友们的网站链接。",
  active: "friends",
  depth: 1,
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

posts.forEach((post) => {
  writePage(`posts/${post.slug}/index.html`, layout({
    title: `${post.title} - 夜航笔记`,
    description: post.summary,
    active: "posts",
    depth: 2,
    content: `
      <article class="article">
        <a class="back-link" href="${url(2, "posts/")}">返回全部文章</a>
        <header class="article-header">
          <p class="eyebrow">${escapeHtml(post.category)}</p>
          <h1>${escapeHtml(post.title)}</h1>
          <div class="article-meta">
            <time datetime="${escapeHtml(post.date)}">${formatDate(post.date)}</time>
            <span>${post.readingMinutes} 分钟阅读</span>
            <span><span id="busuanzi_value_page_pv">...</span> 次阅读</span>
          </div>
        </header>
        <div class="markdown-body">${post.html}</div>
      </article>
    `
  }));
});

categories.forEach((category) => {
  const categoryPosts = posts.filter((post) => post.category === category.name);
  writePage(`categories/${encodeURIComponent(category.name)}/index.html`, layout({
    title: `${category.name} - 夜航笔记`,
    description: `查看 ${category.name} 类型的文章。`,
    active: "posts",
    depth: 2,
    content: `
      <section class="page-title">
        <p class="eyebrow">Category</p>
        <h1>${escapeHtml(category.name)}</h1>
      </section>
      <div class="post-list">
        ${categoryPosts.map((post) => postListItem(post, 2)).join("")}
      </div>
    `
  }));
});

console.log(`Static site generated in ${OUT_DIR}`);

function layout({ title, description, active, depth, content }) {
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
  <link rel="stylesheet" href="${asset(depth, "public/styles.css")}">
</head>
<body>
  <header class="site-header">
    <a class="brand" href="${url(depth, "")}" aria-label="夜航笔记首页">
      <span class="brand-mark">YH</span>
      <span>夜航笔记</span>
    </a>
    <nav class="site-nav" aria-label="主导航">
      <a class="${active === "home" ? "active" : ""}" href="${url(depth, "")}">首页</a>
      <a class="${active === "posts" ? "active" : ""}" href="${url(depth, "posts/")}">文章</a>
      <a class="${active === "friends" ? "active" : ""}" href="${url(depth, "friends/")}">友链</a>
    </nav>
  </header>
  <main>${content}</main>
  <footer class="site-footer">
    <span>© ${new Date().getFullYear()} 夜航笔记</span>
    <span>Markdown powered blog</span>
  </footer>
  <script async src="//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js"></script>
</body>
</html>`;
}

function getPosts() {
  return fs.readdirSync(POSTS_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const fullPath = path.join(POSTS_DIR, file);
      const source = fs.readFileSync(fullPath, "utf8");
      const parsed = matter(source);
      const slug = parsed.data.slug || file.replace(/\.md$/, "");
      return {
        slug,
        title: parsed.data.title || slug,
        category: parsed.data.category || "随笔",
        summary: parsed.data.summary || "",
        date: parsed.data.date || "2026-06-02",
        html: marked.parse(parsed.content),
        readingMinutes: estimateReadingMinutes(parsed.content)
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getFriends() {
  return JSON.parse(fs.readFileSync(FRIENDS_FILE, "utf8"));
}

function getCategories(inputPosts) {
  const map = new Map();
  inputPosts.forEach((post) => map.set(post.category, (map.get(post.category) || 0) + 1));
  return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
}

function staticStatsStrip() {
  return `
    <section class="stats-strip" aria-label="访问统计">
      <div><strong id="busuanzi_value_site_pv">...</strong><span>总浏览</span></div>
      <div><strong id="busuanzi_value_site_uv">...</strong><span>访客</span></div>
      <div><strong id="busuanzi_value_page_pv">...</strong><span>本页浏览</span></div>
    </section>
  `;
}

function postCard(post, depth) {
  return `
    <article class="post-card">
      <a href="${url(depth, `posts/${post.slug}/`)}">
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

function postListItem(post, depth) {
  return `
    <article class="post-row">
      <div>
        <a class="row-title" href="${url(depth, `posts/${post.slug}/`)}">${escapeHtml(post.title)}</a>
        <p>${escapeHtml(post.summary)}</p>
      </div>
      <div class="row-meta">
        <a href="${url(depth, `categories/${encodeURIComponent(post.category)}/`)}">${escapeHtml(post.category)}</a>
        <time datetime="${escapeHtml(post.date)}">${formatDate(post.date)}</time>
      </div>
    </article>
  `;
}

function categoryPill(category, depth) {
  return `
    <a class="category-pill" href="${url(depth, `categories/${encodeURIComponent(category.name)}/`)}">
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

function url(depth, target) {
  return `${"../".repeat(depth)}${target}`;
}

function asset(depth, target) {
  return url(depth, target);
}

function writePage(relativePath, html) {
  const target = path.join(OUT_DIR, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, html);
}

function cleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function copyDir(source, target) {
  fs.mkdirSync(target, { recursive: true });
  fs.readdirSync(source, { withFileTypes: true }).forEach((entry) => {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      copyDir(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  });
}

function estimateReadingMinutes(markdown) {
  const text = markdown.replace(/```[\s\S]*?```/g, "").replace(/[#>*_`[\]()!-]/g, "");
  return Math.max(1, Math.ceil(text.trim().length / 450));
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
