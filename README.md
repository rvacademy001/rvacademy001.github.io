# Movie Prime — Setup Guide & Documentation

Movie Prime යනු Supabase database එකක් මඟින් ක්‍රියාත්මක වන, responsive මෙන්ම සිංහල සහ English භාෂා දෙකෙන්ම ක්‍රියාකරන Premium Movie Site එකකි. 

**ලඟම ඇති වාසිය (Demo Mode):** Supabase database එකක් තවමත් සාදා නොමැති නම්, මෙම site එක ස්වයංක්‍රීයව **Demo Mode (Local Storage)** මඟින් ක්‍රියාත්මක වේ. එමඟින් ඔබට database එකක් නොමැති වුවද චිත්‍රපට එක් කිරීමට, සංස්කරණය කිරීමට සහ මකා දැමීමට හැකියාව ඇත.

---

## 1. Supabase Project එකක් සාදා සම්බන්ධ කිරීම (persistence සඳහා)
පහත පියවර අනුගමනය කර ඔබගේම database එකක් සම්බන්ධ කරගන්න:

1. **Supabase වෙත පිවිසෙන්න**: [Supabase](https://supabase.com) වෙත ගොස් Sign up වී **New Project** එකක් සාදන්න.
2. **Database Schema එක ඇතුලත් කරන්න**: 
   - Left menu → **SQL Editor** → **New query** click කරන්න.
   - `sql/schema.sql` file එකේ content එක සම්පූර්ණයෙන්ම copy කර SQL Editor එකට paste කර **Run** click කරන්න. (මෙයින් movies table එක සහ ආරක්ෂක නීති (Row Level Security) සෑදේ).
3. **පරිපාලක (Admin) ගිණුමක් සාදන්න**:
   - Left menu → **Authentication** → **Users** → **Add user** click කරන්න.
   - ඔබගේ admin email එක සහ password එකක් සාදන්න. (admin.html එකට login වීමට භාවිතා කරන්නේ මෙයයි).
4. **API Keys ලබාගන්න**:
   - Left menu → **Settings** → **API** වෙත යන්න.
   - `Project URL` සහ `anon public` key copy කරගන්න.
5. **Code එකට සම්බන්ධ කරන්න**:
   - `js/supabase-client.js` file එක open කරන්න:
     ```js
     const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
     const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";
     ```
   - මෙම values දෙක ඔබ Supabase වෙතින් copy කරගත් values වලින් replace කර save කරන්න. එවිට site එක Demo Mode එකෙන් ඉවත් වී ඔබගේ database එක සමඟ ක්‍රියාත්මක වේ.

---

## 2. Demo Mode එකෙන් පරීක්ෂා කිරීම (නොමිලේ, Database නොමැතිව)
Supabase config එක වෙනස් නොකර `index.html` double-click කර open කල විට site එක Demo Mode එකෙන් වැඩ කරයි.

1. **Admin Panel එකට යන්න**: Navigation bar එකේ **Admin** click කරන්න.
2. **Login වන්න**: පහත විස්තර යොදා login වන්න:
   - **Email:** `admin@movieprime.com`
   - **Password:** `admin123`
3. **චිත්‍රපට ඇතුලත් කරන්න**: Title, Category, Description පුරවා, **Poster** එකට Google Drive link එකක් හෝ ඕනෑම image link එකක් ලබා දී **Save Movie** කරන්න. (Trending row එකට දැමීමට checkbox එක check කරන්න).
4. **Trailers එක් කිරීම**: **Trailer Link** එකට සාමාන්‍ය YouTube වීඩියෝ ලින්ක් එකක් ඇතුලත් කල විට (උදා: `https://www.youtube.com/watch?v=...`) එය ස්වයංක්‍රීයව details page එකේ YouTube Player එකක් ලෙස දිස්වේ.

---

## 3. GitHub Pages එකට Host කර ලෝකයටම පෙන්වීම
1. **GitHub repository එකක් සාදන්න**: GitHub එකේ අලුත් repository එකක් (public) සාදන්න.
2. **Files upload කරන්න**: මෙම folder එකේ ඇති සියලුම files (folders ඇතුළුව) repository එකට upload කරන්න.
3. **GitHub Pages active කරන්න**: 
   - Repository එකේ **Settings** → **Pages** වෙත යන්න.
   - Build and deployment → Branch: `main`, folder: `/root` තෝරා **Save** කරන්න.
4. විනාඩි කිහිපයකින් `https://your-username.github.io/repo-name/` ඔස්සේ වෙබ් අඩවිය සජීවීව දැකගත හැක.

---

## Files Structure

```
├── index.html            # Home page (dynamic hero banner, search, trending and latest rows)
├── category.html         # Browse by Category page with unified search input
├── movie.html            # Movie Details page with dynamic description and YouTube trailer player
├── admin.html            # Administrator login and complete CRUD panel
├── css/
│   └── style.css         # Modern, dark-themed responsive styles (Netflix-style hero overlay, active badge animations)
├── js/
│   ├── supabase-client.js # Supabase connection configuration & LocalStorage database simulator
│   ├── app.js            # Home & Category page render scripts, search filtering logic, language toggle
│   └── admin.js          # Admin authorization, CRUD binds, and poster image preview logic
└── sql/
    └── schema.sql        # Postgres database initialization script for Supabase SQL Editor
```
