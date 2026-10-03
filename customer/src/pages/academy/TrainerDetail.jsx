import { Link, useParams } from 'react-router-dom'
import { useFetch } from '../../lib/useFetch'
import { academyApi } from '../../api/academy.api'
import SectionHero from '../../components/common/SectionHero'
import StaffAvatar from '../../components/common/StaffAvatar'
import { Reveal } from '../../components/common/Reveal'
import { ErrorState } from '../../components/common/PageStates'

export default function TrainerDetail() {
  const { id } = useParams()
  const { data: trainer, loading, error } = useFetch(() => academyApi.getTrainer(id), [id])
  const name = trainer?.full_name || 'Trainer'

  if (error) {
    return (
      <div style={{ background: '#0E0409', minHeight: '60vh' }} className="flex flex-col items-center justify-center gap-4">
        <ErrorState msg="This trainer profile is unavailable." />
        <Link to="/staff" className="text-sm" style={{ color: '#c97b90' }}>← Back to our team</Link>
      </div>
    )
  }

  return (
    <div style={{ background: 'linear-gradient(180deg, #0E0409 0%, #140610 50%, #0D0409 100%)' }}>
      <SectionHero
        eyebrow="SLEITH ACADEMY"
        title={
          loading ? '…' : (
            <em className="not-italic" style={{
              background: 'linear-gradient(90deg, #C41850 0%, #C9A96E 60%, #E8557A 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              {name}
            </em>
          )
        }
        subtitle={!loading && trainer?.specialization ? trainer.specialization : undefined}
        variant="cherry"
      />

      <div className="mx-auto max-w-3xl px-4 py-16 space-y-10">
        {!loading && trainer && (
          <Reveal className="flex flex-col items-center gap-6 text-center">
            <StaffAvatar name={name} photo={trainer.photo_url || null} size="xl" accentColor="#9b5a6e" />
            {trainer.bio && (
              <p className="max-w-xl text-sm leading-relaxed text-white/55">{trainer.bio}</p>
            )}
            <Link
              to="/academy"
              className="inline-flex items-center rounded-full px-8 py-3 text-sm font-medium border transition-all"
              style={{ borderColor: 'rgba(155,90,110,0.4)', color: '#c97b90' }}
            >
              Explore Academy courses →
            </Link>
          </Reveal>
        )}

        <Reveal className="text-center">
          <Link to="/staff" className="text-sm text-white/35 hover:text-white/70">← Our team</Link>
        </Reveal>
      </div>
    </div>
  )
}
