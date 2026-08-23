// Verifies a Razorpay payment signature using the Web Crypto API
// (Cloudflare Workers don't have Node's `crypto` module, but they do
// implement the standard SubtleCrypto API).
export async function verifyRazorpaySignature({ orderId, paymentId, signature, secret }) {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const payload = `${orderId}|${paymentId}`
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  const expected = [...new Uint8Array(mac)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return expected === signature
}

export async function createRazorpayOrder({ keyId, keySecret, amountPaise, receipt }) {
  const auth = btoa(`${keyId}:${keySecret}`)
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      receipt: String(receipt)
    })
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error?.description || 'Razorpay order creation failed')
  }
  return data
}
