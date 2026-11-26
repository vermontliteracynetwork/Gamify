// Headings (owner, 2026-11-26: "everyword capitial initial and lowercase the
// rest"): every word starts with a capital, small words too. Words that are
// already all capitals (IT, FAQ, K-12) stay as they are. Every capital G that
// starts a word is drawn as the G from the Gamify logo (teacher, 2026-11-24).
// Screen readers get the plain words.
export function titleCase(text: string): string {
  return text.split(/(\s+)/).map((w) => (/\S/.test(w) ? w.replace(/\p{L}/u, (c) => c.toUpperCase()) : w)).join('');
}

export default function Title({ text }: { text: string }) {
  const cased = titleCase(text);
  if (!cased.includes('G')) return <>{cased}</>;
  return (
    <>
      <span className="sr-only">{cased}</span>
      <span aria-hidden="true">
        {cased.split(/(\s+)/).map((word, w) => /^[^\p{L}\p{N}]*G/u.test(word)
          // Only a G that starts a word is the logo G (teacher, 2026-11-24).
          ? <span key={w} className="whitespace-nowrap">{word.split(/(?<=^[^\p{L}\p{N}]*)G/u).map((part, i) => <span key={i}>{i > 0 && <><span className="logo-g" /><span className="logo-g-text">G</span></>}{part}</span>)}</span>
          : word)}
      </span>
    </>
  );
}
