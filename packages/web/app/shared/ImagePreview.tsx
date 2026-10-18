import { useState } from 'react';
import { TileBand } from '~/shared/TileBand';

type Props = { src: string; tile: number };

/** The image in the frame it has on the recipe page (border, 2:1, tile band beneath); says so in text when it can't be loaded. */
export function ImagePreview({ src, tile }: Props) {
  const [failedSrc, setFailedSrc] = useState<string>();
  const failed = failedSrc === src;

  return (
    <output className="mt-3 block empty:hidden">
      {src &&
        (failed ? (
          <p className="font-bold text-red">De afbeelding kan niet worden getoond.</p>
        ) : (
          <div className="@container relative overflow-hidden rounded-xl border-3 border-ink bg-white shadow-hard">
            <img src={src} alt="" onError={() => setFailedSrc(src)} className="block aspect-2/1 w-full border-b-3 border-ink object-cover" />
            <TileBand first={tile} responsive className="border-b-0" />
          </div>
        ))}
    </output>
  );
}
