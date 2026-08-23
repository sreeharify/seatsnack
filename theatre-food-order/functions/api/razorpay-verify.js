import { getDb, json, errorResponse } from '../_lib/db.js'
import { verifyRazorpaySignature } from '../_lib/razorpay.js'

export async function onRequestPost(context) {
  const { request, env } = context
  const { order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json()

  if (!order_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return errorResponse('Missing verification fields')
  }

  const valid = await verifyRazorpaySignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
    secret: env.RAZORPAY_KEY_SECRET
  })

  if (!valid) return errorResponse('Signature verification failed', 400)

  const sql = getDb(env)
  const updated = await sql`
    UPDATE orders
    SET status = 'confirmed', razorpay_payment_id = ${razorpay_payment_id}, updated_at = now()
    WHERE id = ${order_id} AND razorpay_order_id = ${razorpay_order_id}
    RETURNING id, status
  `
  if (updated.length === 0) return errorResponse('Order not found or order id mismatch', 404)

  return json({ success: true, ...updated[0] })
}
