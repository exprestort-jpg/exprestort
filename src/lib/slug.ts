/**
 * Ukrainian → Latin transliteration, KMU resolution No. 55 (2010), the same
 * table used for passports and road signs. Slugs end up readable for humans and
 * for search engines: «Медові коржі» → medovi-korzhi.
 */
const MAP: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "h",
  ґ: "g",
  д: "d",
  е: "e",
  є: "ie",
  ж: "zh",
  з: "z",
  и: "y",
  і: "i",
  ї: "i",
  й: "i",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ь: "",
  ю: "iu",
  я: "ia",
  ъ: "",
  ы: "y",
  э: "e",
  ё: "e",
};

/** Digraphs that only apply at the start of a word, per the same table. */
const WORD_INITIAL: Record<string, string> = {
  є: "ye",
  ї: "yi",
  й: "y",
  ю: "yu",
  я: "ya",
};

export function slugify(input: string): string {
  const lower = input.trim().toLowerCase();
  let out = "";
  let atWordStart = true;

  for (const char of lower) {
    const mapped = (atWordStart ? WORD_INITIAL[char] : undefined) ?? MAP[char];
    if (mapped !== undefined) {
      out += mapped;
      atWordStart = false;
      continue;
    }
    if (/[a-z0-9]/.test(char)) {
      out += char;
      atWordStart = false;
      continue;
    }
    out += "-";
    atWordStart = true;
  }

  return out.replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 64);
}
