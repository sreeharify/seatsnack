import { getDb, json, errorResponse } from '../_lib/db.js'

export async function onRequestGet(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  if (!id) return errorResponse('id is required')

  const sql = getDb(env)
  const orders = await sql`SELECT * FROM orders WHERE id = ${id}`
  if (orders.length === 0) return errorResponse('Order not found', 404)
  const order = orders[0]

  const items = await sql`
    SELECT id, name, price_paise, quantity
    FROM order_items
    WHERE order_id = ${id}
  `

  return json({ ...order, items })
}

export async function onRequestPost(context) {
  const { request, env } = context
  const body = await request.json()
  const { screen_id, seat_label, deliver_at, items } = body

  if (!screen_id || !seat_label) return errorResponse('screen_id and seat_label are required')
  if (!Array.isArray(items) || items.length === 0) return errorResponse('At least one item is required')

  const sql = getDb(env)

  const screens = await sql`SELECT id, theatre_id FROM screens WHERE id = ${screen_id}`
  if (screens.length === 0) return errorResponse('Screen not found', 404)
  const theatreId = screens[0].theatre_id

  const shows = await sql`
    SELECT id FROM shows WHERE screen_id = ${screen_id}
    ORDER BY show_time DESC LIMIT 1
  `
  const showId = shows[0]?.id || null

  const menuItemIds = items.map((i) => i.menu_item_id)
  const menuItems = await sql`
    SELECT id, name, price_paise FROM menu_items
    WHERE id = ANY(${menuItemIds}) AND theatre_id = ${theatreId} AND is_active = true
  `
  const menuById = Object.fromEntries(menuItems.map((m) => [m.id, m]))

  let totalPaise = 0
  const resolvedItems = []
  for (const line of items) {
    const menuItem = menuById[line.menu_item_id]
    if (!menuItem) return errorResponse('Invalid menu item in cart')
    const quantity = Math.max(1, parseInt(line.quantity, 10) || 1)
    totalPaise += menuItem.price_paise * quantity
    resolvedItems.push({ ...menuItem, quantity })
  }

  const deliverAtValue = deliver_at === 'now' ? 'now' : 'interval'

  const inserted = await sql`
    INSERT INTO orders (theatre_id, screen_id, show_id, seat_label, deliver_at, status, total_paise)
    VALUES (${theatreId}, ${screen_id}, ${showId}, ${seat_label}, ${deliverAtValue}, 'pending_payment', ${totalPaise})
    RETURNING id, order_number
  `
  const order = inserted[0]

  for (const item of resolvedItems) {
    await sql`
      INSERT INTO order_items (order_id, menu_item_id, name, price_paise, quantity)
      VALUES (${order.id}, ${item.id}, ${item.name}, ${item.price_paise}, ${item.quantity})
    `
  }

  return json({ id: order.id, order_number: order.order_number, total_paise: totalPaise })
}
