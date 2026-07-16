(async ()=>{
  const ORG = 'kidwords';
  const container = document.getElementById('repos');
  const CACHE_KEY = 'navigator_repos_v1';
  const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

  function el(tag, cls, txt){ const e = document.createElement(tag); if(cls) e.className = cls; if(txt) e.textContent = txt; return e; }

  function saveCache(data){ try{ localStorage.setItem(CACHE_KEY, JSON.stringify({ts:Date.now(),data})); }catch(e){} }
  function loadCache(){ try{ const s = localStorage.getItem(CACHE_KEY); if(!s) return null; const obj = JSON.parse(s); if(Date.now() - obj.ts > CACHE_TTL) return null; return obj.data; }catch(e){ return null; } }

  async function fetchAllRepos(){
    const per = 100; let page = 1; let out = [];
    // Try org first, fallback to user
    let urlBase = `https://api.github.com/orgs/${ORG}/repos`;
    let triedOrg = true;

    while(true){
      const url = `${urlBase}?per_page=${per}&page=${page}`;
      const res = await fetch(url);
      if(res.status === 404 && triedOrg){ // maybe it's a user account
        urlBase = `https://api.github.com/users/${ORG}/repos`;
        triedOrg = false; page = 1; continue;
      }
      if(!res.ok) throw new Error('HTTP '+res.status);
      const arr = await res.json();
      if(!Array.isArray(arr)) break;
      out = out.concat(arr);
      if(arr.length < per) break;
      page++;
    }

    // sort by pushed_at desc
    out.sort((a,b)=> new Date(b.pushed_at) - new Date(a.pushed_at));
    return out;
  }

  function renderEmpty(msg){ container.innerHTML = ''; const p = el('p', null, msg); container.appendChild(p); }

  function makeCard(repo){
    const card = el('article','card');
    card.appendChild(el('h3',null, repo.full_name));
    card.appendChild(el('div','meta', repo.description || '—'));
    const stats = el('div','stats', `⭐ ${repo.stargazers_count} · 🍴 ${repo.forks_count} · issues ${repo.open_issues_count}`);
    card.appendChild(stats);
    const pushed = repo.pushed_at ? new Date(repo.pushed_at).toLocaleString() : '—';
    card.appendChild(el('div',null, `最近推送: ${pushed}`));

    const btnRow = el('div', null);
    const repoLink = document.createElement('a'); repoLink.className='btn'; repoLink.href = repo.html_url; repoLink.target='_blank'; repoLink.rel='noopener'; repoLink.textContent = '打开 仓库';
    btnRow.appendChild(repoLink);

    const pagesBtn = document.createElement('a'); pagesBtn.className='btn'; pagesBtn.style.marginLeft = '8px';
    pagesBtn.target = '_blank'; pagesBtn.rel = 'noopener';
    if(repo.has_pages){
      pagesBtn.href = `https://${repo.owner.login}.github.io/${repo.name}/`;
      pagesBtn.textContent = '打开 Pages';
    }else{
      pagesBtn.href = '#'; pagesBtn.textContent = '无 Pages'; pagesBtn.style.opacity = '0.6'; pagesBtn.style.pointerEvents = 'none';
    }
    btnRow.appendChild(pagesBtn);

    card.appendChild(btnRow);
    return card;
  }

  async function loadAndRender(force=false){
    container.innerHTML = '';
    const cached = loadCache();
    if(cached && !force){
      cached.forEach(r => container.appendChild(makeCard(r)));
      const info = el('div','footer', `（从缓存读取 ${cached.length} 个仓库）`);
      container.appendChild(info);
      return;
    }

    const loading = el('div',null,'加载仓库列表...'); container.appendChild(loading);
    try{
      const repos = await fetchAllRepos();
      container.innerHTML = '';
      if(!repos || repos.length === 0){ renderEmpty('未找到仓库'); return; }
      // Optionally filter: remove forks
      const filtered = repos.filter(r=>!r.fork);
      filtered.forEach(r => container.appendChild(makeCard(r)));
      saveCache(filtered);
      container.appendChild(el('div','footer', `共 ${filtered.length} 个仓库（forks 已过滤）。`));
    }catch(err){ renderEmpty('获取失败: '+err.message); }
  }

  // add refresh button
  const hdr = document.querySelector('.container');
  const ctrl = el('div',null);
  const refresh = el('button','btn','刷新');
  refresh.onclick = ()=>{ saveCache([]); loadAndRender(true); };
  ctrl.appendChild(refresh);
  hdr.insertBefore(ctrl, hdr.querySelector('#repos'));

  // initial load
  await loadAndRender();

})();
