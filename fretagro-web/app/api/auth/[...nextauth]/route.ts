// app/api/auth/[...nextauth]/route.ts — Next-Auth v5 catch-all route handler
// FR-003: login via Credentials provider (Supabase Auth), role-based session.
// Delegates all logic to lib/auth/config.ts (Principle II).

import { handlers } from '@/lib/auth/config'

export const { GET, POST } = handlers
