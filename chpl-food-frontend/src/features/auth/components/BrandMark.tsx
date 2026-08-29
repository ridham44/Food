import { cn } from '@/lib/cn';
import companyLogo from '../../../../images/Logo.webp';

/**
 * Compact OrbitFood lockup (icon + wordmark) cropped from the company logo
 * artwork, used at the top of the sign-in card. The source artwork sits on
 * a white plate, so the mark is framed in a matching light chip rather than
 * fought into transparency.
 */
const CROP = {
  width: 118,
  height: 100,
  imageWidth: 144,
  imageHeight: 144,
  offsetX: -17,
  offsetY: -15,
};

export function BrandMark({ className }: { className?: string }) {
  return (
    <div
      className={cn('overflow-hidden rounded-2xl bg-[#f4f5fa]', className)}
      style={{ width: CROP.width, height: CROP.height }}
    >
      <img
        src={companyLogo}
        alt="OrbitFood"
        style={{
          width: CROP.imageWidth,
          height: CROP.imageHeight,
          maxWidth: 'none',
          transform: `translate(${CROP.offsetX}px, ${CROP.offsetY}px)`,
        }}
        draggable={false}
      />
    </div>
  );
}
