/**
 * One plain line for each option row of the tray, in both languages. The tray marks a row with both
 * (`data-help-en`, `data-help-ja`) and draws nothing from them itself: a page that has a Help switch, as the
 * family's demo sites do, reads the marks and shows the line in the page's language, under the row.
 */
export const HELP = {
  en: {
    count: "How many dice of the kind you touched last. Up to ten dice in a roll.",
    sides: "Tap a die to add one of that size to the roll. Tap again to add more, up to ten. Clear takes them all away.",
    bonus: "A fixed number added to the total, or taken away. Or type any dice in the box, like 2d20kh1+5.",
    keep: "With two or more dice: add them all up, or count only the highest, or only the lowest.",
  },
  ja: {
    count: "最後に触れた種類のダイスの数を選びます。1回に10個までです。",
    sides: "ダイスをタップすると、その面数のダイスが1個増えます。続けてタップすると10個まで増やせます。「クリア」で全部外します。",
    bonus: "合計に足す（または引く）固定の数です。右の欄に 2d20kh1+5 のような表記を直接入力することもできます。",
    keep: "ダイスが2個以上のとき: すべて合計するか、最大の1個だけ、最小の1個だけを数えます。",
  },
} as const;

/** The attributes that mark a row with its line, for the page's Help switch. */
export function helpMarks(key: keyof (typeof HELP)["en"]): Record<string, string> {
  return { "data-help-en": HELP.en[key], "data-help-ja": HELP.ja[key] };
}
