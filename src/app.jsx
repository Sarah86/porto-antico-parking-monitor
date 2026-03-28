import { useState, useEffect } from 'preact/hooks';

const API = "https://portoantico.it/wp-json/porto-antico/v1/parking";
const INTERVAL = 30_000;

const i18n = {
  it: {
    title: "Porto Antico — Parcheggi in tempo reale",
    loading: "Caricamento...",
    lastUpdate: "Ultimo aggiornamento",
    error: "Errore",
    map: "Mappa",
    freeSpots: "posti liberi",
    refreshInfo: "Aggiornamento automatico ogni 30 secondi",
    labels: {
      high: "Disponibile",
      low: "Posti limitati",
      full: "Pieno",
      updating: "In aggiornamento"
    }
  },
  en: {
    title: "Porto Antico — Real-time Parking",
    loading: "Loading...",
    lastUpdate: "Last update",
    error: "Error",
    map: "Map",
    freeSpots: "free spots",
    refreshInfo: "Automatic update every 30 seconds",
    labels: {
      high: "Available",
      low: "Limited spots",
      full: "Full",
      updating: "Updating..."
    }
  }
};

function levelClass(label) {
  if (label === "high") return "high"; // Green
  if (label === "low") return "medium"; // Orange
  if (label === "full") return "low"; // Red
  return "medium";
}

export function App() {
  const [data, setData] = useState([]);
  const [lang, setLang] = useState('it');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [status, setStatus] = useState({ isError: false, isLoading: true, errorMsg: '' });

  const t = i18n[lang];

  const refresh = async () => {
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      
      setData(result);
      setLastUpdated(new Date().toLocaleTimeString(lang === 'it' ? "it-IT" : "en-GB"));
      setStatus({ isError: false, isLoading: false, errorMsg: '' });
    } catch (err) {
      setStatus({ isError: true, isLoading: false, errorMsg: err.message });
    }
  };

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, INTERVAL);
    return () => clearInterval(timer);
  }, []);

  const labelText = (label) => {
    if (label === "high") return t.labels.high;
    if (label === "low") return t.labels.low;
    if (label === "full") return t.labels.full;
    return t.labels.updating;
  };

  return (
    <>
      <header>
        <h1>{t.title}</h1>
        <div className="lang-switch">
          <button onClick={() => setLang('it')} className={lang === 'it' ? 'active' : ''}>IT</button>
          <button onClick={() => setLang('en')} className={lang === 'en' ? 'active' : ''}>EN</button>
        </div>
        <div id="status" className={status.isError ? 'error' : ''}>
          {status.isLoading && <span className="spinner"></span>}
          {status.isError ? `${t.error}: ${status.errorMsg}` : 
           status.isLoading ? t.loading : 
           lastUpdated ? `${t.lastUpdate}: ${lastUpdated}` : ''}
        </div>
      </header>

      <div id="grid">
        {data.map((p) => {
          const lvl = levelClass(p.availability_label);
          return (
            <div className="card" key={p.id || p.title}>
              <div className="card-title">{p.title}</div>
              <div className="card-address">
                {p.address}
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lon}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="map-link"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style={{ verticalAlign: 'middle', position: 'relative', top: '-1px' }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  <span>{t.map}</span>
                </a>
              </div>
              <div className="bar-track">
                <div className={`bar-fill ${lvl}`} style={{ width: `${p.availability_perc}%` }}></div>
              </div>
              <div className="card-meta">
                <span className="places">{p.available_places} / {p.total_places} {t.freeSpots}</span>
                <span className={`pct ${lvl}`}>{p.availability_perc}%</span>
              </div>
              <div style={{ marginTop: '10px' }}>
                <span className={`badge ${lvl}`}>{labelText(p.availability_label)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <footer>
        <p>{t.refreshInfo} · portoantico.it</p>
        <p style={{ marginTop: '8px' }}>
          Made with ❤️ by <a href="https://github.com/Sarah86" target="_blank" rel="noopener noreferrer" style={{ color: '#00427a', fontWeight: 'bold', textDecoration: 'none' }}>Sarah86</a>
        </p>
      </footer>
    </>
  );
}
