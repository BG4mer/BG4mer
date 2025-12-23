/*
Shared script for index.html and sites.html
- Edit GITHUB_USERNAME below
*/

const GITHUB_USERNAME = 'BG4mer'; // <- change this to your GitHub username
const FALLBACK_PROJECTS = [
  { title: 'Sabotaged Sessions', desc: "FNF mod with Impostors and 7 worlds.", img: 'https://placehold.co/800x400?text=Sabotaged+Sessions', url: '#' , tags:['FNF','Mod'] },
  { title: 'Final Gauntlet', desc: 'Geometry Dash gauntlet mod.', img: 'https://placehold.co/800x400?text=Final+Gauntlet', url:'#', tags:['Geometry Dash'] }
];

/* ---------- particles / stars background ---------- */
class Particle {
  constructor(w,h){
    this.reset(w,h);
  }
  reset(w,h){
    this.x = Math.random()*w;
    this.y = Math.random()*h;
    this.vx = (Math.random()-0.5)*0.2;
    this.vy = (Math.random()-0.5)*0.2;
    this.size = Math.random()*1.8+0.4;
    this.alpha = 0.2+Math.random()*0.9;
  }
  step(w,h,mouse){
    this.x += this.vx + (mouse.dx*0.02);
    this.y += this.vy + (mouse.dy*0.02);
    if(this.x<0||this.x>w||this.y<0||this.y>h) this.reset(w,h);
  }
}

function startParticles(canvasId){
  const canvas = document.getElementById(canvasId);
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let w=canvas.width=innerWidth; let h=canvas.height=innerHeight;
  let particles = Array.from({length: Math.round((w*h)/60000)}, ()=> new Particle(w,h));
  let mouse = {x:w/2,y:h/2,dx:0,dy:0};
  window.addEventListener('resize', ()=>{ w=canvas.width=innerWidth; h=canvas.height=innerHeight; particles = Array.from({length: Math.round((w*h)/60000)}, ()=> new Particle(w,h)); });
  window.addEventListener('mousemove', (e)=>{ mouse.dx = (e.clientX - mouse.x); mouse.dy = (e.clientY - mouse.y); mouse.x=e.clientX; mouse.y=e.clientY; });
  let t=0;
  function frame(){
    t+=1;
    ctx.clearRect(0,0,w,h);
    // subtle gradient
    const g = ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0, 'rgba(12,10,20,0.06)');
    g.addColorStop(1, 'rgba(8,12,24,0.12)');
    ctx.fillStyle = g; ctx.fillRect(0,0,w,h);

    // stars
    for(let p of particles){
      p.step(w,h,mouse);
      ctx.beginPath();
      ctx.globalAlpha = p.alpha*0.9;
      ctx.fillStyle = 'rgba(255,255,255,1)';
      ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
      ctx.fill();
    }

    // faint connecting lines
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = 'rgba(124,58,237,0.9)';
    for(let i=0;i<particles.length;i++){
      for(let j=i+1;j<i+4 && j<particles.length;j++){
        const a=particles[i], b=particles[j];
        const dx=a.x-b.x, dy=a.y-b.y; const d2=dx*dx+dy*dy;
        if(d2<40000){ ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); }
      }
    }

    ctx.globalAlpha=1;
    requestAnimationFrame(frame);
  }
  frame();
}

/* ---------- lightweight utilities ---------- */
function $(sel, root=document){ return root.querySelector(sel); }
function $all(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }

/* ---------- GitHub repo loader ---------- */
async function loadGithubProjects(opts={limit:12}){
  try{
    const res = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100`);
    if(!res.ok) throw new Error('github fetch failed');
    const repos = await res.json();
    // sort by updated
    repos.sort((a,b)=> new Date(b.updated_at)-new Date(a.updated_at));
    const projects = repos.slice(0, opts.limit).map(r=>({
      title: r.name,
      desc: r.description || '',
      img: `https://opengraph.githubassets.com/1/${GITHUB_USERNAME}/${r.name}`,
      url: r.homepage && r.homepage.length>0 ? r.homepage : r.html_url,
      tags: [r.language || 'Repo']
    }));
    return projects;
  }catch(e){ console.warn('GitHub load failed',e); return FALLBACK_PROJECTS; }
}

/* ---------- render helpers ---------- */
function makeCard(p){
  const el = document.createElement('div'); el.className='card neon-panel chromatic';
  el.innerHTML = `
    <div class="thumb"><img loading='lazy' src="${p.img}" alt="${p.title}"></div>
    <h4>${p.title}</h4>
    <p>${p.desc||''}</p>
    <div class="tags">${(p.tags||[]).slice(0,3).map(t=>`<span class='tag'>${t}</span>`).join('')}</div>
  `;
  el.onclick = ()=>{ window.open(p.url,'_blank'); };
  return el;
}

async function populatePreviewGrid(){
  const grid = $('#previewGrid'); if(!grid) return;
  grid.innerHTML='';
  const gh = await loadGithubProjects({limit:9});
  const list = [...gh];
  list.forEach(p=> grid.appendChild(makeCard(p)));
}

async function populateSitesGrid(){
  const grid = $('#sitesGrid'); if(!grid) return;
  grid.innerHTML='Loading...';
  const gh = await loadGithubProjects({limit:60});
  const list = [...FALLBACK_PROJECTS, ...gh];
  grid.innerHTML='';
  list.forEach(p=> grid.appendChild(makeCard(p)));
  buildTagFilters(list);
}

function buildTagFilters(list){
  const tagRoot = $('#tags'); if(!tagRoot) return;
  const tags = Array.from(new Set(list.flatMap(x=>x.tags||[])));
  tagRoot.innerHTML = tags.map(t=>`<button class='tag-filter'>${t}</button>`).join('');
  $all('.tag-filter').forEach(btn=>{
    btn.onclick = ()=>{ const t=btn.textContent; filterByTag(t); };
  });
}

function filterByTag(t){
  const nodes = $all('#sitesGrid .card');
  nodes.forEach(n=>{
    const tagText = n.querySelector('.tags')?.textContent||'';
    if(tagText.toLowerCase().includes(t.toLowerCase())){ n.style.display='block'; } else { n.style.display='none'; }
  });
}

/* ---------- scroll reveal ---------- */
function initReveal(){
  const obs = new IntersectionObserver((entries)=>{
    for(const e of entries){ if(e.isIntersecting){ e.target.classList.add('revealed'); obs.unobserve(e.target); } }
  }, {threshold:0.12});
  $all('.reveal').forEach(el=>obs.observe(el));
}

/* ---------- page transition helper ---------- */
function initPageTransitions(){
  const links = Array.from(document.querySelectorAll('a'));
  const transition = document.getElementById('pageTransition');
  links.forEach(a=>{
    if(a.target==='_blank' || a.href.includes('#')) return; // ignore external/newtab/anchors
    a.addEventListener('click', (ev)=>{
      ev.preventDefault();
      if(!transition) { window.location = a.href; return; }
      transition.classList.remove('hidden'); transition.classList.add('show');
      setTimeout(()=> window.location = a.href, 420);
    });
  });
}

/* ---------- theme toggle ---------- */
function initThemeToggle(btnId){
  const btn = document.getElementById(btnId); if(!btn) return;
  btn.onclick = ()=>{ document.body.classList.toggle('light'); if(document.body.classList.contains('light')){ document.documentElement.style.setProperty('--bg-1','#f8fafc'); document.documentElement.style.setProperty('--bg-2','#e6eef8'); document.body.style.color='#071029'; } else { document.documentElement.style.removeProperty('--bg-1'); document.documentElement.style.removeProperty('--bg-2'); document.body.style.color=''; } };
}

/* ---------- init on both pages ---------- */
(function init(){
  // start particle background for each canvas id we might have
  startParticles('bgCanvas'); startParticles('bgCanvasSites');
  initReveal(); initPageTransitions();
  initThemeToggle('themeToggle'); initThemeToggle('themeToggleSites');

  // wire search on index -> preview
  const s = $('#search'); if(s){ s.oninput = ()=>{ const q=s.value.toLowerCase(); $all('#previewGrid .card').forEach(card=>{ const hit = card.textContent.toLowerCase().includes(q); card.style.display = hit ? 'block' : 'none'; }); }; }

  const ss = $('#searchSites'); if(ss){ ss.oninput = ()=>{ const q=ss.value.toLowerCase(); $all('#sitesGrid .card').forEach(card=>{ const hit = card.textContent.toLowerCase().includes(q); card.style.display = hit ? 'block' : 'none'; }); } }

  // page-specific populate
  populatePreviewGrid(); populateSitesGrid();
})();

/* ---------- optional: register service worker for offline (commented out)
if('serviceWorker' in navigator){ navigator.serviceWorker.register('/sw.js').catch(()=>{}); }
*/


<!-- END OF FILE -->
