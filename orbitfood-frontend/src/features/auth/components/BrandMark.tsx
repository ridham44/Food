import { cn } from '@/lib/cn';
import companyLogo from '../../../../images/Logo.webp';

/**
 * Compact OrbitFood lockup (icon + wordmark) cropped from the company logo
 * artwork, used at the top of the sign-in card. The source artwork sits on
 * a white plate, so the mark is framed in a matching light chip rather than
 * fought into transparency.
 *
 * The crop is expressed as CSS background-size/position percentages (derived
 * once below from the original 118x100 reference box) rather than a fixed-
 * size <img> with a pixel transform — percentages are relative to whatever
 * box the caller actually renders, so the exact same crop scales cleanly to
 * any `width`/`height`. A fixed-pixel version previously ignored the size
 * the caller asked for (e.g. the header's 48x40 usage), always rendering at
 * the original 118x100 and overflowing its container.
 */
const REFERENCE = { width: 118, height: 100, imageWidth: 144, imageHeight: 144, offsetX: -17, offsetY: -15 };
const BG_SIZE_X = (REFERENCE.imageWidth / REFERENCE.width) * 100;
const BG_SIZE_Y = (REFERENCE.imageHeight / REFERENCE.height) * 100;
const BG_POS_X = (REFERENCE.offsetX / (REFERENCE.width - REFERENCE.imageWidth)) * 100;
const BG_POS_Y = (REFERENCE.offsetY / (REFERENCE.height - REFERENCE.imageHeight)) * 100;

interface BrandMarkProps {
  className?: string;
  /** Rendered box size in px — defaults to the original 118x100 reference crop. */
  width?: number;
  height?: number;
}

export function BrandMark({ className, width = REFERENCE.width, height = REFERENCE.height }: BrandMarkProps) {
  return (
    <div
      role="img"
      aria-label="OrbitFood"
      className={cn('shrink-0 overflow-hidden rounded-2xl bg-[#f4f5fa] bg-no-repeat', className)}
      style={{
        width,
        height,
        backgroundImage: `url(${companyLogo})`,
        backgroundSize: `${BG_SIZE_X}% ${BG_SIZE_Y}%`,
        backgroundPosition: `${BG_POS_X}% ${BG_POS_Y}%`,
      }}
    />
  );
}
