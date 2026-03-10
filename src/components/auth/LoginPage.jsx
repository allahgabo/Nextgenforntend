import { useState } from 'react';
import AuthLayout from './AuthLayout';
import { authLogin, saveAuth } from '../../services/api';


// ─────────────────────────────────────────────────────────
//  LoginPage has NO lang state of its own.
//  All language values come from AuthLayout's render prop:
//  { lang, t, isAr, dir, font }
//  This means switching language in AuthLayout instantly
//  re-renders every string, label, and direction here.
// ─────────────────────────────────────────────────────────

function BrandLogo() {
  return (
    <svg width="58" height="58" viewBox="0 0 58 58" fill="none">
      <defs>
        <linearGradient id="vg" x1="0" y1="0" x2="58" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#a78bfa" />
          <stop offset="55%"  stopColor="#6366f1" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      <rect width="58" height="58" rx="15" fill="url(#vg)" fillOpacity="0.10" />
      <path d="M13 15 L29 45 L45 15"
        stroke="url(#vg)" strokeWidth="6"
        strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M29 45 L40 22"
        stroke="#38bdf8" strokeWidth="3.5"
        strokeLinecap="round" strokeOpacity="0.85" />
    </svg>
  );
}

function EyeIcon({ show }) {
  return show ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="#9ca3af" strokeWidth="2" strokeLinecap="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="#9ca3af" strokeWidth="2" strokeLinecap="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="#9ca3af" strokeWidth="2" strokeLinecap="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="#9ca3af" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

function Field({
  label, type = 'text', value, onChange, placeholder,
  error, isAr, font, autoComplete, sideIcon, rightSlot, labelRight,
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 6,
      }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: '#1e1b4b', fontFamily: font }}>
          {label}
        </label>
        {labelRight}
      </div>
      <div style={{ position: 'relative' }}>
        <input
          type={type} value={value} onChange={onChange}
          placeholder={placeholder} autoComplete={autoComplete}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          dir={isAr ? 'rtl' : 'ltr'}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '10px 14px',
            paddingRight: sideIcon  ? '40px' : '14px',
            paddingLeft:  rightSlot ? '40px' : '14px',
            border: `1.5px solid ${error ? '#ef4444' : focused ? '#6366f1' : '#e5e7eb'}`,
            borderRadius: 10, fontSize: 13.5, color: '#0f172a',
            background: '#fff', outline: 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s', fontFamily: font,
            boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
            textAlign: isAr ? 'right' : 'left',
          }}
        />
        {sideIcon && (
          <div style={{
            position: 'absolute', top: '50%', right: 13,
            transform: 'translateY(-50%)',
            display: 'flex', alignItems: 'center', pointerEvents: 'none',
          }}>
            {sideIcon}
          </div>
        )}
        {rightSlot && (
          <div style={{
            position: 'absolute', top: '50%', left: 13,
            transform: 'translateY(-50%)',
            display: 'flex', alignItems: 'center', cursor: 'pointer',
          }}>
            {rightSlot}
          </div>
        )}
      </div>
      {error && (
        <p style={{ margin: '4px 0 0', fontSize: 11.5, color: '#ef4444', fontFamily: font }}>
          {error}
        </p>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   LoginPage — NO lang state, driven entirely by AuthLayout
═══════════════════════════════════════════════════════════ */
export default function LoginPage({ onLogin, onGoSignup, onGoForgot, initialLang }) {
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [showPwd,   setShowPwd]   = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [errors,    setErrors]    = useState({});
  const [apiErr,    setApiErr]    = useState('');
  const [activeTab, setActiveTab] = useState('login');

  const validate = (t) => {
    const e = {};
    if (!email)    e.email    = t.fieldRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = t.invalidEmail;
    if (!password) e.password = t.fieldRequired;
    return e;
  };

  const handleSubmit = async (t) => {
    const e = validate(t);
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true); setApiErr('');
    try {
      const res = await authLogin(email, password);
      saveAuth(res.data.token || res.data.access, res.data.user || { email });
      onLogin?.();
    } catch {
      setApiErr(t.authError);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Pass initialLang so AuthLayout initialises correctly.
    // onLangChange is NOT needed here — AuthLayout owns lang.
    <AuthLayout lang={initialLang}>
      {({ lang, t, isAr, dir, font }) => (
        /* direction + font come live from AuthLayout every render */
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'stretch',
          direction: dir, fontFamily: font,
        }}>

          {/* ① Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
            <BrandLogo />
          </div>

          {/* ② Title + subtitle */}
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <h2 style={{ margin: '0 0 7px', fontSize: 19, fontWeight: 800, color: '#1e1b4b', fontFamily: font }}>
              {isAr ? 'إحاطة | Ehaata' : 'إحاطة | Ehaata'}
            </h2>
            <p style={{ margin: 0, fontSize: 12.5, color: '#9ca3af', lineHeight: 1.6, fontFamily: font }}>
              {isAr
                ? 'منصة الإحاطة الذكية لتمكين التمثيل المؤسسي'
                : 'Smart Briefing Platform for Institutional Representation'}
            </p>
          </div>

          {/* ③ Tabs — labels from T via t */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            border: '1.5px solid #e5e7eb', borderRadius: 10,
            overflow: 'hidden', marginBottom: 16,
          }}>
            {[
              { key: 'login',  label: t.loginBtn  },
              { key: 'signup', label: t.signUpLink },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  if (tab.key === 'signup') onGoSignup?.(lang);
                }}
                style={{
                  padding: '10px 8px', fontFamily: font,
                  fontSize: 13, fontWeight: 600,
                  border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                  background: activeTab === tab.key ? '#1e1b4b' : '#fff',
                  color:      activeTab === tab.key ? '#fff'    : '#9ca3af',
                }}>
                {tab.label}
              </button>
            ))}
          </div>
          {/* ⑥ API error */}
          {apiErr && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#fef2f2', border: '1.5px solid #fecaca',
              borderRadius: 10, padding: '9px 13px', marginBottom: 12,
            }}>
              <span style={{ fontSize: 14 }}>⚠️</span>
              <span style={{ fontSize: 12.5, color: '#dc2626', fontFamily: font }}>{apiErr}</span>
            </div>
          )}

          {/* ⑦ Email */}
          <Field
            label={t.emailLabel}
            type="email" value={email}
            onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
            placeholder="you@example.com"
            error={errors.email} isAr={isAr} font={font}
            autoComplete="email" sideIcon={<EmailIcon />}
          />

          {/* ⑧ Password */}
          <Field
            label={t.passwordLabel}
            type={showPwd ? 'text' : 'password'} value={password}
            onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }}
            placeholder="••••••••"
            error={errors.password} isAr={isAr} font={font}
            autoComplete="current-password"
            sideIcon={<LockIcon />}
            rightSlot={<span onClick={() => setShowPwd(p => !p)}><EyeIcon show={showPwd} /></span>}
            labelRight={
              <button onClick={() => onGoForgot?.(lang)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 0, color: '#6366f1', fontSize: 12,
                fontWeight: 600, fontFamily: font,
              }}>
                {t.forgotPassword}
              </button>
            }
          />

          {/* ⑨ Submit */}
          <button
            onClick={() => handleSubmit(t)}
            disabled={loading}
            style={{
              width: '100%', padding: '13px',
              background: loading ? '#818cf8' : '#1e1b4b',
              color: '#fff', border: 'none', borderRadius: 10,
              fontSize: 14.5, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: font, transition: 'background 0.2s',
              boxShadow: '0 4px 16px rgba(30,27,75,0.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
            {loading && (
              <span style={{
                width: 14, height: 14,
                border: '2px solid rgba(255,255,255,0.35)',
                borderTopColor: '#fff', borderRadius: '50%',
                display: 'inline-block',
                animation: 'spin 0.7s linear infinite',
              }} />
            )}
            {loading ? t.loggingIn : t.loginBtn}
          </button>

          {/* ⑩ ToS */}
          <p style={{
            textAlign: 'center', marginTop: 14, marginBottom: 0,
            fontSize: 11.5, color: '#9ca3af', fontFamily: font, lineHeight: 1.6,
          }}>
            {isAr ? 'بالمتابعة، أنت توافق على ' : 'By continuing, you agree to the '}
            <a href="#" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>
              {t.termsLink}
            </a>
            {' '}{t.andText}{' '}
            <a href="#" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>
              {t.privacyLink}
            </a>
          </p>

          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}
    </AuthLayout>
  );
}
