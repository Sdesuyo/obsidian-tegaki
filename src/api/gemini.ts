const MODEL = "gemini-2.5-flash";

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
			"Extract ONLY the handwritten text and annotations from this image. " +
			"Ignore all printed or typed text completely.\n" +
			"For each handwritten element, include its location and what it refers to " +
			"(e.g. 'top-right: good', 'circling the left list: 解析', 'arrow pointing to diagram: →').\n" +
			"Format as a bullet list. Output only handwritten content, no explanations.",
		ja:
			"この画像から手書きのテキストと注釈のみを抽出してください。印刷・タイプされたテキストはすべて無視してください。\n" +
			"各手書き要素について、画像内の位置と何を指しているかを含めてください。\n" +
			"（例：「右上: good」「左のリストを囲む丸: 解析」「図に向かう矢印: →」）\n" +
			"箇条書きで出力してください。手書きの内容のみ、説明は不要です。",
	},
};

export async function ocrWithGemini(
	base64: string,
	mimeType: string,
	apiKey: string,
	promptType: "full" | "handwriting" = "full",
	language: "en" | "ja" = "en"
): Promise<string> {
	const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

	const res = await fetch(url, {
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
	});

	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(err.error?.message ?? `Gemini API error: HTTP ${res.status}`);
	}

	const data = await res.json();
	const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
	if (!text) throw new Error("Gemini returned empty response.");
	return text;
}
