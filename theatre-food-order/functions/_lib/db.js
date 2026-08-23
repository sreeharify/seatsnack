import { neon } from '@neondatabase/serverless'

export function getDb(env) {
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set')
  }
  return neon(env.DATABASE_URL)
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

export function errorResponse(message, status = 400) {
  return json({ error: message }, status)
}
