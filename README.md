# TEGAKI — Handwriting OCR for Obsidian

Convert handwritten notes, whiteboard photos, and slide screenshots into searchable Obsidian notes using AI Vision APIs.

手書きメモ・ホワイトボード写真・スライドのスクショを、AIを使って検索可能なObsidianノートに変換するプラグインです。

---

## Key feature: Numbered region selection / 採番機能

Unlike other OCR plugins that read left-to-right automatically, TEGAKI lets you **decide the reading order**:

1. Open an image → click regions in the order you want them read
2. Each click places a numbered marker
3. Hit "OCR" → text is extracted in your specified order

他のOCRプラグインが自動で左上から読むのに対して、TEGAKIは**読む順番をあなたが決めます**：

1. 画像を開く → 読みたい順番にクリックして領域を選ぶ
2. クリックした箇所に番号マーカーが付く
3. 「OCR」を実行 → 指定した順番でテキスト化

商談メモ・ホワイトボード・手帳の殴り書きなど、散り書きされたメモに最適です。

---

## Privacy / プライバシー

> **Images are sent to external APIs for OCR processing.**
> Do not use this plugin on images containing sensitive or confidential information unless you have reviewed and accepted the respective provider's privacy policy.
> - [Google Privacy Policy](https://policies.google.com/privacy)
> - [Anthropic Privacy Policy](https://www.anthropic.com/privacy)
>
> **OCR処理を行うと、画像が外部API（Google Gemini または Anthropic Claude）に送信されます。**
> 機密情報や個人情報が含まれる画像には使用しないでください。
> お使いのAPIプロバイダーのプライバシーポリシーを必ずご確認ください。
>
> Your API key is stored locally in your Obsidian vault (`data.json`). It is never sent to any server other than the respective AI provider.
> APIキーはObsidianのvault内（`data.json`）にローカル保存されます。AIプロバイダー以外のサーバーには送信されません。

---

## Setup / セットアップ

1. Install TEGAKI from Obsidian Community Plugins
   Obsidianのコミュニティプラグインからインストール
2. Go to **Settings → TEGAKI**
   設定 → TEGAKI を開く
3. Select your OCR engine:
   OCRエンジンを選択：
   - **Gemini Flash** (default) — 1,500 free requests/day, no credit card required / 1日1,500回まで無料
   - **Claude Haiku** — higher accuracy on complex handwriting, paid API / 複雑な手書きに強い、有料
4. Paste your API key / APIキーを貼り付ける

---

## About image files in your vault / 画像ファイルについて

When you paste an image into an Obsidian note, **Obsidian automatically saves it as a file inside your vault** — this is standard Obsidian behavior, not something TEGAKI does.

> ⚠️ If you delete an image file from your vault, the embed in your note (`![[image.png]]`) will break and the image will no longer display. TEGAKI does not manage or delete image files; please be careful when cleaning up your vault.

On the bright side: every saved image becomes a node in your **Graph View**. Organize your images into folders, link them from notes, and enjoy watching your knowledge graph grow. ✦

Obsidianのノートに画像を貼り付けると、**Obsidianが自動でvault内にファイルとして保存します**。これはObsidianの標準機能です（TEGAKIとは無関係です）。

> ⚠️ vault内の画像ファイルを削除すると、ノート内のembed（`![[image.png]]`）が壊れて画像が表示されなくなります。ファイルの整理をする際はご注意ください。

画像ファイルはグラフビューのノードにもなります。フォルダに整理してリンクを育てていくと、ナレッジグラフが美しく広がっていきます。ぜひ楽しんでみてください。✦

---

## Supported formats / 対応フォーマット

JPEG, PNG, WebP, GIF

---

## License

MIT
