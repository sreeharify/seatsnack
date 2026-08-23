import { getDb, json, errorResponse } from '../../_lib/db.js'

const RESOURCES = ['theatres', 'screens', 'shows', 'menu_items']

export async function onRequestGet(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const pin = url.searchParams.get('admin_pin')
  if (pin !== env.ADMIN_PIN) return errorResponse('Invalid admin PIN', 401)

  const resource = url.searchParams.get('resource')
  if (!RESOURCES.includes(resource)) return errorResponse('Unknown resource')

  const sql = getDb(env)
  let rows
  if (resource === 'theatres') rows = await sql`SELECT * FROM theatres ORDER BY name`
  if (resource === 'screens') rows = await sql`SELECT * FROM screens ORDER BY name`
  if (resource === 'shows') rows = await sql`SELECT * FROM shows ORDER BY show_time DESC`
  if (resource === 'menu_items') rows = await sql`SELECT * FROM menu_items ORDER BY name`

  return json({ rows })
}

export async function onRequestPost(context) {
  const { request, env } = context
  const body = await request.json()
  const { resource, action, admin_pin, payload } = body

  if (admin_pin !== env.ADMIN_PIN) return errorResponse('Invalid admin PIN', 401)
  if (!RESOURCES.includes(resource)) return errorResponse('Unknown resource')
  if (!['create', 'update'].includes(action)) return errorResponse('Unknown action')

  const sql = getDb(env)

  if (resource === 'theatres' && action === 'create') {
    const rows = await sql`INSERT INTO theatres (name) VALUES (${payload.name}) RETURNING *`
    return json(rows[0])
  }

  if (resource === 'screens' && action === 'create') {
    const rows = await sql`
      INSERT INTO screens (theatre_id, name) VALUES (${payload.theatre_id}, ${payload.name}) RETURNING *
    `
    return json(rows[0])
  }

  if (resource === 'shows' && action === 'create') {
    const rows = await sql`
      INSERT INTO shows (screen_id, movie_name, show_time, interval_time)
      VALUES (${payload.screen_id}, ${payload.movie_name}, ${payload.show_time}, ${payload.interval_time || null})
      RETURNING *
    `
    return json(rows[0])
  }

  if (resource === 'menu_items' && action === 'create') {
    const rows = await sql`
      INSERT INTO menu_items (theatre_id, name, price_paise, is_active)
      VALUES (${payload.theatre_id}, ${payload.name}, ${payload.price_paise}, true)
      RETURNING *
    `
    return json(rows[0])
  }

  if (resource === 'menu_items' && action === 'update') {
    const rows = await sql`
      UPDATE menu_items SET is_active = ${payload.is_active} WHERE id = ${payload.id} RETURNING *
    `
    return json(rows[0])
  }

  return errorResponse('Unsupported resource/action combination')
}
