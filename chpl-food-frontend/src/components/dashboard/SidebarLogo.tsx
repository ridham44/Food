import { UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/cn';
import companyLogo from '../../../images/Logo.png';

/**
 * Same crop constants as the auth BrandMark (icon + wordmark, validated
 * against the real Logo.png asset) — reused here at sidebar scale so both
 * surfaces show the identical, correctly-framed lockup.
 */
const CROP = {
  width: 118,
  height: 100,
  imageWidth: 144,
  imageHeight: 144,
  offsetX: -17,
  offsetY: -15,
};

export function SidebarLogo({ collapsed }: { collapsed: boolean }) {
  if (collapsed) {
    return (
      <span className="flex h-9 w-9 items-center justify-center rounded-control bg-gradient-to-br from-primary to-primary-deep shadow-[0_6px_16px_rgba(139,108,255,0.35)]">
        <UtensilsCrossed className="h-4 w-4 text-white" aria-hidden="true" />
      </span>
    );
  }

  return (
    <div
      className={cn('overflow-hidden rounded-control bg-[#f4f5fa]')}
      style={{ width: CROP.width * 0.72, height: CROP.height * 0.72 }}
    >
      <img
        src={companyLogo}
        alt="OrbitFood"
        style={{
          width: CROP.imageWidth * 0.72,
          height: CROP.imageHeight * 0.72,
          maxWidth: 'none',
          transform: `translate(${CROP.offsetX * 0.72}px, ${CROP.offsetY * 0.72}px)`,
        }}
        draggable={false}
      />
    </div>
  );
}
