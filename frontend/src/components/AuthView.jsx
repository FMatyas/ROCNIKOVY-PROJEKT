import React from 'react';
import { styles } from '../styles';

export default function AuthView({
  isLoginView,
  setIsLoginView,
  email,
  setEmail,
  password,
  setPassword,
  fullName,
  setFullName,
  confirmPassword,
  setConfirmPassword,
  errorMsg,
  onLogin,
  onRegister,
  onGoogleLogin
}) {
  return (
    <div style={styles.authContainer}>
      <div style={styles.authCard}>
        <div style={styles.authHeaderBadge}>🚗 TrackMyRide</div>
        <h1 style={styles.authTitle}>Vítejte zpět</h1>
        <p style={styles.authSubtitle}>Vyberte způsob přihlášení do aplikace</p>

        {errorMsg && <div style={styles.errorBox}>{errorMsg}</div>}

        {isLoginView ? (
          <form onSubmit={onLogin} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>E-mailová adresa</label>
              <input type="email" placeholder="vas@email.cz" value={email} onChange={e => setEmail(e.target.value)} style={styles.input} required />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Heslo</label>
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} style={styles.input} required />
            </div>
            <button type="submit" style={styles.primaryButton} className="btn-glow">Přihlásit e-mailem</button>
          </form>
        ) : (
          <form onSubmit={onRegister} style={styles.form}>
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
          </form>
        )}

        <div style={{ margin: '1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#64748b', fontSize: '0.8rem' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
          <span>NEBO</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
        </div>

        <button
          type="button"
          onClick={onGoogleLogin}
          style={{
            width: '100%',
            padding: '0.825rem 1rem',
            backgroundColor: '#ffffff',
            color: '#0f172a',
            border: 'none',
            borderRadius: '0.75rem',
            fontWeight: '600',
            fontSize: '0.9375rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem'
          }}
          className="btn-glow"
        >
          <span>G</span>
          <span>Pokračovat přes Google</span>
        </button>

        <p style={styles.switchText}>
          {isLoginView ? (
            <>
              Nemáte ještě účet? <button type="button" onClick={() => setIsLoginView(false)} style={styles.linkButton}>Zaregistrovat se</button>
            </>
          ) : (
            <>
              Už máte účet? <button type="button" onClick={() => setIsLoginView(true)} style={styles.linkButton}>Přihlásit se</button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}