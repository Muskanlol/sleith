import { Link } from 'react-router-dom'
import { academyApi } from '../../api/academy.api'
import { useFetch } from '../../lib/useFetch'
import { asList } from '../../lib/list'
import AcademyAccountShell, { fmtDate, StatusPill } from './AcademyAccountShell'

function ScoreRow({ score }) {
  const max = score.max_marks || 0
  const got = score.marks_obtained ?? 0
  const pct = max ? Math.min(100, Math.round((got / max) * 100)) : 0
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-white/60">{score.criteria_name || 'Criteria'}</p>
        <p className="text-xs text-white/80">{got} / {max}</p>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#c9a96e' }} />
      </div>
    </div>
  )
}

export default function MyPracticals() {
  const { data, loading, error } = useFetch(() => academyApi.getMyPracticals())
  const rows = asList(data)

  return (
    <AcademyAccountShell
      title="Practicals"
      subtitle="Studio practical sessions and trainer evaluations."
    >
      {loading && (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
      )}
      {error && <p className="text-center text-red-400 py-12">Could not load your practicals.</p>}

      {!loading && !error && rows.length === 0 && (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">💅</p>
          <p className="text-white/30 text-sm mb-6">
            No practical sessions yet. They appear here after your trainer schedules and evaluates them.
          </p>
          <Link to="/account/academy" className="text-xs tracking-widest uppercase" style={{ color: '#c97b90' }}>
            ← Back to enrollments
          </Link>
        </div>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="space-y-3">
          {rows.map((row) => {
            const ev = row.evaluation
            const passed = ev?.is_passed
            return (
              <div
                key={row.id}
                className="rounded-2xl border p-5"
                style={{
                  background: ev
                    ? passed
                      ? 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(201,169,110,0.04))'
                      : 'rgba(255,255,255,0.025)'
                    : 'rgba(255,255,255,0.025)',
                  borderColor: ev
                    ? passed ? 'rgba(34,197,94,0.22)' : 'rgba(239,68,68,0.22)'
                    : 'rgba(201,169,110,0.22)',
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-[15px] truncate">{row.title}</p>
                    <p className="text-white/40 text-xs mt-0.5">
                      {[row.course_name, row.batch_name, row.trainer_name]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  <StatusPill
                    label={ev ? (passed ? 'Passed' : 'Not passed') : 'Pending'}
                    tone={ev ? (passed ? 'green' : 'red') : 'gold'}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-[10px] tracking-widest uppercase text-white/30 mb-1">Date</p>
                    <p className="text-sm text-white/80">{fmtDate(row.date)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] tracking-widest uppercase text-white/30 mb-1">Score</p>
                    <p className="text-sm font-semibold" style={{ color: '#c9a96e' }}>
                      {ev ? `${ev.total_marks} / ${ev.max_marks}` : '—'}
                    </p>
                  </div>
                </div>

                {row.notes && (
                  <p className="text-sm text-white/45 leading-relaxed mb-3">{row.notes}</p>
                )}

                {ev?.scores?.length > 0 && (
                  <div className="space-y-2.5 mb-3">
                    {ev.scores.map((score) => (
                      <ScoreRow key={score.id || score.criteria} score={score} />
                    ))}
                  </div>
                )}

                {ev?.feedback && (
                  <p className="text-sm text-white/55 leading-relaxed pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    {ev.feedback}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </AcademyAccountShell>
  )
}
