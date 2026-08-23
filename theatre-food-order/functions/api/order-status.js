import { getDb, json, errorResponse } from '../_lib/db.js'

const ALLOWED = ['confirmed', 'preparing', 'ready', 'delivered', 'cancelled']

export async function onRequestPost(context) {
  const { request, env } = context
  const body = await request.json()
  const { order_id, status, staff_pin } = body

  if (staff_pin !== env.STAFF_PIN) return errorResponse('Invalid staff PIN', 401)
  if (!order_id || !ALLOWED.includes(status)) return errorResponse('Invalid request')

  const sql = getDb(env)
  const updated = await sql`
    UPDATE orders SET status = ${status}, updated_at = now()
    WHERE id = ${order_id}
    RETURNING id, status
  `
  if (updated.length === 0) return errorResponse('Order not found', 404)

  return json(updated[0])
}
