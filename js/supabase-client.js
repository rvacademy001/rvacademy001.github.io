// ==========================================================
// Movie Prime — Supabase client config & Demo Mode fallback
// ==========================================================

const SUPABASE_URL = "https://kkuqbdbbxweuqzauhszu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrdXFiZGJieHdldXF6YXVoc3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0ODA3NTIsImV4cCI6MjEwMDA1Njc1Mn0.c-JGhJ9jFlh8ePKThx7hQ2Xb9nCLZTjk9T5A5jIhQck";

window.isDemoMode = false;

// Check if project has default credentials placeholder OR Supabase library failed to load
if (SUPABASE_URL.includes("YOUR-PROJECT-REF") || SUPABASE_ANON_KEY.includes("YOUR-ANON-PUBLIC-KEY") || typeof window.supabase === 'undefined') {
  window.isDemoMode = true;

  // Pre-seed sample movies into localStorage if empty
  const seedMovies = [
    {
      id: "demo-1",
      title: "Interstellar",
      category: "Science Fiction",
      type: "movie",
      year: 2014,
      rating: 8.7,
      description: "When Earth becomes uninhabitable, a team of explorers undertakes the most important mission in human history: traveling beyond this galaxy to discover whether mankind has a future among the stars.",
      drive_link: "https://drive.google.com/file/d/1BWS8b8wFqT7Q0-P_h2Vd6q842G1_j25x/view?usp=sharing",
      poster_url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=780",
      download_link: "https://www.youtube.com/watch?v=zSWdZVtXT7E",
      trailer_link: "https://www.youtube.com/embed/zSWdZVtXT7E",
      trending: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString()
    },
    {
      id: "demo-2",
      title: "Inception",
      category: "Action",
      type: "movie",
      year: 2010,
      rating: 8.8,
      description: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O., but his tragic past may doom the project.",
      drive_link: "",
      poster_url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=780",
      download_link: "https://www.youtube.com/watch?v=YoHD9XEInc0",
      trailer_link: "https://www.youtube.com/embed/YoHD9XEInc0",
      trending: true,
      created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString()
    },
    {
      id: "demo-3",
      title: "Stranger Things (Season 4)",
      category: "Horror",
      type: "series",
      year: 2022,
      rating: 8.9,
      description: "When a young boy vanishes, a town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.",
      drive_link: "",
      poster_url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=780",
      download_link: "https://t.me/movieprimeytsl",
      trailer_link: "https://www.youtube.com/embed/b9EkMc79ZSU",
      episodes: "Episode 01 | https://t.me/movieprimeytsl/1\nEpisode 02 | https://t.me/movieprimeytsl/2\nEpisode 03 | https://t.me/movieprimeytsl/3\nEpisode 04 | https://t.me/movieprimeytsl/4",
      trending: true,
      created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString()
    }
  ];

  if (!localStorage.getItem("mp_movies")) {
    localStorage.setItem("mp_movies", JSON.stringify(seedMovies));
  }

  // Simulated Supabase SDK client
  window.supabaseClient = {
    auth: {
      getSession: async () => {
        const sessionJson = localStorage.getItem("mp_session");
        return { data: { session: sessionJson ? JSON.parse(sessionJson) : null }, error: null };
      },
      signInWithPassword: async ({ email, password }) => {
        if (email === "admin@movieprime.com" && password === "admin123") {
          const session = { user: { email }, access_token: "mock-token" };
          localStorage.setItem("mp_session", JSON.stringify(session));
          return { data: { session }, error: null };
        } else {
          return { data: null, error: { message: "Invalid email or password." } };
        }
      },
      signOut: async () => {
        localStorage.removeItem("mp_session");
        return { error: null };
      }
    },
    from: (tableName) => {
      if (tableName !== "movies") {
        return {
          select: () => ({ error: { message: "Table not supported in mock client" } })
        };
      }

      const getMovies = () => JSON.parse(localStorage.getItem("mp_movies") || "[]");
      const saveMovies = (list) => localStorage.setItem("mp_movies", JSON.stringify(list));

      const queryState = {
        data: getMovies(),
        error: null,
        isSingle: false
      };

      const builder = {
        select: (columns) => {
          if (columns === 'category') {
            queryState.data = queryState.data.map(m => ({ category: m.category }));
          }
          return builder;
        },
        eq: (field, value) => {
          queryState.data = queryState.data.filter(item => item[field] === value);
          return builder;
        },
        neq: (field, value) => {
          queryState.data = queryState.data.filter(item => item[field] !== value);
          return builder;
        },
        ilike: (field, value) => {
          const cleanPattern = value.replace(/%/g, '').toLowerCase();
          queryState.data = queryState.data.filter(item => 
            item[field] && String(item[field]).toLowerCase().includes(cleanPattern)
          );
          return builder;
        },
        order: (field, { ascending } = { ascending: true }) => {
          queryState.data.sort((a, b) => {
            const valA = a[field] || '';
            const valB = b[field] || '';
            if (typeof valA === 'string') {
              return ascending ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            return ascending ? valA - valB : valB - valA;
          });
          return builder;
        },
        limit: (n) => {
          queryState.data = queryState.data.slice(0, n);
          return builder;
        },
        single: () => {
          queryState.isSingle = true;
          return builder;
        },
        insert: async (payload) => {
          const movies = getMovies();
          const newItems = Array.isArray(payload) ? payload : [payload];
          const added = newItems.map(item => ({
            ...item,
            id: "movie-" + Math.random().toString(36).substr(2, 9),
            created_at: new Date().toISOString()
          }));
          saveMovies([...added, ...movies]);
          return { data: added, error: null };
        },
        update: async (payload) => {
          return {
            eq: async (field, val) => {
              const movies = getMovies();
              const idx = movies.findIndex(m => m[field] === val);
              if (idx !== -1) {
                movies[idx] = { ...movies[idx], ...payload };
                saveMovies(movies);
                return { data: [movies[idx]], error: null };
              }
              return { data: [], error: { message: "Movie not found" } };
            }
          };
        },
        delete: () => {
          return {
            eq: async (field, val) => {
              const movies = getMovies();
              const filtered = movies.filter(m => m[field] !== val);
              saveMovies(filtered);
              return { data: null, error: null };
            }
          };
        },
        then: (onfulfilled) => {
          const result = queryState.isSingle
            ? { data: queryState.data[0] || null, error: queryState.error }
            : { data: queryState.data, error: queryState.error };
          return Promise.resolve(onfulfilled(result));
        }
      };

      return builder;
    }
  };
} else {
  // Real Supabase client configuration
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// ==========================================================
// Google Drive link -> direct viewable image URL
// ==========================================================
function driveLinkToImageUrl(link) {
  if (!link) return "";
  let id = "";

  const fileMatch = link.match(/\/file\/d\/([^/]+)/);
  const idParamMatch = link.match(/[?&]id=([^&]+)/);

  if (fileMatch) id = fileMatch[1];
  else if (idParamMatch) id = idParamMatch[1];
  else return link; // not a drive link, use as-is

  return `https://lh3.googleusercontent.com/d/${id}=w780`;
}
