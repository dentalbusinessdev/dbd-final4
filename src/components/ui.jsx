export function Card({ className = '', children, ...props }) {
  return <div className={`card ${className}`} {...props}>{children}</div>
}

export function CardContent({ className = '', children }) {
  return <div className={`card-content ${className}`}>{children}</div>
}

export function Badge({ className = '', dark = false, children, style = {} }) {
  return <span className={`badge ${dark ? 'badge-dark' : ''} ${className}`} style={style}>{children}</span>
}

export function Button({ className = '', variant = 'primary', children, style = {}, ...props }) {
  return <button className={`btn ${variant === 'outline' ? 'btn-outline' : 'btn-primary'} ${className}`} style={style} {...props}>{children}</button>
}

export function Input(props) {
  return <input className="input" {...props} />
}

export function Textarea(props) {
  return <textarea className="textarea" {...props} />
}

export function Progress({ value }) {
  return <div className="progress-wrap"><div className="progress-bar" style={{ width: `${value}%` }} /></div>
}
