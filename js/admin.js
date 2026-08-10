// ==========================================================
// Movie Prime — admin panel logic
// ==========================================================

const loginPanel   = document.getElementById('loginPanel');
const adminContent = document.getElementById('adminContent');
const logoutBtn    = document.getElementById('logoutBtn');
const demoBanner   = document.getElementById('demoBanner');

// ---------- auth & demo checks ----------
async function checkSession(){
  // Check if we are running in Demo Mode to show warnings
  if (window.isDemoMode && demoBanner) {
    demoBanner.style.display = 'block';
  }

  const {data:{session}} = await supabase.auth.getSession();
  if(session){
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

document.getElementById('loginBtn').addEventListener('click', async ()=>{
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const msg = document.getElementById('loginMsg');
  msg.textContent = 'Logging in…'; msg.className='state-msg';

  const {error} = await supabase.auth.signInWithPassword({email, password});
  if(error){
    msg.textContent = error.message; msg.className='state-msg error';
  } else {
    msg.textContent = '';
    checkSession();
  }
});

logoutBtn.addEventListener('click', async ()=>{
  await supabase.auth.signOut();
  checkSession();
});

// ---------- live drive preview ----------
const fDrive = document.getElementById('fDrive');
const fPreview = document.getElementById('fPreview');
fDrive.addEventListener('input', ()=>{
  const url = driveLinkToImageUrl(fDrive.value.trim());
  if(url){ fPreview.src = url; fPreview.style.display='block'; }
  else { fPreview.style.display='none'; }
});

// ---------- form save (add or update) ----------
const saveBtn = document.getElementById('saveBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const formTitle = document.getElementById('formTitle');

function clearForm(){
  document.getElementById('movieId').value = '';
  document.getElementById('fTitle').value = '';
  document.getElementById('fCategory').value = '';
  document.getElementById('fYear').value = '';
  document.getElementById('fRating').value = '';
  document.getElementById('fDescription').value = '';
  document.getElementById('fDrive').value = '';
  document.getElementById('fTrailer').value = '';
  document.getElementById('fDownload').value = '';
  document.getElementById('fTrending').checked = false;
  fPreview.style.display = 'none';
  formTitle.textContent = 'Add Movie';
  cancelEditBtn.style.display = 'none';
}

saveBtn.addEventListener('click', async ()=>{
  const id = document.getElementById('movieId').value;
  const driveLink = document.getElementById('fDrive').value.trim();
  const payload = {
    title: document.getElementById('fTitle').value.trim(),
    category: document.getElementById('fCategory').value.trim(),
    year: parseInt(document.getElementById('fYear').value) || null,
    rating: parseFloat(document.getElementById('fRating').value) || null,
    description: document.getElementById('fDescription').value.trim(),
    drive_link: driveLink,
    poster_url: driveLinkToImageUrl(driveLink),
    trailer_link: document.getElementById('fTrailer').value.trim(),
    download_link: document.getElementById('fDownload').value.trim(),
    trending: document.getElementById('fTrending').checked
  };
  const msg = document.getElementById('formMsg');

  if(!payload.title || !payload.category){
    msg.textContent = 'Title and Category are required.'; msg.className='state-msg error';
    return;
  }

  msg.textContent = 'Saving…'; msg.className='state-msg';
  let error;
  if(id){
    ({error} = await supabase.from('movies').update(payload).eq('id', id));
  } else {
    ({error} = await supabase.from('movies').insert(payload));
  }

  if(error){
    msg.textContent = error.message; msg.className='state-msg error';
  } else {
    msg.textContent = 'Saved ✓'; msg.className='state-msg ok';
    clearForm();
    loadMovies();
  }
});

cancelEditBtn.addEventListener('click', clearForm);

// ---------- table + edit/delete ----------
async function loadMovies(){
  const tbody = document.getElementById('movieTableBody');
  const {data, error} = await supabase.from('movies').select('*').order('created_at', {ascending:false});
  if(error){
    tbody.innerHTML = `<tr><td colspan="5">${error.message}</td></tr>`;
    return;
  }
  if(!data.length){
    tbody.innerHTML = `<tr><td colspan="5">No movies yet.</td></tr>`;
    return;
  }
  tbody.innerHTML = data.map(m => {
    const poster = m.poster_url || driveLinkToImageUrl(m.drive_link) || '';
    return `
      <tr>
        <td><img src="${poster}" style="opacity:0;transition:opacity .3s" onload="this.style.opacity=1" onerror="this.style.opacity=0.15"></td>
        <td>${m.title}</td>
        <td>${m.category || ''}</td>
        <td>${m.trending ? 'Yes' : '—'}</td>
        <td>
          <button class="btn secondary" style="margin:0;padding:6px 12px;font-size:12px" data-edit="${m.id}">Edit</button>
          <button class="btn danger" style="margin:0;padding:6px 12px;font-size:12px" data-del="${m.id}">Delete</button>
        </td>
      </tr>`;
  }).join('');

  tbody.querySelectorAll('[data-edit]').forEach(btn=>{
    btn.addEventListener('click', ()=> editMovie(btn.dataset.edit, data));
  });
  tbody.querySelectorAll('[data-del]').forEach(btn=>{
    btn.addEventListener('click', ()=> deleteMovie(btn.dataset.del));
  });
}

function editMovie(id, data){
  const m = data.find(x=>x.id===id);
  if(!m) return;
  document.getElementById('movieId').value = m.id;
  document.getElementById('fTitle').value = m.title || '';
  document.getElementById('fCategory').value = m.category || '';
  document.getElementById('fYear').value = m.year || '';
  document.getElementById('fRating').value = m.rating || '';
  document.getElementById('fDescription').value = m.description || '';
  document.getElementById('fDrive').value = m.drive_link || '';
  document.getElementById('fTrailer').value = m.trailer_link || '';
  document.getElementById('fDownload').value = m.download_link || '';
  document.getElementById('fTrending').checked = !!m.trending;
  if(m.poster_url || m.drive_link){ 
    fPreview.src = m.poster_url || driveLinkToImageUrl(m.drive_link); 
    fPreview.style.display='block'; 
  } else {
    fPreview.style.display='none';
  }
  formTitle.textContent = 'Edit Movie';
  cancelEditBtn.style.display = 'inline-block';
  window.scrollTo({top:0, behavior:'smooth'});
}

async function deleteMovie(id){
  if(!confirm('Delete this movie?')) return;
  const {error} = await supabase.from('movies').delete().eq('id', id);
  if(error){ alert(error.message); return; }
  loadMovies();
}

document.addEventListener('DOMContentLoaded', checkSession);
