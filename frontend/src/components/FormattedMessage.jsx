import { Fragment } from 'react';

// Renders **bold** inside a line. Plain React elements only (no raw HTML), so it is safe.
function renderInline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
      <strong key={i} style={{ color: 'var(--teal)', fontWeight: 700 }}>
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  );
}

/**
 * Turns a chatbot reply into tidy paragraphs and bullet lists.
 * Understands: "- item" / "* item" / "• item" / "1. item" bullets, **bold**,
 * and strips stray markdown "#" headings that models sometimes add.
 */
export default function FormattedMessage({ text }) {
  const blocks = [];
  let bullets = [];

  const flushBullets = () => {
    if (bullets.length === 0) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`} style={{ margin: '6px 0 2px', paddingLeft: 20 }}>
        {bullets.map((item, i) => (
          <li key={i} style={{ margin: '4px 0' }}>
            {renderInline(item)}
          </li>
        ))}
      </ul>
    );
    bullets = [];
  };

  String(text)
    .split('\n')
    .forEach((rawLine) => {
      const line = rawLine.replace(/^#{1,6}\s*/, '').trim();
      const bullet = line.match(/^(?:[-*\u2022]|\d+[.)])\s+(.*)$/);

      if (bullet) {
        bullets.push(bullet[1]);
      } else {
        flushBullets();
        if (line) {
          blocks.push(
            <p key={`p-${blocks.length}`} style={{ margin: '0 0 4px' }}>
              {renderInline(line)}
            </p>
          );
        }
      }
    });
  flushBullets();

  return <>{blocks}</>;
}
