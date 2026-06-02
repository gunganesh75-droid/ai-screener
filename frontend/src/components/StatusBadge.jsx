import { CheckCircle, Clock, XCircle, Eye } from 'lucide-react'

const configs = {
  Shortlisted: { cls: 'badge-shortlisted', icon: CheckCircle, label: 'Shortlisted' },
  Applied:     { cls: 'badge-applied',      icon: Clock,        label: 'Applied' },
  Review:      { cls: 'badge-review',       icon: Eye,          label: 'Under Review' },
  Rejected:    { cls: 'badge-rejected',     icon: XCircle,      label: 'Rejected' },
  Shortlist:   { cls: 'badge-shortlisted',  icon: CheckCircle,  label: 'Shortlist' },
  Reject:      { cls: 'badge-rejected',     icon: XCircle,      label: 'Reject' },
}

export default function StatusBadge({ status }) {
  const cfg = configs[status] || configs['Review']
  const Icon = cfg.icon
  return (
    <span className={cfg.cls}>
      <Icon size={11} />
      {cfg.label}
    </span>
  )
}
