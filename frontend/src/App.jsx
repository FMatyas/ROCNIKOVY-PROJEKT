import React, { useState, useEffect } from 'react';
import { styles, ANIMATION_CSS } from './styles';
import { account } from './appwrite';
import AuthView from './components/AuthView';
import StatsCharts from './components/StatsCharts';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [dashboardData, setDashboardData] = useState(null);
  const [trips, setTrips] = useState([]);
  const [refuelings, setRefuelings] = useState([]);
  const [services, setServices] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [newTrip, setNewTrip] = useState({ title: '', date: '', distance_km: '', start_location: '', destination: '', note: '' });
  const [newVehicle, setNewVehicle] = useState({ brand: '', model: '', year: '', vin: '', license_plate: '' });

  const loadAllData = () => {
    fetch('/api/dashboard', { credentials: 'include' })
      .then(res => res.json())
      .then(data => { if (data.success) setDashboardData(data); });

    fetch('/api/trips', { credentials: 'include' })
      .then(res => res.json())
      .then(data => { if (data.success) setTrips(data.trips); });

    fetch('/api/refuelings', { credentials: 'include' })
      .then(res => res.json())
      .then(data => { if (data.success) setRefuelings(data.refuelings); });

    fetch('/api/services', { credentials: 'include' })
      .then(res => res.json())
      .then(data => { if (data.success) setServices(data.services); });

    fetch('/api/documents', { credentials: 'include' })
      .then(res => res.json())
      .then(data => { if (data.success) setDocuments(data.documents); });
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Zkusíme, zda je aktivní Appwrite session (návrat z Google OAuth)
        const appwriteUser = await account.get();
        const jwtRes = await account.createJWT().catch(() => null);

        const res = await fetch('/api/auth/appwrite-google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email: appwriteUser.email,
            full_name: appwriteUser.name || appwriteUser.email,
            appwrite_id: appwriteUser.$id,
            jwt: jwtRes?.jwt || null
          })
        });
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
          loadAllData();
          setLoading(false);
          return;
        }
      } catch {
        // Není přihlášen přes Appwrite -> pokračujeme kontrolou klasické FastAPI session
      }

      // 2. Kontrola klasické FastAPI session
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
          loadAllData();
        }
      } catch {
        // Nepřihlášen
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });
    const data = await res.json();
    if (data.success) {
      setUser(data.user);
      loadAllData();
    } else {
      setErrorMsg(data.detail || 'Chyba při přihlášení');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, full_name: fullName, password, confirm_password: confirmPassword }),
      credentials: 'include'
    });
    const data = await res.json();
    if (data.success) {
      setUser(data.user);
      loadAllData();
    } else {
      setErrorMsg(data.detail || 'Chyba při registraci');
    }
  };

  const handleGoogleLogin = () => {
    setErrorMsg('');
    const redirectUrl = 'http://localhost:8000';
account.createOAuth2Session('google', redirectUrl, redirectUrl);
  };

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    await account.deleteSession('current').catch(() => {});
    setUser(null);
    setDashboardData(null);
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/vehicles/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newVehicle),
      credentials: 'include'
    });
    if (res.ok) {
      setNewVehicle({ brand: '', model: '', year: '', vin: '', license_plate: '' });
      loadAllData();
      alert('Vozidlo úspěšně přidáno!');
    }
  };

  const handleAddTrip = async (e) => {
    e.preventDefault();
    if (!dashboardData?.selected_vehicle) return alert('Nejprve vyber nebo přidej vozidlo!');
    const res = await fetch('/api/trips/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newTrip,
        vehicle_id: dashboardData.selected_vehicle.id,
        distance_km: parseFloat(newTrip.distance_km)
      }),
      credentials: 'include'
    });
    if (res.ok) {
      setNewTrip({ title: '', date: '', distance_km: '', start_location: '', destination: '', note: '' });
      loadAllData();
      alert('Výlet přidán!');
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={{ color: '#94a3b8', fontWeight: '500' }}>Načítám TrackMyRide...</p>
        <style>{ANIMATION_CSS}</style>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthView
          isLoginView={isLoginView}
          setIsLoginView={setIsLoginView}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          fullName={fullName}
          setFullName={setFullName}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          errorMsg={errorMsg}
          onLogin={handleLogin}
          onRegister={handleRegister}
          onGoogleLogin={handleGoogleLogin}
        />
        <style>{ANIMATION_CSS}</style>
      </>
    );
  }

  const displayName = user.name || user.full_name || user.email || 'Uživatel';

  return (
    <div style={styles.appContainer}>
      <aside style={styles.sidebar}>
        <div>
          <div style={styles.logoArea}>
            <span style={styles.logoIcon}>🚗</span>
            <h2 style={styles.logoText}>TrackMyRide</h2>
          </div>
          <nav style={styles.nav}>
            <button onClick={() => setActiveTab('dashboard')} style={{ ...styles.navButton, ...(activeTab === 'dashboard' ? styles.navActive : {}) }} className="nav-item">📊 Přehled</button>
            <button onClick={() => setActiveTab('vehicles')} style={{ ...styles.navButton, ...(activeTab === 'vehicles' ? styles.navActive : {}) }} className="nav-item">🚘 Vozidla</button>
            <button onClick={() => setActiveTab('refuelings')} style={{ ...styles.navButton, ...(activeTab === 'refuelings' ? styles.navActive : {}) }} className="nav-item">⛽ Tankování</button>
            <button onClick={() => setActiveTab('trips')} style={{ ...styles.navButton, ...(activeTab === 'trips' ? styles.navActive : {}) }} className="nav-item">🗺️ Výlety</button>
            <button onClick={() => setActiveTab('services')} style={{ ...styles.navButton, ...(activeTab === 'services' ? styles.navActive : {}) }} className="nav-item">🛠️ Servis</button>
            <button onClick={() => setActiveTab('documents')} style={{ ...styles.navButton, ...(activeTab === 'documents' ? styles.navActive : {}) }} className="nav-item">📄 Doklady & STK</button>
          </nav>
        </div>
        <div style={styles.userSection}>
          <div style={styles.userAvatar}>{displayName.charAt(0).toUpperCase()}</div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <p style={styles.userName}>{displayName}</p>
            <button onClick={handleLogout} style={styles.logoutButton}>Odhlásit se</button>
          </div>
        </div>
      </aside>

      <main style={styles.mainContent} className="animate-fade">
        {activeTab === 'dashboard' && (
          <div>
            <div style={styles.headerFlex}>
              <h2 style={styles.pageTitle}>Statistiky a přehled</h2>
              <span style={styles.liveBadge}>● Systém aktivní</span>
            </div>
            {dashboardData && dashboardData.vehicles.length > 0 ? (
              <>
                <div style={styles.statsGrid}>
                  <div style={styles.cardGlass} className="card-hover">
                    <div style={styles.cardHeader}>
                      <span style={styles.cardIconBlue}>⚡</span>
                      <h3 style={styles.cardTitle}>Průměrná spotřeba</h3>
                    </div>
                    <p style={styles.cardValueBlue}>{dashboardData.avg_consumption} <span style={styles.unit}>l/100km</span></p>
                  </div>
                  <div style={styles.cardGlass} className="card-hover">
                    <div style={styles.cardHeader}>
                      <span style={styles.cardIconEmerald}>💰</span>
                      <h3 style={styles.cardTitle}>Celkové náklady</h3>
                    </div>
                    <p style={styles.cardValueEmerald}>{dashboardData.total_cost} <span style={styles.unit}>Kč</span></p>
                  </div>
                  <div style={styles.cardGlass} className="card-hover">
                    <div style={styles.cardHeader}>
                      <span style={styles.cardIconPurple}>🚗</span>
                      <h3 style={styles.cardTitle}>Aktivní vozidlo</h3>
                    </div>
                    <p style={styles.cardValueWhite}>{dashboardData.selected_vehicle ? dashboardData.selected_vehicle.name : 'Žádné'}</p>
                  </div>
                </div>

                <StatsCharts refuelings={refuelings} services={services} trips={trips} />
              </>
            ) : (
              <div style={styles.cardCenter}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚘</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Zatím zde nejsou žádná vozidla</h3>
                <p style={styles.textMuted}>Pro zobrazení statistik musíte nejprve přidat své vozidlo.</p>
                <button onClick={() => setActiveTab('vehicles')} style={styles.primaryButtonInline} className="btn-glow">Přidat vozidlo</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'vehicles' && (
          <div>
            <h2 style={styles.pageTitle}>Správa vozidel</h2>
            <div style={styles.cardGlass}>
              <h3 style={styles.subTitle}>➕ Přidat nové vozidlo</h3>
              <form onSubmit={handleAddVehicle} style={styles.inlineForm}>
                <div style={styles.inputGroup}><label style={styles.label}>Značka</label><input type="text" placeholder="Audi" value={newVehicle.brand} onChange={e => setNewVehicle({...newVehicle, brand: e.target.value})} style={styles.input} required /></div>
                <div style={styles.inputGroup}><label style={styles.label}>Model</label><input type="text" placeholder="A4 Avant" value={newVehicle.model} onChange={e => setNewVehicle({...newVehicle, model: e.target.value})} style={styles.input} required /></div>
                <div style={styles.inputGroup}><label style={styles.label}>Rok výroby</label><input type="number" placeholder="2001" value={newVehicle.year} onChange={e => setNewVehicle({...newVehicle, year: e.target.value})} style={styles.input} /></div>
                <div style={styles.inputGroup}><label style={styles.label}>VIN kód</label><input type="text" placeholder="17 znaků" value={newVehicle.vin} onChange={e => setNewVehicle({...newVehicle, vin: e.target.value})} style={styles.input} /></div>
                <div style={styles.inputGroup}><label style={styles.label}>SPZ</label><input type="text" placeholder="1AB 2345" value={newVehicle.license_plate} onChange={e => setNewVehicle({...newVehicle, license_plate: e.target.value})} style={styles.input} /></div>
                <button type="submit" style={styles.primaryButton} className="btn-glow">Uložit vozidlo</button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'refuelings' && (
          <div>
            <h2 style={styles.pageTitle}>Historie tankování</h2>
            <div style={styles.cardGlass}>
              {refuelings.length === 0 ? <p style={styles.textMuted}>Zatím žádné záznamy tankování.</p> : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr><th style={styles.th}>Datum</th><th style={styles.th}>Litry</th><th style={styles.th}>Celkem Kč</th><th style={styles.th}>Tachometr</th></tr>
                    </thead>
                    <tbody>
                      {refuelings.map(r => (
                        <tr key={r.id} style={styles.trHover}><td style={styles.td}>{r.date}</td><td style={styles.td}>{r.liters} l</td><td style={styles.td}>{r.price_total} Kč</td><td style={styles.td}>{r.odometer} km</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'trips' && (
          <div>
            <h2 style={styles.pageTitle}>Výlety a jízdy</h2>
            <div style={styles.cardGlass}>
              <h3 style={styles.subTitle}>🗺️ Zaznamenat novou jízdu</h3>
              <form onSubmit={handleAddTrip} style={styles.inlineForm}>
                <div style={styles.inputGroup}><label style={styles.label}>Účel / Název</label><input type="text" placeholder="Cesta do práce" value={newTrip.title} onChange={e => setNewTrip({...newTrip, title: e.target.value})} style={styles.input} required /></div>
                <div style={styles.inputGroup}><label style={styles.label}>Datum</label><input type="date" value={newTrip.date} onChange={e => setNewTrip({...newTrip, date: e.target.value})} style={styles.input} required /></div>
                <div style={styles.inputGroup}><label style={styles.label}>Vzdálenost (km)</label><input type="number" step="0.1" placeholder="45.5" value={newTrip.distance_km} onChange={e => setNewTrip({...newTrip, distance_km: e.target.value})} style={styles.input} required /></div>
                <button type="submit" style={styles.primaryButton} className="btn-glow">Přidat výlet</button>
              </form>
            </div>
            <div style={{ ...styles.cardGlass, marginTop: '20px' }}>
              <h3 style={styles.subTitle}>Seznam zaznamenaných jízd</h3>
              {trips.length === 0 ? <p style={styles.textMuted}>Zatím žádné zaznamenané výlety.</p> : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr><th style={styles.th}>Název</th><th style={styles.th}>Datum</th><th style={styles.th}>Vzdálenost</th></tr>
                    </thead>
                    <tbody>
                      {trips.map(t => (
                        <tr key={t.id} style={styles.trHover}><td style={styles.td}>{t.title}</td><td style={styles.td}>{t.date}</td><td style={styles.td}>{t.distance_km} km</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div>
            <h2 style={styles.pageTitle}>Servis a údržba</h2>
            <div style={styles.cardGlass}>
              {services.length === 0 ? <p style={styles.textMuted}>Žádné servisní záznamy.</p> : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr><th style={styles.th}>Název</th><th style={styles.th}>Datum</th><th style={styles.th}>Cena</th><th style={styles.th}>Nájezd</th></tr>
                    </thead>
                    <tbody>
                      {services.map(s => (
                        <tr key={s.id} style={styles.trHover}><td style={styles.td}>{s.title}</td><td style={styles.td}>{s.date}</td><td style={styles.td}>{s.cost} Kč</td><td style={styles.td}>{s.mileage} km</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            <h2 style={styles.pageTitle}>Doklady a STK</h2>
            <div style={styles.cardGlass}>
              {documents.length === 0 ? <p style={styles.textMuted}>Žádné uložené doklady.</p> : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr><th style={styles.th}>Typ dokladu</th><th style={styles.th}>Platnost do</th><th style={styles.th}>Poznámka</th></tr>
                    </thead>
                    <tbody>
                      {documents.map(d => (
                        <tr key={d.id} style={styles.trHover}><td style={styles.td}>{d.doc_type}</td><td style={styles.td}>{d.expiry_date}</td><td style={styles.td}>{d.note}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <style>{ANIMATION_CSS}</style>
    </div>
  );
}