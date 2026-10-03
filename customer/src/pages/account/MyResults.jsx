import { Link } from 'react-router-dom'
import { academyApi } from '../../api/academy.api'
import { useFetch } from '../../lib/useFetch'
import { asList } from '../../lib/list'
import AcademyAccountShell, { fmtDate, StatusPill } from './AcademyAccountShell'

const TYPE_LABEL = {
  THEORY: 'Theory',
  PRACTICAL: 'Practical',
  FINAL: 'Final',
}

export default function MyResults() {
  const { data, loading, error } = useFetch(() => academyApi.getMyResults())
  const rows = asList(data)

  return (
    <AcademyAccountShell
      title="Results"
      subtitle="Marks from theory, practical and final assessments."
    >
      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
      )}
      {error && <p className="text-center text-red-400 py-12">Could not load your results.</p>}

      {!loading && !error && rows.length === 0 && (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">📝</p>
          <p className="text-white/30 text-sm mb-6">No assessment results yet. Scores appear after your trainer publishes them.</p>
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
                background: row.is_passed
                  ? 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(201,169,110,0.04))'
                  : 'rgba(255,255,255,0.025)',
                borderColor: row.is_passed ? 'rgba(34,197,94,0.22)' : 'rgba(239,68,68,0.22)',
              }}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className="text-white font-semibold text-[15px] truncate">{row.assessment_title}</p>
                  <p className="text-white/40 text-xs mt-0.5">
                    {[row.course_name, row.batch_name, TYPE_LABEL[row.assessment_type] || row.assessment_type]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <StatusPill
                  label={row.is_passed ? 'Passed' : 'Not passed'}
                  tone={row.is_passed ? 'green' : 'red'}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-[10px] tracking-widest uppercase text-white/30 mb-1">Score</p>
                  <p className="text-sm font-semibold" style={{ color: '#c9a96e' }}>
                    {row.marks_obtained}
                    {row.max_marks != null ? ` / ${row.max_marks}` : ''}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] tracking-widest uppercase text-white/30 mb-1">Passing</p>
                  <p className="text-sm text-white/80">{row.passing_marks ?? '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] tracking-widest uppercase text-white/30 mb-1">Date</p>
                  <p className="text-sm text-white/80">{fmtDate(row.assessment_date)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AcademyAccountShell>
  )
}
