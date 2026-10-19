// Shared auth guard for API routes.
//
// Six routes called supabaseAuth.auth.getUser(token) outside any try/catch.
// getUser THROWS on a malformed or truncated token rather than returning an
// error, so a junk Authorization header produced an unhandled rejection and a
// 500 instead of a clean 401. This wraps it once so every route behaves the
// same way.
//
// Returns { user } on success or { error, status } on failure — never throws.
export async function requireUser(supabaseAuth, req) {
  const header = req.headers?.authorization
  const token = typeof header === 'string' ? header.replace('Bearer ', '').trim() : ''
  if (!token) return { error: 'Unauthorized', status: 401 }

  try {
    const { data, error } = await supabaseAuth.auth.getUser(token)
    if (error || !data?.user) return { error: 'Unauthorized', status: 401 }
    return { user: data.user }
  } catch (e) {
    console.error('Auth verification threw:', e?.message || e)
    return { error: 'Unauthorized', status: 401 }
  }
}
