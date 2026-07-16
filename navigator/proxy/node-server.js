// Minimal Node proxy for GitHub repos
// Usage: set `GITHUB_TOKEN` env and run `node node-server.js`.

const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;
const token = process.env.GITHUB_TOKEN;
const PROXY_API_KEY = process.env.PROXY_API_KEY || '';

function requireApiKey(req,res,next){
  // allow open access for public usage but if PROXY_API_KEY is set, require it
  if(!PROXY_API_KEY) return next();
  const key = req.get('x-api-key') || req.get('authorization') || '';
  if(!key) return res.status(401).json({error:'missing api key'});
  // support Bearer <key>
  const v = key.startsWith('Bearer ') ? key.slice(7) : key;
  if(v !== PROXY_API_KEY) return res.status(403).json({error:'invalid api key'});
  return next();
}

app.get('/repos', requireApiKey, async (req, res) => {
  const org = req.query.org;
  if(!org) return res.status(400).send({error:'missing org param'});
  try{
    const per = 100; let page = 1; let out = [];
    const headers = { 'User-Agent': 'node-proxy', Accept: 'application/vnd.github.v3+json' };
    if(token) headers['Authorization'] = `token ${token}`;
    while(true){
      const url = `https://api.github.com/orgs/${org}/repos?per_page=${per}&page=${page}`;
      const r = await fetch(url, { headers });
      if(r.status === 404){
        // try user
        const u = await fetch(`https://api.github.com/users/${org}/repos?per_page=${per}&page=${page}`, { headers });
        if(!u.ok) return res.status(u.status).send(await u.text());
        const arr = await u.json(); out = out.concat(arr); if(arr.length < per) break; page++; continue;
      }
      if(!r.ok) return res.status(r.status).send(await r.text());
      const arr = await r.json(); out = out.concat(arr); if(arr.length < per) break; page++;
    }
    const mapped = out.map(r=>({ name: r.name, full_name: r.full_name, html_url: r.html_url, description: r.description, stargazers_count: r.stargazers_count, forks_count: r.forks_count, open_issues_count: r.open_issues_count, has_pages: r.has_pages, pushed_at: r.pushed_at, private: r.private||false, owner: { login: r.owner.login } }));
    res.set('Cache-Control','public, max-age=300');
    res.json(mapped);
  }catch(e){ res.status(500).send({error: e.message}); }
});

app.get('/admin/health', (req,res)=>{
  // basic health; require api key if set
  if(PROXY_API_KEY){
    const key = req.get('x-api-key') || req.get('authorization') || '';
    const v = key.startsWith('Bearer ') ? key.slice(7) : key;
    if(v !== PROXY_API_KEY) return res.status(403).json({ok:false});
  }
  res.json({ok:true, note:'proxy running'});
});

app.listen(PORT, ()=> console.log('listening',PORT));
