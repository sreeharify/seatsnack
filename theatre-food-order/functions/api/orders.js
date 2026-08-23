import { getDb, json, errorResponse } from '../_lib/db.js'

export async function onRequestGet(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const screenId = url.searchParams.get('screen_id')
  if (!screenId) return errorResponse('screen_id is required')

  const sql = getDb(env)

  const orders = await sql`
    SELECT id, order_number, seat_label, deliver_at, status, total_paise, created_at
    FROM orders
    WHERE screen_id = ${screenId}
      AND status IN ('confirmed', 'preparing', 'ready')
    ORDER BY created_at ASC
  `

  const orderIds = orders.map((o) => o.id)
  let items = []
  if (orderIds.length > 0) {
    items = await sql`
      SELECT id, order_id, name, price_paise, quantity
      FROM order_items
      WHERE order_id = ANY(${orderIds})
    `
  }

  const itemsByOrder = {}
  for (const item of items) {
    if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = []
    itemsByOrder[item.order_id].push(item)
  }

  const result = orders.map((o) => ({ ...o, items: itemsByOrder[o.id] || [] }))

  return json({ orders: result })
}
