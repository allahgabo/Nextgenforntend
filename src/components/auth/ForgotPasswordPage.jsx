import { useState } from 'react';
import AuthLayout from './AuthLayout';
import { authForgot } from '../../services/api';

export default function ForgotPasswordPage({ onGoLogin, initialLang }) {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');
  const [lang,    setLang]    = useState(initialLang);

  const handleSubmit = async (t) => {
    if (!email) { setError(t.fieldRequired); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError(t.invalidEmail); return; }
    setLoading(true); setError('');
    try {
      await authForgot(email);
      setSent(true);
    } catch {
      // Still show success to avoid email enumeration
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout lang={initialLang} onLangChange={setLang}>
      {({ t, isAr, dir, font }) => (
        <div style={{ direction:dir, fontFamily:font }}>

          {sent ? (
            /* ── Success state ── */
            <div style={{ textAlign:'center' }}>
              <div style={{ width:72, height:72, borderRadius:'50%', background:'linear-gradient(135deg,#dcfce7,#bbf7d0)', border:'2px solid #86efac', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, margin:'0 auto 24px' }}>
                ✅
              </div>
              <h2 style={{ margin:'0 0 12px', fontSize:24, fontWeight:900, color:'#0d1829', letterSpacing:isAr?0:'-0.03em', fontFamily:font }}>
                {isAr ? 'تم الإرسال!' : 'Email Sent!'}
              </h2>
              <p style={{ margin:'0 0 32px', fontSize:13.5, color:'#64748b', lineHeight:1.6, fontFamily:font }}>
                {t.resetSent}
              </p>
              <div style={{ background:'#f8fafc', borderRadius:12, padding:'14px 18px', border:'1px solid #e2e8f0', marginBottom:32 }}>
                <span style={{ fontSize:13, color:'#0f172a', fontWeight:600, fontFamily:font }}>{email}</span>
              </div>
              <button onClick={() => onGoLogin?.(lang)}
                style={{ width:'100%', padding:'13px', background:'linear-gradient(135deg,#1c3370,#2d4fa6)', color:'white', border:'none', borderRadius:12, fontSize:14.5, fontWeight:700, cursor:'pointer', fontFamily:font, boxShadow:'0 4px 16px rgba(28,51,112,0.3)' }}>
                {t.backToLogin}
              </button>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              {/* Header */}
              <div style={{ marginBottom:32 }}>
                <div style={{ width:52, height:52, borderRadius:14, background:'linear-gradient(135deg,#eff6ff,#dbeafe)', border:'1px solid #bfdbfe', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, marginBottom:18 }}>
                  🔑
                </div>
                <h2 style={{ margin:'0 0 8px', fontSize:26, fontWeight:900, color:'#0d1829', lineHeight:1.2, letterSpacing:isAr?0:'-0.04em', fontFamily:font }}>
                  {t.forgotTitle}
                </h2>
                <p style={{ margin:0, fontSize:13.5, color:'#64748b', lineHeight:1.5, fontFamily:font }}>
                  {t.forgotSubtitle}
                </p>
              </div>

              {/* Email field */}
              <div style={{ marginBottom:24 }}>
                <label style={{ display:'block', fontSize:12.5, fontWeight:700, color:'#374151', marginBottom:7, fontFamily:font }}>
                  {t.emailLabel}
                </label>
                <input
                  type="email" value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder={t.emailPlaceholder}
                  style={{
                    width:'100%', padding:'12px 16px',
                    border:`1.5px solid ${error?'#ef4444':'#e2e8f0'}`,
                    borderRadius:10, fontSize:13.5, color:'#0f172a',
                    background:'#f8fafc', outline:'none', boxSizing:'border-box',
                    fontFamily:font, direction:isAr?'rtl':'ltr',
                    transition:'all 0.15s',
                  }}
                  onFocus={e => { e.target.style.borderColor='#3b82f6'; e.target.style.background='#fff'; e.target.style.boxShadow='0 0 0 3px rgba(59,130,246,0.1)'; }}
                  onBlur={e  => { e.target.style.borderColor=error?'#ef4444':'#e2e8f0'; e.target.style.background='#f8fafc'; e.target.style.boxShadow='none'; }}
                />
                {error && <p style={{ margin:'5px 0 0', fontSize:11.5, color:'#ef4444', fontFamily:font }}>{error}</p>}
              </div>

              {/* Submit */}
              <button onClick={() => handleSubmit(t)} disabled={loading}
                style={{
                  width:'100%', padding:'13px',
                  background: loading?'#93c5fd':'linear-gradient(135deg,#1c3370,#2d4fa6)',
                  color:'white', border:'none', borderRadius:12,
                  fontSize:14.5, fontWeight:700, cursor:loading?'not-allowed':'pointer',
                  fontFamily:font, marginBottom:20,
                  boxShadow: loading?'none':'0 4px 16px rgba(28,51,112,0.3)',
                  transition:'all 0.2s',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.transform='translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform='none'; }}>
                {loading ? (
                  <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                    <span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'white', borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite' }}/>
                    {t.sendingReset}
                  </span>
                ) : t.sendResetBtn}
              </button>

              <div style={{ textAlign:'center' }}>
                <button onClick={() => onGoLogin?.(lang)}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'#3b82f6', fontWeight:600, fontSize:13, fontFamily:font }}>
                  {t.backToLogin}
                </button>
              </div>
            </>
          )}

          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}
    </AuthLayout>
  );
}
