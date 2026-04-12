import { NextRequest } from 'next/server'
import { createAuthClient } from '@/lib/supabase'

async function getAuthClient(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return { supabase: createAuthClient(token) }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthClient(request)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  let body: { memo?: string; diary_text?: string }
  try { body = await request.json() }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const fields: Record<string, string> = {}
  if (typeof body.memo === 'string') fields.memo = body.memo
  if (typeof body.diary_text === 'string') fields.diary_text = body.diary_text
  if (Object.keys(fields).length === 0) {
    return Response.json({ error: 'No valid fields' }, { status: 400 })
  }

  const { supabase } = auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('photos').update(fields)
    .eq('id', id).eq('user_id', user.id)
    .select().single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthClient(request)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { supabase } = auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: photo } = await supabase
    .from('photos').select('storage_path')
    .eq('id', id).eq('user_id', user.id).single()

  if (!photo) return Response.json({ error: 'Not found' }, { status: 404 })

  await supabase.storage.from('photos').remove([photo.storage_path])

  const { error } = await supabase
    .from('photos').delete()
    .eq('id', id).eq('user_id', user.id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return new Response(null, { status: 204 })
}
