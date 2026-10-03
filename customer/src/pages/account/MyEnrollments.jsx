import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { academyApi } from '../../api/academy.api'
import { useFetch } from '../../lib/useFetch'
import { asList } from '../../lib/list'
import AcademyAccountShell, { fmtDate, StatusPill } from './AcademyAccountShell'

const BATCH_TONE = {
  ACTIVE: 'green',
  COMPLETED: 'gold',
  CANCELLED: 'red',
}

function AttendanceBar({ pct }) {
  if (pct == null) {
    return <p className="text-xs text-white/35">Attendance will appear after sessions are marked.</p>
  }
  const tone = pct >= 75 ? '#16a34a' : pct >= 50 ? '#c9a96e' : '#dc2626'
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] tracking-widest uppercase text-white/30">Attendance</p>
        <p className="text-sm font-semibold" style={{ color: tone }}>{pct}%</p>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: tone }} />
      </div>
    </div>
  )
}

function EnrollmentCard({ row }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border p-5"
      style={{
        background: 'linear-gradient(135deg, rgba(155,90,110,0.1), rgba(201,169,110,0.04))',
        borderColor: 'rgba(155,90,110,0.28)',
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className="text-white font-semibold text-[15px] truncate">{row.course_name}</p>
          <p className="text-white/40 text-xs mt-0.5">
            {row.batch_name}
            {row.trainer_name ? ` · ${row.trainer_name}` : ''}
          </p>
        </div>
        <StatusPill
          label={row.batch_status || 'Enrolled'}
          tone={BATCH_TONE[row.batch_status] || 'cherry'}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-[10px] tracking-widest uppercase text-white/30 mb-1">Batch dates</p>
          <p className="text-sm text-white/80">
            {fmtDate(row.batch_start_date)} – {fmtDate(row.batch_end_date)}
          </p>
        </div>
        <div>
          <p className="text-[10px] tracking-widest uppercase text-white/30 mb-1">Enrolled</p>
          <p className="text-sm text-white/80">{fmtDate(row.enrolled_at)}</p>
        </div>
      </div>

      <AttendanceBar pct={row.attendance_percentage} />

      <div className="mt-4 flex flex-wrap gap-3">
        {row.course_id && (
          <Link to={`/academy/${row.course_id}`} className="text-xs tracking-widest uppercase font-medium" style={{ color: '#c97b90' }}>
            View course →
          </Link>
        )}
        <Link to="/account/academy/attendance" className="text-xs tracking-widest uppercase font-medium text-white/35 hover:text-white/60">
          Attendance
        </Link>
        <Link to="/account/academy/practicals" className="text-xs tracking-widest uppercase font-medium text-white/35 hover:text-white/60">
          Practicals
        </Link>
        <Link to="/account/academy-fees" className="text-xs tracking-widest uppercase font-medium text-white/35 hover:text-white/60">
          Fees
        </Link>
      </div>
    </motion.div>
  )
}

export default function MyEnrollments() {
  const { data, loading, error } = useFetch(() => academyApi.getMyEnrollments())
  const rows = asList(data)

  return (
    <AcademyAccountShell
      title="My Enrollments"
      subtitle="Your batches, trainers, and attendance at a glance."
    >
      {loading && (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-36 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
      )}
      {error && <p className="text-center text-red-400 py-12">Could not load your enrollments.</p>}

      {!loading && !error && rows.length === 0 && (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">🎓</p>
          <p className="text-white/30 text-sm mb-2">You are not enrolled in a batch yet.</p>
          <p className="text-white/25 text-xs mb-6">Apply to a course — once approved, your batch will show up here.</p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Link
              to="/academy"
              className="px-7 py-3 rounded-full text-sm font-semibold tracking-widest uppercase"
              style={{ background: 'linear-gradient(135deg,#9b5a6e,#c9a96e)', color: '#fff' }}
            >
              Explore Courses →
            </Link>
            <Link
              to="/account/applications"
              className="px-7 py-3 rounded-full text-sm tracking-widest uppercase border text-white/50"
              style={{ borderColor: 'rgba(255,255,255,0.14)' }}
            >
              My Applications
            </Link>
          </div>
        </div>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="space-y-3">
          {rows.map((row) => (
            <EnrollmentCard key={row.id} row={row} />
          ))}
        </div>
      )}
    </AcademyAccountShell>
  )
}
