import { useState } from 'react';
import AuthLayout from './AuthLayout';
import { authSignup, saveAuth } from '../../services/api';

// ─────────────────────────────────────────────────────────
//  SignupPage has NO lang state of its own.
//  All language values come from AuthLayout's render prop.
// ─────────────────────────────────────────────────────────

function BrandLogo() {
  return (
    <svg width="58" height="58" viewBox="0 0 58 58" fill="none">
      <defs>
        <linearGradient id="vg3" x1="0" y1="0" x2="58" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#a78bfa" />
          <stop offset="55%"  stopColor="#6366f1" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      <rect width="58" height="58" rx="15" fill="url(#vg3)" fillOpacity="0.10" />
      <path d="M13 15 L29 45 L45 15"
        stroke="url(#vg3)" strokeWidth="6"
        strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M29 45 L40 22"
        stroke="#38bdf8" strokeWidth="3.5"
        strokeLinecap="round" strokeOpacity="0.85" />
    </svg>
  );
}

function EyeIcon({ show }) {
  return show ? (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

function Field({ label, type = 'text', value, onChange, placeholder, error, isAr, font, autoComplete, rightSlot }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{
        display: 'block', fontSize: 13, fontWeight: 600,
        color: '#1e1b4b', marginBottom: 6, fontFamily: font,
      }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={type} value={value} onChange={onChange}
          placeholder={placeholder} autoComplete={autoComplete}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          dir={isAr ? 'rtl' : 'ltr'}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: rightSlot
              ? `10px ${isAr ? '14px' : '40px'} 10px ${isAr ? '40px' : '14px'}`
              : '10px 14px',
            border: `1.5px solid ${error ? '#ef4444' : focused ? '#6366f1' : '#e5e7eb'}`,
            borderRadius: 10, fontSize: 13.5, color: '#0f172a',
            background: '#fff', outline: 'none',
            transition: 'all 0.15s', fontFamily: font,
            boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
            textAlign: isAr ? 'right' : 'left',
          }}
        />
        {rightSlot && (
          <div style={{
            position: 'absolute', top: '50%', transform: 'translateY(-50%)',
            [isAr ? 'left' : 'right']: 13, cursor: 'pointer',
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
   SignupPage — NO lang state, driven entirely by AuthLayout
   Props: onSignup · onGoLogin · initialLang
═══════════════════════════════════════════════════════════ */
export default function SignupPage({ onSignup, onGoLogin, initialLang }) {
  const [form, setForm] = useState({
    fullName: '', email: '', jobTitle: '',
    department: '', password: '', confirmPassword: '',
  });
  const [showPwd,  setShowPwd]  = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [agreed,   setAgreed]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState({});
  const [apiErr,   setApiErr]   = useState('');

  const set = (k) => (e) => {
    setForm(p => ({ ...p, [k]: e.target.value }));
    setErrors(p => ({ ...p, [k]: '' }));
  };

  const validate = (t) => {
    const e = {};
    if (!form.fullName) e.fullName = t.fieldRequired;
    if (!form.email)    e.email    = t.fieldRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t.invalidEmail;
    if (!form.password) e.password = t.fieldRequired;
    else if (form.password.length < 8) e.password = t.passwordTooShort;
    if (!form.confirmPassword) e.confirmPassword = t.fieldRequired;
    else if (form.password !== form.confirmPassword) e.confirmPassword = t.passwordMismatch;
    return e;
  };

  const handleSubmit = async (t) => {
    const e = validate(t);
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true); setApiErr('');
    try {
      const res = await authSignup(form);
      saveAuth(res.data.token || res.data.access, res.data.user || { email: form.email });
      onSignup?.();
    } catch (err) {
      setApiErr(err?.response?.data?.message || err?.response?.data?.email?.[0] || t.authError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout lang={initialLang}>
      {({ lang, t, isAr, dir, font }) => (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'stretch',
          direction: dir, fontFamily: font,
        }}>

          {/* ① Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <BrandLogo />
          </div>

          {/* ② Title + subtitle */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <h2 style={{ margin: '0 0 7px', fontSize: 19, fontWeight: 800, color: '#1e1b4b', fontFamily: font }}>
              {t.signUpTitle}
            </h2>
            <p style={{ margin: 0, fontSize: 12.5, color: '#9ca3af', lineHeight: 1.6, fontFamily: font }}>
              {t.signUpSubtitle}
            </p>
          </div>

          {/* ③ API error */}
          {apiErr && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#fef2f2', border: '1.5px solid #fecaca',
              borderRadius: 10, padding: '10px 14px', marginBottom: 14,
            }}>
              <span style={{ fontSize: 15 }}>⚠️</span>
              <span style={{ fontSize: 13, color: '#dc2626', fontWeight: 500, fontFamily: font }}>{apiErr}</span>
            </div>
          )}

          {/* ④ Name + Job title */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label={t.fullNameLabel} value={form.fullName} onChange={set('fullName')}
              placeholder={t.fullNamePlaceholder} error={errors.fullName}
              isAr={isAr} font={font} autoComplete="name" />
            <Field label={t.jobTitleLabel} value={form.jobTitle} onChange={set('jobTitle')}
              placeholder={t.jobTitlePlaceholder} error={errors.jobTitle}
              isAr={isAr} font={font} />
          </div>

          {/* ⑤ Email */}
          <Field label={t.emailLabel} type="email" value={form.email} onChange={set('email')}
            placeholder={t.emailPlaceholder} error={errors.email}
            isAr={isAr} font={font} autoComplete="email" />

          {/* ⑥ Department */}
          <Field label={t.departmentLabel} value={form.department} onChange={set('department')}
            placeholder={t.departmentPlaceholder}
            isAr={isAr} font={font} />

          {/* ⑦ Password + Confirm */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label={t.passwordLabel} type={showPwd ? 'text' : 'password'}
              value={form.password} onChange={set('password')}
              placeholder={t.passwordPlaceholder} error={errors.password}
              isAr={isAr} font={font} autoComplete="new-password"
              rightSlot={<span onClick={() => setShowPwd(p => !p)}><EyeIcon show={showPwd} /></span>} />
            <Field label={t.confirmPasswordLabel} type={showConf ? 'text' : 'password'}
              value={form.confirmPassword} onChange={set('confirmPassword')}
              placeholder={t.confirmPasswordPlaceholder} error={errors.confirmPassword}
              isAr={isAr} font={font} autoComplete="new-password"
              rightSlot={<span onClick={() => setShowConf(p => !p)}><EyeIcon show={showConf} /></span>} />
          </div>

          {/* ⑧ Password strength */}
          {form.password && (() => {
            const len      = form.password.length;
            const strength = len >= 12 ? 3 : len >= 8 ? 2 : 1;
            const colors   = ['#ef4444', '#f59e0b', '#22c55e'];
            const labels   = { ar: ['ضعيفة', 'متوسطة', 'قوية'], en: ['Weak', 'Fair', 'Strong'] };
            return (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  {[1, 2, 3].map(s => (
                    <div key={s} style={{
                      flex: 1, height: 3, borderRadius: 2,
                      background: s <= strength ? colors[strength - 1] : '#e2e8f0',
                      transition: 'all 0.3s',
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: 11, color: colors[strength - 1], fontWeight: 600, fontFamily: font }}>
                  {labels[isAr ? 'ar' : 'en'][strength - 1]}
                </span>
              </div>
            );
          })()}

          {/* ⑨ Terms */}
          <div onClick={() => setAgreed(p => !p)} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            cursor: 'pointer', marginBottom: 18, direction: dir,
          }}>
            <div style={{
              width: 17, height: 17, borderRadius: 5, flexShrink: 0,
              border: `1.5px solid ${agreed ? '#6366f1' : '#d1d5db'}`,
              background: agreed ? '#6366f1' : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginTop: 2, transition: 'all 0.15s',
            }}>
              {agreed && (
                <svg width="9" height="9" viewBox="0 0 12 12">
                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.2"
                    strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              )}
            </div>
            <span style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.5, fontFamily: font, userSelect: 'none' }}>
              {t.agreeTerms}{' '}
              <span style={{ color: '#6366f1', fontWeight: 600 }}>{t.termsLink}</span>
              {' '}{t.andText}{' '}
              <span style={{ color: '#6366f1', fontWeight: 600 }}>{t.privacyLink}</span>
            </span>
          </div>

          {/* ⑩ Submit */}
          <button
            onClick={() => handleSubmit(t)}
            disabled={loading || !agreed}
            onMouseEnter={e => { if (!loading && agreed) e.currentTarget.style.background = '#2d2a6e'; }}
            onMouseLeave={e => { e.currentTarget.style.background = (loading || !agreed) ? '#a5b4fc' : '#1e1b4b'; }}
            style={{
              width: '100%', padding: '13px',
              background: (loading || !agreed) ? '#a5b4fc' : '#1e1b4b',
              color: '#fff', border: 'none', borderRadius: 10,
              fontSize: 14.5, fontWeight: 700,
              cursor: (loading || !agreed) ? 'not-allowed' : 'pointer',
              fontFamily: font, transition: 'background 0.2s',
              boxShadow: (loading || !agreed) ? 'none' : '0 4px 16px rgba(30,27,75,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
            {loading ? (
              <>
                <span style={{
                  width: 14, height: 14,
                  border: '2px solid rgba(255,255,255,0.35)',
                  borderTopColor: '#fff', borderRadius: '50%',
                  display: 'inline-block', animation: 'spin 0.7s linear infinite',
                }} />
                {t.signingUp}
              </>
            ) : t.signUpBtn}
          </button>

          {/* ⑪ Login link */}
          <p style={{
            textAlign: 'center', marginTop: 16, marginBottom: 0,
            fontSize: 13, color: '#9ca3af', fontFamily: font,
          }}>
            {t.hasAccount}{' '}
            <button onClick={() => onGoLogin?.(lang)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#6366f1', fontWeight: 700, fontSize: 13,
              fontFamily: font, padding: 0,
            }}>
              {t.loginLink}
            </button>
          </p>

          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}
    </AuthLayout>
  );
}
