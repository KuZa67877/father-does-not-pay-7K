import { Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useRequireAuth } from '@/entities/session';
import { useReplyStory } from '@/entities/story';
import { routes } from '@/shared/lib/routes';
import { useUi } from '@/shared/model/ui-context';
import s from './stories.module.css';

export function StoryReply({ id, onBusy }: { id: string; onBusy: (busy: boolean) => void }) {
  const reply = useReplyStory(id);
  const gate = useRequireAuth();
  const { toast } = useUi();
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    onBusy(focused || reply.isPending);
    return () => onBusy(false);
  }, [focused, reply.isPending, onBusy]);
  return (
    <>
      <form
        className={s.replyForm}
        onSubmit={(e) => {
          e.preventDefault();
          if (reply.isPending || !text.trim()) return;
          gate(() =>
            reply.mutate(text.trim(), {
              onSuccess: () => {
                setText('');
                toast('Ответ отправлен');
              },
            }),
          )();
        }}
      >
        <label className="visually-hidden" htmlFor="story-reply">
          Ответ на историю
        </label>
        <input
          id="story-reply"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          maxLength={500}
          placeholder="Ответить…"
        />
        <button
          type="submit"
          aria-label="Отправить ответ на историю"
          disabled={reply.isPending || !text.trim()}
        >
          <Send size={20} aria-hidden />
        </button>
      </form>
      {(text.trim() || reply.isError || reply.isSuccess) && (
        <div className={s.replyHint}>
          {reply.isError && <p role="alert">Ответ не отправился. Попробуйте ещё раз.</p>}
          <Link to={routes.messages()}>Открыть сообщения</Link>
        </div>
      )}
    </>
  );
}
