import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api.js'

const STEPS = [
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'delivered', label: 'Delivered' }
]

export default function OrderTracking() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let stop = false
    async function poll() {
      try {
        const data = await api.get(`/order?id=${encodeURIComponent(orderId)}`)
        if (!stop) setOrder(data)
      } catch (e) {
        if (!stop) setError(e.message)
      }
    }
    poll()
    const interval = setInterval(poll, 3000)
    return () => {
      stop = true
      clearInterval(interval)
    }
  }, [orderId])

  if (error) return <div className="screen"><p className="error-text">{error}</p></div>
  if (!order) return <div className="loading-text">Loading order…</div>

  const currentIndex = STEPS.findIndex((s) => s.key === order.status)

  return (
    <div className="screen">
      <div className="marquee">
        <span className="marquee__mark" />
        <h1>ORDER #{order.order_number}</h1>
      </div>

      <div className="ticket">
        <div className="show-strip" style={{ background: 'transparent', padding: 0, marginBottom: 16 }}>
          <div>
            <div className="eyebrow">Seat</div>
            <b>{order.seat_label}</b>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="eyebrow">Total</div>
            <b>₹{(order.total_paise / 100).toFixed(0)}</b>
          </div>
        </div>

        <div style={{ borderTop: '1px dashed var(--line)', paddingTop: 12 }}>
          {order.items.map((it) => (
            <p key={it.id} style={{ margin: '4px 0', fontSize: 14 }}>
              {it.name} × {it.quantity}
            </p>
          ))}
        </div>

        <div className="status-track">
          {STEPS.map((step, i) => (
            <div key={step.key}>
              <div className="status-step">
                <span
                  className={`status-dot ${
                    i < currentIndex ? 'done' : i === currentIndex ? 'current' : ''
                  }`}
                />
                <span>{step.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className="status-line" />}
            </div>
          ))}
        </div>

        {order.status === 'delivered' ? (
          <p style={{ textAlign: 'center', color: 'var(--good)', fontWeight: 600 }}>
            ✅ Delivered — enjoy your movie! 🍿
          </p>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
            {order.deliver_at === 'interval'
              ? "We'll deliver this during interval. You can keep watching the movie."
              : "We're bringing this to your seat now."}
          </p>
        )}
      </div>
    </div>
  )
}
