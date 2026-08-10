// ==========================================================
// Movie Prime — shared frontend logic (home + category pages)
// ==========================================================

{
  const supabase = window.supabaseClient;

  // Global lists to store movies for real-time search filtering
  let allTrendingMovies = [];
  let allLatestMovies = [];
  let allCategoryMovies = [];
  let allLatestSeries = [];

  const isSeriesPage = location.pathname.includes('series.html');
  const mediaType = isSeriesPage ? 'series' : 'movie';

  // ---------- language toggle (English / Sinhala) ----------
  function applyLang(lang){
    document.querySelectorAll('[data-en]').forEach(el=>{
      el.textContent = lang === 'si' ? (el.dataset.si || el.dataset.en) : el.dataset.en;
    });
    
    // Set placeholders for search inputs
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.placeholder = lang === 'si'
        ? (searchInput.dataset.siPlaceholder || 'සොයන්න...')
        : (searchInput.dataset.enPlaceholder || 'Search movies...');
    }

    document.querySelectorAll('.lang-toggle button').forEach(b=>{
      b.classList.toggle('active', b.dataset.lang === lang);
    });
    localStorage.setItem('mp_lang', lang);
  }

  function initLangToggle(){
    const saved = localStorage.getItem('mp_lang') || 'en';
    applyLang(saved);
    document.querySelectorAll('.lang-toggle button').forEach(b=>{
      b.addEventListener('click', ()=> applyLang(b.dataset.lang));
    });
  }

  // ---------- card rendering ----------
  function movieCardHTML(m){
    const poster = m.poster_url || driveLinkToImageUrl(m.drive_link) || '';
    const mainGenre = m.category ? m.category.split(',')[0].trim() : '';
    return `
      <div class="card">
        <div class="poster-wrap" onclick="window.location.href='movie.html?id=${m.id}'">
          ${m.trending ? '<span class="badge trending">Trending</span>' : ''}
          <img src="${poster}" alt="${escapeHtml(m.title)}" loading="lazy"
               onload="this.classList.add('loaded')"
               onerror="this.style.opacity=0.15">
        </div>
        <div class="card-body">
          <p class="title" onclick="window.location.href='movie.html?id=${m.id}'">${escapeHtml(m.title)}</p>
          <div class="meta" onclick="window.location.href='movie.html?id=${m.id}'">
            <div class="meta-left">
              <span class="genre-tag">${escapeHtml(mainGenre)}</span>
              <span class="year-val">${m.year || ''}</span>
            </div>
            ${m.rating ? `<span class="rating">★ ${m.rating}</span>` : ''}
          </div>
          <!-- Card Socials -->
          <div class="card-socials">
            <a href="https://t.me/movieprimeytsl" target="_blank" rel="noopener" class="card-soc-btn tg" title="Join Telegram Channel">
              <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.27-2.03-.49-.82-.27-1.47-.41-1.42-.87.03-.24.36-.49.99-.75 3.86-1.68 6.44-2.78 7.74-3.31 3.69-1.51 4.45-1.77 4.95-1.78.11 0 .36.03.52.16.13.1.17.25.19.35.02.13.02.26 0 .39z"/></svg>
            </a>
            <a href="https://whatsapp.com/channel/0029VbDDB8K8PgsPkQHHoK34" target="_blank" rel="noopener" class="card-soc-btn wa" title="Join WhatsApp Channel">
              <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.817 9.817 0 0 0 12.04 2zm0 1.63c2.21 0 4.29.86 5.86 2.43 1.57 1.57 2.43 3.65 2.43 5.86 0 4.56-3.72 8.28-8.28 8.28-1.47 0-2.91-.39-4.18-1.13l-.3-.18-3.11.82.83-3.03-.2-.31c-.81-1.29-1.24-2.79-1.24-4.33.01-4.56 3.73-8.28 8.29-8.28z"/></svg>
            </a>
            <a href="https://web.facebook.com/profile.php?id=61590992003172" target="_blank" rel="noopener" class="card-soc-btn fb" title="Follow FB Page">
              <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.99 3.65 9.12 8.44 9.88v-6.99H7.9v-2.89h2.54V9.8c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.89h-2.33v6.99C18.35 21.12 22 16.99 22 12c0-5.52-4.48-10-10-10z"/></svg>
            </a>
          </div>
        </div>
      </div>`;
  }

  // ---------- dynamic hero banner (Slideshow Carousel) ----------
  let heroIndex = 0;
  let heroInterval = null;
  let heroMovies = [];

  function updateHeroSlider() {
    const heroContainer = document.getElementById('heroBanner');
    if (!heroContainer || heroMovies.length === 0) return;

    const featured = heroMovies[heroIndex];
    const poster = featured.poster_url || driveLinkToImageUrl(featured.drive_link) || '';
    const lang = localStorage.getItem('mp_lang') || 'en';
    const watchNowText = lang === 'si' ? 'දැන් නරඹන්න' : 'Watch Now';
    const featuredText = lang === 'si' ? 'විශේෂාංගය' : 'Featured Film';
    const ratingText = featured.rating ? `★ ${featured.rating} IMDb` : '';

    heroContainer.innerHTML = `
      <section class="hero-banner" style="background-image: url('${poster}')">
        <div class="hero-banner-content">
          <p class="eyebrow" data-en="Featured Film" data-si="විශේෂාංගය">${featuredText}</p>
          <h1 class="display" style="margin-bottom:8px;">${escapeHtml(featured.title)}</h1>
          <div class="hero-meta-badge-row">
            <span class="hero-badge-item year">${featured.year || ''}</span>
            ${featured.rating ? `<span class="hero-badge-item rating">${ratingText}</span>` : ''}
            <span class="hero-badge-item category">${escapeHtml(featured.category)}</span>
          </div>
          <a href="movie.html?id=${featured.id}" class="btn" style="margin-top:24px;">${watchNowText}</a>
        </div>
      </section>
    `;
  }

  async function renderHeroBanner() {
    const heroContainer = document.getElementById('heroBanner');
    if (!heroContainer) return;

    heroMovies = allTrendingMovies.length > 0 ? allTrendingMovies : allLatestMovies;
    if (heroMovies.length === 0) return;

    heroIndex = 0;
    updateHeroSlider();

    if (heroInterval) clearInterval(heroInterval);
    heroInterval = setInterval(() => {
      heroIndex = (heroIndex + 1) % heroMovies.length;
      updateHeroSlider();
    }, 6000);
  }

  // ---------- scroll-reveal for section headers ----------
  function initScrollReveal(){
    const targets = document.querySelectorAll('.section-head');
    targets.forEach(el => el.classList.add('reveal'));
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, {threshold:.2});
    targets.forEach(el => io.observe(el));
  }

  function escapeHtml(s){
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // ---------- data fetchers ----------
  async function fetchTrending(limit=10){
    const {data,error} = await supabase.from('movies')
      .select('*').eq('trending', true).eq('type', 'movie')
      .order('created_at', {ascending:false}).limit(limit);
    if(error){console.error(error); return [];}
    return data;
  }

  async function fetchLatest(limit=12){
    const {data,error} = await supabase.from('movies')
      .select('*').eq('type', 'movie')
      .order('created_at', {ascending:false}).limit(limit);
    if(error){console.error(error); return [];}
    return data;
  }

  async function fetchLatestSeries(limit=12){
    const {data,error} = await supabase.from('movies')
      .select('*').eq('type', 'series')
      .order('created_at', {ascending:false}).limit(limit);
    if(error){console.error(error); return [];}
    return data;
  }

  async function fetchByCategory(category, limit=60){
    let q = supabase.from('movies').select('*').eq('type', mediaType).order('created_at', {ascending:false}).limit(limit);
    if(category && category !== 'All') q = q.ilike('category', `%${category}%`);
    const {data,error} = await q;
    if(error){console.error(error); return [];}
    return data;
  }

  async function fetchCategories(){
    const {data,error} = await supabase.from('movies').select('category').eq('type', mediaType);
    if(error){console.error(error); return [];}
    
    const allGenres = [];
    data.forEach(d => {
      if (d.category) {
        d.category.split(',').forEach(g => {
          const trimmed = g.trim();
          if (trimmed && !allGenres.includes(trimmed)) {
            allGenres.push(trimmed);
          }
        });
      }
    });
    return allGenres.sort();
  }

  // ---------- search filtering ----------
  function filterMovies(query) {
    const cleanQuery = query.toLowerCase().trim();
    
    const filterList = (list, gridEl, emptyMsg) => {
      if (!gridEl) return;
      const filtered = list.filter(m => 
        m.title.toLowerCase().includes(cleanQuery) || 
        (m.description && m.description.toLowerCase().includes(cleanQuery)) ||
        (m.category && m.category.toLowerCase().includes(cleanQuery))
      );
      gridEl.innerHTML = filtered.length
        ? filtered.map(movieCardHTML).join('')
        : `<p style="color:var(--muted)">${emptyMsg}</p>`;
    };

    const lang = localStorage.getItem('mp_lang') || 'en';
    const emptyMsg = lang === 'si' ? 'ගැලපෙන තොරතුරු කිසිවක් හමු නොවීය.' : 'No matching items found.';

    filterList(allTrendingMovies, document.getElementById('trendingGrid'), emptyMsg);
    filterList(allLatestMovies, document.getElementById('latestGrid'), emptyMsg);
    filterList(allLatestSeries, document.getElementById('latestSeriesGrid'), emptyMsg);
    filterList(allCategoryMovies, document.getElementById('categoryGrid'), emptyMsg);
  }

  // ---------- home page ----------
  async function renderHome(){
    const trendingEl = document.getElementById('trendingGrid');
    const latestEl = document.getElementById('latestGrid');
    const latestSeriesEl = document.getElementById('latestSeriesGrid');
    
    if(trendingEl){
      allTrendingMovies = await fetchTrending();
      trendingEl.innerHTML = allTrendingMovies.length
        ? allTrendingMovies.map(movieCardHTML).join('')
        : `<p style="color:var(--muted)">No trending movies yet.</p>`;
    }
    if(latestEl){
      allLatestMovies = await fetchLatest();
      latestEl.innerHTML = allLatestMovies.length
        ? allLatestMovies.map(movieCardHTML).join('')
        : `<p style="color:var(--muted)">No movies added yet.</p>`;
    }
    if(latestSeriesEl){
      allLatestSeries = await fetchLatestSeries();
      latestSeriesEl.innerHTML = allLatestSeries.length
        ? allLatestSeries.map(movieCardHTML).join('')
        : `<p style="color:var(--muted)">No TV series added yet.</p>`;
    }
    
    await renderHeroBanner();
  }

  // ---------- category page ----------
  async function renderCategoryPage(){
    const chipsEl = document.getElementById('categoryChips');
    const gridEl = document.getElementById('categoryGrid');
    if(!chipsEl || !gridEl) return;

    const params = new URLSearchParams(location.search);
    let active = params.get('c') || 'All';

    const cats = ['All', ...await fetchCategories()];
    chipsEl.innerHTML = cats.map(c =>
      `<button class="chip ${c===active?'active':''}" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`
    ).join('');

    async function load(cat){
      active = cat;
      chipsEl.querySelectorAll('.chip').forEach(ch=>{
        ch.classList.toggle('active', ch.dataset.cat === cat);
      });
      allCategoryMovies = await fetchByCategory(cat);
      
      // Reset search bar when changing categories
      const searchInput = document.getElementById('searchInput');
      if (searchInput) searchInput.value = '';

      gridEl.innerHTML = allCategoryMovies.length
        ? allCategoryMovies.map(movieCardHTML).join('')
        : `<p style="color:var(--muted)">No movies in this category yet.</p>`;
        
      const url = new URL(location);
      cat === 'All' ? url.searchParams.delete('c') : url.searchParams.set('c', cat);
      history.replaceState(null, '', url);
    }

    chipsEl.addEventListener('click', e=>{
      const btn = e.target.closest('.chip');
      if(btn) load(btn.dataset.cat);
    });

    load(active);
  }

  // ---------- DOM setup ----------
  document.addEventListener('DOMContentLoaded', ()=>{
    initLangToggle();
    initScrollReveal();
    renderHome();
    renderCategoryPage();

    // Search input listeners
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        filterMovies(e.target.value);
      });
    }
  });
}
