import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'

function formatRupees(paise) {
  return `₹${(paise / 100).toFixed(0)}`
}

export default function CustomerOrder() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const screenId = params.get('screen')
  const seat = params.get('seat') || ''

  const [menu, setMenu] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState({})
  const [deliverAt, setDeliverAt] = useState('interval')
  const [placing, setPlacing] = useState(false)

  useEffect(() => {
    if (!screenId) {
      setError('Missing screen. Please scan the seat QR code again.')
      setLoading(false)
      return
    }
    api
      .get(`/menu?screen_id=${encodeURIComponent(screenId)}`)
      .then((data) => setMenu(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [screenId])

  function updateQty(itemId, delta) {
    setCart((prev) => {
      const next = { ...prev }
      const current = next[itemId] || 0
      const updated = Math.max(0, current + delta)
      if (updated === 0) delete next[itemId]
      else next[itemId] = updated
      return next
    })
  }

  const items = menu?.items || []
  const total = items.reduce((sum, item) => {
    const qty = cart[item.id] || 0
    return sum + qty * item.price_paise
  }, 0)
  const itemCount = Object.values(cart).reduce((a, b) => a + b, 0)

  async function placeOrder() {
    setPlacing(true)
    setError('')
    try {
      const orderItems = Object.entries(cart).map(([menu_item_id, quantity]) => ({
        menu_item_id,
        quantity
      }))

      const order = await api.post('/order', {
        screen_id: screenId,
        seat_label: seat,
        deliver_at: deliverAt,
        items: orderItems
      })

      const rzp = await api.post('/razorpay-order', { order_id: order.id })

      const options = {
        key: rzp.key_id,
        amount: rzp.amount,
        currency: rzp.currency,
        name: menu.theatre.name,
        description: `Order for seat ${seat}`,
        order_id: rzp.razorpay_order_id,
        handler: async function (response) {
          try {
            await api.post('/razorpay-verify', {
              order_id: order.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
            navigate(`/track/${order.id}`)
          } catch (e) {
            setError('Payment succeeded but verification failed: ' + e.message)
          }
        },
        theme: { color: '#c1272d' },
        modal: {
          ondismiss: function () {
            setPlacing(false)
          }
        }
      }

      const rz = new window.Razorpay(options)
      rz.open()
    } catch (e) {
      setError(e.message)
      setPlacing(false)
    }
  }

  if (loading) return <div className="loading-text">Loading menu…</div>
  if (error && !menu) {
    return (
      <div className="screen">
        <p className="error-text">{error}</p>
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="marquee">
        <span className="marquee__mark" />
        <h1>{menu.theatre.name.toUpperCase()}</h1>
      </div>

      <div className="show-strip">
        <div>
          <div className="eyebrow">{menu.screen.name}</div>
          <b>{menu.show ? menu.show.movie_name || 'Now Showing' : 'No show scheduled'}</b>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="eyebrow">Seat</div>
          <b>{seat || '—'}</b>
        </div>
      </div>

      <div className="card">
        {items.length === 0 && <p className="empty-state">No menu items available.</p>}
        {items.map((item) => (
          <div className="menu-item" key={item.id}>
            <div>
              <p className="menu-item__name">{item.name}</p>
              <p className="menu-item__price">{formatRupees(item.price_paise)}</p>
            </div>
            <div className="stepper">
              <button onClick={() => updateQty(item.id, -1)} aria-label={`Remove ${item.name}`}>−</button>
              <span>{cart[item.id] || 0}</span>
              <button onClick={() => updateQty(item.id, 1)} aria-label={`Add ${item.name}`}>+</button>
            </div>
          </div>
        ))}
      </div>

      <div className="eyebrow" style={{ marginTop: 10 }}>Deliver</div>
      <div className="toggle-row">
        <button
          className={`toggle-pill ${deliverAt === 'now' ? 'active' : ''}`}
          onClick={() => setDeliverAt('now')}
        >
          Now
        </button>
        <button
          className={`toggle-pill ${deliverAt === 'interval' ? 'active' : ''}`}
          onClick={() => setDeliverAt('interval')}
        >
          During Interval
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="sticky-bar">
        <span className="total-price">{formatRupees(total)}</span>
        <button
          className="btn-primary"
          disabled={itemCount === 0 || placing}
          onClick={placeOrder}
        >
          {placing ? 'Processing…' : 'Order Now'}
        </button>
      </div>
    </div>
  )
}
