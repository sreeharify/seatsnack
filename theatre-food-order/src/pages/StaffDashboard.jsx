import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api.js'
import { playNewOrderSound, vibrateNewOrder, unlockAudio } from '../lib/alert.js'

const NEXT_STATUS = {
  confirmed: { next: 'preparing', label: 'Start Preparing' },
  preparing: { next: 'ready', label: 'Mark Ready' },
  ready: { next: 'delivered', label: 'Mark Delivered' }
}

function PinGate({ onSuccess }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api.post('/staff-login', { pin })
      sessionStorage.setItem('staff_pin', pin)
      unlockAudio()
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
        <h1>STAFF LOGIN</h1>
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

export default function StaffDashboard() {
  const [pin, setPin] = useState(() => sessionStorage.getItem('staff_pin') || '')
  const [screens, setScreens] = useState([])
  const [screenId, setScreenId] = useState('')
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')
  const knownIds = useRef(new Set())
  const firstLoad = useRef(true)

  useEffect(() => {
    if (!pin) return
    api.get('/screens').then((data) => {
      setScreens(data.screens)
      if (data.screens.length > 0) setScreenId(data.screens[0].id)
    }).catch((e) => setError(e.message))
  }, [pin])

  useEffect(() => {
    if (!pin || !screenId) return
    let stop = false
    async function poll() {
      try {
        const data = await api.get(`/orders?screen_id=${encodeURIComponent(screenId)}`)
        if (stop) return
        const incomingIds = new Set(data.orders.map((o) => o.id))
        if (!firstLoad.current) {
          const hasNew = [...incomingIds].some((id) => !knownIds.current.has(id))
          if (hasNew) {
            playNewOrderSound()
            vibrateNewOrder()
          }
        }
        knownIds.current = incomingIds
        firstLoad.current = false
        setOrders(data.orders)
      } catch (e) {
        if (!stop) setError(e.message)
      }
    }
    poll()
    const interval = setInterval(poll, 4000)
    return () => {
      stop = true
      clearInterval(interval)
    }
  }, [pin, screenId])

  async function advance(order) {
    const step = NEXT_STATUS[order.status]
    if (!step) return
    try {
      await api.post('/order-status', {
        order_id: order.id,
        status: step.next,
        staff_pin: pin
      })
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: step.next } : o))
      )
    } catch (e) {
      setError(e.message)
    }
  }

  if (!pin) return <PinGate onSuccess={setPin} />

  const revenue = orders.reduce((sum, o) => sum + o.total_paise, 0)

  const batched = {}
  orders.forEach((o) => {
    o.items.forEach((it) => {
      batched[it.name] = (batched[it.name] || 0) + it.quantity
    })
  })

  const byRow = {}
  orders.forEach((o) => {
    const row = (o.seat_label || '?').replace(/[0-9]/g, '') || '?'
    if (!byRow[row]) byRow[row] = []
    byRow[row].push(o)
  })

  return (
    <div className="screen screen--wide">
      <div className="top-bar">
        <div className="marquee" style={{ marginBottom: 0 }}>
          <span className="marquee__mark" />
          <h1>STAFF DASHBOARD</h1>
        </div>
        <select
          className="pin-input"
          style={{ width: 'auto', letterSpacing: 0, fontSize: 14, padding: '10px 14px' }}
          value={screenId}
          onChange={(e) => setScreenId(e.target.value)}
        >
          {screens.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="stat-row">
        <div className="stat-card">
          <b>{orders.length}</b>
          <span>Orders</span>
        </div>
        <div className="stat-card">
          <b>₹{(revenue / 100).toFixed(0)}</b>
          <span>Revenue</span>
        </div>
        <div className="stat-card">
          <b>{orders.filter((o) => o.status === 'ready').length}</b>
          <span>Ready</span>
        </div>
      </div>

      <div className="eyebrow">Interval Preparation — Batched Items</div>
      <div className="batch-grid">
        {Object.entries(batched).length === 0 && (
          <p className="empty-state" style={{ gridColumn: '1 / -1' }}>No active orders yet.</p>
        )}
        {Object.entries(batched).map(([name, qty]) => (
          <div className="batch-item" key={name}>
            <span>{name}</span>
            <span>×{qty}</span>
          </div>
        ))}
      </div>

      <div className="eyebrow">Orders by Row</div>
      {Object.entries(byRow).map(([row, rowOrders]) => (
        <div className="zone-block" key={row}>
          <h3>Row {row}</h3>
          {rowOrders.map((o) => {
            const step = NEXT_STATUS[o.status]
            const isNewLooking = o.status === 'confirmed'
            return (
              <div
                className={`order-card status-${o.status} ${isNewLooking ? 'new-order-flash' : ''}`}
                key={o.id}
              >
                <div className="order-card__head">
                  <span className="order-card__seat">{o.seat_label}</span>
                  <span className="eyebrow" style={{ margin: 0 }}>{o.status}</span>
                </div>
                <p className="order-card__items">
                  {o.items.map((it) => `${it.name} ×${it.quantity}`).join(', ')}
                </p>
                <div className="order-card__actions">
                  {step && (
                    <button className="btn-small primary" onClick={() => advance(o)}>
                      {step.label}
                    </button>
                  )}
                  {o.status === 'delivered' && (
                    <span style={{ fontSize: 12, color: 'var(--good)' }}>Delivered ✓</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
