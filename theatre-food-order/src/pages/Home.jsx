import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="screen">
      <div className="marquee">
        <span className="marquee__mark" />
        <h1>REEL BITES</h1>
      </div>
      <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>
        Theatre food ordering — order from your seat, staff prepares and
        delivers at interval.
      </p>
      <p style={{ color: 'var(--muted)', fontSize: 13 }}>
        Customers normally arrive here via a seat QR code
        (<code>/order?screen=SCREEN_ID&amp;seat=G12</code>). Use the links
        below to jump to the staff and admin tools.
      </p>
      <div className="link-row" style={{ marginTop: 24 }}>
        <Link to="/staff">Staff dashboard</Link>
        <Link to="/admin">Admin panel</Link>
      </div>
    </div>
  )
}
