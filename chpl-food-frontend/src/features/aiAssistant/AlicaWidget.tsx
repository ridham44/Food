import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { AxiosInstance } from 'axios';
import { Sparkles, X, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { askAssistant } from './aiAssistantApi';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'error';
  text: string;
}

interface AlicaWidgetProps {
  /** Axios instance already carrying the right role's auth interceptor (apiClient or customerApiClient). */
  apiClient: AxiosInstance;
  /** Backend route this portal's chat should hit, e.g. /ask-admin-ai. */
  endpoint: string;
  greeting: string;
  suggestions: string[];
  /** 'mobile-tab-bar' clears the fixed bottom tab nav the customer layout shows below sm. */
  variant?: 'default' | 'mobile-tab-bar';
}

const FAB_OFFSET: Record<'default' | 'mobile-tab-bar', string> = {
  default: 'bottom-6',
  'mobile-tab-bar': 'bottom-24 sm:bottom-6',
};

const PANEL_OFFSET: Record<'default' | 'mobile-tab-bar', string> = {
  default: 'bottom-24',
  'mobile-tab-bar': 'bottom-40 sm:bottom-24',
};

let idCounter = 0;
const nextId = () => `alica-${++idCounter}`;

export function AlicaWidget({ apiClient, endpoint, greeting, suggestions, variant = 'default' }: AlicaWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const send = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { id: nextId(), role: 'user', text: trimmed }]);
    setInput('');
    setLoading(true);

    try {
      const result = await askAssistant(apiClient, endpoint, trimmed);
      setMessages((prev) => [...prev, { id: nextId(), role: 'assistant', text: result.message }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: 'error', text: "Sorry, I couldn't reach the server just now — please try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close Alica, your AI assistant' : 'Open Alica, your AI assistant'}
        aria-expanded={open}
        className={cn(
          'fixed right-4 z-toast flex h-14 w-14 items-center justify-center rounded-full sm:right-6',
          'bg-gradient-to-br from-primary via-primary-hover to-cyan text-white',
          'shadow-[0_12px_32px_rgba(139,108,255,0.45)] transition-transform duration-200 hover:scale-105 active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base',
          FAB_OFFSET[variant]
        )}
      >
        {open ? <X className="h-6 w-6" aria-hidden="true" /> : <Sparkles className="h-6 w-6" aria-hidden="true" />}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Alica, your AI assistant"
          className={cn(
            'glass-panel--strong fixed right-4 z-toast flex h-[32rem] max-h-[75vh] w-96 max-w-[92vw] flex-col overflow-hidden rounded-dialog sm:right-6',
            PANEL_OFFSET[variant]
          )}
        >
          <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary via-primary-hover to-cyan text-white">
              <Sparkles className="h-4.5 w-4.5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text-primary">Alica</p>
              <p className="truncate text-xs text-text-muted">Your AI assistant</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close Alica"
              className="flex h-8 w-8 items-center justify-center rounded-control text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div ref={listRef} role="log" aria-live="polite" className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-text-secondary">{greeting}</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => void send(s)}
                      className="rounded-control border border-border-subtle bg-surface-glass px-3 py-1.5 text-left text-xs text-text-secondary transition-colors hover:border-border-active hover:text-text-primary"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[85%] whitespace-pre-wrap rounded-card px-3 py-2 text-sm',
                    m.role === 'user' && 'bg-gradient-to-b from-primary to-primary-deep text-white',
                    m.role === 'assistant' && 'glass-panel text-text-primary',
                    m.role === 'error' && 'border border-danger/40 bg-danger/12 text-danger'
                  )}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="glass-panel flex items-center gap-2 rounded-card px-3 py-2 text-sm text-text-secondary">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  Alica is thinking…
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border-subtle p-3">
            <label htmlFor="alica-input" className="sr-only">
              Ask Alica a question
            </label>
            <input
              id="alica-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Alica anything…"
              maxLength={800}
              className="h-10 flex-1 rounded-control border border-border-subtle bg-input-bg px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-border-active focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send message to Alica"
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-control text-white transition-transform',
                'bg-gradient-to-b from-primary to-primary-deep',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'enabled:hover:scale-105 enabled:active:scale-95',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60'
              )}
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
