import { App, FuzzySuggestModal, Notice, Plugin, PluginSettingTab, Setting, TFile } from "obsidian";
import { ocrWithGemini } from "./api/gemini";
import { ocrWithClaude } from "./api/claude";

const IMAGE_EXTS = ["jpg", "jpeg", "png", "webp", "gif"];

// ![[image.png]] / ![[image.png|377]] / ![alt](path) の全形式を検出
const EMBED_RE = /!\[\[([^\]|]+\.(?:jpg|jpeg|png|webp|gif))(?:\|[^\]]*)?\]\]|!\[.*?\]\(([^)]+\.(?:jpg|jpeg|png|webp|gif))\)/gi;

function findEmbeddedImages(content: string): string[] {
	const found: string[] = [];
	let m: RegExpExecArray | null;
	EMBED_RE.lastIndex = 0;
	while ((m = EMBED_RE.exec(content)) !== null) {
		// ![[image.png|377]] の |サイズ指定 を除去
		const raw = m[1] ?? m[2];
		found.push(raw.split("|")[0].trim());
	}
	return found;
}

interface TegakiSettings {
	engine: "gemini" | "claude";
	geminiApiKey: string;
	claudeApiKey: string;
	language: "en" | "ja";
}

const DEFAULT_SETTINGS: TegakiSettings = {
	engine: "gemini",
	geminiApiKey: "",
	claudeApiKey: "",
	language: "en",
};

function arrayBufferToBase64(buf: ArrayBuffer): string {
	let binary = "";
	const bytes = new Uint8Array(buf);
	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

function mimeType(ext: string): string {
	const map: Record<string, string> = {
		jpg: "image/jpeg", jpeg: "image/jpeg",
		png: "image/png", webp: "image/webp", gif: "image/gif",
	};
	return map[ext.toLowerCase()] ?? "image/jpeg";
}

export default class TegakiPlugin extends Plugin {
	settings: TegakiSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new TegakiSettingTab(this.app, this));

		this.addCommand({
			id: "ocr-append",
			name: "OCR: append to note",
			callback: () => this.ocrActiveFile("append", "full"),
		});

		this.addCommand({
			id: "ocr-handwriting",
			name: "OCR: handwriting only",
			callback: () => this.ocrActiveFile("append", "handwriting"),
		});
	}

	async ocrActiveFile(mode: "append" | "replace" = "append", promptType: "full" | "handwriting" = "full") {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice("TEGAKI: ファイルを開いてから実行してください。");
			return;
		}

		const apiKey = this.settings.engine === "gemini"
			? this.settings.geminiApiKey
			: this.settings.claudeApiKey;

		if (!apiKey) {
			new Notice("TEGAKI: APIキーが設定されていません（設定 → TEGAKI）。");
			return;
		}

		// 画像ファイルを直接開いている場合
		if (IMAGE_EXTS.includes(activeFile.extension.toLowerCase())) {
			await this.runOcr(activeFile, null, mode, promptType);
			return;
		}

		// ノートに埋め込まれた画像を探す
		if (activeFile.extension === "md") {
			const content = await this.app.vault.read(activeFile);
			const names = findEmbeddedImages(content);

			if (names.length === 0) {
				new Notice("TEGAKI: No supported image found in this note.");
				return;
			}

			const imageFiles = names
				.map(n => this.app.vault.getFiles().find(f => f.name === n || f.path === n))
				.filter((f): f is TFile => f !== undefined);

			if (imageFiles.length === 0) {
				new Notice("TEGAKI: Image file not found in vault.");
				return;
			}

			if (imageFiles.length === 1) {
				await this.runOcr(imageFiles[0], activeFile, mode, promptType);
			} else {
				new ImagePickerModal(this.app, imageFiles, (chosen) => {
					this.runOcr(chosen, activeFile, mode, promptType);
				}).open();
			}
			return;
		}

		new Notice("TEGAKI: 対応ファイルを開いてから実行してください。");
	}

	async runOcr(imageFile: TFile, sourceNote: TFile | null, mode: "append" | "replace" = "append", promptType: "full" | "handwriting" = "full") {
		const notice = new Notice("TEGAKI: OCR処理中…", 0);

		try {
			const binary = await this.app.vault.readBinary(imageFile);
			const base64 = arrayBufferToBase64(binary);
			const mime = mimeType(imageFile.extension);

			let text: string;
			const lang = this.settings.language;
			if (this.settings.engine === "gemini") {
				text = await ocrWithGemini(base64, mime, this.settings.geminiApiKey, promptType, lang);
			} else {
				if (!this.settings.claudeApiKey) {
					throw new Error("Claude API key is not set (Settings → TEGAKI).");
				}
				text = await ocrWithClaude(base64, mime, this.settings.claudeApiKey, promptType, lang);
			}

			const sectionHeader = promptType === "handwriting"
				? (lang === "ja" ? "## 手書きメモ" : "## Handwritten notes")
				: (lang === "ja" ? "## TEGAKI OCR結果" : "## TEGAKI OCR");

			if (sourceNote) {
				const existing = await this.app.vault.read(sourceNote);
				await this.app.vault.modify(sourceNote, existing + `\n\n---\n\n${sectionHeader}\n\n` + text);
				new Notice("TEGAKI: Done — appended to note.");
			} else {
				const outputPath = imageFile.path.replace(/\.[^.]+$/, "_OCR.md");
				const existing = this.app.vault.getAbstractFileByPath(outputPath);
				if (existing instanceof TFile) {
					await this.app.vault.modify(existing, text);
				} else {
					await this.app.vault.create(outputPath, text);
				}
				const outputFile = this.app.vault.getAbstractFileByPath(outputPath);
				if (outputFile instanceof TFile) {
					await this.app.workspace.getLeaf().openFile(outputFile);
				}
				new Notice("TEGAKI: Done.");
			}
		} catch (e) {
			new Notice(`TEGAKI: Error — ${e.message}`);
		} finally {
			notice.hide();
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class ImagePickerModal extends FuzzySuggestModal<TFile> {
	private images: TFile[];
	private onChoose: (file: TFile) => void;

	constructor(app: App, images: TFile[], onChoose: (file: TFile) => void) {
		super(app);
		this.images = images;
		this.onChoose = onChoose;
		this.setPlaceholder("Select image to OCR…");
	}

	getItems(): TFile[] { return this.images; }
	getItemText(file: TFile): string { return file.name; }
	onChooseItem(file: TFile): void { this.onChoose(file); }
}

class TegakiSettingTab extends PluginSettingTab {
	plugin: TegakiPlugin;

	constructor(app: App, plugin: TegakiPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// Privacy notice — required for Obsidian community plugin review
		containerEl.createEl("div", {
			cls: "tegaki-privacy-notice",
		}).innerHTML = `
			<strong>⚠️ Privacy Notice / プライバシーに関するご注意</strong><br><br>
			Images you process with TEGAKI are sent to external APIs
			(Google Gemini or Anthropic Claude) to perform OCR.
			Do not use this plugin on images containing sensitive or confidential information
			unless you have reviewed and accepted the respective provider's privacy policy.<br><br>
			TEGAKIでOCR処理を行うと、画像が外部API（Google Gemini または Anthropic Claude）に送信されます。
			機密情報や個人情報が含まれる画像には使用しないでください。
			各プロバイダーのプライバシーポリシーを必ずご確認ください。<br><br>
			<a href="https://policies.google.com/privacy" target="_blank">Google Privacy Policy</a>
			&nbsp;|&nbsp;
			<a href="https://www.anthropic.com/privacy" target="_blank">Anthropic Privacy Policy</a>
		`;

		new Setting(containerEl).setName("Language / 言語").addDropdown((d) =>
			d
				.addOption("en", "English")
				.addOption("ja", "日本語")
				.setValue(this.plugin.settings.language)
				.onChange(async (v) => {
					this.plugin.settings.language = v as "en" | "ja";
					await this.plugin.saveSettings();
				})
		);

		new Setting(containerEl).setName("OCR engine").addDropdown((d) =>
			d
				.addOption("gemini", "Gemini Flash (default — 1,500 free req/day)")
				.addOption("claude", "Claude Haiku (higher accuracy, paid)")
				.setValue(this.plugin.settings.engine)
				.onChange(async (v) => {
					this.plugin.settings.engine = v as "gemini" | "claude";
					await this.plugin.saveSettings();
				})
		);

		new Setting(containerEl)
			.setName("Gemini API key")
			.setDesc("Get a free key at aistudio.google.com")
			.addText((t) => {
				t.inputEl.type = "password";
				t
					.setPlaceholder("AIza…")
					.setValue(this.plugin.settings.geminiApiKey)
					.onChange(async (v) => {
						this.plugin.settings.geminiApiKey = v.trim();
						await this.plugin.saveSettings();
					});
				return t;
			});

		new Setting(containerEl)
			.setName("Claude API key (optional)")
			.setDesc("Required only if you select Claude Haiku as engine")
			.addText((t) => {
				t.inputEl.type = "password";
				t
					.setPlaceholder("sk-ant-…")
					.setValue(this.plugin.settings.claudeApiKey)
					.onChange(async (v) => {
						this.plugin.settings.claudeApiKey = v.trim();
						await this.plugin.saveSettings();
					});
				return t;
			});
	}
}
