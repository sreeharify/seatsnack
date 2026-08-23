import { getDb, json, errorResponse } from '../_lib/db.js'
import { createRazorpayOrder } from '../_lib/razorpay.js'

export async function onRequestPost(context) {
  const { request, env } = context
  const { order_id } = await request.json()
  if (!order_id) return errorResponse('order_id is required')

  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    return errorResponse('Razorpay keys not configured on server', 500)
  }

  const sql = getDb(env)
  const orders = await sql`SELECT id, order_number, total_paise FROM orders WHERE id = ${order_id}`
  if (orders.length === 0) return errorResponse('Order not found', 404)
  const order = orders[0]

  const rzpOrder = await createRazorpayOrder({
    keyId: env.RAZORPAY_KEY_ID,
    keySecret: env.RAZORPAY_KEY_SECRET,
    amountPaise: order.total_paise,
    receipt: order.order_number
  })

  await sql`UPDATE orders SET razorpay_order_id = ${rzpOrder.id} WHERE id = ${order_id}`

  return json({
    razorpay_order_id: rzpOrder.id,
    amount: rzpOrder.amount,
    currency: rzpOrder.currency,
    key_id: env.RAZORPAY_KEY_ID
  })
}
