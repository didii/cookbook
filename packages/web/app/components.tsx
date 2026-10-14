/** Rotating tile for a recipe. Colour per person is not decided yet. */
export const tileFor = (i: number) => i % 9;

/** Shared azulejo pattern definition; render once in the document. */
export function TileDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute" }}>
      <defs>
        <symbol id="wave" viewBox="0 0 300 22" preserveAspectRatio="none">
          <path
            d="M0 11C25 -6 40 28 70 11S110 -6 140 11 190 28 220 11 270 -6 300 11"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </symbol>
      </defs>
    </svg>
  );
}

/** One tile repeated across the width; `round` scales it so only whole tiles fit. */
export function TileBand({ first }: { first: number }) {
  return <div className="tile-band" style={{ backgroundImage: `url(/img/tile${(first % 9) + 1}.svg)` }} aria-hidden="true" />;
}

export function Wave() {
  return (
    <svg className="wave" aria-hidden="true" preserveAspectRatio="none">
      <use href="#wave" />
    </svg>
  );
}
