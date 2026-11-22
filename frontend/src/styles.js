export const ANIMATION_CSS = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
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
`;

export const styles = {
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