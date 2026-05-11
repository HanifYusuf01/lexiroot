import { useRef, useState } from 'react';
import { AudioWaveform, ImageIcon, Loader2, Upload, X } from 'lucide-react';
import {
  useSignLessonAudioMutation,
  useSignLessonImageMutation,
} from '../../../../services/uploadsApi';
import { uploadLessonMediaToCloudinary } from '../../../../utils/cloudinary';

type Kind = 'audio' | 'image';

interface Props {
  kind: Kind;
  value: string | null;
  onChange: (url: string | null) => void;
  /** Tighter style for in-card image option slots (with no surrounding card). */
  variant?: 'card' | 'tile';
}

const ACCEPT: Record<Kind, string> = {
  audio: 'audio/mpeg,audio/wav,audio/x-m4a,audio/mp3,audio/mp4',
  image: 'image/png,image/jpeg,image/webp,image/gif',
};

export function MediaUploader({ kind, value, onChange, variant = 'card' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [signAudio] = useSignLessonAudioMutation();
  const [signImage] = useSignLessonImageMutation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePick(file: File) {
    setError(null);
    setBusy(true);
    try {
      const signature = await (kind === 'audio' ? signAudio() : signImage()).unwrap();
      const url = await uploadLessonMediaToCloudinary(file, signature);
      onChange(url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  if (variant === 'tile') {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="relative flex h-24 w-24 items-center justify-center rounded-md border-2 border-dashed border-border bg-neutral-soft/40 text-neutral-variant transition hover:border-primary hover:text-primary"
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt=""
            className="h-full w-full rounded-[inherit] object-cover"
          />
        ) : busy ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <ImageIcon size={20} />
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT[kind]}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) handlePick(f);
          }}
        />
      </button>
    );
  }

  return (
    <div className="rounded-lg border-2 border-dashed border-border bg-neutral-soft/40 p-4">
      {value ? (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-primary">
            {kind === 'audio' ? <AudioWaveform size={16} /> : <ImageIcon size={16} />}
          </span>
          <div className="min-w-0 flex-1 truncate text-sm text-neutral">
            {kind === 'audio' ? <audio src={value} controls className="h-9 w-full max-w-md" /> : (
              <img src={value} alt="" className="h-12 w-12 rounded-md object-cover" />
            )}
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded-md p-1.5 text-neutral-variant hover:bg-neutral-soft hover:text-error"
            title="Remove"
          >
            <X size={14} />
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="rounded-md border border-border bg-white px-3 py-1.5 text-xs font-semibold text-neutral hover:bg-neutral-soft"
          >
            {busy ? 'Uploading…' : 'Replace'}
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-3 py-2 text-sm text-neutral-variant hover:text-primary"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-softer text-primary">
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
          </span>
          <span className="text-left">
            <span className="block text-sm font-semibold text-neutral">
              {kind === 'audio' ? 'Upload audio' : 'Upload image'}
            </span>
            <span className="block text-xs text-neutral-variant">
              {kind === 'audio'
                ? 'MP3 or WAV up to 10MB'
                : 'PNG, JPG or WebP up to 5MB'}
            </span>
          </span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT[kind]}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) handlePick(f);
        }}
      />
      {error ? <p className="mt-2 text-xs text-error">{error}</p> : null}
    </div>
  );
}
