import React, { useState, useEffect } from 'react';

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

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUser(data.user);
          loadAllData();
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
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
      body: JSON.stringify({ ...newTrip, vehicle_id: dashboardData.selected_vehicle.id, distance_km: parseFloat(newTrip.distance_km) }),
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
      </div>
    );
  }

  if (!user) {
    return (
      <div style={styles.authContainer}>
        <div style={styles.authCard}>
          <div style={styles.authHeaderBadge}>🚗 TrackMyRide</div>
          <h1 style={styles.authTitle}>Vítejte zpět</h1>
          <p style={styles.authSubtitle}>Přihlaste se do svého správce vozového parku</p>

          {errorMsg && <div style={styles.errorBox}>{errorMsg}</div>}

          {isLoginView ? (
            <form onSubmit={handleLogin} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>E-mailová adresa</label>
                <input type="email" placeholder="vas@email.cz" value={email} onChange={e => setEmail(e.target.value)} style={styles.input} required />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Heslo</label>
                <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} style={styles.input} required />
              </div>
              <button type="submit" style={styles.primaryButton} className="btn-glow">Pokračovat do aplikace</button>
              <p style={styles.switchText}>
                Nemáte ještě účet? <button type="button" onClick={() => setIsLoginView(false)} style={styles.linkButton}>Zaregistrovat se</button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Celé jméno</label>
                <input type="text" placeholder="Jan Novák" value={fullName} onChange={e => setFullName(e.target.value)} style={styles.input} required />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>E-mailová adresa</label>
                <input type="email" placeholder="vas@email.cz" value={email} onChange={e => setEmail(e.target.value)} style={styles.input} required />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Heslo</label>
                <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} style={styles.input} required />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Potvrzení hesla</label>
                <input type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={styles.input} required />
              </div>
              <button type="submit" style={{ ...styles.primaryButton, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }} className="btn-glow">Vytvořit účet</button>
              <p style={styles.switchText}>
                Už máte účet? <button type="button" onClick={() => setIsLoginView(true)} style={styles.linkButton}>Přihlásit se</button>
              </p>
            </form>
          )}
        </div>
      </div>
    );
  }

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
          <div style={styles.userAvatar}>{user.name.charAt(0).toUpperCase()}</div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <p style={styles.userName}>{user.name}</p>
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

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 15px rgba(59, 130, 246, 0.2); }
          50% { box-shadow: 0 0 25px rgba(59, 130, 246, 0.4); }
          100% { box-shadow: 0 0 15px rgba(59, 130, 246, 0.2); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-fade {
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .card-hover {
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }
        .card-hover:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 30px -10px rgba(59, 130, 246, 0.2);
          border-color: rgba(59, 130, 246, 0.4);
        }
        .btn-glow {
          transition: transform 0.15s ease, box-shadow 0.2s ease;
        }
        .btn-glow:hover {
          transform: translateY(-1px);
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
        }
        .nav-item {
          transition: all 0.2s ease;
        }
        .nav-item:hover {
          background-color: rgba(30, 41, 59, 0.7);
          color: #fff !important;
          transform: translateX(4px);
        }
        tr {
          transition: background-color 0.15s ease;
        }
        tr:hover {
          background-color: rgba(30, 41, 59, 0.6) !important;
        }
      `}</style>
    </div>
  );
}

const styles = {
  loadingContainer: { display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#030712', gap: '1rem', fontFamily: 'Inter, system-ui, sans-serif' },
  spinner: { width: '40px', height: '40px', border: '4px solid rgba(59, 130, 246, 0.2)', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  authContainer: { display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#030712', backgroundImage: 'radial-gradient(circle at 50% 0%, #1e1b4b 0%, #030712 70%)', fontFamily: 'Inter, system-ui, sans-serif', padding: '1rem' },
  authCard: { width: '100%', maxWidth: '420px', backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(16px)', padding: '2.5rem', borderRadius: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' },
  authHeaderBadge: { display: 'inline-block', padding: '0.25rem 0.75rem', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: '600', marginBottom: '1rem' },
  authTitle: { fontSize: '1.875rem', fontWeight: 'bold', color: '#f8fafc', marginBottom: '0.5rem', letterSpacing: '-0.025em' },
  authSubtitle: { color: '#94a3b8', marginBottom: '1.75rem', fontSize: '0.875rem' },
  errorBox: { backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '0.875rem', borderRadius: '0.75rem', marginBottom: '1.25rem', fontSize: '0.875rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '0.375rem' },
  label: { fontSize: '0.8125rem', fontWeight: '500', color: '#cbd5e1' },
  input: { padding: '0.875rem 1rem', backgroundColor: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(51, 65, 85, 0.8)', borderRadius: '0.75rem', color: '#fff', fontSize: '0.9375rem', outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'all 0.2s ease' },
  primaryButton: { padding: '0.875rem', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff', border: 'none', borderRadius: '0.75rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.9375rem', marginTop: '0.5rem' },
  primaryButtonInline: { padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff', border: 'none', borderRadius: '0.75rem', fontWeight: '600', cursor: 'pointer' },
  switchText: { textAlign: 'center', fontSize: '0.875rem', color: '#94a3b8', marginTop: '1.25rem' },
  linkButton: { background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontWeight: '600' },
  appContainer: { display: 'flex', minHeight: '100vh', backgroundColor: '#030712', backgroundImage: 'radial-gradient(circle at 100% 0%, #0f172a 0%, #030712 50%)', color: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' },
  sidebar: { width: '280px', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)', borderRight: '1px solid rgba(255, 255, 255, 0.06)', padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  logoArea: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' },
  logoIcon: { fontSize: '1.75rem' },
  logoText: { fontSize: '1.25rem', fontWeight: 'bold', background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.025em' },
  nav: { display: 'flex', flexDirection: 'column', gap: '0.375rem' },
  navButton: { width: '100%', textAlign: 'left', padding: '0.875rem 1rem', backgroundColor: 'transparent', border: 'none', borderRadius: '0.75rem', color: '#94a3b8', cursor: 'pointer', fontSize: '0.9375rem', fontWeight: '500' },
  navActive: { backgroundColor: '#3b82f6', color: '#fff', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' },
  userSection: { borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem' },
  userAvatar: { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.125rem' },
  userName: { fontWeight: '600', color: '#f8fafc', fontSize: '0.9375rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  logoutButton: { background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.8125rem', padding: '0', fontWeight: '500' },
  mainContent: { flex: 1, padding: '3rem', overflowY: 'auto' },
  headerFlex: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
  pageTitle: { fontSize: '2.25rem', fontWeight: 'bold', letterSpacing: '-0.03em' },
  liveBadge: { fontSize: '0.75rem', color: '#34d399', backgroundColor: 'rgba(52, 211, 153, 0.1)', padding: '0.375rem 0.875rem', borderRadius: '2rem', fontWeight: '600', border: '1px solid rgba(52, 211, 153, 0.2)' },
  subTitle: { fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.25rem', color: '#f1f5f9' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' },
  cardGlass: { backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '1.25rem', padding: '1.75rem', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)' },
  cardCenter: { backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '1.25rem', padding: '4rem 2rem', textAlign: 'center' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' },
  cardIconBlue: { padding: '0.5rem', backgroundColor: 'rgba(59, 130, 246, 0.15)', borderRadius: '0.5rem', fontSize: '1.125rem' },
  cardIconEmerald: { padding: '0.5rem', backgroundColor: 'rgba(16, 185, 129, 0.15)', borderRadius: '0.5rem', fontSize: '1.125rem' },
  cardIconPurple: { padding: '0.5rem', backgroundColor: 'rgba(168, 85, 247, 0.15)', borderRadius: '0.5rem', fontSize: '1.125rem' },
  cardTitle: { fontSize: '0.9375rem', fontWeight: '500', color: '#94a3b8', margin: 0 },
  cardValueBlue: { fontSize: '2.25rem', fontWeight: 'bold', color: '#60a5fa', margin: 0 },
  cardValueEmerald: { fontSize: '2.25rem', fontWeight: 'bold', color: '#34d399', margin: 0 },
  cardValueWhite: { fontSize: '1.75rem', fontWeight: 'bold', color: '#fff', margin: 0 },
  unit: { fontSize: '1rem', fontWeight: 'normal', color: '#94a3b8' },
  textMuted: { color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.9375rem' },
  inlineForm: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', alignItems: 'end' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' },
  th: { textAlign: 'left', padding: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8', fontSize: '0.8125rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' },
  td: { padding: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '0.9375rem' },
  trHover: { transition: 'background-color 0.15s ease' }
};