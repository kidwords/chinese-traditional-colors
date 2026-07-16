// Cloudflare Worker - GitHub repos proxy
// Deploy with Wrangler. Store your PAT in a secret named GITHUB_TOKEN.

addEventListener('fetch', event => {
  event.respondWith(handle(event.request));
});

async function handle(req){
  const url = new URL(req.url);
  const pathname = url.pathname;
  if(url.searchParams.has('org')){
    const org = url.searchParams.get('org');
    return fetchRepos(org);
  }
  return new Response('Use ?org=ORG', { status: 400 });
}

async function fetchRepos(org){
  const token = GITHUB_TOKEN; // provided as worker binding secret
  const per = 100; let page = 1; let out = [];
  const headers = { 'User-Agent': 'cf-worker', Accept: 'application/vnd.github.v3+json' };
  if(token) headers['Authorization'] = `token ${token}`;
  while(true){
    const api = `https://api.github.com/orgs/${org}/repos?per_page=${per}&page=${page}`;
    const resp = await fetch(api, { headers });
    if(resp.status === 404){
      // fallback to user
      const userApi = `https://api.github.com/users/${org}/repos?per_page=${per}&page=${page}`;
      const r = await fetch(userApi, { headers });
      if(!r.ok) return new Response('GitHub API error: '+r.status, { status: r.status });
      const arr = await r.json();
      out = out.concat(arr);
      if(arr.length < per) break;
      page++;
      continue;
    }
    if(!resp.ok) return new Response('GitHub API error: '+resp.status, { status: resp.status });
    const arr = await resp.json();
    if(!Array.isArray(arr)) break;
    out = out.concat(arr);
    if(arr.length < per) break;
    page++;
  }
  // minimal mapping to reduce size
  const mapped = out.map(r=>({
    name: r.name,
    full_name: r.full_name,
    html_url: r.html_url,
    description: r.description,
    stargazers_count: r.stargazers_count,
    forks_count: r.forks_count,
    open_issues_count: r.open_issues_count,
    has_pages: r.has_pages,
    pushed_at: r.pushed_at,
    topics: r.topics || [],
    owner: { login: r.owner.login }
  }));
  return new Response(JSON.stringify(mapped), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 's-maxage=300' } });
}
