import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const BASE_PROMPT = `この写真を見て、撮影した人の視点で日記を書いてください。
・日本語で200文字前後
・です・ます調
・感情や情景を丁寧に描写する
・押しつけがましくなく、じわっとくる文章で
・2〜3文ごとに改行を入れて読みやすくしてください
・最後の行にこの写真に合うタグを3〜5個、#タグ の形式のみで書いてください（例: #散歩 #晴れ #カフェ）`

export async function generateDiary(
  imageBase64: string,
  mimeType: string,
  customPrompt?: string,
): Promise<string> {
  const prompt = customPrompt
    ? `${BASE_PROMPT}\n\n【キャラクター指示】${customPrompt}`
    : BASE_PROMPT

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${imageBase64}` },
          },
          { type: 'text', text: prompt },
        ],
      },
    ],
  })

  return response.choices[0]?.message?.content ?? ''
}
