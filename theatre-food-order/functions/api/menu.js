import { getDb, json, errorResponse } from '../_lib/db.js'

export async function onRequestGet(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const screenId = url.searchParams.get('screen_id')

  if (!screenId) return errorResponse('screen_id is required')

  const sql = getDb(env)

  const screens = await sql`
    SELECT s.id, s.name, s.theatre_id, t.name AS theatre_name
    FROM screens s
    JOIN theatres t ON t.id = s.theatre_id
    WHERE s.id = ${screenId}
  `
  if (screens.length === 0) return errorResponse('Screen not found', 404)
  const screen = screens[0]

  const shows = await sql`
    SELECT id, movie_name, show_time, interval_time
    FROM shows
    WHERE screen_id = ${screenId}
    ORDER BY show_time DESC
    LIMIT 1
  `

  const items = await sql`
    SELECT id, name, price_paise
    FROM menu_items
    WHERE theatre_id = ${screen.theatre_id} AND is_active = true
    ORDER BY name ASC
  `

  return json({
    theatre: { id: screen.theatre_id, name: screen.theatre_name },
    screen: { id: screen.id, name: screen.name },
    show: shows[0] || null,
    items
  })
}
