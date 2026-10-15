// The dice-specific schema and preview; controls and code formats come from the shared builder.
import { VERSION } from "./dist/index.js";
import { KorokoroDie, KorokoroRoller } from "./dist/element.js";
import "./dist/element-define.js";
import { familyEmbedBuilder, FAMILY_EMBED_BUILDER_WORDS } from "./family-embed-builder.js";

const words = {
  en: {
    ...FAMILY_EMBED_BUILDER_WORDS.en,
    pitch: "Choose your dice, try a roll, and copy the code for your page.",
    name: "Korokoro is the Japanese sound of something small rolling.",
    nameLink: "About the name",
    foot: "The setup is in the link. The preview keeps no saved history.",
    toGallery: "The dice tray",
    makerRoller: "A dice tray",
    makerDie: "One die",
    makerRollerSays: "Dice notation, a result and optional controls.",
    makerDieSays: "A single die, which can roll or show a fixed face.",
    copyLink: "Copy a link to these dice"
  },
  ja: {
    ...FAMILY_EMBED_BUILDER_WORDS.ja,
    pitch: "ダイスを選んで振り、ページに埋め込むコードをコピーできます。",
    name: "「コロコロ」は、小さなものが転がる様子を表す言葉です。",
    nameLink: "名前について",
    foot: "設定はリンクに入ります。プレビューの履歴は保存しません。",
    toGallery: "ダイストレイ",
    makerRoller: "ダイストレイ",
    makerDie: "ダイス1個",
    makerRollerSays: "ダイス表記、結果、必要に応じた操作ボタンです。",
    makerDieSays: "振ったり、指定した面を表示したりできるダイス1個です。",
    copyLink: "このダイスへのリンクをコピー"
  },
};
const row = (id, kind, names, en, ja, extra = {}) => ({ id, group: "dice", kind, names, say: { en: { label: en[0], help: en[1] }, ja: { label: ja[0], help: ja[1] } }, ...extra });
const both = (id) => ({ roller: id, die: id });
const options = [
  row("notation", "text", { roller: "notation" }, ["Notation", "The dice expression, such as 2d6+3."], ["ダイス表記", "2d6+3のように、振るダイスを書きます。"], { default: "2d6" }),
  row("sides", "choice", { die: "sides" }, ["Sides", "The number of faces, or F for Fate dice."], ["面の数", "面の数、またはFateダイスの「F」です。"], { default: "6", choices: ["2", "4", "6", "8", "10", "12", "20", "100", "F"] }),
  row("face", "number", { die: "face" }, ["Face", "A fixed face to show when opening."], ["表示する面", "開いたときに表示する面です。"], { range: { min: -1, max: 1000, step: 1 } }),
  row("tray-size", "choice", { roller: "size" }, ["Display size", "Small, medium or large."], ["表示の大きさ", "小・中・大を選びます。"], { default: "large", choices: ["small", "medium", "large"], choiceLabels: { en: { small: "Small", medium: "Medium", large: "Large" }, ja: { small: "小", medium: "中", large: "大" } } }),
  row("size", "choice", { die: "size" }, ["Display size", "Small, medium or large."], ["表示の大きさ", "小・中・大を選びます。"], { default: "medium", choices: ["small", "medium", "large"] }),
  row("width", "number", both("width"), ["Width", "Width in pixels, within the available space."], ["幅", "表示する幅をピクセルで指定します。"], { range: { min: 48, max: 900, step: 4 } }),
  row("lang", "choice", both("lang"), ["Language", "English or Japanese words."], ["言語", "英語または日本語で表示します。"], { choices: ["en", "ja"] }),
  row("label", "text", both("label"), ["Spoken label", "An optional label for a screen reader."], ["読み上げる名前", "スクリーンリーダー用の名前です。指定は任意です。"]),
  row("theme", "choice", both("theme"), ["Theme", "Light, dark or the device's preference."], ["配色", "明るい配色・暗い配色、または端末の設定に合わせます。"], { default: "auto", choices: ["auto", "light", "dark"] }),
  row("cloth", "choice", both("cloth"), ["Cloth", "The colour of the felt."], ["テーブルの色", "フェルトの色です。"], { default: "green", choices: ["green", "blue", "red", "black", "wood"] }),
  row("one-pip", "choice", both("one-pip"), ["One pip", "The single pip on a six-sided die."], ["1の目", "6面ダイスの1の目の色です。"], { default: "red", choices: ["red", "black"] }),
  row("seed", "text", both("seed"), ["Seed", "Use the same seed for the same sequence."], ["シード", "同じシードで同じ順番の結果になります。"]),
  row("sound", "boolean", { roller: "sound" }, ["Sound", "Include dice sounds and the mute control."], ["音", "ダイスの音と消音ボタンを含めます。"], { default: true }),
  row("die-sound", "boolean", { die: "sound" }, ["Sound", "Make a sound when this die rolls."], ["音", "ダイスを振ったときに音を出します。"], { default: false }),
  row("rollable", "boolean", { die: "rollable" }, ["Rollable", "Allow a tap or keyboard action to roll."], ["振れるダイス", "タップやキー操作で振れるようにします。"], { default: true }),
  row("hold", "boolean", { roller: "hold" }, ["Hold dice", "Keep selected dice while rolling the others."], ["ダイスをホールド", "選んだダイスを残して、ほかを振ります。"], { default: true }),
  row("placeholder", "boolean", { roller: "placeholder" }, ["Opening suggestion", "Show a suggested opening roll."], ["最初の表示", "最初に見本の結果を表示します。"], { default: true }),
  row("keyboard", "boolean", { roller: "keyboard" }, ["Keyboard", "Allow Space to roll from the page."], ["キー操作", "ページ上でスペースキーを押すと振れます。"], { default: true }),
  row("wide", "boolean", { roller: "wide" }, ["Wide layout", "Put the tray and panels side by side."], ["横に並べる", "トレイとパネルを横に並べます。"], { default: false }),
  row("language-chooser", "boolean", { roller: "language-chooser" }, ["Language chooser", "Show the tray's language buttons."], ["言語ボタン", "トレイに言語の切り替えボタンを表示します。"], { default: false }),
  row("dice-war", "boolean", { roller: "dice-war" }, ["Dice War", "Include the Dice War game."], ["ダイスウォー", "ダイスウォーのゲームを含めます。"], { default: false }),
  row("animation-ms", "number", both("animation-ms"), ["Animation", "Tumble duration in milliseconds; reduced motion is honoured."], ["アニメーション", "転がる時間をミリ秒で指定します。動きを減らす設定に従います。"], { range: { min: 0, max: 5000, step: 50 } }),
  row("storage", "choice", { roller: "storage" }, ["Saved history", "Embedding keeps no persistent history."], ["履歴の保存", "埋め込みでは履歴を保存しません。"], { default: "none", choices: ["none"] }),
];
for (const option of options) {
  if (["theme", "cloth", "one-pip", "size", "tray-size", "width", "lang", "label"].includes(option.id)) option.group = "look";
  else if (["sound", "die-sound", "hold", "keyboard", "rollable", "language-chooser", "dice-war", "animation-ms", "wide", "placeholder"].includes(option.id)) option.group = "behaviour";
}
const formats = ["element", "iframe", "module", "react", "vue", "svelte", "angular", "html", "url"];
const sides = { small: 48, medium: 96, large: 150 };
let mounted;
const page = globalThis.familyLanguage({ id: "korokoro", words, onChange: () => mounted?.draw() });
const builder = familyEmbedBuilder({ id: "korokoro", packageName: "@johnmorrisdotca/korokoro", major: VERSION.split(".")[0], site: "https://johnmorrisdotca.github.io/korokoro/", title: "Korokoro · dice", titleJa: "ダイスの埋め込み", options, groups: { dice: { en: "The dice", ja: "ダイスの設定" }, look: { en: "Appearance", ja: "見た目" }, behaviour: { en: "Behaviour", ja: "動作" } },
  unit: (option) => option.id === "width" ? "px" : option.id === "animation-ms" ? "ms" : "",
  leftOut: { "roller.storage-key": "An embed never writes saved history.", "roller.share-base": "Shared links use the package's existing site.", "roller.query": "Use notation and seed instead of an unstructured shared query." },
  makers: {
    roller: { names: "roller", element: "roller", tag: "korokoro-roller", embed: "embed/", required: ["notation", "storage"], description: "makerRollerSays", formats, width: (settings) => Number(settings.width) || 600, height: (settings) => ({ small: 540, medium: 1320, large: 1600 }[settings["tray-size"]] ?? 1600) },
    die: { names: "die", element: "die", tag: "korokoro-die", embed: "embed/die/", description: "makerDieSays", formats, width: (settings) => Number(settings.width) || sides[settings.size] || 96, height: (settings) => Number(settings.width) || sides[settings.size] || 96 },
  },
  code: ({ maker, format, settings }) => {
    if ((format === "iframe" || format === "url") && settings.lang === undefined) return builder.codeFor(maker, format, options, { ...settings, lang: page.lang });
    return undefined;
  },
});
builder.validateCoverage({ roller: KorokoroRoller.observedAttributes, die: KorokoroDie.observedAttributes });
mounted = builder.mount({ words, language: () => page, initial: { roller: { "tray-size": "small", sound: false, placeholder: false, keyboard: false, storage: "none", lang: page.lang }, die: { size: "medium", lang: page.lang } },
  renderPreview: ({ stage, maker, attrs }) => {
    const element = globalThis.document.createElement(maker === "die" ? "korokoro-die" : "korokoro-roller");
    for (const [name, value] of attrs) element.setAttribute(name, value);
    if (maker === "roller") { element.setAttribute("storage", "none"); element.setAttribute("query", ""); }
    stage.append(element);
    return { destroy() { element.remove(); } };
  },
});
