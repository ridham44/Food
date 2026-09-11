/**
 * A few soft, blurred gradient blobs meant to sit behind glass cards so the
 * page reads as "glow visible through frosted glass" instead of flat panels
 * on a plain background. Purely decorative — absolutely positioned and
 * pointer-events-none, so it never interferes with layout or interaction.
 * Place inside a `relative` (or `absolute inset-0`) wrapper around page content.
 */
export function AmbientGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div
        className="absolute -left-24 -top-24 h-72 w-72 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(139,108,255,0.22), transparent 70%)' }}
      />
      <div
        className="absolute -right-20 top-10 h-64 w-64 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(53,212,231,0.16), transparent 70%)' }}
      />
      <div
        className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(139,108,255,0.12), transparent 70%)' }}
      />
    </div>
  );
}
