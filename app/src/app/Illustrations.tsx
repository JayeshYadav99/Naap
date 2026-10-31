// Flat illustrations and avatars for the landing page. Colours come from theme tokens so they work in light and dark.

const SKIN = '#C98B5E'
const SKIN2 = '#E0A97C'
const HAIR = '#2B2118'

export function TailorAvatar({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill="var(--info-bg)" />
      <path d="M8 38c1.5-7 6-10 12-10s10.5 3 12 10" fill="var(--denim)" />
      <path d="M11 31c3 2 6 3 9 3s6-1 9-3" stroke="var(--tape)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="20" cy="17" r="7" fill={SKIN} />
      <path d="M13 15c0-5 3-7.5 7-7.5s7 2.5 7 7.5c-2-2-4.5-3-7-3s-5 1-7 3Z" fill={HAIR} />
      <path d="M15 21.5c1.5 1.4 3.2 2 5 2s3.5-.6 5-2" stroke={HAIR} strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export function CustomerAvatar({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill="var(--warn-bg)" />
      <path d="M8 38c1.5-7 6-10 12-10s10.5 3 12 10" fill="var(--warn)" />
      <circle cx="20" cy="17" r="7" fill={SKIN2} />
      <path d="M13 16c0-5.5 3-8.5 7-8.5s7 3 7 8.5c-1-3-3.5-4.5-7-4.5s-6 1.5-7 4.5Z" fill={HAIR} />
    </svg>
  )
}

export function HelperAvatar({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill="var(--ok-bg)" />
      <path d="M8 38c1.5-7 6-10 12-10s10.5 3 12 10" fill="var(--ok)" />
      <circle cx="20" cy="17" r="7" fill={SKIN} />
      <path d="M12.5 17c-.5-6 3-9.5 7.5-9.5S28 11 27.5 17c-1.5-2.5-2.5-4.5-7.5-4.5s-6 2-7.5 4.5Z" fill={HAIR} />
      <rect x="23" y="27" width="6" height="8" rx="1" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1" />
    </svg>
  )
}

export function NaapAvatar({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill="var(--tape)" />
      <circle cx="17" cy="20" r="8" fill="none" stroke="#3B2F07" strokeWidth="2.4" />
      <circle cx="17" cy="20" r="2.4" fill="#3B2F07" />
      <path d="M25 20h7v5h-7M28 20v2.5M30.5 20v2.5" fill="none" stroke="#3B2F07" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

/** The shop counter: tailor measures, customer speaks, the phone on the counter fills the order. */
export function CounterScene({ bubble1, bubble2, cardTitle }: { bubble1: string; bubble2: string; cardTitle: string }) {
  return (
    <svg viewBox="0 0 420 280" role="img" aria-label={cardTitle} className="scene">
      <rect x="0" y="0" width="420" height="280" rx="18" fill="var(--sunk)" />
      {/* fabric rolls on the shelf, top right */}
      <rect x="292" y="20" width="108" height="8" rx="3" fill="var(--line-strong)" opacity=".5" />
      {['#B0413E', '#2E6F95', '#D9A441', '#3E7D5A'].map((c, i) => (
        <rect key={c} x={298 + i * 25} y="30" width="19" height="42" rx="6" fill={c} opacity=".85" />
      ))}
      {/* customer */}
      <circle cx="96" cy="128" r="17" fill={SKIN2} />
      <path d="M79 124c0-13 7-19 17-19s17 6 17 19c-3-6-9-9-17-9s-14 3-17 9Z" fill={HAIR} />
      <path d="M62 236c2-40 14-62 34-62s32 22 34 62Z" fill="#D9822B" />
      {/* tape around customer's chest */}
      <path d="M68 196c18 8 38 8 56 0" stroke="var(--tape)" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* tailor */}
      <circle cx="210" cy="132" r="17" fill={SKIN} />
      <path d="M193 128c0-12 7-18 17-18s17 6 17 18c-4-4-10-6-17-6s-13 2-17 6Z" fill={HAIR} />
      <path d="M176 236c2-38 14-58 34-58s32 20 34 58Z" fill="var(--denim)" />
      <path d="M186 186c8 5 16 7 24 7s16-2 24-7" stroke="var(--tape)" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* tailor's arm holding the tape out to the customer */}
      <path d="M192 196c-20 4-44 2-64 0" stroke={SKIN} strokeWidth="9" fill="none" strokeLinecap="round" />
      {/* counter */}
      <rect x="20" y="232" width="380" height="30" rx="8" fill="var(--line-strong)" />
      <rect x="20" y="232" width="380" height="6" rx="3" fill="var(--ink)" opacity=".15" />
      {/* phone with Naap on the counter */}
      <g transform="translate(300 150)">
        <rect width="84" height="110" rx="12" fill="var(--ink)" />
        <rect x="6" y="10" width="72" height="90" rx="6" fill="var(--surface)" />
        <rect x="6" y="10" width="72" height="8" rx="3" fill="var(--tape)" />
        <rect x="12" y="26" width="44" height="6" rx="3" fill="var(--denim)" />
        {[40, 52, 64, 76].map(y => <rect key={y} x="12" y={y} width={y % 24 === 4 ? 40 : 56} height="5" rx="2.5" fill="var(--line-strong)" />)}
        <rect x="12" y="86" width="34" height="9" rx="4.5" fill="var(--denim)" />
      </g>
      {/* sound waves from the conversation to the phone */}
      <g fill="none" stroke="var(--ok)" strokeWidth="3" strokeLinecap="round" className="waves">
        <path d="M258 120c8 8 8 22 0 30" />
        <path d="M268 110c14 14 14 36 0 50" />
        <path d="M278 100c20 20 20 50 0 70" />
      </g>
      {/* speech bubbles */}
      {/* tailor asks */}
      <g>
        <rect x="160" y="50" width="128" height="34" rx="12" fill="var(--surface)" stroke="var(--line-strong)" />
        <path d="M200 83l6 14 8-14Z" fill="var(--surface)" />
        <text x="224" y="72" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--ink)" fontFamily="var(--f-body)">{bubble1}</text>
      </g>
      {/* customer answers */}
      <g>
        <rect x="30" y="48" width="96" height="30" rx="12" fill="var(--ink)" />
        <path d="M84 77l8 12 2-12Z" fill="var(--ink)" />
        <text x="78" y="68" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--bg)" fontFamily="var(--f-body)">{bubble2}</text>
      </g>
    </svg>
  )
}
