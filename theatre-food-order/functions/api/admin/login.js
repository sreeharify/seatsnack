import { json, errorResponse } from '../../_lib/db.js'

export async function onRequestPost(context) {
  const { request, env } = context
  const { pin } = await request.json()
  if (!env.ADMIN_PIN) return errorResponse('ADMIN_PIN not configured on server', 500)
  if (pin !== env.ADMIN_PIN) return errorResponse('Invalid PIN', 401)
  return json({ ok: true })
}
