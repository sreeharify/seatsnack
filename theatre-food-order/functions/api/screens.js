import { getDb, json } from '../_lib/db.js'

export async function onRequestGet(context) {
  const { env } = context
  const sql = getDb(env)
  const rows = await sql`
    SELECT s.id, s.name, s.theatre_id, t.name AS theatre_name
    FROM screens s
    JOIN theatres t ON t.id = s.theatre_id
    ORDER BY t.name, s.name
  `
  return json({ screens: rows })
}
