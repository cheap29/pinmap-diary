import { NextRequest } from 'next/server'
import { createAuthClient } from '@/lib/supabase'
import { generateDiary } from '@/lib/openai'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAuthClient(token)
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .order('taken_at', { ascending: false, nullsFirst: false })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data)
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAuthClient(token)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return Response.json({ error: 'No file provided' }, { status: 400 })
  }

  // クライアント送信の EXIF を優先（リサイズで EXIF が消えるため）
  const clientTakenAt = formData.get('takenAt')
  const clientLat = formData.get('lat')
  const clientLng = formData.get('lng')

  let takenAt: string | null = typeof clientTakenAt === 'string' && clientTakenAt ? clientTakenAt : null
  let lat: number | null = typeof clientLat === 'string' && clientLat ? parseFloat(clientLat) : null
  let lng: number | null = typeof clientLng === 'string' && clientLng ? parseFloat(clientLng) : null
  let hasLocation = lat !== null && lng !== null

  // Supabase Storageへアップロード
  const ext = file.name.split('.').pop() ?? 'jpg'
  const storagePath = `${user.id}/${Date.now()}.${ext}`
  const arrayBuffer = await file.arrayBuffer()
  const uint8Array = new Uint8Array(arrayBuffer)

  const { error: storageError } = await supabase.storage
    .from('photos')
    .upload(storagePath, uint8Array, {
      contentType: file.type,
      upsert: false,
    })

  if (storageError) {
    return Response.json({ error: storageError.message }, { status: 500 })
  }

  // 逆ジオコーディング（緯度経度→地名）
  let locationName: string | null = null
  if (lat !== null && lng !== null) {
    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ja`,
        { headers: { 'User-Agent': 'pinmap-diary/1.0' } }
      )
      if (geoRes.ok) {
        const geoData = await geoRes.json()
        const addr = geoData.address ?? {}
        const state = addr.state ?? addr.province ?? ''
        const city = addr.city ?? addr.county ?? addr.town ?? addr.village ?? ''
        const combined = `${state}${city}`.trim()
        if (combined) locationName = combined
      }
    } catch {
      // 取得失敗は無視して続行
    }
  }

  // ペルソナキー
  const personaKey = formData.get('personaKey')
  const persona = typeof personaKey === 'string' && personaKey ? personaKey : null

  // AI日記生成
  const customPrompt = formData.get('customPrompt')
  let diaryText: string | null = null
  try {
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    diaryText = await generateDiary(
      base64,
      file.type,
      typeof customPrompt === 'string' && customPrompt ? customPrompt : undefined,
    )
  } catch (err) {
    // Storageにアップロード済みのファイルを削除してロールバック
    await supabase.storage.from('photos').remove([storagePath])
    const message = err instanceof Error ? err.message : 'AI日記の生成に失敗しました'
    return Response.json({ error: `AI日記の生成に失敗しました: ${message}` }, { status: 500 })
  }

  // DBに保存
  const { data: photo, error: dbError } = await supabase
    .from('photos')
    .insert({
      user_id: user.id,
      storage_path: storagePath,
      taken_at: takenAt,
      lat,
      lng,
      has_location: hasLocation,
      location_name: locationName,
      diary_text: diaryText,
      persona,
      memo: null,
    })
    .select()
    .single()

  if (dbError) {
    return Response.json({ error: dbError.message }, { status: 500 })
  }

  return Response.json(photo, { status: 201 })
}
