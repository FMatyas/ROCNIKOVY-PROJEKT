import React, { useState, useEffect } from 'react';
import { styles, ANIMATION_CSS } from './styles';
import { account } from './appwrite';
import AuthView from './components/AuthView';
import StatsCharts from './components/StatsCharts';

const gridSectionStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
  gap: '14px',
};

const vinBoxStyle = {
  display: 'grid',
  gridTemplateColumns: 'minmax(240px, 1fr) auto',
  gap: '12px',
  alignItems: 'end',
  padding: '14px',
  borderRadius: '12px',
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
};

const stackFormStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
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
  const [newVehicle, setNewVehicle] = useState({
    brand: '',
    model: '',
    year: '',
    vin: '',
    license_plate: '',
    engine: '',
    power_kw: '',
  });
  const [vinLoading, setVinLoading] = useState(false);
  const [vinStatus, setVinStatus] = useState('');
  const [lastFetchedVin, setLastFetchedVin] = useState('');

  const [newRefueling, setNewRefueling] = useState({ date: '', liters: '', price_total: '', odometer: '', note: '' });
  const [newService, setNewService] = useState({ title: '', date: '', cost: '', mileage: '', note: '' });
  const [newDocument, setNewDocument] = useState({ doc_type: 'STK', expiry_date: '', note: '' });

  const loadAllData = async (preferredVehicleId = selectedVehicleId) => {
    try {
      const dashQuery = preferredVehicleId ? `?vehicle_id=${encodeURIComponent(preferredVehicleId)}` : '';
      const dashRes = await fetch(`/api/dashboard${dashQuery}`, { credentials: 'include' });
      const dashJson = await dashRes.json();
      if (dashJson.success) {
        setDashboardData(dashJson);
        const activeId = dashJson.selected_vehicle?.id ?? dashJson.vehicles?.[0]?.id ?? null;
        if (activeId !== null) {
          setSelectedVehicleId(activeId);
        }
      }
    } catch {
      // ignorovat chybu sítě při obnově
    }

    fetch('/api/trips', { credentials: 'include' })
      .then(res => res.json())
      .then(data => { if (data.success) setTrips(data.trips); })
      .catch(() => {});

    fetch('/api/refuelings', { credentials: 'include' })
      .then(res => res.json())
      .then(data => { if (data.success) setRefuelings(data.refuelings); })
      .catch(() => {});

    fetch('/api/services', { credentials: 'include' })
      .then(res => res.json())
      .then(data => { if (data.success) setServices(data.services); })
      .catch(() => {});

    fetch('/api/documents', { credentials: 'include' })
      .then(res => res.json())
      .then(data => { if (data.success) setDocuments(data.documents); })
      .catch(() => {});
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
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
          await loadAllData();
          setLoading(false);
          return;
        }
      } catch {
        // Není přihlášen přes Appwrite -> kontrola klasické FastAPI session
      }

      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
          await loadAllData();
        }
      } catch {
        // Nepřihlášen
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const handleVehicleChange = async (nextId) => {
    const parsedId = nextId ? Number(nextId) : null;
    setSelectedVehicleId(parsedId);
    await loadAllData(parsedId);
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
      await loadAllData();
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
      await loadAllData();
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
    setSelectedVehicleId(null);
  };

  const lookupVin = async (rawVin) => {
    const cleanVin = (rawVin || '').trim().toUpperCase();
    if (cleanVin.length !== 17) {
      setVinStatus('VIN musí mít přesně 17 znaků.');
      return;
    }

    setVinLoading(true);
    setVinStatus('Načítám data podle VIN...');
    try {
      const res = await fetch(`/api/etechnicak/${encodeURIComponent(cleanVin)}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setVinStatus(data.detail || 'VIN se nepodařilo dekódovat.');
        return;
      }

      setNewVehicle(prev => ({
        ...prev,
        vin: cleanVin,
        brand: data.brand || prev.brand,
        model: data.model || prev.model,
        year: data.year ? String(data.year) : prev.year,
        license_plate: data.license_plate || prev.license_plate,
        engine: data.engine || prev.engine,
        power_kw: data.power_kw ? String(data.power_kw) : prev.power_kw,
      }));
      setLastFetchedVin(cleanVin);

      if (data.stk_valid_to) {
        setNewDocument(prev => ({
          ...prev,
          doc_type: 'STK',
          expiry_date: prev.expiry_date || data.stk_valid_to,
        }));
      }

      setVinStatus(`Doplněno ze zdroje: ${(data.source || 'api').toUpperCase()}`);
    } catch {
      setVinStatus('Chyba při komunikaci se serverem.');
    } finally {
      setVinLoading(false);
    }
  };

  useEffect(() => {
    const cleanVin = (newVehicle.vin || '').trim().toUpperCase();
    if (cleanVin.length === 17 && cleanVin !== lastFetchedVin && !vinLoading) {
      lookupVin(cleanVin);
    }
  }, [newVehicle.vin]);

  const activeVehicleId = selectedVehicleId ?? dashboardData?.selected_vehicle?.id ?? null;

  const ensureVehicleSelected = () => {
    if (!activeVehicleId) {
      alert('Nejprve vyber nebo přidej vozidlo!');
      return false;
    }
    return true;
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    const payload = {
      ...newVehicle,
      vin: newVehicle.vin ? newVehicle.vin.trim().toUpperCase() : null,
      year: newVehicle.year ? parseInt(newVehicle.year, 10) : null,
      power_kw: newVehicle.power_kw ? parseInt(newVehicle.power_kw, 10) : null,
      engine: newVehicle.engine || null,
      license_plate: newVehicle.license_plate || null,
    };

    const res = await fetch('/api/vehicles/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include'
    });
    if (res.ok) {
      const created = await res.json().catch(() => ({}));
      const nextId = created.vehicle_id || selectedVehicleId;
      setNewVehicle({ brand: '', model: '', year: '', vin: '', license_plate: '', engine: '', power_kw: '' });
      setLastFetchedVin('');
      setVinStatus('');
      await loadAllData(nextId);
      alert('Vozidlo úspěšně přidáno!');
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.detail || 'Nepodařilo se uložit vozidlo.');
    }
  };

  const handleAddTrip = async (e) => {
    e.preventDefault();
    if (!ensureVehicleSelected()) return;
    const res = await fetch('/api/trips/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newTrip,
        vehicle_id: activeVehicleId,
        distance_km: parseFloat(newTrip.distance_km)
      }),
      credentials: 'include'
    });
    if (res.ok) {
      setNewTrip({ title: '', date: '', distance_km: '', start_location: '', destination: '', note: '' });
      await loadAllData(activeVehicleId);
      alert('Výlet přidán!');
    }
  };

  const handleAddRefueling = async (e) => {
    e.preventDefault();
    if (!ensureVehicleSelected()) return;
    const res = await fetch('/api/refuelings/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicle_id: activeVehicleId,
        date: newRefueling.date,
        liters: parseFloat(newRefueling.liters),
        price_total: parseFloat(newRefueling.price_total),
        odometer: parseInt(newRefueling.odometer, 10),
        note: newRefueling.note || null,
      }),
      credentials: 'include'
    });
    if (res.ok) {
      setNewRefueling({ date: '', liters: '', price_total: '', odometer: '', note: '' });
      await loadAllData(activeVehicleId);
      alert('Tankování přidáno!');
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.detail || 'Nepodařilo se uložit tankování.');
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!ensureVehicleSelected()) return;
    const res = await fetch('/api/services/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicle_id: activeVehicleId,
        title: newService.title,
        date: newService.date,
        cost: parseFloat(newService.cost),
        mileage: parseInt(newService.mileage, 10),
        note: newService.note || null,
      }),
      credentials: 'include'
    });
    if (res.ok) {
      setNewService({ title: '', date: '', cost: '', mileage: '', note: '' });
      await loadAllData(activeVehicleId);
      alert('Servis přidán!');
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.detail || 'Nepodařilo se uložit servis.');
    }
  };

  const handleAddDocument = async (e) => {
    e.preventDefault();
    if (!ensureVehicleSelected()) return;
    const res = await fetch('/api/documents/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicle_id: activeVehicleId,
        doc_type: newDocument.doc_type,
        expiry_date: newDocument.expiry_date,
        note: newDocument.note || null,
      }),
      credentials: 'include'
    });
    if (res.ok) {
      setNewDocument({ doc_type: 'STK', expiry_date: '', note: '' });
      await loadAllData(activeVehicleId);
      alert('Doklad přidán!');
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.detail || 'Nepodařilo se uložit doklad.');
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
  const vehiclesList = dashboardData?.vehicles || [];

  return (
    <div style={styles.appContainer}>
      <aside style={styles.sidebar}>
        <div>
          <div style={styles.logoArea}>
            <span style={styles.logoIcon}>🚗</span>
            <h2 style={styles.logoText}>TrackMyRide</h2>
          </div>

          {vehiclesList.length > 0 && (
            <div style={{ padding: '0 14px 14px' }}>
              <label style={{ ...styles.label, display: 'block', marginBottom: '6px' }}>Aktivní vozidlo</label>
              <select
                value={activeVehicleId || ''}
                onChange={e => handleVehicleChange(e.target.value)}
                style={{ ...styles.input, width: '100%' }}
              >
                {vehiclesList.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
          )}

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
            {vehiclesList.length > 0 ? (
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
              <form onSubmit={handleAddVehicle} style={stackFormStyle}>
                <div style={vinBoxStyle}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>VIN kód (17 znaků – automatické doplnění)</label>
                    <input
                      type="text"
                      maxLength={17}
                      placeholder="Např. WVWZZZ3CZ8E123456"
                      value={newVehicle.vin}
                      onChange={e => setNewVehicle({ ...newVehicle, vin: e.target.value.toUpperCase() })}
                      style={styles.input}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => lookupVin(newVehicle.vin)}
                    disabled={vinLoading}
                    style={{ ...styles.primaryButton, height: '42px', whiteSpace: 'nowrap' }}
                    className="btn-glow"
                  >
                    {vinLoading ? 'Načítám...' : '🔍 Načíst z VIN'}
                  </button>
                </div>

                {vinStatus && <p style={{ ...styles.textMuted, margin: 0 }}>{vinStatus}</p>}

                <div style={gridSectionStyle}>
                  <div style={styles.inputGroup}><label style={styles.label}>Značka</label><input type="text" placeholder="Audi" value={newVehicle.brand} onChange={e => setNewVehicle({ ...newVehicle, brand: e.target.value })} style={styles.input} required /></div>
                  <div style={styles.inputGroup}><label style={styles.label}>Model</label><input type="text" placeholder="A4 Avant" value={newVehicle.model} onChange={e => setNewVehicle({ ...newVehicle, model: e.target.value })} style={styles.input} required /></div>
                  <div style={styles.inputGroup}><label style={styles.label}>Rok výroby</label><input type="number" placeholder="2001" value={newVehicle.year} onChange={e => setNewVehicle({ ...newVehicle, year: e.target.value })} style={styles.input} /></div>
                  <div style={styles.inputGroup}><label style={styles.label}>Motor</label><input type="text" placeholder="1.9 TDI" value={newVehicle.engine} onChange={e => setNewVehicle({ ...newVehicle, engine: e.target.value })} style={styles.input} /></div>
                  <div style={styles.inputGroup}><label style={styles.label}>Výkon (kW)</label><input type="number" placeholder="96" value={newVehicle.power_kw} onChange={e => setNewVehicle({ ...newVehicle, power_kw: e.target.value })} style={styles.input} /></div>
                  <div style={styles.inputGroup}><label style={styles.label}>SPZ</label><input type="text" placeholder="1AB 2345" value={newVehicle.license_plate} onChange={e => setNewVehicle({ ...newVehicle, license_plate: e.target.value })} style={styles.input} /></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" style={styles.primaryButton} className="btn-glow">Uložit vozidlo</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'refuelings' && (
          <div>
            <h2 style={styles.pageTitle}>Historie tankování</h2>
            <div style={styles.cardGlass}>
              <h3 style={styles.subTitle}>⛽ Přidat tankování</h3>
              <form onSubmit={handleAddRefueling} style={stackFormStyle}>
                <div style={gridSectionStyle}>
                  <div style={styles.inputGroup}><label style={styles.label}>Datum</label><input type="date" value={newRefueling.date} onChange={e => setNewRefueling({ ...newRefueling, date: e.target.value })} style={styles.input} required /></div>
                  <div style={styles.inputGroup}><label style={styles.label}>Litry</label><input type="number" step="0.01" placeholder="45.0" value={newRefueling.liters} onChange={e => setNewRefueling({ ...newRefueling, liters: e.target.value })} style={styles.input} required /></div>
                  <div style={styles.inputGroup}><label style={styles.label}>Celkem Kč</label><input type="number" step="0.01" placeholder="1650" value={newRefueling.price_total} onChange={e => setNewRefueling({ ...newRefueling, price_total: e.target.value })} style={styles.input} required /></div>
                  <div style={styles.inputGroup}><label style={styles.label}>Tachometr (km)</label><input type="number" placeholder="215000" value={newRefueling.odometer} onChange={e => setNewRefueling({ ...newRefueling, odometer: e.target.value })} style={styles.input} required /></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" style={styles.primaryButton} className="btn-glow">Uložit tankování</button>
                </div>
              </form>
            </div>
            <div style={{ ...styles.cardGlass, marginTop: '20px' }}>
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
              <form onSubmit={handleAddTrip} style={stackFormStyle}>
                <div style={gridSectionStyle}>
                  <div style={styles.inputGroup}><label style={styles.label}>Účel / Název</label><input type="text" placeholder="Cesta do práce" value={newTrip.title} onChange={e => setNewTrip({ ...newTrip, title: e.target.value })} style={styles.input} required /></div>
                  <div style={styles.inputGroup}><label style={styles.label}>Datum</label><input type="date" value={newTrip.date} onChange={e => setNewTrip({ ...newTrip, date: e.target.value })} style={styles.input} required /></div>
                  <div style={styles.inputGroup}><label style={styles.label}>Vzdálenost (km)</label><input type="number" step="0.1" placeholder="45.5" value={newTrip.distance_km} onChange={e => setNewTrip({ ...newTrip, distance_km: e.target.value })} style={styles.input} required /></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" style={styles.primaryButton} className="btn-glow">Přidat výlet</button>
                </div>
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
              <h3 style={styles.subTitle}>🛠️ Přidat servisní záznam</h3>
              <form onSubmit={handleAddService} style={stackFormStyle}>
                <div style={gridSectionStyle}>
                  <div style={styles.inputGroup}><label style={styles.label}>Název úkonu</label><input type="text" placeholder="Výměna oleje" value={newService.title} onChange={e => setNewService({ ...newService, title: e.target.value })} style={styles.input} required /></div>
                  <div style={styles.inputGroup}><label style={styles.label}>Datum</label><input type="date" value={newService.date} onChange={e => setNewService({ ...newService, date: e.target.value })} style={styles.input} required /></div>
                  <div style={styles.inputGroup}><label style={styles.label}>Cena (Kč)</label><input type="number" step="0.01" placeholder="2500" value={newService.cost} onChange={e => setNewService({ ...newService, cost: e.target.value })} style={styles.input} required /></div>
                  <div style={styles.inputGroup}><label style={styles.label}>Nájezd (km)</label><input type="number" placeholder="215000" value={newService.mileage} onChange={e => setNewService({ ...newService, mileage: e.target.value })} style={styles.input} required /></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" style={styles.primaryButton} className="btn-glow">Uložit servis</button>
                </div>
              </form>
            </div>
            <div style={{ ...styles.cardGlass, marginTop: '20px' }}>
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
              <h3 style={styles.subTitle}>📄 Přidat doklad / STK</h3>
              <form onSubmit={handleAddDocument} style={stackFormStyle}>
                <div style={gridSectionStyle}>
                  <div style={styles.inputGroup}><label style={styles.label}>Typ dokladu</label><input type="text" placeholder="STK" value={newDocument.doc_type} onChange={e => setNewDocument({ ...newDocument, doc_type: e.target.value })} style={styles.input} required /></div>
                  <div style={styles.inputGroup}><label style={styles.label}>Platnost do</label><input type="date" value={newDocument.expiry_date} onChange={e => setNewDocument({ ...newDocument, expiry_date: e.target.value })} style={styles.input} required /></div>
                  <div style={styles.inputGroup}><label style={styles.label}>Poznámka</label><input type="text" placeholder="Stanice TK" value={newDocument.note} onChange={e => setNewDocument({ ...newDocument, note: e.target.value })} style={styles.input} /></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" style={styles.primaryButton} className="btn-glow">Uložit doklad</button>
                </div>
              </form>
            </div>
            <div style={{ ...styles.cardGlass, marginTop: '20px' }}>
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