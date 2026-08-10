// ==========================================================
// Movie Prime — Admin Prime Logic
// ==========================================================

{
  const supabase = window.supabaseClient;

  const loginPanel   = document.getElementById('loginPanel');
  const adminContent = document.getElementById('adminContent');
  const logoutBtn    = document.getElementById('logoutBtn');

  // ---------- Session Verification ----------
  async function checkSession(){
    const isLogged = sessionStorage.getItem('mp_admin_logged') === 'true';
    
    if(isLogged){
      loginPanel.style.display = 'none';
      adminContent.style.display = 'block';
      logoutBtn.style.display = 'inline-block';
      loadMovies();
    } else {
      loginPanel.style.display = 'block';
      adminContent.style.display = 'none';
      logoutBtn.style.display = 'none';
    }
  }

  // ---------- Authentication Action ----------
  document.getElementById('loginBtn').addEventListener('click', ()=>{
    const username = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const msg = document.getElementById('loginMsg');

    if (username === 'MovieprimeAdmin' && password === 'Prashan2002') {
      msg.textContent = '';
      sessionStorage.setItem('mp_admin_logged', 'true');
      checkSession();
    } else {
      msg.textContent = 'Invalid credentials. Only the main Administrator account can access this panel.';
      msg.className='state-msg error';
    }
  });

  logoutBtn.addEventListener('click', ()=>{
    sessionStorage.removeItem('mp_admin_logged');
    checkSession();
  });

  // ---------- Google Drive Preview Handling ----------
  const fDrive = document.getElementById('fDrive');
  const fPreview = document.getElementById('fPreview');
  fDrive.addEventListener('input', ()=>{
    const val = fDrive.value.trim();
    const url = driveLinkToImageUrl(val) || val;
    if(url){ fPreview.src = url; fPreview.style.display='block'; }
    else { fPreview.style.display='none'; }
  });

  // ---------- Form Control Actions ----------
  const saveBtn = document.getElementById('saveBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const formTitle = document.getElementById('formTitle');
  const fType = document.getElementById('fType');
  const movieQualityGroup = document.getElementById('movieQualityGroup');
  const episodesFormGroup = document.getElementById('episodesFormGroup');

  fType.addEventListener('change', toggleFormGroups);

  function toggleFormGroups() {
    const val = fType.value;
    if (val === 'series') {
      movieQualityGroup.style.display = 'none';
      episodesFormGroup.style.display = 'block';
    } else {
      movieQualityGroup.style.display = 'block';
      episodesFormGroup.style.display = 'none';
    }
  }

  function getSelectedCategories() {
    const checked = document.querySelectorAll('#categoryCheckboxes input[type="checkbox"]:checked');
    return Array.from(checked).map(c => c.value).join(', ');
  }

  function clearSelectedCategories() {
    document.querySelectorAll('#categoryCheckboxes input[type="checkbox"]').forEach(c => c.checked = false);
  }

  function setSelectedCategories(catString) {
    clearSelectedCategories();
    if (!catString) return;
    const genres = catString.split(',').map(g => g.trim());
    document.querySelectorAll('#categoryCheckboxes input[type="checkbox"]').forEach(c => {
      c.checked = genres.includes(c.value);
    });
  }

  function clearForm(){
    document.getElementById('movieId').value = '';
    document.getElementById('fType').value = 'movie';
    document.getElementById('fTitle').value = '';
    clearSelectedCategories();
    document.getElementById('fYear').value = '';
    document.getElementById('fRating').value = '';
    document.getElementById('fDescription').value = '';
    document.getElementById('fDrive').value = '';
    document.getElementById('fTrailer').value = '';
    document.getElementById('fLink480').value = '';
    document.getElementById('fLink720').value = '';
    document.getElementById('fLink1080').value = '';
    document.getElementById('fEpisodes').value = '';
    document.getElementById('fDownload').value = '';
    document.getElementById('fTrending').checked = false;
    fPreview.style.display = 'none';
    fPreview.src = '';
    
    toggleFormGroups();
    formTitle.textContent = 'Add Premium Item';
    cancelEditBtn.style.display = 'none';
  }

  saveBtn.addEventListener('click', async ()=>{
    const id = document.getElementById('movieId').value;
    const driveLink = document.getElementById('fDrive').value.trim();
    
    // Extract or direct pass poster image
    const posterUrl = driveLinkToImageUrl(driveLink) || driveLink;

    const payload = {
      title: document.getElementById('fTitle').value.trim(),
      type: document.getElementById('fType').value,
      category: getSelectedCategories(),
      year: parseInt(document.getElementById('fYear').value) || null,
      rating: parseFloat(document.getElementById('fRating').value) || null,
      description: document.getElementById('fDescription').value.trim(),
      drive_link: driveLink,
      poster_url: posterUrl,
      trailer_link: document.getElementById('fTrailer').value.trim(),
      link_480p: document.getElementById('fLink480').value.trim(),
      link_720p: document.getElementById('fLink720').value.trim(),
      link_1080p: document.getElementById('fLink1080').value.trim(),
      episodes: document.getElementById('fEpisodes').value.trim(),
      download_link: document.getElementById('fDownload').value.trim(),
      trending: document.getElementById('fTrending').checked
    };
    const msg = document.getElementById('formMsg');

    if(!payload.title || !payload.category){
      msg.textContent = 'Title and Category (Genre) are required.'; msg.className='state-msg error';
      return;
    }

    msg.textContent = 'Saving details to database…'; msg.className='state-msg';
    let error;
    if(id){
      ({error} = await supabase.from('movies').update(payload).eq('id', id));
    } else {
      ({error} = await supabase.from('movies').insert(payload));
    }

    if(error){
      console.error("Supabase Save Error Details:", error);
      let hint = "";
      if (error.message.includes("relation") || error.message.includes("does not exist")) {
        hint = " (හේතුව: Supabase database එකේ 'movies' table එක සෑදී නැත. කරුණාකර sql/schema.sql එක Supabase SQL Editor එකේ Run කරන්න.)";
      } else if (error.message.includes("row-level security") || error.status === 401 || error.status === 403 || error.message.includes("violates row-level security policy")) {
        hint = " (හේතුව: Database එකේ RLS ආරක්ෂාව සක්‍රීයව පවතී. කරුණාකර Supabase dashboard -> SQL Editor එකේ ALTER TABLE movies DISABLE ROW LEVEL SECURITY; run කරන්න.)";
      } else if (error.message.includes("column")) {
        hint = " (හේතුව: Database එකේ අලුත් quality columns (link_480p, etc.) සෑදී නැත. කරුණාකර අලුත්ම sql/schema.sql එක Supabase SQL Editor එකේ Run කරන්න.)";
      }
      msg.innerHTML = `<strong>Error:</strong> ${error.message}${hint}`; 
      msg.className='state-msg error';
    } else {
      msg.textContent = 'Movie published successfully! ✓'; msg.className='state-msg ok';
      clearForm();
      loadMovies();
    }
  });

  cancelEditBtn.addEventListener('click', clearForm);

  // ---------- Table Loader, Edit, & Delete ----------
  async function loadMovies(){
    const tbodyMovies = document.getElementById('movieTableBody');
    const tbodySeries = document.getElementById('seriesTableBody');
    if (!tbodyMovies || !tbodySeries) return;

    const {data, error} = await supabase.from('movies').select('*').order('created_at', {ascending:false});
    if(error){
      tbodyMovies.innerHTML = `<tr><td colspan="5">${error.message}</td></tr>`;
      tbodySeries.innerHTML = `<tr><td colspan="5">${error.message}</td></tr>`;
      return;
    }

    const moviesList = data ? data.filter(m => m.type !== 'series') : [];
    const seriesList = data ? data.filter(m => m.type === 'series') : [];
    
    const renderRow = m => {
      const poster = m.poster_url || driveLinkToImageUrl(m.drive_link) || '';
      return `
        <tr>
          <td><img src="${poster}" style="opacity:0;transition:opacity .3s" onload="this.style.opacity=1" onerror="this.style.opacity=0.15"></td>
          <td style="font-weight:600;">${m.title}</td>
          <td>${m.category || ''}</td>
          <td>${m.trending ? '<span style="color:var(--primary)">Yes</span>' : 'No'}</td>
          <td>
            <button class="btn secondary" style="margin:0;padding:6px 12px;font-size:12px" data-edit="${m.id}">Edit</button>
            <button class="btn danger" style="margin:0;padding:6px 12px;font-size:12px" data-del="${m.id}">Delete</button>
          </td>
        </tr>`;
    };

    tbodyMovies.innerHTML = moviesList.length
      ? moviesList.map(renderRow).join('')
      : `<tr><td colspan="5">No movies found in catalog.</td></tr>`;

    tbodySeries.innerHTML = seriesList.length
      ? seriesList.map(renderRow).join('')
      : `<tr><td colspan="5">No TV Series found in catalog.</td></tr>`;
  }

  // Handle Edit/Delete button triggers
  const handleTableClick = async (e) => {
    const btn = e.target.closest('button');
    if(!btn) return;
    const editId = btn.getAttribute('data-edit');
    const delId = btn.getAttribute('data-del');
    console.log("Admin list action clicked. Edit ID:", editId, "Delete ID:", delId);
    if(editId) editMovie(editId);
    if(delId) await deleteMovie(delId);
  };

  document.getElementById('movieTableBody').addEventListener('click', handleTableClick);
  document.getElementById('seriesTableBody').addEventListener('click', handleTableClick);

  async function editMovie(id){
    const {data:m, error} = await supabase.from('movies').select('*').eq('id', id).single();
    if(error || !m){ alert('Error loading item details'); return; }
    
    document.getElementById('movieId').value = m.id;
    document.getElementById('fType').value = m.type || 'movie';
    document.getElementById('fTitle').value = m.title;
    setSelectedCategories(m.category);
    document.getElementById('fYear').value = m.year || '';
    document.getElementById('fRating').value = m.rating || '';
    document.getElementById('fDescription').value = m.description || '';
    document.getElementById('fDrive').value = m.drive_link || '';
    document.getElementById('fTrailer').value = m.trailer_link || '';
    document.getElementById('fLink480').value = m.link_480p || '';
    document.getElementById('fLink720').value = m.link_720p || '';
    document.getElementById('fLink1080').value = m.link_1080p || '';
    document.getElementById('fEpisodes').value = m.episodes || '';
    document.getElementById('fDownload').value = m.download_link || '';
    document.getElementById('fTrending').checked = !!m.trending;
    toggleFormGroups();
    
    const poster = m.poster_url || driveLinkToImageUrl(m.drive_link);
    if(poster){ 
      fPreview.src = poster; 
      fPreview.style.display='block'; 
    } else {
      fPreview.style.display='none';
    }
    
    formTitle.textContent = 'Edit Premium Item';
    cancelEditBtn.style.display = 'inline-block';
    window.scrollTo({top:0, behavior:'smooth'});
  }

  async function deleteMovie(id){
    if(!confirm('Are you sure you want to delete this movie?')) return;
    const {error} = await supabase.from('movies').delete().eq('id', id);
    if(error){ alert(error.message); return; }
    loadMovies();
  }

  // Initial check
  document.addEventListener('DOMContentLoaded', checkSession);
}
