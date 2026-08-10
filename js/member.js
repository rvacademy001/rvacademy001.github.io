// ==========================================================
// Movie Prime — Member Area & Watchlist Logic
// ==========================================================

{
  const supabase = window.supabaseClient;

  const authPanel       = document.getElementById('authPanel');
  const memberDashboard = document.getElementById('memberDashboard');
  const logoutBtn       = document.getElementById('logoutBtn');
  const authBtn         = document.getElementById('authBtn');
  const authToggle      = document.getElementById('authToggle');
  const authTitle       = document.getElementById('authTitle');
  const authMsg         = document.getElementById('authMsg');
  const watchlistGrid   = document.getElementById('watchlistGrid');

  let isSignUpMode = false;

  // ---------- Session Checker ----------
  async function checkMemberSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      authPanel.style.display = 'none';
      memberDashboard.style.display = 'block';
      logoutBtn.style.display = 'inline-block';
      
      const email = session.user.email;
      const lang = localStorage.getItem('mp_lang') || 'en';
      const helloText = lang === 'si' ? 'ආයුබෝවන්' : 'Welcome';
      document.getElementById('welcomeMsg').textContent = `${helloText}, ${email}!`;
      
      loadWatchlist(session.user.id);
    } else {
      authPanel.style.display = 'block';
      memberDashboard.style.display = 'none';
      logoutBtn.style.display = 'none';
    }
  }

  // ---------- Toggle Sign Up / Login ----------
  authToggle.addEventListener('click', () => {
    const lang = localStorage.getItem('mp_lang') || 'en';
    isSignUpMode = !isSignUpMode;
    
    if (isSignUpMode) {
      authTitle.textContent = lang === 'si' ? 'සාමාජික ලියාපදිංචිය' : 'Member Sign Up';
      authBtn.textContent = lang === 'si' ? 'ලියාපදිංචි වන්න' : 'Sign Up';
      authToggle.textContent = lang === 'si' ? 'දැනටමත් ගිණුමක් තිබේද? ඇතුළු වන්න' : 'Already have an account? Log In';
    } else {
      authTitle.textContent = lang === 'si' ? 'සාමාජික ප්‍රවේශය' : 'Member Login';
      authBtn.textContent = lang === 'si' ? 'ප්‍රවේශ වන්න' : 'Log In';
      authToggle.textContent = lang === 'si' ? 'ගිණුමක් නොමැතිද? ලියාපදිංචි වන්න' : "Don't have an account? Sign Up";
    }
    authMsg.textContent = '';
  });

  // ---------- Submit Auth Actions ----------
  authBtn.addEventListener('click', async () => {
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    
    if (!email || !password) {
      const lang = localStorage.getItem('mp_lang') || 'en';
      authMsg.textContent = lang === 'si' ? 'ඊමේල් සහ මුරපදය ඇතුළත් කරන්න.' : 'Email and password are required.';
      authMsg.className = 'state-msg error';
      return;
    }
    
    authMsg.textContent = isSignUpMode ? 'Creating account...' : 'Logging in...';
    authMsg.className = 'state-msg';
    
    if (isSignUpMode) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        authMsg.textContent = error.message;
        authMsg.className = 'state-msg error';
      } else {
        const lang = localStorage.getItem('mp_lang') || 'en';
        authMsg.textContent = lang === 'si' ? 'ලියාපදිංචිය සාර්ථකයි! දැන් ඇතුළු වන්න.' : 'Sign up successful! Please check your email or log in.';
        authMsg.className = 'state-msg ok';
        isSignUpMode = false;
        authToggle.click(); // switch back to login mode automatically
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        authMsg.textContent = error.message;
        authMsg.className = 'state-msg error';
      } else {
        authMsg.textContent = '';
        checkMemberSession();
      }
    }
  });

  logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    checkMemberSession();
  });

  // ---------- Load Saved Watchlist ----------
  async function loadWatchlist(userId) {
    const lang = localStorage.getItem('mp_lang') || 'en';
    watchlistGrid.innerHTML = `<p style="color:var(--muted)">${lang === 'si' ? 'පූරණය වෙමින් පවතී...' : 'Loading watchlist...'}</p>`;

    // Select joined movie information from the database
    const { data, error } = await supabase
      .from('watchlist')
      .select('id, movies(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      watchlistGrid.innerHTML = `<p style="color:var(--crimson)">${error.message}</p>`;
      return;
    }

    if (!data || !data.length) {
      watchlistGrid.innerHTML = `
        <p style="color:var(--muted)">
          ${lang === 'si' ? 'ඔබ තවමත් කිසිදු චිත්‍රපටයක් සුරැකීමට එක් කර නැත.' : 'Your watchlist is empty. Explore movies and save them here!'}
        </p>`;
      return;
    }

    watchlistGrid.innerHTML = data.map(item => {
      const m = item.movies;
      if (!m) return '';
      const poster = m.poster_url || driveLinkToImageUrl(m.drive_link) || '';
      const removeText = lang === 'si' ? 'මකන්න' : 'Remove';
      return `
        <div class="card" id="wl-item-${item.id}">
          <a href="movie.html?id=${m.id}" style="text-decoration:none; color:inherit;">
            <div class="poster-wrap">
              <img src="${poster}" alt="${m.title}" loading="lazy" onload="this.classList.add('loaded')" onerror="this.style.opacity=0.15">
            </div>
            <div class="card-body" style="padding-bottom:0;">
              <p class="title">${m.title}</p>
              <div class="meta">
                <div class="meta-left">
                  <span class="genre-tag">${m.category ? m.category.split(',')[0].trim() : ''}</span>
                  <span class="year-val">${m.year || ''}</span>
                </div>
                ${m.rating ? `<span class="rating">★ ${m.rating}</span>` : ''}
              </div>
            </div>
          </a>
          <div style="padding: 0 14px 14px;">
            <!-- Card Socials -->
            <div class="card-socials" style="margin-top: 6px; border-top: 1px solid rgba(255, 255, 255, 0.06); padding-top: 6px; display: flex; gap: 8px; justify-content: flex-end;">
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
            <button class="btn danger" style="margin: 8px 0 0; width:100%; padding:8px; font-size:12px;" onclick="removeFromWatchlist('${item.id}', '${userId}')">
              ${removeText}
            </button>
          </div>
        </div>`;
    }).join('');
  }

  // ---------- Remove Item Action ----------
  window.removeFromWatchlist = async function(watchlistId, userId) {
    if (!confirm('Remove this movie from your watchlist?')) return;
    
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('id', watchlistId);
      
    if (error) {
      alert(error.message);
    } else {
      loadWatchlist(userId);
    }
  };

  document.addEventListener('DOMContentLoaded', checkMemberSession);
}
