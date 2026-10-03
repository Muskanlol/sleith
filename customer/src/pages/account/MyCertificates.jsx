import { useState } from 'react'
import { Link } from 'react-router-dom'
import { academyApi } from '../../api/academy.api'
import { useFetch } from '../../lib/useFetch'
import { asList } from '../../lib/list'
import AcademyAccountShell, { fmtDate, StatusPill } from './AcademyAccountShell'

const CERT_TONE = {
  ISSUED: 'gold',
  VERIFIED: 'green',
  REVOKED: 'red',
}

function CopyNumber({ value }) {
  const [copied, setCopied] = useState(false)
  if (!value) return null
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
          setTimeout(() => setCopied(false), 1600)
        } catch {}
      }}
      className="text-[11px] tracking-widest uppercase mt-1"
      style={{ color: copied ? '#16a34a' : '#c9a96e' }}
    >
      {copied ? 'Copied' : 'Copy number'}
    </button>
  )
}

export default function MyCertificates() {
  const { data, loading, error } = useFetch(() => academyApi.getMyCertificates())
  const rows = asList(data)

  return (
    <AcademyAccountShell
      title="Certificates"
      subtitle="Issued SLEITH Academy certificates for completed courses."
    >
      {loading && (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
      )}
      {error && <p className="text-center text-red-400 py-12">Could not load certificates.</p>}

      {!loading && !error && rows.length === 0 && (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">📜</p>
          <p className="text-white/30 text-sm mb-2">No certificates issued yet.</p>
          <p className="text-white/25 text-xs mb-6">Certificates appear here after you complete a course and the academy issues them.</p>
          <Link to="/account/academy" className="text-xs tracking-widest uppercase" style={{ color: '#c97b90' }}>
            ← Back to enrollments
          </Link>
        </div>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.id}
              className="rounded-2xl border p-5"
              style={{
                background: 'linear-gradient(135deg, rgba(201,169,110,0.1), rgba(155,90,110,0.05))',
                borderColor: 'rgba(201,169,110,0.28)',
              }}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <p className="text-white font-semibold text-[15px] truncate">{row.course_name}</p>
                  <p className="text-white/40 text-xs mt-0.5">{row.batch_name || 'SLEITH Academy'}</p>
                </div>
                <StatusPill
                  label={row.is_verified ? 'Verified' : (row.status || 'Issued')}
                  tone={row.is_verified ? 'green' : (CERT_TONE[row.status] || 'gold')}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] tracking-widest uppercase text-white/30 mb-1">Certificate no.</p>
                  <p className="text-sm font-medium text-white/90 tracking-wide">{row.certificate_number}</p>
                  <CopyNumber value={row.certificate_number} />
                </div>
                <div>
                  <p className="text-[10px] tracking-widest uppercase text-white/30 mb-1">Issued</p>
                  <p className="text-sm text-white/80">{fmtDate(row.issued_at)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AcademyAccountShell>
  )
}
