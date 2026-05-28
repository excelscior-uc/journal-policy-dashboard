import { SITE_STATS } from '../data/siteStats'

const STATS = [
  { num: String(SITE_STATS.fieldCount),                      lbl: 'Research Fields' },
  { num: `${SITE_STATS.chartCount}+`,                        lbl: 'Charts' },
  { num: `${SITE_STATS.yearMin}–${SITE_STATS.yearMax}`,      lbl: 'Time Span' },
  { num: 'Pre-reg.',                                         lbl: 'Study Protocol' },
]

export default function StatsStrip() {
  return (
    <div className="stats-strip">
      {STATS.map(s => (
        <div key={s.lbl} className="stats-strip__item">
          <div className="stats-strip__num">{s.num}</div>
          <div className="stats-strip__lbl">{s.lbl}</div>
        </div>
      ))}
    </div>
  )
}
