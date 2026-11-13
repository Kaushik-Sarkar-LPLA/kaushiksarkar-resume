// Kaushik Sarkar Blogs: server-rendered blog mirrored from PromptGrabber API + static resume
const http = require('http');
const fs = require('fs');
const path = require('path');
const API = process.env.BLOG_API || 'http://10.0.1.1:3011/api/blog';
const SITE = 'https://kaushiksarkar.com';
const PORT = process.env.PORT || 80;
const RESUME = fs.readFileSync(path.join(__dirname, 'resume.html'), 'utf8');
const PER = 12;
const cache = new Map();
async function api(q, ttl = 300000) {
  const hit = cache.get(q);
  if (hit && Date.now() - hit.t < ttl) return hit.v;
  try {
    const r = await fetch(API + q, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) { if (r.status === 404) return null; throw new Error(r.status); }
    const v = await r.json();
    cache.set(q, { t: Date.now(), v });
    return v;
  } catch (e) { if (hit) return hit.v; throw e; }
}
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = d => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
const parse = v => { if (typeof v !== 'string') return v || []; try { return JSON.parse(v); } catch { return []; } };

const CSS = `
:root{--accent:#7c3aed;--accent-dark:#6d28d9;--accent-light:#f5f3ff;--glow:rgba(124,58,237,.25);--ink:#0f172a;--ink2:#334155;--muted:#64748b;--light:#94a3b8;--border:#e2e8f0}
*{margin:0;padding:0;box-sizing:border-box;-webkit-font-smoothing:antialiased}
body{font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:var(--ink);background:#fff;line-height:1.6;min-height:100vh;display:flex;flex-direction:column}
a{color:var(--accent-dark)}
.bar{position:sticky;top:0;z-index:100;background:rgba(255,255,255,.85);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid rgba(0,0,0,.048);padding:10px 20px}
.bar-in{max-width:1140px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:12px;text-decoration:none}
.logo{width:34px;height:34px;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px var(--glow);flex-shrink:0}
.bn{display:flex;align-items:baseline;gap:8px;line-height:1}
.bn-main{font-family:Montserrat,sans-serif;font-size:18px;letter-spacing:-.01em;display:inline-flex;gap:5px}
.bn-main b{font-weight:800;color:#1f2a3d}
.bn-main i{font-style:normal;font-weight:300;background:linear-gradient(135deg,#8b5cf6,#4c1d95);-webkit-background-clip:text;background-clip:text;color:transparent}
.bn-blog{font-family:Caveat,cursive;font-weight:700;font-size:26px;color:var(--accent);transform:rotate(-4deg) translateY(1px);display:inline-block}
.nav{display:flex;gap:10px}
.btn{display:inline-flex;align-items:center;gap:7px;padding:7px 16px;font-size:12px;font-weight:600;border-radius:6px;text-decoration:none;transition:all .2s;border:1px solid rgba(0,0,0,.072);background:rgba(0,0,0,.048);color:#212121;min-height:36px}
.btn:hover{background:rgba(0,0,0,.096)}
.btn.on{background:linear-gradient(135deg,var(--accent),var(--accent-dark));color:#fff;border-color:transparent;box-shadow:0 2px 10px var(--glow)}
main{flex:1;width:100%;max-width:1140px;margin:0 auto;padding:36px 20px}
.hero{margin-bottom:28px}
.hero h1{font-size:30px;font-weight:800;letter-spacing:-.02em}
.hero p{color:var(--muted);margin-top:6px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:22px}
.card{border:1px solid var(--border);border-radius:12px;overflow:hidden;background:#fff;text-decoration:none;color:inherit;display:flex;flex-direction:column;transition:transform .2s,box-shadow .2s}
.card:hover{transform:translateY(-3px);box-shadow:0 10px 30px -8px rgba(15,23,42,.15)}
.card img{width:100%;aspect-ratio:16/9;object-fit:cover;background:var(--accent-light)}
.card .b{padding:16px 18px;display:flex;flex-direction:column;gap:8px;flex:1}
.cat{font-size:11px;font-weight:600;color:var(--accent-dark);background:var(--accent-light);padding:3px 10px;border-radius:999px;align-self:flex-start}
.card h2{font-size:17px;line-height:1.35;font-weight:700}
.card p{font-size:13.5px;color:var(--muted);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.meta{font-size:12px;color:var(--light);margin-top:auto}
.pager{display:flex;justify-content:center;align-items:center;flex-wrap:wrap;gap:6px;margin-top:40px}
.pg-n{min-width:38px;height:38px;padding:0 10px;display:inline-grid;place-items:center;border-radius:10px;border:1px solid var(--border);background:#fff;color:var(--ink2);font-size:14px;font-weight:600;text-decoration:none;transition:all .15s}
.pg-n:hover{border-color:var(--accent);color:var(--accent-dark)}
.pg-n.on{background:linear-gradient(135deg,var(--accent),var(--accent-dark));color:#fff;border-color:transparent;box-shadow:0 2px 10px var(--glow)}
.pg-arrow{font-size:20px}.pg-gap{color:var(--light);padding:0 4px}
.tools{display:flex;gap:10px;flex-wrap:wrap;margin:-8px 0 26px}
.srch{flex:1;min-width:220px;position:relative}
.srch svg{position:absolute;left:12px;top:50%;width:17px;height:17px;transform:translateY(-50%);color:var(--light)}
.srch input,.tools select{width:100%;height:40px;border:1px solid var(--border);border-radius:10px;font:inherit;font-size:14px;color:var(--ink);background:#fff;outline:none;transition:border-color .15s,box-shadow .15s}
.srch input{padding:0 12px 0 38px}
.tools select{width:auto;min-width:190px;padding:0 34px 0 12px;appearance:none;background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 12px center;cursor:pointer}
.srch input:focus,.tools select:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--glow)}
.tools .btn{height:40px;min-height:40px}
.empty{text-align:center;color:var(--muted);padding:50px 0}
@media(max-width:640px){.tools select{flex:1}}
article{max-width:780px;margin:0 auto}
article header h1{font-size:34px;line-height:1.2;font-weight:800;letter-spacing:-.02em;margin:12px 0}
article header .meta{margin-bottom:22px}
.cover{width:100%;border-radius:12px;margin-bottom:26px}
.content{font-size:16px;line-height:1.75;color:#334155;overflow-wrap:break-word}
.content>*+*{margin-top:1.15em}
.content>p:first-child{font-size:17px;color:#1e293b}
.content h2{font-size:1.4rem;line-height:1.25;font-weight:800;letter-spacing:-.02em;color:#0f172a;margin-top:2.2em;scroll-margin-top:90px}
.content h3{font-size:1.1rem;font-weight:700;color:#0f172a;margin-top:1.6em}
.content strong{color:#0f172a;font-weight:650}
.content a{color:#6d28d9;text-decoration:underline;text-decoration-color:#6d28d959;text-underline-offset:3px;text-decoration-thickness:1.5px}
.content a:hover{color:#4c1d95;text-decoration-color:currentColor}
.content ul,.content ol{padding-left:1.35em}
.content li{margin-top:.45em;padding-left:.2em}
.content li::marker{color:#8b5cf6}
.content img,.content video{max-width:100%;height:auto;border-radius:14px;box-shadow:0 10px 30px -12px rgba(15,23,42,.35)}
.content figure{margin:1.8em 0}
.content figcaption,.content .blog-credit{font-size:13px;color:var(--muted);text-align:center;margin-top:8px}
.content code{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:.86em;background:#f1f5f9;color:#0f172a;border:1px solid #e2e8f0;border-radius:6px;padding:.12em .4em}
.content pre{white-space:pre-wrap;word-break:break-word;background:#0b1020;color:#e2e8f0;border-radius:14px;padding:1.1rem 1.25rem;overflow-x:auto;font:13px/1.7 'JetBrains Mono',ui-monospace,monospace;box-shadow:inset 0 0 0 1px #ffffff0f}
.content pre code{background:transparent;border:0;padding:0;color:inherit;font-size:inherit}
.content .blog-callout{background:linear-gradient(135deg,#f5f3ff,#eef2ff);border:1px solid #ddd6fe;border-radius:16px;padding:20px 24px;margin:1.6em 0}
.content .blog-toc{background:#f8fafc;border:1px solid var(--border);border-radius:16px;padding:18px 24px}
.content .blog-callout h2,.content .blog-toc h2{font-size:12px;text-transform:uppercase;letter-spacing:.12em;color:#6d28d9;margin:0 0 10px}
.content .blog-toc a{text-decoration:none;color:#334155}.content .blog-toc a:hover{color:#6d28d9}
.content .blog-prompt{background:#0b1020;border-radius:18px;padding:20px 22px;color:#e2e8f0}
.content .blog-prompt h2{color:#c4b5fd;font-size:12px;text-transform:uppercase;letter-spacing:.12em;margin:0 0 12px}
.content .blog-prompt pre{padding:0;box-shadow:none;max-height:420px}
.content .blog-step{border:1px solid var(--border);border-radius:18px;padding:22px 24px;margin-top:1.6em;background:#fff;box-shadow:0 1px 2px rgba(15,23,42,.04)}
.content .blog-step>h2{margin-top:0;display:flex;align-items:center;gap:12px;font-size:1.2rem}
.content .blog-step>*+*{margin-top:1em}
.blog-step-num{flex-shrink:0;width:34px;height:34px;border-radius:10px;display:inline-grid;place-items:center;background:linear-gradient(135deg,#8b5cf6,#6d28d9);color:#fff;font-size:15px;font-weight:800;box-shadow:0 4px 12px var(--glow)}
.content .blog-tip{background:#fffbeb;border:1px solid #fde68a;border-left:4px solid #f59e0b;border-radius:10px;padding:12px 16px;font-size:14.5px;color:#78350f}
.content .blog-tip strong{color:#92400e}
.content .blog-faq{border:1px solid var(--border);border-radius:14px;padding:14px 18px;margin-top:10px}
.content table{border-collapse:collapse;width:100%;font-size:14.5px;border-radius:12px;overflow:hidden}
.content th{background:#f5f3ff;color:#0f172a}
.content th,.content td{border:1px solid var(--border);padding:9px 12px;text-align:left}
article header h1{background:linear-gradient(135deg,#0f172a 30%,#6d28d9);-webkit-background-clip:text;background-clip:text;color:transparent}
.cat{color:#6d28d9;background:#f5f3ff;border:1px solid #ddd6fe}
.faq{margin-top:36px}
.faq details{border:1px solid var(--border);border-radius:10px;padding:12px 16px;margin-bottom:10px}
.faq summary{font-weight:600;cursor:pointer}
.src{margin-top:30px;padding:16px 20px;border:1px dashed var(--border);border-radius:10px;font-size:14px;color:var(--muted)}
footer.site{border-top:1px solid var(--border);padding:22px 20px;font-size:12.5px;color:var(--light)}
footer.site .in{max-width:1140px;margin:0 auto;display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px}
footer.site a{color:var(--muted);text-decoration:none;margin-left:14px}
footer.site a:hover{color:var(--accent-dark)}
.pg{display:inline-flex;align-items:center;gap:6px;font-weight:600;color:var(--accent-dark)!important}
@media(max-width:640px){.bn-main{font-size:15px}.bn-blog{font-size:22px}article header h1{font-size:26px}.grid{grid-template-columns:1fr}}
.tw{font-family:'Special Elite',monospace;font-weight:400;white-space:pre;font-size:30px;line-height:1;height:34px;align-self:center;letter-spacing:.03em;color:#35609f;white-space:nowrap;display:inline-flex;align-items:center}.tw::after{content:'';display:inline-block;width:.5em;height:.71em;margin-left:4px;border-radius:2px;background:#35609f;animation:twb 1s steps(1) infinite}@keyframes twb{50%{opacity:0}}.tw>span{position:relative;top:.15em}.bn,.brand-name,.brand,.action-bar-brand{align-items:center!important}.icon-btn{display:inline-grid;place-items:center;width:36px;height:36px;padding:0!important;border-radius:8px}.icon-btn svg{width:17px;height:17px}@media(max-width:640px){.tw{font-size:22px;height:26px}}
`;

const LOGO = (RESUME.match(/<div class="brand-logo"[^>]*>(<svg[\s\S]*?<\/svg>)<\/div>/) || [, ''])[1];
const FAVICON = (RESUME.match(/<link rel="icon"[^>]*>/) || [''])[0];

const slugify = c => c.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
let CATS = [];
async function refreshCats() { try { const d = await api('?page=1&limit=1'); if (d.categories) CATS = d.categories; } catch {} }
const SEARCH_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
function subnav(active = '', q = '', home = false) {
  const items = [`<a href="/" class="sn-l${home && !active && !q ? ' on' : ''}">All</a>`].concat(CATS.map(c => `<a href="/category/${slugify(c.category)}" class="sn-l${c.category === active ? ' on' : ''}">${esc(c.category.replace(/ Prompts$/, ''))}</a>`));
  return `<div class="subnav"><div class="sn-in"><nav class="sn-cats" aria-label="Categories">${items.join('')}</nav><form class="sn-search" action="/search" method="get" role="search">${SEARCH_ICON}<input type="search" name="q" value="${esc(q)}" placeholder="Search articles…" aria-label="Search articles"></form></div></div>`;
}
const SUBNAV_CSS = `.subnav{position:sticky;top:57px;z-index:99;background:rgba(255,255,255,.92);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid #e2e8f0}
.sn-in{max-width:1140px;margin:0 auto;padding:0 20px;display:flex;align-items:center;gap:16px;height:50px}
.sn-cats{flex:1;display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;height:100%;align-items:stretch}.sn-cats::-webkit-scrollbar{display:none}
.sn-l{display:flex;align-items:center;padding:0 12px;font:600 13.5px Inter,-apple-system,sans-serif;color:#64748b;text-decoration:none;white-space:nowrap;border-bottom:2px solid transparent;transition:color .15s,border-color .15s}
.sn-l:hover{color:#0f172a}.sn-l.on{color:#35609f;border-bottom-color:#35609f}
.sn-search{position:relative;width:240px;flex-shrink:0}
.sn-search svg{position:absolute;left:11px;top:50%;width:15px;height:15px;transform:translateY(-50%);color:#94a3b8;pointer-events:none}
.sn-search input{width:100%;height:34px;padding:0 12px 0 33px;border:1px solid #e2e8f0;border-radius:999px;background:#f8fafc;font:14px Inter,-apple-system,sans-serif;color:#0f172a;outline:none;transition:all .15s}
.sn-search input:focus{background:#fff;border-color:#6b9be0;box-shadow:0 0 0 3px rgba(74,123,200,.18)}
@media(max-width:700px){.sn-in{flex-wrap:wrap;height:auto;padding:8px 14px;gap:8px}.sn-search{width:100%;order:-1}.sn-cats{height:36px}}`;

function layout({ title, desc, canonical, active, body, image, jsonld, robots, cat = '', q = '' }) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${canonical}">
${robots ? `<meta name="robots" content="${robots}">` : ''}
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${canonical}"><meta property="og:type" content="${jsonld && jsonld['@type'] === 'BlogPosting' ? 'article' : 'website'}">
${image ? `<meta property="og:image" content="${esc(image)}"><meta name="twitter:image" content="${esc(image)}">` : ''}<meta name="twitter:card" content="summary_large_image">
<link rel="alternate" type="application/rss+xml" title="Kaushik Sarkar Blogs" href="${SITE}/rss.xml">
${FAVICON}<meta name="theme-color" content="#ffffff">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Special+Elite&family=Montserrat:wght@300;800&family=Caveat:wght@700&family=Inter:wght@400;600;700;800&family=JetBrains+Mono&display=swap" rel="stylesheet">
<style>${CSS}${SUBNAV_CSS}</style>${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>` : ''}</head><body>
<header class="bar"><div class="bar-in"><a href="/" class="brand" aria-label="Kaushik Sarkar Blogs home"><div class="logo">${LOGO}</div><span class="bn"><span class="tw" data-text="KAUSHIK SARKAR" aria-label="Kaushik Sarkar">KAUSHIK SARKAR</span><span class="bn-blog">Blogs</span></span></a>
<nav class="nav"><a href="/" class="btn ${active === 'blog' ? 'on' : ''}">Blogs</a><a href="/resume" class="btn icon-btn ${active === 'resume' ? 'on' : ''}" title="Resume" aria-label="Resume"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8M16 17H8M10 9H8"/></svg></a></nav></div></header>
${subnav(cat, q, active === 'blog' && canonical === SITE + '/')}
<main>${body}</main>
<footer class="site"><div class="in"><span>© ${new Date().getFullYear()} Kaushik Sarkar · kaushiksarkar.com</span><span><a href="/">Blogs</a><a href="/resume">Resume</a><a href="https://www.linkedin.com/in/kaushik-sarkar-93115728/" rel="noopener" target="_blank">LinkedIn</a><a class="pg" href="https://promptgrabber.com" target="_blank" rel="noopener">More AI prompts at PromptGrabber.com →</a></span></div></footer>
<script>(function(){var e=document.querySelector('.tw');if(!e)return;var t=e.dataset.text,i=0,C=['#6b9be0','#5f8fd5','#5584ca','#4a78bf','#406cb3','#35609f'];function r(n){var k=0;e.innerHTML=t.slice(0,n).split('').map(function(c){return c===' '?'<span style="display:inline-block;width:.45em"></span>':'<span style="color:'+C[k++%C.length]+'">'+c+'</span>'}).join('')}if(matchMedia('(prefers-reduced-motion: reduce)').matches){r(t.length);return}r(0);(function s(){r(++i);if(i<t.length)setTimeout(s,110)})()})();</script>
</body></html>`;
}

const card = p => `<a class="card" href="/blog/${esc(p.slug)}">${p.cover_image ? `<img src="${esc(p.cover_image)}" alt="${esc(p.cover_alt || p.title)}" loading="lazy" width="640" height="360">` : ''}<div class="b">${p.category ? `<span class="cat">${esc(p.category)}</span>` : ''}<h2>${esc(p.title)}</h2><p>${esc(p.excerpt)}</p><span class="meta">${fmtDate(p.published_at)} · ${p.reading_minutes || 5} min read</span></div></a>`;

async function listPage(page, q = '', cat = '') {
  q = q.slice(0, 80); cat = cat.slice(0, 60);
  const base = q ? '/search' : cat ? `/category/${slugify(cat)}` : '/';
  const qs = (pg) => { const sp = new URLSearchParams(); if (q) sp.set('q', q); if (pg > 1) sp.set('page', pg); const t = sp.toString(); return t ? `${base}?${t}` : base; };
  const d = await api(`?page=${page}&limit=${PER}${q ? `&search=${encodeURIComponent(q)}` : ''}${cat ? `&category=${encodeURIComponent(cat)}` : ''}`);
  const tp = Math.max(1, d.totalPages || 1);
  const filtered = !!q;
  const canonical = SITE + qs(page);
  const nums = []; const win = new Set([1, tp]); for (let i = page - 2; i <= page + 2; i++) if (i >= 1 && i <= tp) win.add(i);
  [...win].sort((x, y) => x - y).forEach((n, i, arr) => { if (i && n - arr[i - 1] > 1) nums.push('<span class="pg-gap">…</span>'); nums.push(n === page ? `<span class="pg-n on" aria-current="page">${n}</span>` : `<a class="pg-n" href="${qs(n)}">${n}</a>`); });
  const pager = tp > 1 ? `<nav class="pager" aria-label="Pagination">${page > 1 ? `<a class="pg-n pg-arrow" rel="prev" href="${qs(page - 1)}" aria-label="Previous page">‹</a>` : ''}${nums.join('')}${page < tp ? `<a class="pg-n pg-arrow" rel="next" href="${qs(page + 1)}" aria-label="Next page">›</a>` : ''}</nav>` : '';
  const cats = (d.categories || []).map(c => `<option value="${esc(c.category)}"${c.category === cat ? ' selected' : ''}>${esc(c.category)} (${c.count})</option>`).join('');
  const tools = `<form class="tools" method="get" action="/" role="search"><div class="srch"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input type="search" name="q" value="${esc(q)}" placeholder="Search articles…" aria-label="Search articles"></div><select name="category" aria-label="Category" onchange="this.form.submit()"><option value="">All categories</option>${cats}</select><button class="btn on" type="submit">Search</button>${filtered ? '<a class="btn" href="/">Clear</a>' : ''}</form>`;
  const heading = filtered ? `${d.total || 0} result${d.total === 1 ? '' : 's'}${q ? ` for “${esc(q)}”` : ''}${cat ? ` in ${esc(cat)}` : ''}` : 'Latest articles';
  const H = cat && !q ? esc(cat) : heading;
  return layout({
    title: q ? `Search: ${q} | Kaushik Sarkar Blogs` : cat ? `${cat}${page > 1 ? ' — Page ' + page : ''} | Kaushik Sarkar Blogs` : page > 1 ? `Kaushik Sarkar Blogs — Page ${page}` : 'Kaushik Sarkar Blogs — AI Prompts, Tutorials & Engineering',
    desc: 'Articles by Kaushik Sarkar on AI image and video prompts, generative AI tutorials, and software engineering.',
    canonical, active: 'blog', cat, q, robots: filtered ? 'noindex,follow' : '',
    jsonld: { '@context': 'https://schema.org', '@type': 'Blog', name: 'Kaushik Sarkar Blogs', url: SITE + '/', author: { '@type': 'Person', name: 'Kaushik Sarkar', url: SITE + '/resume' } },
    body: `<section class="hero"><h1>${H}</h1><p>AI prompts, generative AI tutorials and engineering notes by Kaushik Sarkar.</p></section>${d.posts.length ? `<div class="grid">${d.posts.map(card).join('')}</div>` : '<p class="empty">No articles found. Try a different search or category.</p>'}${pager}`,
  });
}

async function postPage(slug) {
  const d = await api('/' + encodeURIComponent(slug));
  if (!d || !d.post) return null;
  const p = d.post, url = `https://promptgrabber.com/blog/${p.slug}`; // canonical: PromptGrabber is the original source
  const faq = parse(p.faq);
  const html = String(p.content_html || '').replace(/href="https:\/\/promptgrabber\.com\/blog\//g, 'href="/blog/');
  const ld = [{ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.meta_description || p.excerpt, image: p.cover_image ? [p.cover_image] : undefined, datePublished: p.published_at, dateModified: p.updated_at || p.published_at, author: { '@type': 'Person', name: 'Kaushik Sarkar', url: SITE + '/resume' }, publisher: { '@type': 'Person', name: 'Kaushik Sarkar' }, mainEntityOfPage: url, keywords: parse(p.keywords).join(', '), wordCount: p.word_count },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Blogs', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: p.title, item: url }] }];
  if (faq.length) ld.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });
  const ldOut = ld.length === 1 ? ld[0] : { '@context': 'https://schema.org', '@graph': ld.map(({ ['@context']: _, ...r }) => r) };
  ldOut['@type'] = ldOut['@type'] || undefined;
  return layout({
    title: (p.meta_title || p.title) + ' | Kaushik Sarkar Blogs', desc: p.meta_description || p.excerpt, canonical: url, active: 'blog', cat: p.category || '', image: p.cover_image, jsonld: ldOut,
    body: `<article><header><a href="/" style="font-size:13px;text-decoration:none">← All articles</a><br>${p.category ? `<span class="cat">${esc(p.category)}</span>` : ''}<h1>${esc(p.title)}</h1><div class="meta">By Kaushik Sarkar · <time datetime="${esc(p.published_at)}">${fmtDate(p.published_at)}</time> · ${p.reading_minutes || 5} min read</div></header>
${html.includes(p.cover_image) || !p.cover_image ? '' : `<img class="cover" src="${esc(p.cover_image)}" alt="${esc(p.cover_alt || p.title)}">`}
<div class="content">${html}</div>
${faq.length && !/id="faq"/.test(html) ? `<section class="faq"><h2>FAQ</h2>${faq.map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</section>` : ''}
<div class="src">Originally published on <a href="https://promptgrabber.com/blog/${esc(p.slug)}" target="_blank" rel="noopener">PromptGrabber.com</a> — find thousands more AI prompts there.</div></article>`,
  });
}

async function allPosts() {
  const first = await api(`?page=1&limit=100`);
  let posts = first.posts;
  for (let i = 2; i <= first.totalPages; i++) posts = posts.concat((await api(`?page=${i}&limit=100`)).posts);
  return posts;
}
const xmlEsc = s => esc(s);
async function sitemap() {
  const posts = await allPosts();
  const now = posts[0]?.updated_at || new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n<url><loc>${SITE}/</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>\n${CATS.map(c => `<url><loc>${SITE}/category/${slugify(c.category)}</loc><changefreq>daily</changefreq><priority>0.6</priority></url>`).join('\n')}\n<url><loc>${SITE}/resume</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>\n</urlset>`; // articles omitted: their canonical lives on promptgrabber.com
}
async function rss() {
  const d = await api(`?page=1&limit=30`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>Kaushik Sarkar Blogs</title><link>${SITE}/</link><description>AI prompts, tutorials and engineering notes by Kaushik Sarkar</description>\n${d.posts.map(p => `<item><title>${xmlEsc(p.title)}</title><link>${SITE}/blog/${xmlEsc(p.slug)}</link><guid>${SITE}/blog/${xmlEsc(p.slug)}</guid><pubDate>${new Date(p.published_at).toUTCString()}</pubDate><description>${xmlEsc(p.excerpt)}</description></item>`).join('\n')}\n</channel></rss>`;
}

function send(res, code, type, body, maxAge = 300) {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': `public, max-age=${maxAge}`, 'X-Content-Type-Options': 'nosniff' });
  res.end(body);
}
const notFound = () => layout({ title: 'Page not found | Kaushik Sarkar Blogs', desc: 'Page not found', canonical: SITE + '/', active: 'blog', robots: 'noindex', body: '<section class="hero"><h1>Page not found</h1><p><a href="/">Back to all articles</a></p></section>' });

http.createServer(async (req, res) => {
  const u = new URL(req.url, SITE);
  const p = u.pathname.replace(/\/+$/, '') || '/';
  try {
    if (!CATS.length || Math.random() < .05) await refreshCats();
    const pg = Math.max(1, parseInt(u.searchParams.get('page')) || 1);
    if (p === '/search') { const q = (u.searchParams.get('q') || '').trim(); if (!q) { res.writeHead(302, { Location: '/' }); return res.end(); } return send(res, 200, 'text/html; charset=utf-8', await listPage(pg, q, ''), 60); }
    let cm = p.match(/^\/category\/([a-z0-9-]+)$/);
    if (cm) { const c = CATS.find(x => slugify(x.category) === cm[1]); return c ? send(res, 200, 'text/html; charset=utf-8', await listPage(pg, '', c.category)) : send(res, 404, 'text/html; charset=utf-8', notFound()); }
    if (p === '/' && u.searchParams.get('category')) { const c = slugify(u.searchParams.get('category')); res.writeHead(301, { Location: `/category/${c}` }); return res.end(); }
    if (p === '/' && u.searchParams.get('q')) { res.writeHead(301, { Location: `/search?q=${encodeURIComponent(u.searchParams.get('q'))}` }); return res.end(); }
    if (p === '/') return send(res, 200, 'text/html; charset=utf-8', await listPage(pg));
    if (p === '/resume' || p === '/resume.html') return send(res, 200, 'text/html; charset=utf-8', RESUME.replace('</style>', SUBNAV_CSS + '</style>').replace('</header>', '</header>' + subnav()), 600);
    if (p === '/index.html' || p === '/blog' || p === '/blogs') { res.writeHead(301, { Location: '/' }); return res.end(); }
    let m = p.match(/^\/blog\/([a-z0-9-]+)$/i);
    if (m) { const h = await postPage(m[1]); return h ? send(res, 200, 'text/html; charset=utf-8', h) : send(res, 404, 'text/html; charset=utf-8', notFound()); }
    if (p === '/sitemap.xml') return send(res, 200, 'application/xml; charset=utf-8', await sitemap());
    if (p === '/rss.xml' || p === '/feed.xml') return send(res, 200, 'application/rss+xml; charset=utf-8', await rss());
    if (p === '/robots.txt') return send(res, 200, 'text/plain', `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`, 86400);
    if (p === '/healthz') return send(res, 200, 'text/plain', 'ok', 0);
    send(res, 404, 'text/html; charset=utf-8', notFound());
  } catch (e) {
    console.error(req.url, e.message);
    send(res, 503, 'text/html; charset=utf-8', layout({ title: 'Temporarily unavailable', desc: '', canonical: SITE + '/', active: 'blog', robots: 'noindex', body: '<section class="hero"><h1>Articles are temporarily unavailable</h1><p>Please try again shortly, or view the <a href="/resume">resume</a>.</p></section>' }), 0);
  }
}).listen(PORT, () => console.log('listening on', PORT));
