async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  })
  let data = null
  try {
    data = await res.json()
  } catch (e) {
    // no body
  }
  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`
    throw new Error(message)
  }
  return data
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) })
}
