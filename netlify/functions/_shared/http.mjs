export function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
    body: JSON.stringify(body),
  }
}

export function methodNotAllowed(allowed = ['POST']) {
  return json(405, {
    success: false,
    error: `Method not allowed. Use ${allowed.join(', ')}`,
  })
}

export function parseJsonBody(event) {
  try {
    return event.body ? JSON.parse(event.body) : {}
  } catch {
    throw new Error('INVALID_JSON_BODY')
  }
}
