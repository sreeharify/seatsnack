import { useEffect, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { api } from '../lib/api.js'

function PinGate({ onSuccess }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api.post('/admin/login', { pin })
      sessionStorage.setItem('admin_pin', pin)
      onSuccess(pin)
    } catch (e2) {
      setError('Wrong PIN')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="pin-screen">
      <div className="marquee">
        <span className="marquee__mark" />
        <h1>ADMIN LOGIN</h1>
      </div>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
        <input
          className="pin-input"
          type="password"
          inputMode="numeric"
          maxLength={8}
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="PIN"
          autoFocus
        />
        {error && <p className="error-text">{error}</p>}
        <button className="btn-primary" style={{ width: 200 }} disabled={busy || !pin}>
          {busy ? 'Checking…' : 'Enter'}
        </button>
      </form>
    </div>
  )
}

export default function AdminPanel() {
  const [pin, setPin] = useState(() => sessionStorage.getItem('admin_pin') || '')
  const [theatres, setTheatres] = useState([])
  const [screens, setScreens] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [newTheatre, setNewTheatre] = useState('')
  const [newScreen, setNewScreen] = useState({ theatre_id: '', name: '' })
  const [newShow, setNewShow] = useState({ screen_id: '', movie_name: '', show_time: '', interval_time: '' })
  const [newItem, setNewItem] = useState({ theatre_id: '', name: '', price_rupees: '' })
  const [qrForm, setQrForm] = useState({ screen_id: '', seat_label: '' })

  async function loadAll() {
    try {
      const t = await api.get(`/admin/data?resource=theatres&admin_pin=${encodeURIComponent(pin)}`)
      setTheatres(t.rows)
      const s = await api.get(`/admin/data?resource=screens&admin_pin=${encodeURIComponent(pin)}`)
      setScreens(s.rows)
      const m = await api.get(`/admin/data?resource=menu_items&admin_pin=${encodeURIComponent(pin)}`)
      setMenuItems(m.rows)
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => {
    if (pin) loadAll()
  }, [pin])

  async function createTheatre(e) {
    e.preventDefault()
    try {
      await api.post('/admin/data', {
        resource: 'theatres', action: 'create', admin_pin: pin,
        payload: { name: newTheatre }
      })
      setNewTheatre('')
      setNotice('Theatre added')
      loadAll()
    } catch (e2) { setError(e2.message) }
  }

  async function createScreen(e) {
    e.preventDefault()
    try {
      await api.post('/admin/data', {
        resource: 'screens', action: 'create', admin_pin: pin,
        payload: newScreen
      })
      setNewScreen({ theatre_id: '', name: '' })
      setNotice('Screen added')
      loadAll()
    } catch (e2) { setError(e2.message) }
  }

  async function createShow(e) {
    e.preventDefault()
    try {
      await api.post('/admin/data', {
        resource: 'shows', action: 'create', admin_pin: pin,
        payload: newShow
      })
      setNewShow({ screen_id: '', movie_name: '', show_time: '', interval_time: '' })
      setNotice('Show scheduled')
    } catch (e2) { setError(e2.message) }
  }

  async function createItem(e) {
    e.preventDefault()
    try {
      await api.post('/admin/data', {
        resource: 'menu_items', action: 'create', admin_pin: pin,
        payload: {
          theatre_id: newItem.theatre_id,
          name: newItem.name,
          price_paise: Math.round(parseFloat(newItem.price_rupees) * 100)
        }
      })
      setNewItem({ theatre_id: '', name: '', price_rupees: '' })
      setNotice('Menu item added')
      loadAll()
    } catch (e2) { setError(e2.message) }
  }

  async function toggleItem(item) {
    try {
      await api.post('/admin/data', {
        resource: 'menu_items', action: 'update', admin_pin: pin,
        payload: { id: item.id, is_active: !item.is_active }
      })
      loadAll()
    } catch (e2) { setError(e2.message) }
  }

  if (!pin) return <PinGate onSuccess={setPin} />

  const qrUrl = qrForm.screen_id && qrForm.seat_label
    ? `${window.location.origin}/order?screen=${qrForm.screen_id}&seat=${encodeURIComponent(qrForm.seat_label)}`
    : ''

  return (
    <div className="screen screen--wide">
      <div className="marquee">
        <span className="marquee__mark" />
        <h1>ADMIN PANEL</h1>
      </div>

      {error && <p className="error-text">{error}</p>}
      {notice && <p style={{ color: 'var(--good)', fontSize: 13 }}>{notice}</p>}

      <div className="card">
        <div className="eyebrow">Add Theatre</div>
        <form onSubmit={createTheatre} style={{ display: 'flex', gap: 10 }}>
          <input className="pin-input" style={{ letterSpacing: 0, width: '100%', textAlign: 'left' }}
            placeholder="Theatre name" value={newTheatre}
            onChange={(e) => setNewTheatre(e.target.value)} />
          <button className="btn-small primary" type="submit">Add</button>
        </form>
      </div>

      <div className="card">
        <div className="eyebrow">Add Screen</div>
        <form onSubmit={createScreen}>
          <div className="field">
            <label>Theatre</label>
            <select value={newScreen.theatre_id} onChange={(e) => setNewScreen({ ...newScreen, theatre_id: e.target.value })}>
              <option value="">Select theatre</option>
              {theatres.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Screen name</label>
            <input value={newScreen.name} onChange={(e) => setNewScreen({ ...newScreen, name: e.target.value })} placeholder="Screen 1" />
          </div>
          <button className="btn-small primary" type="submit">Add Screen</button>
        </form>
      </div>

      <div className="card">
        <div className="eyebrow">Schedule Show</div>
        <form onSubmit={createShow}>
          <div className="field">
            <label>Screen</label>
            <select value={newShow.screen_id} onChange={(e) => setNewShow({ ...newShow, screen_id: e.target.value })}>
              <option value="">Select screen</option>
              {screens.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Movie name</label>
            <input value={newShow.movie_name} onChange={(e) => setNewShow({ ...newShow, movie_name: e.target.value })} />
          </div>
          <div className="field">
            <label>Show time</label>
            <input type="datetime-local" value={newShow.show_time} onChange={(e) => setNewShow({ ...newShow, show_time: e.target.value })} />
          </div>
          <div className="field">
            <label>Interval time (approx)</label>
            <input type="datetime-local" value={newShow.interval_time} onChange={(e) => setNewShow({ ...newShow, interval_time: e.target.value })} />
          </div>
          <button className="btn-small primary" type="submit">Schedule</button>
        </form>
      </div>

      <div className="card">
        <div className="eyebrow">Menu Items</div>
        <form onSubmit={createItem} style={{ marginBottom: 14 }}>
          <div className="field">
            <label>Theatre</label>
            <select value={newItem.theatre_id} onChange={(e) => setNewItem({ ...newItem, theatre_id: e.target.value })}>
              <option value="">Select theatre</option>
              {theatres.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Item name</label>
            <input value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} placeholder="Popcorn" />
          </div>
          <div className="field">
            <label>Price (₹)</label>
            <input type="number" value={newItem.price_rupees} onChange={(e) => setNewItem({ ...newItem, price_rupees: e.target.value })} placeholder="120" />
          </div>
          <button className="btn-small primary" type="submit">Add Item</button>
        </form>

        {menuItems.map((item) => (
          <div className="menu-item" key={item.id}>
            <div>
              <p className="menu-item__name">{item.name}</p>
              <p className="menu-item__price">₹{(item.price_paise / 100).toFixed(0)}</p>
            </div>
            <button className="btn-small" onClick={() => toggleItem(item)}>
              {item.is_active ? 'Disable' : 'Enable'}
            </button>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="eyebrow">Generate Seat QR</div>
        <div className="field">
          <label>Screen</label>
          <select value={qrForm.screen_id} onChange={(e) => setQrForm({ ...qrForm, screen_id: e.target.value })}>
            <option value="">Select screen</option>
            {screens.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Seat label</label>
          <input value={qrForm.seat_label} onChange={(e) => setQrForm({ ...qrForm, seat_label: e.target.value })} placeholder="G12" />
        </div>
        {qrUrl && (
          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <div className="qr-box">
              <QRCodeCanvas value={qrUrl} size={180} />
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted)', wordBreak: 'break-all', marginTop: 8 }}>{qrUrl}</p>
          </div>
        )}
      </div>
    </div>
  )
}
