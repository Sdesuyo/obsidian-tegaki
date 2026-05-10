# TEGAKI — Handwriting OCR for Obsidian

Convert handwritten notes, whiteboard photos, and slide screenshots into searchable Obsidian notes using AI Vision APIs.

手書きメモ・ホワイトボード写真・スライドのスクショを、AIを使って検索可能なObsidianノートに変換するプラグインです。

---

## What TEGAKI does / できること

TEGAKI sends your image to an AI Vision API (Gemini Flash or Claude Haiku) and extracts:

1. **All printed text** — preserving structure and layout
2. **Handwritten annotations** — including their position context

Example output for a slide with handwritten notes:

```
## Handwritten notes
- top-right: good ✓
- circling the left list: 解析
- arrow pointing to 介入群: →
- bottom-right: Font も.
```

Unlike generic OCR, TEGAKI understands **where** annotations are written — circles, arrows, margin notes — not just what they say.

手書きのテキストだけでなく、「どこに何を書いたか」まで抽出します。丸で囲んだ部分・矢印の向き・余白のメモが位置情報付きで記録されます。

---

## Commands / コマンド

Both commands are available via `Ctrl+P`:

| Command | Description |
|---------|-------------|
| **OCR: append to note** | Full OCR (printed + handwritten). Appends result to current note. |
| **OCR: handwriting only** | Extracts only handwritten annotations with position context. |

---

## Privacy / プライバシー

> **Images are sent to external APIs for OCR processing.**
> Do not use this plugin on images containing sensitive or confidential information unless you have reviewed and accepted the respective provider's privacy policy.
> - [Google Privacy Policy](https://policies.google.com/privacy)
> - [Anthropic Privacy Policy](https://www.anthropic.com/privacy)
>
> **OCR処理を行うと、画像が外部API（Google Gemini または Anthropic Claude）に送信されます。**
> 機密情報や個人情報が含まれる画像には使用しないでください。
>
> Your API key is stored locally in your Obsidian vault (`data.json`). It is never sent to any server other than the respective AI provider.
> APIキーはObsidianのvault内（`data.json`）にローカル保存されます。AIプロバイダー以外のサーバーには送信されません。

---

## Setup / セットアップ

1. Install TEGAKI from Obsidian Community Plugins
   Obsidianのコミュニティプラグインからインストール
2. Go to **Settings → TEGAKI**
   設定 → TEGAKI を開く
3. Select your OCR engine / OCRエンジンを選択：
   - **Gemini Flash** (default) — 1,500 free requests/day, no credit card required / 1日1,500回まで無料
   - **Claude Haiku** — higher accuracy on complex handwriting, paid API / 複雑な手書きに強い、有料
4. Paste your API key / APIキーを貼り付ける

---

## About image files in your vault / 画像ファイルについて

When you paste an image into an Obsidian note, **Obsidian automatically saves it as a file inside your vault** — this is standard Obsidian behavior, not something TEGAKI does.

> ⚠️ If you delete an image file from your vault, the embed in your note (`![[image.png]]`) will break and the image will no longer display. TEGAKI does not manage or delete image files; please be careful when cleaning up your vault.

On the bright side: every saved image becomes a node in your **Graph View**. Organize your images into folders, link them from notes, and enjoy watching your knowledge graph grow. ✦

Obsidianのノートに画像を貼り付けると、**Obsidianが自動でvault内にファイルとして保存します**。これはObsidianの標準機能です（TEGAKIとは無関係です）。

---

## Supported formats / 対応フォーマット

JPEG, PNG, WebP, GIF

---

## Roadmap / 今後の予定

- [ ] Numbered region selection: click regions in order → OCR in that sequence
- [ ] Multi-image selection modal when note contains multiple images

---

## License

MIT
