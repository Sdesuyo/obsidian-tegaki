import { requestUrl } from "obsidian";

const MODELS: Record<"fast" | "accurate", string> = {
	fast:     "claude-haiku-4-5-20251001",
	accurate: "claude-sonnet-4-6",
};

const PROMPTS: Record<"full" | "handwriting", Record<"en" | "ja", string>> = {
	full: {
		en:
			"Extract ALL text from this image — both printed text AND handwritten annotations " +
			"(including text in different colors, circled notes, arrow labels, and scribbles).\n" +
			"Format: first output the main printed content preserving its structure, " +
			"then add a section '## Handwritten notes' listing all handwritten annotations.\n" +
			"Output only the extracted text, no explanations.",
		ja:
			"この画像に含まれるすべてのテキストを抽出してください。印刷テキストだけでなく、" +
			"手書きの注釈（異なる色の文字・丸で囲んだメモ・矢印のラベル・走り書き）も必ずすべて含めてください。\n" +
			"形式：まず印刷テキストを構造を保って出力し、次に「## 手書きメモ」セクションに手書き注釈をまとめてください。\n" +
			"テキストのみ出力してください。説明は不要です。",
	},
	handwriting: {
		en:
			"Extract ONLY the handwritten text from this image. " +
			"Ignore all printed or typed text completely.\n" +
			"Output just the handwritten words and phrases as a simple bullet list. " +
			"No descriptions, no explanations, no location info — text values only.",
		ja:
			"この画像から手書きの文字のみを抽出してください。印刷・タイプされたテキストはすべて無視してください。\n" +
			"手書きの文字を箇条書きで出力してください。\n" +
			"位置の説明・注釈の説明は不要です。文字そのものだけを出力してください。",
	},
};

export async function ocrWithClaude(
	base64: string,
	mimeType: string,
	apiKey: string,
	promptType: "full" | "handwriting" = "full",
	language: "en" | "ja" = "en",
	quality: "fast" | "accurate" = "fast"
): Promise<string> {
	const res = await requestUrl({
		url: "https://api.anthropic.com/v1/messages",
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"x-api-key": apiKey,
			"anthropic-version": "2023-06-01",
		},
		body: JSON.stringify({
			model: MODELS[quality],
			max_tokens: 4096,
			messages: [{
				role: "user",
				content: [
					{ type: "image", source: { type: "base64", media_type: mimeType, data: base64 } },
					{ type: "text", text: PROMPTS[promptType][language] },
				],
			}],
		}),
		throw: false,
	});

	if (res.status >= 400) {
		const msg = res.json?.error?.message ?? `Claude API error: HTTP ${res.status}`;
		throw new Error(msg);
	}

	const text = res.json?.content?.[0]?.text;
	if (!text) throw new Error("Claude returned empty response.");
	return text;
}
