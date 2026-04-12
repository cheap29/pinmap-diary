# pinmap-diary

> 生きてきた、ここにいた。

写真を撮ってアップロードするだけで、AIが日記を書いてくれるWebアプリです。撮影日時・位置情報を自動取得し、タイムライン・カレンダー・マップで思い出を振り返れます。

---

## 機能

- **AI日記生成** — 写真をアップロードするとGPT-4o-miniが日記を自動生成
- **ペルソナ選択** — 8種類のキャラクター（優しいお兄さん・ギャル・関西のおっさんなど）で口調を変えられる
- **タグ自動生成** — AIが日記末尾に `#タグ` を自動付与、個別削除も可能
- **タイムライン** — 月別グループ表示、日記のインライン編集・削除に対応
- **カレンダー** — 月次グリッド、付箋スタイルのサムネイル表示
- **マップ** — 位置情報付き写真を地図上にピン表示、日記からマップへの直接ジャンプ
- **逆ジオコーディング** — 撮影座標から都道府県・市区町村名を自動取得（Nominatim使用）
- **メモ追記** — 各写真にひとことメモを追加可能

---

## 技術スタック

| 項目 | 内容 |
|---|---|
| フレームワーク | Next.js 16（App Router） |
| 言語 | TypeScript |
| UI | Chakra UI v3 |
| 認証 / DB / Storage | Supabase |
| AI | OpenAI gpt-4o-mini（Vision） |
| 地図 | MapLibre GL + react-map-gl |
| EXIF抽出 | exifr |
| フォント | Noto Sans JP / Mamelon |

---

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local` を作成し、以下を設定してください。

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

### 3. Supabaseのセットアップ

Supabaseダッシュボードで以下のSQLを実行してください。

```sql
create table photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  storage_path text not null,
  taken_at timestamptz,
  lat float8,
  lng float8,
  has_location boolean default false,
  location_name text,
  diary_text text,
  persona text,
  memo text,
  created_at timestamptz default now()
);
```

Storageに `photos` バケットを作成し、ポリシーで `bucket_id = 'photos'` のアクセスを許可してください。

### 4. 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) で確認できます。

---

## ディレクトリ構成

```
src/
├── app/
│   ├── api/photos/       # 写真アップロード・編集・削除API
│   ├── calendar/         # カレンダー画面
│   ├── login/            # ログイン画面
│   ├── map/              # マップ画面
│   ├── settings/         # ペルソナ・追加指示設定
│   ├── timeline/         # タイムライン画面（初期画面）
│   ├── upload/           # 写真アップロード画面
│   ├── globals.css       # グローバルスタイル・フォント定義
│   └── style.css         # コンポーネント別カスタムスタイル
├── components/
│   ├── AppHeader.tsx     # 共通ヘッダー（設定ボタン含む）
│   ├── BottomNav.tsx     # ボトムナビ＋フロートボタン
│   ├── MapView.tsx       # マップコンポーネント
│   └── PhotoCard.tsx     # 写真・日記カード
└── lib/
    ├── openai.ts         # AI日記生成
    ├── personas.ts       # ペルソナ定義
    ├── personaDisplay.ts # ペルソナUI情報（アイコン・説明）
    └── supabase.ts       # Supabaseクライアント・型定義
```

---

## 注意事項

- **位置情報について** — iOS SafariはEXIF GPSをブラウザに渡す際に削除します。位置情報を記録したい場合はスマホから直接アクセスするか、USBケーブルで転送した元ファイルをアップロードしてください。
- **OpenStreetMapタイル** — ズームレベルは最大19までです。
- **RLS** — 現在は開発用にRLS無効設定です。本番運用前に適切なポリシーを設定してください。
