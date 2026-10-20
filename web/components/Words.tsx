import { Fragment, type CSSProperties } from 'react';
import { splitWords } from '@/lib/textMotion';

/**
 * A headline split into words, for the unveil that plays on load.
 *
 * Each word sits in a clip (`.tx-w`) and its text in a layer that starts below
 * the clip's edge (`.tx-wi`), so the words are lifted into view rather than
 * faded. The animation is pure CSS on the parent's `.tx-wl` class; see "Text
 * motion" in app/styles/text-motion.css. Server-rendered, so with no script the words are
 * simply there, and the markup is the same shape the client engine builds for
 * headings further down the page (components/TextMotion.tsx).
 *
 * The real spaces are kept between the words, so selection, find-in-page and
 * screen readers all see an ordinary sentence.
 */
export default function Words({ text }: { text: string }) {
  return splitWords(text).map((word, i) => (
    <Fragment key={i}>
      {i > 0 ? ' ' : null}
      <span className="tx-w">
        <span className="tx-wi" style={{ '--i': i } as CSSProperties}>
          {word}
        </span>
      </span>
    </Fragment>
  ));
}
