(async ()=>{
  const repos = [
    {owner: 'kidwords', repo: 'chinese-traditional-colors'}
  ];

  const container = document.getElementById('repos');

  function el(tag, cls, txt){ const e = document.createElement(tag); if(cls) e.className = cls; if(txt) e.textContent = txt; return e; }

  async function fetchRepo(o){
    try{
      const r = await fetch(`https://api.github.com/repos/${o.owner}/${o.repo}`);
      if(!r.ok) throw new Error('HTTP '+r.status);
      const j = await r.json();
      const c = await fetch(`https://api.github.com/repos/${o.owner}/${o.repo}/commits?per_page=1`);
      const commits = c.ok ? await c.json() : [];
      return {repo: j, lastCommit: commits[0] || null};
    }catch(e){ return {error: e.message}; }
  }

  for(const r of repos){
    const card = el('article','card');
    container.appendChild(card);
    card.appendChild(el('h3',null, `${r.owner}/${r.repo}`));
    const meta = el('div','meta','加载中...'); card.appendChild(meta);
    const stats = el('div','stats'); card.appendChild(stats);
    const link = document.createElement('a'); link.className='btn'; link.target='_blank'; link.rel='noopener';
    link.href = `https://${r.owner}.github.io/${r.repo}/`;
    link.textContent = '打开 Pages';

    try{
      const data = await fetchRepo(r);
      if(data.error){ meta.textContent = '获取信息失败: '+data.error; continue; }
      const repo = data.repo;
      meta.textContent = repo.description || '—';
      stats.textContent = `⭐ ${repo.stargazers_count} · 🍴 ${repo.forks_count} · issues ${repo.open_issues_count}`;
      if(data.lastCommit){
        const d = new Date(data.lastCommit.commit.author.date);
        const last = el('div',null, `最近提交: ${d.toLocaleString()} (${data.lastCommit.sha.slice(0,7)})`);
        card.appendChild(last);
      }
      card.appendChild(link);
    }catch(err){ meta.textContent = '错误: '+err.message; }
  }
})();
