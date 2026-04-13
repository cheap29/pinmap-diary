import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export type Photo = {
  id: string
  user_id: string
  storage_path: string
  taken_at: string | null
  lat: number | null
  lng: number | null
  has_location: boolean
  location_name: string | null
  diary_text: string | null
  persona: string | null
  memo: string | null
  created_at: string
}

// ダミーセッション（デモモード用）
const dummySession = {
  access_token: 'dummy-token',
  user: { id: 'dummy-user-id', email: 'demo@example.com' },
}

// デモモード用のモッククライアント
function createMockClient() {
  const mockQuery = {
    select: () => mockQuery,
    order: () => mockQuery,
    eq: () => mockQuery,
    filter: () => mockQuery,
    insert: () => mockQuery,
    update: () => mockQuery,
    single: () => Promise.resolve({ data: null, error: null }),
    then: (resolve: (val: { data: Photo[]; error: null }) => unknown) =>
      Promise.resolve({ data: [] as Photo[], error: null }).then(resolve),
  }

  return {
    auth: {
      getSession: () =>
        Promise.resolve({ data: { session: dummySession }, error: null }),
      getUser: () =>
        Promise.resolve({ data: { user: dummySession.user }, error: null }),
      signInWithOtp: () => Promise.resolve({ error: null }),
      signOut: () => Promise.resolve({ error: null }),
    },
    from: (_table: string) => mockQuery,
    storage: {
      from: (_bucket: string) => ({
        upload: () => Promise.resolve({ error: null }),
        createSignedUrl: (_path: string, _expires: number) =>
          Promise.resolve({ data: { signedUrl: '' }, error: null }),
        remove: (_paths: string[]) => Promise.resolve({ error: null }),
      }),
    },
  }
}

export const supabase = isDemoMode
  ? (createMockClient() as unknown as ReturnType<typeof createClient>)
  : createClient(supabaseUrl, supabaseAnonKey)

export function getPublicUrl(storagePath: string): string {
  return `${supabaseUrl}/storage/v1/object/public/photos/${storagePath}`
}

export function createAuthClient(accessToken: string) {
  if (isDemoMode) {
    return createMockClient() as unknown as ReturnType<typeof createClient>
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })
}
