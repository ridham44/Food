import loginBg from '../../../../images/login-bg.png';

/**
 * Sign-in backdrop: a deep near-black stage with the plate shot presented as
 * a bounded, vignetted "hero" rather than stretched full-bleed. Capping its
 * display width (instead of `object-cover`-ing the whole viewport) keeps the
 * upscale factor small so the low-res source photo stays sharp at any
 * viewport, and the image is only shown at `lg+` where there's real room
 * beside the card — below that, the backdrop is a clean solid wash with no
 * raster asset to go soft on small screens.
 */
export function AuthBackdrop() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-bg-base" aria-hidden="true">
      {/* Ambient depth wash — present at every breakpoint, independent of the photo */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 65% at 18% 45%, rgba(22,34,58,0.55), transparent 60%), radial-gradient(ellipse 55% 60% at 88% 15%, rgba(32,22,64,0.28), transparent 55%)',
        }}
      />

      {/* Hero plate shot, bounded so the low-res source never gets stretched
          soft. Its vignette is a mask on the image itself, sized as a
          percentage of its OWN box (50% 50% radii = exactly reaches the
          box's real edges at the mask's 100% stop) — that makes it fade to
          fully transparent precisely at the image's boundary by construction,
          at any size or breakpoint, instead of an overlay gradient sized
          against the viewport that has to be hand-matched to the box and
          drifts out of sync as the box's proportions change per breakpoint. */}
      <div
        className="absolute top-1/2 hidden -translate-y-1/2 lg:block"
        style={{ left: '-2%', width: 'min(64vw, 1280px)', aspectRatio: '612 / 408' }}
      >
        <img
          src={loginBg}
          alt=""
          draggable={false}
          className="h-full w-full object-cover"
          style={{
            filter: 'saturate(1.22) contrast(1.08) brightness(1.03)',
            maskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, black 0%, black 40%, transparent 100%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 50% 50% at 50% 50%, black 0%, black 40%, transparent 100%)',
          }}
        />
        {/* Warm studio-light glow */}
        <div
          className="absolute -inset-10"
          style={{
            background: 'radial-gradient(ellipse 55% 55% at 48% 46%, rgba(255,170,110,0.1), transparent 70%)',
          }}
        />
      </div>

      {/* Fade the scene toward the card so text stays legible over whatever sits behind it */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, transparent 38%, rgba(8,11,20,0.5) 58%, rgba(8,11,20,0.88) 76%, var(--bg-base) 100%)',
        }}
      />

      {/* Indigo / cyan brand accent glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 80% 24%, rgba(139,108,255,0.14), transparent 55%), radial-gradient(circle at 10% 90%, rgba(53,212,231,0.09), transparent 50%)',
        }}
      />
    </div>
  );
}
