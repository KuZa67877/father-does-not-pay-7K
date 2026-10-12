import { Check, Link2, Send, Share2 } from 'lucide-react';
import { useState } from 'react';
import { RoundButton } from '@/shared/ui';

/** Поделиться: Telegram, ВКонтакте, копировать ссылку, системное «Поделиться». */
export function ShareArticle({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window === 'undefined' ? '' : (window.location.href.split('#')[0] ?? '');
  const enc = encodeURIComponent;
  const canNative = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Скопируйте ссылку', url);
    }
  };

  return (
    <div className="share-row">
      <a
        href={`https://t.me/share/url?url=${enc(url)}&text=${enc(title)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Поделиться в Telegram"
        title="Telegram"
        className="share-round"
      >
        <Send size={16} aria-hidden />
      </a>
      <a
        href={`https://vk.com/share.php?url=${enc(url)}&title=${enc(title)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Поделиться во ВКонтакте"
        title="ВКонтакте"
        className="share-round share-vk"
      >
        VK
      </a>
      <RoundButton
        label={copied ? 'Ссылка скопирована' : 'Копировать ссылку'}
        onClick={() => void copy()}
      >
        {copied ? <Check size={16} aria-hidden /> : <Link2 size={16} aria-hidden />}
      </RoundButton>
      {canNative && (
        <RoundButton
          label="Другие способы"
          onClick={() => void navigator.share({ title, url }).catch(() => undefined)}
        >
          <Share2 size={16} aria-hidden />
        </RoundButton>
      )}
      <span className="visually-hidden" aria-live="polite">
        {copied ? 'Ссылка скопирована' : ''}
      </span>
    </div>
  );
}
