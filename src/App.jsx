import React, { useState, useEffect, useRef } from 'react'

const API = 'http://localhost:8001'

// ── Theme system ──────────────────────────────────────────────────────────────
const LIGHT = {
  bg: '#f1f4f9',
  surface: '#ffffff',
  surface2: '#f8fafc',
  surface3: '#f1f4f9',
  border: 'rgba(0,0,0,0.08)',
  border2: 'rgba(0,0,0,0.14)',
  text: '#0f172a',
  textSub: '#475569',
  textMuted: '#94a3b8',
  accent: '#6366f1',
  accentLight: '#eef2ff',
  accentBorder: '#c7d2fe',
  green: '#059669',
  greenLight: '#f0fdf4',
  greenBorder: '#bbf7d0',
  red: '#dc2626',
  redLight: '#fef2f2',
  redBorder: '#fecaca',
  amber: '#d97706',
  amberLight: '#fffbeb',
  amberBorder: '#fde68a',
  shadow: '0 1px 4px rgba(0,0,0,0.07)',
  shadowMd: '0 4px 16px rgba(0,0,0,0.08)',
  shadowLg: '0 12px 40px rgba(0,0,0,0.12)',
  inputBg: '#f8fafc',
  codeBg: '#f1f5f9',
  isDark: false,
}
const DARK = {
  bg: '#0f1117',
  surface: '#1a1d27',
  surface2: '#22263a',
  surface3: '#2a2f47',
  border: 'rgba(255,255,255,0.08)',
  border2: 'rgba(255,255,255,0.14)',
  text: '#e2e8f0',
  textSub: '#94a3b8',
  textMuted: '#64748b',
  accent: '#818cf8',
  accentLight: 'rgba(99,102,241,0.15)',
  accentBorder: 'rgba(99,102,241,0.35)',
  green: '#34d399',
  greenLight: 'rgba(52,211,153,0.1)',
  greenBorder: 'rgba(52,211,153,0.25)',
  red: '#f87171',
  redLight: 'rgba(248,113,113,0.1)',
  redBorder: 'rgba(248,113,113,0.25)',
  amber: '#fbbf24',
  amberLight: 'rgba(251,191,36,0.1)',
  amberBorder: 'rgba(251,191,36,0.25)',
  shadow: '0 1px 4px rgba(0,0,0,0.4)',
  shadowMd: '0 4px 16px rgba(0,0,0,0.5)',
  shadowLg: '0 12px 40px rgba(0,0,0,0.6)',
  inputBg: '#22263a',
  codeBg: '#2a2f47',
  isDark: true,
}

// ── Data ──────────────────────────────────────────────────────────────────────
const ISSUE_LABELS = {
  name_case: { label: 'Name casing', color: '#6366f1', darkColor: '#818cf8' },
  generic_email: { label: 'Generic email', color: '#dc2626', darkColor: '#f87171' },
  phone_format: { label: 'Phone format', color: '#d97706', darkColor: '#fbbf24' },
  phone_missing: { label: 'Phone missing', color: '#dc2626', darkColor: '#f87171' },
  name_incomplete: { label: 'Incomplete name', color: '#dc2626', darkColor: '#f87171' },
  title_abbrev: { label: 'Title abbreviated', color: '#7c3aed', darkColor: '#a78bfa' },
  title_case: { label: 'Title casing', color: '#6366f1', darkColor: '#818cf8' },
  company_format: { label: 'Company format', color: '#d97706', darkColor: '#fbbf24' },
  company_case: { label: 'Company casing', color: '#d97706', darkColor: '#fbbf24' },
  name_suffix: { label: 'Name suffix', color: '#7c3aed', darkColor: '#a78bfa' },
}

const PERSONAS = {
  'vp sales': 'Executive Buyer', 'vp of sales': 'Executive Buyer', 'vp of partnerships': 'Executive Buyer',
  'head of revenue operations': 'Operations Leader', 'director of revenue': 'Budget Holder',
  'chief revenue officer': 'C-Suite / Economic Buyer', 'cro': 'C-Suite / Economic Buyer',
  'sales manager': 'Influencer', 'lead project manager': 'Influencer',
  'senior account executive': 'End User', 'sr. account exec': 'End User',
  'director growth marketing': 'Champion', 'head of partnerships': 'Executive Buyer',
  'head of revops': 'Operations Leader', 'account manager': 'End User',
  'vp of engineering': 'Executive Buyer', 'sr. solutions consultant': 'End User',
  'vp of product': 'Executive Buyer',
}
const CONTACT_TIMES = {
  'Asia/Manila': '9:00 AM – 11:00 AM PHT (Tue–Thu)',
  'America/New_York': '10:00 AM – 12:00 PM EST (Tue–Thu)',
  'America/Chicago': '9:30 AM – 11:30 AM CST (Tue–Thu)',
  'America/Los_Angeles': '10:00 AM – 12:00 PM PST (Tue–Thu)',
  'Asia/Kolkata': '11:00 AM – 1:00 PM IST (Mon–Wed)',
  'Australia/Sydney': '10:00 AM – 12:00 PM AEST (Tue–Thu)',
  'Asia/Jerusalem': '9:00 AM – 11:00 AM IST (Sun–Tue)',
  'America/San_Francisco': '10:00 AM – 12:00 PM PST (Tue–Thu)',
  'Europe/Dublin': '9:00 AM – 11:00 AM GMT (Tue–Thu)',
  'Asia/Singapore': '10:00 AM – 12:00 PM SGT (Tue–Thu)',
  'Europe/Tallinn': '9:00 AM – 11:00 AM EET (Tue–Thu)',
}
const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'America/San_Francisco',
  'Asia/Manila', 'Asia/Kolkata', 'Asia/Singapore', 'Australia/Sydney',
  'Europe/Dublin', 'Europe/Tallinn', 'Asia/Jerusalem',
]
const COUNTRIES = [
  ['US', 'United States'], ['PH', 'Philippines'], ['IN', 'India'], ['AU', 'Australia'],
  ['GB', 'United Kingdom'], ['IE', 'Ireland'], ['IL', 'Israel'], ['SG', 'Singapore'],
  ['EE', 'Estonia'], ['CA', 'Canada'],
]

function cleanLocally(r) {
  const nameParts = (r.name || '').replace(/\b(jr|sr|ii|iii|iv)\b\.?/gi, '').trim()
    .split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
  const cleanName = nameParts.join(' ').trim()
  const emailIsGeneric = ['info@', 'contact@', 'admin@', 'hello@', 'careers@'].some(p => (r.email || '').startsWith(p))
  const cleanEmail = emailIsGeneric
    ? `${cleanName.split(' ')[0].toLowerCase()}@${(r.email || '').split('@')[1]}`
    : (r.email || '')
  const digits = (r.phone || '').replace(/\D/g, '')
  let cleanPhone = r.phone || ''
  if (!r.phone || r.phone.trim() === '') cleanPhone = 'Request on next touchpoint'
  else if (!r.phone.startsWith('+') && digits.length === 10) {
    const pre = r.country === 'PH' ? '+63' : '+1'
    cleanPhone = `${pre} (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  const t = (r.title || '').toLowerCase()
    .replace(/\bvp\b/g, 'Vice President').replace(/\bcro\b/g, 'Chief Revenue Officer')
    .replace(/\bsr\.\s*/g, 'Senior ').replace(/\bexec\b/g, 'Executive')
    .replace(/\brevops\b/g, 'Revenue Operations')
  const cleanTitle = t.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  const cleanCompany = (r.company || '').replace(/\b(inc\.|ltd\.|pty ltd|llc|inc|corp\.)\b/gi, '')
    .replace(/\s+/g, ' ').trim().split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
  return {
    cleaned_name: cleanName, cleaned_email: cleanEmail, cleaned_phone: cleanPhone,
    cleaned_title: cleanTitle, cleaned_company: cleanCompany,
    buyer_persona: PERSONAS[(r.title || '').toLowerCase()] || 'Evaluator',
    best_contact_time: CONTACT_TIMES[r.timezone] || '9:00 AM – 11:00 AM local time (Tue–Thu)',
    issues_found: r.issues || [], issues_fixed: r.issues || [],
  }
}

// ── SVG icons (no emojis) ─────────────────────────────────────────────────────
const Icon = {
  moon: (color = 'currentColor') => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  sun: (color = 'currentColor') => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  upload: (color = 'currentColor') => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  download: (color = 'currentColor') => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  plus: (color = 'currentColor') => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  trash: (color = 'currentColor') => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  ),
  shield: (color = 'currentColor') => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  circle: (color = 'currentColor', size = 8) => (
    <svg width={size} height={size} viewBox="0 0 8 8">
      <circle cx="4" cy="4" r="4" fill={color} />
    </svg>
  ),
  check: (color = 'currentColor') => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  x: (color = 'currentColor') => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  clock: (color = 'currentColor') => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  warning: (color = 'currentColor') => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  sparkle: (color = 'currentColor') => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  ),
  database: (color = 'currentColor') => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  ),
  copy: (color = 'currentColor') => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function DuplicateResolverModal({ groups, onResolve, onCancel, T }) {
  const [selections, setSelections] = useState(() => {
    const initial = {}
    groups.forEach((g, i) => { initial[g.id || i] = g.records[0].id })
    return initial
  })

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 300, backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: T.surface, borderRadius: 16, padding: 28, width: 520, maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        boxShadow: T.shadowLg, animation: 'fadeUp 0.25s ease', border: `1px solid ${T.border}`
      }}>
        <div style={{ paddingBottom: 20, borderBottom: `1px solid ${T.border}` }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: T.accentLight,
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16
          }}>
            {Icon.copy(T.accent)}
          </div>
          <div style={{ fontSize: 19, fontWeight: 700, color: T.text, marginBottom: 6 }}>Duplicate Leads Found</div>
          <div style={{ fontSize: 14, color: T.textSub, lineHeight: 1.6 }}>
            We found {groups.length} groups of duplicate emails.
            Pick which record to <strong>keep & clean</strong>. Others will be <strong>deleted</strong>.
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0' }}>
          {groups.map(group => (
            <div key={group.email} style={{ marginBottom: 20, padding: 16, background: T.surface2, borderRadius: 12, border: `1px solid ${T.border2}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{group.email}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {group.records.map(r => (
                  <label key={r.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10,
                    background: selections[group.id || index] === r.id ? T.accentLight : T.surface,
                    border: `1px solid ${selections[group.id || index] === r.id ? T.accentBorder : T.border2}`, cursor: 'pointer', transition: 'all 0.15s'
                  }}>
                    <input type="radio" name={group.id || index} checked={selections[group.id || index] === r.id}
                      onChange={() => setSelections(s => ({ ...s, [group.id || index]: r.id }))}
                      style={{ width: 18, height: 18, cursor: 'pointer', accentColor: T.accent }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{r.name}</div>
                      <div style={{ fontSize: 12, color: T.textSub }}>{r.title} · {r.company}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, paddingTop: 20, borderTop: `1px solid ${T.border}` }}>
          <button onClick={onCancel}
            style={{
              flex: 1, padding: '12px 0', borderRadius: 9, border: `1px solid ${T.border2}`,
              background: T.surface2, color: T.textSub, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter'
            }}>Cancel</button>
          <button onClick={() => onResolve(selections)}
            style={{
              flex: 1, padding: '12px 0', borderRadius: 9, border: 'none',
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter', boxShadow: `0 4px 12px ${T.accent}33`
            }}>
            Resolve & Clean All
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal: Add Lead ───────────────────────────────────────────────────────────
function AddLeadModal({ onClose, onAdd, saving, T }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', title: '', company: '', timezone: 'America/New_York', country: 'US' })
  const [errors, setErrors] = useState({})
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }
  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    if (!form.title.trim()) e.title = 'Title is required'
    if (!form.company.trim()) e.company = 'Company is required'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email'
    setErrors(e); return Object.keys(e).length === 0
  }

  const inp = (label, key, placeholder, req) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: T.textSub, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}{req && <span style={{ color: T.red, marginLeft: 3 }}>*</span>}
      </div>
      <input value={form[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder}
        style={{
          width: '100%', background: errors[key] ? T.redLight : T.inputBg,
          border: `1px solid ${errors[key] ? T.red : T.border2}`,
          borderRadius: 8, padding: '10px 13px', fontSize: 14, color: T.text,
          fontFamily: 'Inter', outline: 'none'
        }} />
      {errors[key] && <div style={{ fontSize: 12, color: T.red, marginTop: 4 }}>{errors[key]}</div>}
    </div>
  )

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: T.surface, borderRadius: 16, width: 500, maxHeight: '90vh', overflowY: 'auto',
        boxShadow: T.shadowLg, animation: 'fadeUp 0.25s ease', border: `1px solid ${T.border}`
      }}>
        <div style={{
          padding: '22px 26px', borderBottom: `1px solid ${T.border}`,
          background: T.accentLight, borderRadius: '16px 16px 0 0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: T.text }}>Add New Lead</div>
            <div style={{ fontSize: 13, color: T.textSub, marginTop: 3 }}>Saved to Supabase and scanned for issues</div>
          </div>
          <button onClick={onClose} style={{
            border: 'none', background: T.surface3, borderRadius: 8,
            width: 34, height: 34, cursor: 'pointer', color: T.textSub, display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: 20
          }}>×</button>
        </div>
        <div style={{ padding: '22px 26px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div>{inp('Full name', 'name', 'laura claire reyes', true)}</div>
            <div>{inp('Email', 'email', 'info@company.com', true)}</div>
            <div>{inp('Phone', 'phone', '9171234567', false)}</div>
            <div>{inp('Job title', 'title', 'vp sales', true)}</div>
            <div style={{ gridColumn: '1/-1' }}>{inp('Company', 'company', 'techcorp solutions', true)}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            {['Timezone', 'Country'].map((lbl, i) => (
              <div key={lbl} style={{ marginBottom: 16 }}>
                <div style={{
                  fontSize: 12, fontWeight: 600, color: T.textSub, marginBottom: 6,
                  textTransform: 'uppercase', letterSpacing: '0.06em'
                }}>{lbl}</div>
                <select value={i === 0 ? form.timezone : form.country}
                  onChange={e => set(i === 0 ? 'timezone' : 'country', e.target.value)}
                  style={{
                    width: '100%', background: T.inputBg, border: `1px solid ${T.border2}`,
                    borderRadius: 8, padding: '10px 13px', fontSize: 14, color: T.text,
                    fontFamily: 'Inter', outline: 'none'
                  }}>
                  {(i === 0 ? TIMEZONES : COUNTRIES).map(v =>
                    Array.isArray(v)
                      ? <option key={v[0]} value={v[0]}>{v[1]}</option>
                      : <option key={v} value={v}>{v}</option>
                  )}
                </select>
              </div>
            ))}
          </div>
          <div style={{
            padding: 13, borderRadius: 8, background: T.amberLight,
            border: `1px solid ${T.amberBorder}`, marginBottom: 18,
            fontSize: 13, color: T.amber, lineHeight: 1.6
          }}>
            Tip: Enter dirty data intentionally — lowercase names, generic emails like
            <code style={{ background: T.surface3, padding: '0 4px', borderRadius: 4, margin: '0 3px', fontSize: 12 }}>info@company.com</code>
            — to see LeadCheck clean it.
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{
              flex: 1, padding: '11px 0', borderRadius: 8, fontSize: 14, fontWeight: 600,
              border: `1px solid ${T.border2}`, background: T.surface2, color: T.textSub, cursor: 'pointer', fontFamily: 'Inter'
            }}>
              Cancel
            </button>
            <button onClick={() => validate() && onAdd(form)} disabled={saving}
              style={{
                flex: 2, padding: '11px 0', borderRadius: 8, fontSize: 14, fontWeight: 700,
                border: 'none', cursor: saving ? 'default' : 'pointer', fontFamily: 'Inter',
                background: saving ? T.surface3 : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                color: saving ? T.textMuted : '#fff'
              }}>
              {saving ? 'Saving...' : 'Add Lead to CRM'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── IssueBadge ─────────────────────────────────────────────────────────────────
function IssueBadge({ type, dark }) {
  const cfg = ISSUE_LABELS[type] || { label: type, color: '#64748b', darkColor: '#94a3b8' }
  const c = dark ? cfg.darkColor : cfg.color
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
      background: `${c}1a`, color: c, border: `1px solid ${c}33`, whiteSpace: 'nowrap'
    }}>
      {cfg.label}
    </span>
  )
}

// ── StatCard ───────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, gradient, T, svgIcon }) {
  return (
    <div style={{
      background: T.surface, borderRadius: 14, padding: '18px 22px',
      boxShadow: T.shadow, border: `1px solid ${T.border}`, position: 'relative', overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 90, height: 90,
        background: gradient, borderRadius: '0 14px 0 90px', opacity: T.isDark ? 0.18 : 0.1
      }} />
      <div style={{ marginBottom: 6, opacity: 0.7 }}>{svgIcon}</div>
      <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: T.text, marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.textSub }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

// ── DiffRow ────────────────────────────────────────────────────────────────────
function DiffRow({ label, before, after, changed, T }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '90px 1fr 22px 1fr', gap: 8,
      alignItems: 'center', padding: '9px 0', borderBottom: `1px solid ${T.border}`
    }}>
      <span style={{ fontSize: 12, color: T.textSub, fontWeight: 500 }}>{label}</span>
      <span style={{
        fontSize: 12, padding: '5px 9px', borderRadius: 6, fontFamily: 'monospace',
        background: changed ? T.redLight : T.surface2, color: changed ? T.red : T.textMuted,
        textDecoration: changed ? 'line-through' : 'none', wordBreak: 'break-all'
      }}>{before || '—'}</span>
      <span style={{ textAlign: 'center', color: changed ? T.green : T.textMuted, fontSize: 15, fontWeight: 700 }}>
        {changed ? '→' : '·'}
      </span>
      <span style={{
        fontSize: 12, padding: '5px 9px', borderRadius: 6, fontFamily: 'monospace',
        background: changed ? T.greenLight : T.surface2, color: changed ? T.green : T.textMuted,
        fontWeight: changed ? 600 : 400, wordBreak: 'break-all'
      }}>{after || '—'}</span>
    </div>
  )
}

// ── RecordRow ──────────────────────────────────────────────────────────────────
function RecordRow({ record, index, onPreview, onApprove, onReject, onDelete, selected, T }) {
  const c = record._cleaned || null
  const isApproved = record.status === 'approved'
  const displayName = c && isApproved ? c.cleaned_name : record.name
  const displayEmail = c && isApproved ? c.cleaned_email : record.email
  const displayTitle = c && isApproved ? c.cleaned_title : record.title
  const displayCompany = c && isApproved ? c.cleaned_company : record.company

  const fixedPill = (orig, cleaned) => orig !== cleaned && (
    <span style={{
      fontSize: 10, fontWeight: 700, color: T.green, background: T.greenLight,
      padding: '1px 6px', borderRadius: 10, border: `1px solid ${T.greenBorder}`, flexShrink: 0
    }}>fixed</span>
  )

  return (
    <div onClick={() => onPreview(record)} style={{
      display: 'grid', gridTemplateColumns: '44px 0.8fr 0.6fr 110px 80px 245px',
      gap: 12, alignItems: 'center', padding: '10px 18px', cursor: 'pointer',
      background: selected ? T.accentLight : T.surface,
      borderBottom: `1px solid ${T.border}`,
      borderLeft: `3px solid ${selected ? T.accent : isApproved ? T.green : record.status === 'rejected' ? T.red : 'transparent'}`,
      animation: 'fadeUp 0.3s ease both', animationDelay: `${index * 0.04}s`, transition: 'background 0.15s'
    }}>

      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: isApproved ? `linear-gradient(135deg,${T.green},#059669)` : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700, color: '#fff'
      }}>
        {(displayName || '?').charAt(0).toUpperCase()}
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{
          fontWeight: 600, fontSize: 13, color: T.text, display: 'flex', alignItems: 'center', gap: 6,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
        }}>
          {displayName} {isApproved && c && fixedPill(record.name, c.cleaned_name)}
        </div>
        <div style={{
          fontSize: 12, color: T.textSub, display: 'flex', alignItems: 'center', gap: 5, marginTop: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
        }}>
          {displayEmail}
        </div>
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, color: T.text, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayTitle}
        </div>
        <div style={{ fontSize: 11, color: T.textSub, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayCompany}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {isApproved
          ? <span style={{
            fontSize: 12, fontWeight: 600, color: T.green, background: T.greenLight,
            padding: '3px 10px', borderRadius: 20, border: `1px solid ${T.greenBorder}`
          }}>
            {(record.issues || []).length} resolved
          </span>
          : (record.issues || []).slice(0, 2).map(i => <IssueBadge key={i} type={i} dark={T.isDark} />)
        }
        {!isApproved && (record.issues || []).length > 2 &&
          <span style={{ fontSize: 12, color: T.textMuted, alignSelf: 'center' }}>+{record.issues.length - 2}</span>}
      </div>

      <div>
        {isApproved && (
          <span style={{
            fontSize: 12, fontWeight: 600, color: T.green, background: T.greenLight,
            padding: '4px 12px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 5
          }}>
            {Icon.check(T.green)} Cleaned
          </span>
        )}
        {record.status === 'rejected' && (
          <span style={{
            fontSize: 12, fontWeight: 600, color: T.red, background: T.redLight,
            padding: '4px 12px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 5
          }}>
            {Icon.x(T.red)} Skipped
          </span>
        )}
        {record.status === 'pending' && (
          <span style={{
            fontSize: 12, fontWeight: 600, color: T.amber, background: T.amberLight,
            padding: '4px 12px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 5
          }}>
            {Icon.clock(T.amber)} Pending
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 4, alignItems: 'center', justifySelf: 'end' }}>
        {record.status === 'pending' && <>
          <button onClick={e => { e.stopPropagation(); onApprove(record) }}
            style={{
              padding: '5px 10px', borderRadius: 7, border: 'none', fontSize: 11, fontWeight: 600,
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff',
              cursor: 'pointer', fontFamily: 'Inter', display: 'flex', alignItems: 'center', gap: 4
            }}>
            {Icon.sparkle('#fff')} Clean
          </button>
          <button onClick={e => { e.stopPropagation(); onReject(record.id) }}
            style={{
              padding: '5px 8px', borderRadius: 7, border: `1px solid ${T.border2}`,
              fontSize: 11, fontWeight: 600, background: T.surface2, color: T.textSub,
              cursor: 'pointer', fontFamily: 'Inter'
            }}>
            Skip
          </button>
        </>}
        <button onClick={e => { e.stopPropagation(); onDelete(record) }}
          style={{
            padding: '5px 10px', borderRadius: 7, border: `1px solid ${T.redBorder}`,
            background: T.redLight, color: T.red, cursor: 'pointer', fontSize: 11, fontWeight: 700,
            fontFamily: 'Inter'
          }}>
          Delete lead
        </button>
      </div>
    </div>
  )
}

// ── PreviewPanel ───────────────────────────────────────────────────────────────
function PreviewPanel({ record, onClose, onApprove, onReject, saving, T }) {
  if (!record) return null
  const c = record._cleaned || cleanLocally(record)
  return (
    <div style={{
      width: 420, background: T.surface, borderLeft: `1px solid ${T.border}`,
      display: 'flex', flexDirection: 'column', animation: 'slideIn 0.25s ease', flexShrink: 0
    }}>
      <div style={{ padding: '22px 26px', borderBottom: `1px solid ${T.border}`, background: T.accentLight }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{
            fontSize: 12, fontWeight: 700, color: T.accent, letterSpacing: '0.07em',
            textTransform: 'uppercase'
          }}>
            {record._cleaned ? 'AI Cleaned Preview' : 'Local Preview'}
          </div>
          <button onClick={onClose} style={{
            border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 22, color: T.textMuted, lineHeight: 1
          }}>×</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 700, color: '#fff'
          }}>
            {(c.cleaned_name || '?').charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: T.text }}>{c.cleaned_name}</div>
            <div style={{ fontSize: 13, color: T.textSub, marginTop: 2 }}>{c.cleaned_title}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '22px 26px', flex: 1, overflowY: 'auto' }}>
        <div style={{
          fontSize: 12, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase',
          letterSpacing: '0.08em', marginBottom: 14
        }}>Field Changes</div>
        <DiffRow T={T} label="Name" before={record.name} after={c.cleaned_name} changed={record.name !== c.cleaned_name} />
        <DiffRow T={T} label="Email" before={record.email} after={c.cleaned_email} changed={record.email !== c.cleaned_email} />
        <DiffRow T={T} label="Phone" before={record.phone || '—'} after={c.cleaned_phone} changed={(record.phone || '') !== c.cleaned_phone} />
        <DiffRow T={T} label="Title" before={record.title} after={c.cleaned_title} changed={record.title !== c.cleaned_title} />
        <DiffRow T={T} label="Company" before={record.company} after={c.cleaned_company} changed={record.company !== c.cleaned_company} />

        <div style={{ marginTop: 18, padding: 16, borderRadius: 12, background: T.accentLight, border: `1px solid ${T.accentBorder}` }}>
          <div style={{
            fontSize: 12, fontWeight: 700, color: T.accent, marginBottom: 12,
            textTransform: 'uppercase', letterSpacing: '0.07em'
          }}>AI Enrichment</div>
          {[
            ['Buyer Persona', c.buyer_persona],
            ['Best Time to Contact', c.best_contact_time],
            ['Timezone', record.timezone],
          ].map(([k, v]) => (
            <div key={k} style={{ marginBottom: 10 }}>
              <div style={{
                fontSize: 11, color: T.textMuted, fontWeight: 600, marginBottom: 3,
                textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>{k}</div>
              <div style={{ fontSize: 14, color: T.text, fontWeight: 500 }}>{v}</div>
            </div>
          ))}
        </div>

        {(record.issues || []).length > 0 && (
          <div style={{ marginTop: 14, padding: 14, borderRadius: 10, background: T.amberLight, border: `1px solid ${T.amberBorder}` }}>
            <div style={{
              fontSize: 12, fontWeight: 700, color: T.amber, marginBottom: 8,
              display: 'flex', alignItems: 'center', gap: 6
            }}>
              {Icon.warning(T.amber)} Issues Detected
            </div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {(record.issues || []).map(i => <IssueBadge key={i} type={i} dark={T.isDark} />)}
            </div>
          </div>
        )}
      </div>

      {record.status === 'pending' && (
        <div style={{ padding: '18px 26px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 10 }}>
          <button onClick={() => onApprove(record)} disabled={saving}
            style={{
              flex: 1, padding: '12px 0', borderRadius: 9, border: 'none',
              background: saving ? T.surface3 : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              color: saving ? T.textMuted : '#fff', fontSize: 14, fontWeight: 700,
              cursor: saving ? 'default' : 'pointer', fontFamily: 'Inter',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
            }}>
            {saving ? 'Cleaning...' : <>{Icon.sparkle('#fff')} Clean with AI</>}
          </button>
          <button onClick={() => onReject(record.id)}
            style={{
              flex: 1, padding: '12px 0', borderRadius: 9, border: `1px solid ${T.border2}`,
              background: T.surface2, color: T.textSub, fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'Inter'
            }}>Skip</button>
        </div>
      )}
    </div>
  )
}

// ── Main App ───────────────────────────────────────────────────────────────────
export default function App() {
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  const T = dark ? DARK : LIGHT

  const [records, setRecords] = useState([])
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [backendOnline, setBackendOnline] = useState(null)
  const [toast, setToast] = useState(null)
  const [stagedCount, setStagedCount] = useState(0)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addingLead, setAddingLead] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [cleaningStatus, setCleaningStatus] = useState(null)
  const [duplicatesToResolve, setDuplicatesToResolve] = useState(null)
  const fileInputRef = useRef(null)

  // sync body background with theme
  useEffect(() => {
    document.body.style.background = T.bg
    document.body.style.color = T.text
  }, [dark])

  useEffect(() => {
    fetch(`${API}/health`).then(r => r.json()).then(() => setBackendOnline(true)).catch(() => setBackendOnline(false))
  }, [])

  useEffect(() => {
    if (backendOnline) loadRecords()
  }, [backendOnline])

  async function loadRecords() {
    try {
      const [dirtyRes, stagedRes] = await Promise.all([
        fetch(`${API}/dirty-records`),
        fetch(`${API}/staged`)
      ])
      const dirtyData = await dirtyRes.json()
      const stagedData = await stagedRes.json()
      setStagedCount(stagedData.count || 0)

      let loaded = (dirtyData.records || []).map(r => ({ ...r, issues: r.issues || [], status: 'pending', _cleaned: null }))

      if (stagedData.records?.length) {
        loaded = loaded.map(r => {
          const saved = stagedData.records.find(s => s.original_id === r.id)
          if (!saved) return r
          const cd = saved.cleaned_data || {}, aft = cd.after || {}
          return {
            ...r, status: 'approved', _cleaned: {
              cleaned_name: aft.name || cd.cleaned_name || r.name,
              cleaned_email: aft.email || cd.cleaned_email || r.email,
              cleaned_phone: aft.phone || cd.cleaned_phone || r.phone,
              cleaned_title: aft.title || cd.cleaned_title || r.title,
              cleaned_company: aft.company || cd.cleaned_company || r.company,
              buyer_persona: cd.buyer_persona || 'Evaluator',
              best_contact_time: cd.best_contact_time || '',
              issues_fixed: cd.issues_fixed || r.issues,
            }
          }
        })
      }
      setRecords(loaded)
    } catch (err) { showToast('Could not load records', 'error') }
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type }); setTimeout(() => setToast(null), 4000)
  }

  async function handleFileChange(e) {
    const file = e.target.files[0]; if (!file) return
    if (!backendOnline) { showToast('Backend offline', 'error'); return }
    setImporting(true); showToast('Uploading CSV...', 'info')
    const fd = new FormData(); fd.append('file', file)
    try {
      const res = await fetch(`${API}/import-csv`, { method: 'POST', body: fd })
      if (!res.ok) throw new Error((await res.json()).detail || 'Import failed')
      const data = await res.json()
      showToast(`Imported ${data.imported_count} records`)
      await loadRecords()
    } catch (err) {
      showToast('Import failed: ' + err.message, 'error')
    } finally { setImporting(false); if (fileInputRef.current) fileInputRef.current.value = '' }
  }

  async function auditWithAI(recs) {
    if (!backendOnline) return {}
    const res = await fetch(`${API}/audit`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        records: recs.map(r => ({
          id: r.id, name: r.name, email: r.email, phone: r.phone || '',
          title: r.title, company: r.company,
          timezone: r.timezone || 'America/New_York', country: r.country || 'US'
        }))
      })
    })
    if (!res.ok) throw new Error(`AI audit failed: ${res.status}`)
    const results = await res.json()
    const map = {}; results.forEach(r => { map[r.original_id] = r }); return map
  }

  async function approve(record) {
    setSaving(true)
    setCleaningStatus({ label: `Cleaning ${record.name} with Groq AI...`, current: 1, total: 1, step: 'auditing' })
    try {
      let cleaned = record._cleaned
      if (!cleaned && backendOnline) {
        const aiMap = await auditWithAI([record])
        cleaned = aiMap[record.id] || null
        if (cleaned) setRecords(prev => prev.map(r => r.id === record.id ? { ...r, _cleaned: cleaned, issues: cleaned.issues_found } : r))
      }
      const c = cleaned || cleanLocally(record)
      setCleaningStatus({ label: `Saving ${c.cleaned_name} to Supabase...`, current: 1, total: 1, step: 'saving' })
      if (backendOnline) {
        const res = await fetch(`${API}/confirm-update`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            record_id: record.id, cleaned: {
              before: { name: record.name, email: record.email, phone: record.phone, title: record.title, company: record.company },
              after: { name: c.cleaned_name, email: c.cleaned_email, phone: c.cleaned_phone, title: c.cleaned_title, company: c.cleaned_company },
              buyer_persona: c.buyer_persona, best_contact_time: c.best_contact_time,
              issues_fixed: c.issues_fixed || c.issues_found || record.issues
            }
          })
        })
        if (!res.ok) { const err = await res.json(); throw new Error(err.detail || 'Save failed') }
        setStagedCount(n => n + 1)
      }
      setRecords(prev => prev.map(r => r.id === record.id ? { ...r, status: 'approved', _cleaned: c } : r))
      const next = records.find(r => r.id !== record.id && r.status === 'pending')
      setSelected(next || null)
      showToast(`${c.cleaned_name} cleaned and saved`)
    } catch (err) {
      showToast('Failed: ' + err.message, 'error')
    } finally { setSaving(false); setCleaningStatus(null) }
  }

  async function approveAll() {
    const pendingRecs = records.filter(r => r.status === 'pending'); if (!pendingRecs.length) return

    const byEmail = {}
    const byIdentity = {}

    pendingRecs.forEach(r => {
      const em = r.email?.trim().toLowerCase()
      if (em) {
        if (!byEmail[em]) byEmail[em] = []
        byEmail[em].push(r)
      }
      const iden = `${(r.name || '').trim().toLowerCase()}|${(r.company || '').trim().toLowerCase()}`
      if (!byIdentity[iden]) byIdentity[iden] = []
      byIdentity[iden].push(r)
    })

    const adj = {}
    pendingRecs.forEach(r => adj[r.id] = new Set())

    const link = (arr) => {
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          adj[arr[i].id].add(arr[j].id)
          adj[arr[j].id].add(arr[i].id)
        }
      }
    }

    Object.values(byEmail).forEach(link)
    Object.values(byIdentity).forEach(link)

    const visited = new Set()
    const groups = []

    pendingRecs.forEach(r => {
      if (!visited.has(r.id) && adj[r.id].size > 0) {
        const cluster = []
        const q = [r.id]
        visited.add(r.id)
        while (q.length > 0) {
          const cid = q.shift()
          cluster.push(pendingRecs.find(pr => pr.id === cid))
          adj[cid].forEach(neigh => {
            if (!visited.has(neigh)) {
              visited.add(neigh)
              q.push(neigh)
            }
          })
        }
        if (cluster.length > 1) {
          const emails = cluster.map(cr => cr.email?.trim().toLowerCase()).filter(Boolean)
          const hasEmailMatch = new Set(emails).size < emails.length
          const idens = cluster.map(cr => `${(cr.name || '').trim().toLowerCase()}|${(cr.company || '').trim().toLowerCase()}`)
          const hasIdenMatch = new Set(idens).size < idens.length

          let title = "Possible Duplicate"
          if (hasEmailMatch && hasIdenMatch) title = "Email & Identity Match"
          else if (hasEmailMatch) title = `Shared Email: ${emails[0]}`
          else title = "Shared Name & Company"

          groups.push({ email: title, records: cluster, id: r.id })
        }
      }
    })

    if (groups.length > 0) {
      setDuplicatesToResolve(groups)
    } else {
      processCleanAll(pendingRecs)
    }
  }

  async function handleResolveDuplicates(selections) {
    const pendingRecs = records.filter(r => r.status === 'pending')
    const keepIds = new Set(Object.values(selections))
    const groupRecordIds = new Set(duplicatesToResolve.flatMap(g => g.records.map(r => r.id)))

    const toKeep = []
    const toDelete = []

    pendingRecs.forEach(r => {
      if (groupRecordIds.has(r.id)) {
        if (keepIds.has(r.id)) toKeep.push(r)
        else toDelete.push(r)
      } else {
        toKeep.push(r)
      }
    })

    setDuplicatesToResolve(null)
    setSaving(true)

    if (toDelete.length > 0 && backendOnline) {
      setCleaningStatus({ label: `Removing ${toDelete.length} duplicates...`, current: 0, total: toDelete.length, step: 'saving' })
      try {
        await Promise.all(toDelete.map(r => fetch(`${API}/delete-record/${r.id}`, { method: 'DELETE' })))
      } catch (e) { console.error("Batch delete failed", e) }
    }

    setRecords(prev => prev.filter(r => !toDelete.find(d => d.id === r.id)))
    processCleanAll(toKeep)
  }

  async function processCleanAll(pendingRecs) {
    if (!pendingRecs.length) { setSaving(false); return }
    setSaving(true)
    setCleaningStatus({ label: `Sending ${pendingRecs.length} records to Groq AI...`, current: 0, total: pendingRecs.length, step: 'auditing' })

    let aiMap = {}
    if (backendOnline) {
      try {
        aiMap = await auditWithAI(pendingRecs)
        setRecords(prev => prev.map(r => { const ai = aiMap[r.id]; return ai ? { ...r, _cleaned: ai, issues: ai.issues_found } : r }))
      } catch (err) { showToast('AI audit failed — using local cleaning', 'warn') }
    }

    let savedCount = 0
    for (let i = 0; i < pendingRecs.length; i++) {
      const record = pendingRecs[i], c = aiMap[record.id] || cleanLocally(record)
      setCleaningStatus({ label: `Saving ${c.cleaned_name || record.name}...`, current: i + 1, total: pendingRecs.length, step: 'saving' })
      try {
        if (backendOnline) {
          const res = await fetch(`${API}/confirm-update`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              record_id: record.id, cleaned: {
                before: { name: record.name, email: record.email, phone: record.phone, title: record.title, company: record.company },
                after: { name: c.cleaned_name, email: c.cleaned_email, phone: c.cleaned_phone, title: c.cleaned_title, company: c.cleaned_company },
                buyer_persona: c.buyer_persona, best_contact_time: c.best_contact_time,
                issues_fixed: c.issues_fixed || c.issues_found || record.issues
              }
            })
          })
          if (res.ok) savedCount++
        }
      } catch (err) { console.error(err) }
    }
    setRecords(prev => prev.map(r => {
      const isPending = pendingRecs.find(p => p.id === r.id)
      if (!isPending) return r;
      const c = aiMap[r.id] || cleanLocally(r);
      return { ...r, status: 'approved', _cleaned: c }
    }))
    setStagedCount(n => n + savedCount); setSaving(false); setSelected(null); setCleaningStatus(null)
    showToast(`${savedCount}/${pendingRecs.length} records cleaned and saved`)
  }

  function reject(id) {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r))
    setSelected(records.find(r => r.id !== id && r.status === 'pending') || null)
  }

  async function addLead(form) {
    setAddingLead(true)
    try {
      if (backendOnline) {
        const csv = ['name,email,phone,title,company,timezone,country',
          `${form.name},${form.email},${form.phone},${form.title},${form.company},${form.timezone},${form.country}`].join('\n')
        const fd = new FormData(); fd.append('file', new File([csv], 'single_lead.csv', { type: 'text/csv' }))
        const res = await fetch(`${API}/import-csv`, { method: 'POST', body: fd })
        if (!res.ok) throw new Error('Failed to save lead')
        const data = await res.json(); const nr = data.records[0]
        setRecords(prev => [{ ...nr, issues: nr.issues || [], status: 'pending', _cleaned: null }, ...prev])
        showToast(`${form.name} added to Supabase`)
      } else {
        const tempId = Date.now()
        const issues = []; if (!form.phone) issues.push('phone_missing')
        setRecords(prev => [{ id: tempId, ...form, issues, status: 'pending', _cleaned: null }, ...prev])
        showToast('Added locally (backend offline)', 'warn')
      }
      setShowAddModal(false)
    } catch (err) {
      showToast('Failed: ' + err.message, 'error')
    } finally { setAddingLead(false) }
  }

  async function deleteLead(record) {
    try {
      if (backendOnline) {
        await fetch(`${API}/delete-record/${record.id}`, { method: 'DELETE' })
        if (record.status === 'approved') { await fetch(`${API}/delete-staged/${record.id}`, { method: 'DELETE' }); setStagedCount(n => Math.max(0, n - 1)) }
      }
      setRecords(prev => prev.filter(r => r.id !== record.id))
      if (selected?.id === record.id) setSelected(null)
      setDeleteConfirm(null); showToast(`${record.name} deleted`)
    } catch (err) {
      setRecords(prev => prev.filter(r => r.id !== record.id))
      if (selected?.id === record.id) setSelected(null)
      setDeleteConfirm(null); showToast('Removed from view', 'warn')
    }
  }

  async function exportCsv() {
    if (!backendOnline) { showToast('Backend offline', 'error'); return }
    setExporting(true)
    try {
      const res = await fetch(`${API}/export-csv`); if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob(); const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url
      a.download = `LeadCheck_cleaned_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
      showToast('Cleaned CSV downloaded')
    } catch (err) {
      showToast('Export failed: ' + err.message, 'error')
    } finally { setExporting(false) }
  }

  const approved = records.filter(r => r.status === 'approved')
  const pending = records.filter(r => r.status === 'pending')
  const rejected = records.filter(r => r.status === 'rejected')
  const totalIssues = records.reduce((a, r) => a + (r.issues || []).length, 0)
  const fixedIssues = approved.reduce((a, r) => a + (r.issues || []).length, 0)
  const cleanScore = records.length ? Math.round((approved.length / records.length) * 100) : 0
  const filtered = records.filter(r => {
    const mf = filter === 'all' || r.status === filter
    const ms = search === '' || (r.name || '').toLowerCase().includes(search.toLowerCase()) || (r.company || '').toLowerCase().includes(search.toLowerCase())
    return mf && ms
  })

  const btnStyle = (gradient, disabled) => ({
    padding: '9px 16px', borderRadius: 8, border: 'none',
    background: disabled ? T.surface3 : gradient, color: disabled ? T.textMuted : '#fff',
    fontSize: 13, fontWeight: 600, cursor: disabled ? 'default' : 'pointer',
    display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap',
    fontFamily: 'Inter', transition: 'opacity 0.15s', flexShrink: 0
  })

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column', fontFamily: 'Inter,sans-serif', color: T.text, transition: 'background 0.2s,color 0.2s' }}>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} style={{ display: 'none' }} />

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 999, padding: '14px 20px',
          borderRadius: 12, fontWeight: 600, fontSize: 14, animation: 'fadeUp 0.3s ease',
          background: toast.type === 'error' ? T.redLight : toast.type === 'warn' ? T.amberLight : toast.type === 'info' ? T.accentLight : T.greenLight,
          color: toast.type === 'error' ? T.red : toast.type === 'warn' ? T.amber : toast.type === 'info' ? T.accent : T.green,
          border: `1px solid ${toast.type === 'error' ? T.redBorder : toast.type === 'warn' ? T.amberBorder : toast.type === 'info' ? T.accentBorder : T.greenBorder}`,
          boxShadow: T.shadowMd, maxWidth: 400
        }}>
          {toast.msg}
        </div>
      )}

      {/* Duplicate Resolver Modal */}
      {duplicatesToResolve && (
        <DuplicateResolverModal
          T={T}
          groups={duplicatesToResolve}
          onCancel={() => setDuplicatesToResolve(null)}
          onResolve={handleResolveDuplicates}
        />
      )}

      {/* Add Lead Modal */}
      {showAddModal && <AddLeadModal T={T} onClose={() => setShowAddModal(false)} onAdd={addLead} saving={addingLead} />}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: T.surface, borderRadius: 16, padding: 30, width: 400,
            boxShadow: T.shadowLg, animation: 'fadeUp 0.2s ease', border: `1px solid ${T.border}`
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: T.redLight,
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16
            }}>
              {Icon.trash(T.red)}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 8 }}>Delete this lead?</div>
            <div style={{ fontSize: 14, color: T.textSub, marginBottom: 6, lineHeight: 1.6 }}>
              You're about to delete <strong style={{ color: T.text }}>{deleteConfirm.name}</strong> from {deleteConfirm.company}.
            </div>
            <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 24 }}>
              This removes the record from Supabase and cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{
                flex: 1, padding: '11px 0', borderRadius: 9,
                fontSize: 14, fontWeight: 600, border: `1px solid ${T.border2}`, background: T.surface2,
                color: T.textSub, cursor: 'pointer', fontFamily: 'Inter'
              }}>Cancel</button>
              <button onClick={() => deleteLead(deleteConfirm)} style={{
                flex: 1, padding: '11px 0', borderRadius: 9,
                fontSize: 14, fontWeight: 700, border: 'none',
                background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff',
                cursor: 'pointer', fontFamily: 'Inter'
              }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{
        background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '0 32px',
        height: 64, display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 100,
        boxShadow: T.shadow
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {Icon.shield('#fff')}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.03em', color: T.text, lineHeight: 1 }}>LeadCheck</div>
            <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 500, letterSpacing: '0.04em' }}>CRM HYGIENE ENGINE</div>
          </div>
        </div>

        {/* Backend status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, background: T.surface2,
          borderRadius: 20, padding: '6px 13px 6px 9px', border: `1px solid ${T.border}`
        }}>
          {Icon.circle(backendOnline === null ? T.amber : backendOnline ? T.green : T.red, 8)}
          <span style={{ fontSize: 12, fontWeight: 500, color: T.textSub }}>
            {backendOnline === null ? 'Checking...'
              : backendOnline ? `Backend online · ${stagedCount} staged`
                : 'Backend offline — local mode'}
          </span>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search records..."
            style={{
              background: T.inputBg, border: `1px solid ${T.border2}`, borderRadius: 9,
              padding: '8px 14px', fontSize: 13, color: T.text, outline: 'none', width: 200, fontFamily: 'Inter'
            }} />

          {/* Dark mode toggle */}
          <button onClick={() => setDark(d => !d)}
            style={{
              width: 38, height: 38, borderRadius: 9, border: `1px solid ${T.border2}`,
              background: T.surface2, cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: T.textSub, flexShrink: 0
            }}>
            {dark ? Icon.sun(T.textSub) : Icon.moon(T.textSub)}
          </button>

          <button onClick={() => setShowAddModal(true)}
            style={btnStyle('linear-gradient(135deg,#f59e0b,#d97706)', false)}>
            {Icon.plus('#fff')} Add Lead
          </button>
          <button onClick={() => fileInputRef.current?.click()} disabled={importing || !backendOnline}
            style={btnStyle('linear-gradient(135deg,#6366f1,#8b5cf6)', importing || !backendOnline)}>
            {importing ? <><div className="spinner" />Importing...</>
              : <>{Icon.upload('#fff')} Import CSV</>}
          </button>
          <button onClick={exportCsv} disabled={exporting || stagedCount === 0 || !backendOnline}
            style={btnStyle('linear-gradient(135deg,#10b981,#059669)', exporting || stagedCount === 0 || !backendOnline)}>
            {exporting ? <><div className="spinner" />Exporting...</>
              : <>{Icon.download('#fff')} Export CSV ({stagedCount})</>}
          </button>
        </div>
      </header>

      {/* Empty state */}
      {records.length === 0 && !importing && (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 18, padding: '80px 0'
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {Icon.database('#fff')}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: T.text }}>No records yet</div>
          <div style={{ fontSize: 15, color: T.textSub, maxWidth: 340, textAlign: 'center', lineHeight: 1.7 }}>
            Import a CSV file to get started. Records are saved to Supabase as dirty data, then cleaned with AI.
          </div>
          <button onClick={() => fileInputRef.current?.click()} disabled={!backendOnline}
            style={{ ...btnStyle('linear-gradient(135deg,#6366f1,#8b5cf6)', !backendOnline), padding: '13px 28px', fontSize: 15 }}>
            {Icon.upload('#fff')} Import your first CSV
          </button>
          <div style={{ fontSize: 13, color: T.textMuted }}>
            Use <code style={{ background: T.codeBg, padding: '2px 6px', borderRadius: 5 }}>sample_dirty_crm.csv</code> to test
          </div>
        </div>
      )}

      {records.length > 0 && <>
        {/* Stat cards */}
        <div style={{ padding: '20px 24px 0', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          <StatCard T={T} label="Total Records" value={records.length} sub={`${pending.length} pending`} gradient="linear-gradient(135deg,#6366f1,#8b5cf6)" svgIcon={Icon.database(T.accent)} />
          <StatCard T={T} label="Issues Found" value={totalIssues} sub={`${records.length} records flagged`} gradient="linear-gradient(135deg,#ef4444,#dc2626)" svgIcon={Icon.warning(T.red)} />
          <StatCard T={T} label="Cleaned" value={approved.length} sub={`${fixedIssues} issues resolved`} gradient="linear-gradient(135deg,#10b981,#059669)" svgIcon={Icon.check(T.green)} />
          <StatCard T={T} label="Saved to DB" value={stagedCount} sub="rows in crm_staging" gradient="linear-gradient(135deg,#f59e0b,#d97706)" svgIcon={Icon.database(T.amber)} />
        </div>

        {/* Cleaning notification bar */}
        {cleaningStatus && (
          <div style={{ padding: '14px 24px 0' }}>
            <div style={{
              background: T.accentLight, border: `1px solid ${T.accentBorder}`,
              borderRadius: 12, padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 16
            }}>
              <div className="spinner" style={{ width: 20, height: 20, borderColor: `${T.accent}30`, borderTopColor: T.accent, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.accent, marginBottom: 4 }}>
                  {cleaningStatus.step === 'auditing' ? 'AI Cleaning in progress...' : 'Saving to Supabase...'}
                </div>
                <div style={{ fontSize: 13, color: T.accent, opacity: 0.8, marginBottom: cleaningStatus.total > 1 ? 6 : 0 }}>
                  {cleaningStatus.label}
                </div>
                {cleaningStatus.total > 1 && (
                  <>
                    <div style={{ height: 4, background: `${T.accent}20`, borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{
                        height: 4, borderRadius: 2, background: `linear-gradient(90deg,#6366f1,#8b5cf6)`,
                        width: `${(cleaningStatus.current / cleaningStatus.total) * 100}%`, transition: 'width 0.4s ease'
                      }} />
                    </div>
                    <div style={{ fontSize: 12, color: T.accent, opacity: 0.7, marginTop: 4 }}>
                      {cleaningStatus.current} of {cleaningStatus.total} records
                    </div>
                  </>
                )}
              </div>
              <div style={{ fontSize: 12, color: T.textMuted, flexShrink: 0 }}>
                {cleaningStatus.step === 'auditing' ? 'Groq · Llama 3-70B' : 'crm_staging'}
              </div>
            </div>
          </div>
        )}

        {/* Health bar */}
        <div style={{ padding: '12px 24px 0' }}>
          <div style={{
            background: T.surface, borderRadius: 12, padding: '10px 16px',
            border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 12
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.textSub, whiteSpace: 'nowrap' }}>Data Health</span>
            <div style={{ flex: 1, height: 6, background: T.surface3, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: 6, width: `${cleanScore}%`, borderRadius: 3,
                background: 'linear-gradient(90deg,#6366f1,#10b981)', transition: 'width 0.8s ease'
              }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 800, color: T.text, whiteSpace: 'nowrap' }}>{cleanScore}% Clean</span>
            {pending.length > 0 && (
              <button onClick={approveAll} disabled={saving}
                style={btnStyle('linear-gradient(135deg,#6366f1,#8b5cf6)', saving)}>
                {saving ? <><div className="spinner" />Cleaning...</>
                  : <>{Icon.sparkle('#fff')} Clean All with AI ({pending.length})</>}
              </button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ padding: '12px 24px 0', display: 'flex', gap: 8, alignItems: 'center' }}>
          {[['all', 'All'], ['pending', 'Pending'], ['approved', 'Cleaned'], ['rejected', 'Skipped']].map(([val, lbl]) => (
            <button key={val} onClick={() => setFilter(val)}
              style={{
                padding: '6px 14px', borderRadius: 20, border: 'none',
                background: filter === val ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : T.surface,
                color: filter === val ? '#fff' : T.textSub, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'Inter', transition: 'all 0.15s',
                boxShadow: filter === val ? `0 2px 8px ${T.accent}44` : T.shadow
              }}>
              {lbl} <span style={{ opacity: 0.7 }}>
                ({val === 'all' ? records.length : val === 'pending' ? pending.length : val === 'approved' ? approved.length : rejected.length})
              </span>
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 13, color: T.textMuted }}>{filtered.length} records</span>
        </div>

        {/* Table + Preview */}
        <div style={{
          display: 'flex', flex: 1, margin: '12px 24px 24px', background: T.surface,
          borderRadius: 16, border: `1px solid ${T.border}`, overflow: 'hidden', boxShadow: T.shadowMd
        }}>
          <div style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
            {/* Table header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '44px 0.8fr 0.6fr 110px 80px 245px',
              gap: 12, padding: '10px 18px', borderBottom: `1px solid ${T.border}`,
              background: T.surface2, position: 'sticky', top: 0, zIndex: 10
            }}>
              {['', 'Lead', 'Role / Company', 'Issues', 'Status', 'Actions'].map((h, i) => (
                <span key={i} style={{
                  fontSize: 10, fontWeight: 700, color: T.textMuted,
                  textTransform: 'uppercase', letterSpacing: '0.06em'
                }}>{h}</span>
              ))}
            </div>
            {filtered.length === 0
              ? <div style={{ padding: '60px 0', textAlign: 'center', color: T.textMuted, fontSize: 15 }}>
                No records match this filter.
              </div>
              : filtered.map((r, i) => (
                <RecordRow key={r.id} record={r} index={i} T={T}
                  selected={selected?.id === r.id}
                  onPreview={setSelected} onApprove={approve} onReject={reject}
                  onDelete={r => setDeleteConfirm(r)} />
              ))
            }
          </div>
          <PreviewPanel T={T} record={selected} onClose={() => setSelected(null)}
            onApprove={approve} onReject={reject} saving={saving} />
        </div>
      </>}
    </div>
  )
}