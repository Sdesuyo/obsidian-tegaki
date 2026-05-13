import { requestUrl } from "obsidian";

const MODELS: Record<"fast" | "accurate", string> = {
	fast:     "gemini-2.5-flash",
	accurate: "gemini-2.5-pro",
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

export async function ocrWithGemini(
	base64: string,
	mimeType: string,
	apiKey: string,
	promptType: "full" | "handwriting" = "full",
	language: "en" | "ja" = "en",
	quality: "fast" | "accurate" = "fast"
): Promise<string> {
	const model = MODELS[quality];
	const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

	const res = await requestUrl({
		url,
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			contents: [{
				parts: [
					{ inline_data: { mime_type: mimeType, data: base64 } },
					{ text: PROMPTS[promptType][language] },
				],
			}],
		}),
		throw: false,
	});

	if (res.status >= 400) {
		const msg = res.json?.error?.message ?? `Gemini API error: HTTP ${res.status}`;
		throw new Error(msg);
	}

	const text = res.json?.candidates?.[0]?.content?.parts?.[0]?.text;
	if (!text) throw new Error("Gemini returned empty response.");
	return text;
}
