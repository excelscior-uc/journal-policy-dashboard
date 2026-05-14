const STATS = [
  { num: '12',        lbl: 'Research Fields' },
  { num: '335+',      lbl: 'Charts' },
  { num: '2008–2024', lbl: 'Time Span' },
  { num: 'Pre-reg.',  lbl: 'Study Protocol' },
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
