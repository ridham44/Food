import companyLogo from '../../../images/Logo.png';

/**
 * Source region in the original 1254x1254 Logo.png containing just the
 * ring/fork/spoon/orbit icon — excludes the "OrbitFood" wordmark and
 * taglines beneath it, which read as an illegible smudge at sidebar scale.
 * Generous margins on purpose: better to include a hair of empty space than
 * clip the ring or the orbit swoosh's tail.
 */
const ICON_CROP = { x0: 188, y0: 163, width: 815, height: 577 };
const SOURCE_SIZE = 1254;

export function SidebarLogo({ collapsed }: { collapsed: boolean }) {
  const size = collapsed ? 44 : 56;
  const scale = size / ICON_CROP.width;
  const imageSize = SOURCE_SIZE * scale;
  const containerHeight = ICON_CROP.height * scale;

  return (
    <div
      className="shrink-0 overflow-hidden rounded-control bg-[#f4f5fa]"
      style={{ width: size, height: containerHeight }}
    >
      <img
        src={companyLogo}
        alt="OrbitFood"
        draggable={false}
        style={{
          width: imageSize,
          height: imageSize,
          maxWidth: 'none',
          transform: `translate(${-ICON_CROP.x0 * scale}px, ${-ICON_CROP.y0 * scale}px)`,
        }}
      />
    </div>
  );
}
