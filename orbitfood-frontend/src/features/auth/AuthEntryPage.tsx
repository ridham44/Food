import { useNavigate } from 'react-router-dom';
import { ArrowRight, Briefcase, Smartphone } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel/GlassPanel';
import { cn } from '@/lib/cn';
import { AuthBackdrop } from '@/features/auth/components/AuthBackdrop';
import { BrandMark } from '@/features/auth/components/BrandMark';
import orbitDevStudioLogo from '../../../images/companylogo.png';

interface EntryOption {
  key: string;
  title: string;
  description: string;
  icon: typeof Smartphone;
  accent: 'cyan' | 'primary';
  path: string;
}

const OPTIONS: EntryOption[] = [
  {
    key: 'customer',
    title: 'Customer',
    description: 'Sign in with your mobile number to order from your favorite restaurants.',
    icon: Smartphone,
    accent: 'cyan',
    path: '/app/login',
  },
  {
    key: 'business',
    title: 'Business',
    description: 'Sign in with your email or mobile number and password to manage your restaurant.',
    icon: Briefcase,
    accent: 'primary',
    path: '/login/business',
  },
];

export default function AuthEntryPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-bg-base">
      <AuthBackdrop />

      <div className="relative z-10 flex min-h-screen w-full items-center justify-center px-4 py-3 sm:px-6 lg:justify-end lg:px-10 lg:py-4 xl:px-14">
        <div className="w-full max-w-3xl animate-auth-panel-in">
          <div className="mb-10 flex flex-col items-center text-center">
            <BrandMark className="scale-110 border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.4)]" />
            <h1 className="mt-5 text-3xl font-bold text-text-primary sm:text-4xl">Welcome back</h1>
            <p className="mt-2 text-base text-text-secondary sm:text-lg">
              Choose how you'd like to continue
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {OPTIONS.map(({ key, title, description, icon: Icon, accent, path }) => (
              <button
                key={key}
                type="button"
                onClick={() => navigate(path)}
                className="group text-left focus:outline-none"
              >
                <GlassPanel
                  radius="dialog"
                  className={cn(
                    'auth-glass-card flex h-full flex-col p-8 transition-all duration-300 ease-out',
                    'group-hover:-translate-y-1 group-hover:scale-[1.015] group-focus-visible:-translate-y-1 group-focus-visible:scale-[1.015]',
                    accent === 'cyan' &&
                      'group-hover:border-cyan/40 group-hover:shadow-[0_32px_80px_rgba(0,0,0,0.32),0_0_40px_rgba(53,212,231,0.18)] group-focus-visible:border-cyan/40',
                    accent === 'primary' &&
                      'group-hover:border-primary/40 group-hover:shadow-[0_32px_80px_rgba(0,0,0,0.32),0_0_40px_rgba(139,108,255,0.18)] group-focus-visible:border-primary/40'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-14 w-14 items-center justify-center rounded-2xl',
                      accent === 'cyan' ? 'bg-cyan/10 text-cyan' : 'bg-primary/10 text-primary'
                    )}
                  >
                    <Icon className="h-7 w-7" aria-hidden="true" />
                  </div>

                  <h2 className="mt-5 text-xl font-bold text-text-primary">{title}</h2>
                  <p className="mt-2 text-base leading-relaxed text-text-secondary">{description}</p>

                  <span
                    className={cn(
                      'mt-6 inline-flex items-center gap-1.5 text-base font-semibold',
                      accent === 'cyan' ? 'text-cyan' : 'text-primary'
                    )}
                  >
                    Continue
                    <ArrowRight
                      className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </span>
                </GlassPanel>
              </button>
            ))}
          </div>

          <p className="mt-8 text-center text-xs text-text-muted">
            <span className="font-semibold text-text-secondary">OrbitFood</span> · Food Ordering. Simplified.
          </p>

          <a
            href="https://orbit-dev-studio.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-text-muted transition-colors hover:text-text-secondary"
          >
            Made by
            <img src={orbitDevStudioLogo} alt="OrbitDevStudio" className="h-4 w-4 rounded-full object-cover" />
            <span className="font-medium text-text-secondary">OrbitDevStudio</span>
          </a>
        </div>
      </div>
    </div>
  );
}
