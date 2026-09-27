// Splitting verse text into words while keeping the punctuation around them for display.

export type Token = {
  pre: string; // punctuation before the word, e.g. an opening quote
  word: string; // letters (and inner apostrophes/hyphens), as printed
  post: string; // punctuation after, e.g. ", " or "."
};

const WORD = /[\p{L}\p{M}]+(?:['’-][\p{L}\p{M}]+)*/gu;

export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let last = 0;
  let pending = "";
  for (const m of text.matchAll(WORD)) {
    const between = text.slice(last, m.index);
    if (tokens.length === 0) pending += between;
    else {
      // Split punctuation between two words: trailing for the previous word, the rest leading for the next.
      const space = between.search(/\s/);
      if (space === -1) tokens[tokens.length - 1].post += between;
      else {
        tokens[tokens.length - 1].post += between.slice(0, space + 1);
        pending += between.slice(space + 1).trimStart();
      }
    }
    tokens.push({ pre: pending, word: m[0], post: "" });
    pending = "";
    last = m.index + m[0].length;
  }
  if (tokens.length) tokens[tokens.length - 1].post += text.slice(last);
  return tokens;
}

export function normalizeWord(w: string) {
  return w.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/’/g, "'");
}

// Filler words that make poor puzzles, in English and Tagalog.
const STOPWORDS = new Set(
  `a an and are as at be been being but by did do does for from had has have he her hers him his how i if in
  into is it its let may me my no nor not of on or our out said shall she so than that the their them then there
  these they this those thus to unto up upon us was we were what when which who whom will with would ye you your
  yet also all any every even one own
  ang ng sa at na mga ay si ni kay niya nila ko mo ka ako ikaw siya kami tayo kayo sila ito iyon iyan din rin
  lamang lang para kung dahil sapagkat upang hindi may mayroon kanya kanyang kanilang aking iyong ating amin
  inyo atin nang pa po ba ngunit subalit kaya kaya't man dito doon diyan nga kapag o tulad gaya lahat nito niyon`
    .split(/\s+/)
    .filter(Boolean),
);

// A name (or "God", "Diyos", "LORD"), shown with its capital rather than in lowercase: capitalized
// where a sentence doesn't start, or a word the Bible nearly always capitalizes (`names`, which
// catches "Jesus" opening a sentence).
export function isName(tokens: Token[], i: number, names?: Set<string>) {
  const word = tokens[i].word;
  if (!/^\p{Lu}/u.test(word)) return false;
  const sentenceStart = i === 0 || /[.!?:]["”’)]*\s*$/.test(tokens[i - 1].post) || /[“"‘(]/.test(tokens[i].pre);
  return !sentenceStart || !!names?.has(normalizeWord(word));
}

export function isStopword(word: string) {
  return STOPWORDS.has(normalizeWord(word));
}

// Only plain letters: no apostrophes or hyphens (for Wordle-style tiles).
export function isPlainWord(word: string) {
  return /^[\p{L}]+$/u.test(word);
}
