import { CheckCircle2, ExternalLink } from 'lucide-react'
import { Badge } from './ui'

export default function RecommendationCard({ item }) {
  const typeLabel = item.type === 'bundle' ? 'Bundle 6 Courses Online' : item.type === 'free' ? 'محتوى مجاني' : 'كورس أونلاين'

  return (
    <div className="report-recommendation-card">
      <div className="row-between" style={{ alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{item.title}</div>
          <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7 }}>{item.titleAr}</div>
        </div>
        <Badge>{typeLabel}</Badge>
      </div>

      <p style={{ margin: '0 0 10px', lineHeight: 1.8, fontSize: 14, color: '#374151' }}>{item.description}</p>
      <p style={{ margin: '0 0 10px', lineHeight: 1.8, fontSize: 14, color: '#4b5563' }}><strong>لماذا نرشحه لك:</strong> {item.reason}</p>

      <div className="stack-2" style={{ marginBottom: 12 }}>
        {item.outcome.map((outcome) => (
          <div key={outcome} className="row-between" style={{ justifyContent: 'flex-start', gap: 8 }}>
            <CheckCircle2 size={16} />
            <span className="small">{outcome}</span>
          </div>
        ))}
      </div>

      <div className="row-between" style={{ marginBottom: 12, fontSize: 12, color: '#6b7280' }}>
        <span>{item.lectures}</span>
        <span>{item.duration}</span>
      </div>

      <button type="button" className="btn btn-primary linkish" onClick={() => openExternalUrl(item.link)}>
        {item.cta} <ExternalLink size={16} />
      </button>
    </div>
  )
}

function openExternalUrl(url) {
  const popup = window.open(url, '_blank', 'noopener,noreferrer')
  if (popup) return

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.target = '_blank'
  anchor.rel = 'noopener noreferrer'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()

  window.setTimeout(() => {
    if (document.visibilityState === 'visible') {
      window.location.assign(url)
    }
  }, 400)
}
