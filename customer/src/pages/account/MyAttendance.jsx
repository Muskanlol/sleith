import { Link } from 'react-router-dom'
import { academyApi } from '../../api/academy.api'
import { useFetch } from '../../lib/useFetch'
import { asList } from '../../lib/list'
import AcademyAccountShell, { fmtDate, fmtTime, StatusPill } from './AcademyAccountShell'

function groupByCourse(rows) {
  const map = new Map()
  for (const row of rows) {
    const key = row.course_name || 'Course'
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(row)
  }
  return [...map.entries()]
}

export default function MyAttendance() {
  const { data, loading, error } = useFetch(() => academyApi.getMyAttendance())
  const rows = asList(data)
  const groups = groupByCourse(rows)

  return (
    <AcademyAccountShell
      title="Attendance"
      subtitle="Present and absent marks for each academy session."
    >
      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
      )}
      {error && <p className="text-center text-red-400 py-12">Could not load attendance.</p>}

      {!loading && !error && rows.length === 0 && (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">📋</p>
          <p className="text-white/30 text-sm mb-6">No attendance records yet. They appear after your trainer marks a session.</p>
          <Link to="/account/academy" className="text-xs tracking-widest uppercase" style={{ color: '#c97b90' }}>
            ← Back to enrollments
          </Link>
        </div>
      )}

      {!loading && !error && groups.map(([course, items]) => {
        const present = items.filter((r) => r.status === 'PRESENT').length
        const pct = items.length ? Math.round((present / items.length) * 100) : 0
        return (
          <div key={course} className="mb-8">
            <div className="flex items-center justify-between mb-3 gap-3">
              <p className="text-xs tracking-widest uppercase" style={{ color: '#c97b90' }}>{course}</p>
              <p className="text-xs text-white/35">{present}/{items.length} present · {pct}%</p>
            </div>
            <div className="space-y-2">
              {items.map((row) => (
                <div
                  key={row.id}
                  className="rounded-xl border px-4 py-3 flex items-center justify-between gap-3"
                  style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.07)' }}
                >
                  <div className="min-w-0">
                    <p className="text-sm text-white/85 truncate">{row.session_title || 'Session'}</p>
                    <p className="text-xs text-white/35 mt-0.5">
                      {fmtDate(row.session_date)}
                      {row.session_start_time ? ` · ${fmtTime(row.session_start_time)}–${fmtTime(row.session_end_time)}` : ''}
                      {row.batch_name ? ` · ${row.batch_name}` : ''}
                    </p>
                  </div>
                  <StatusPill
                    label={row.status === 'PRESENT' ? 'Present' : 'Absent'}
                    tone={row.status === 'PRESENT' ? 'green' : 'red'}
                  />
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </AcademyAccountShell>
  )
}
