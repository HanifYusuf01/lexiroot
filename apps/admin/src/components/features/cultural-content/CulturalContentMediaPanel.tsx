import { useRef, useState } from 'react';
import {
  AudioWaveform,
  ImageIcon,
  Loader2,
  X,
} from 'lucide-react';
import {
  useSignCulturalAudioMutation,
  useSignCulturalImageMutation,
} from '../../../services/uploadsApi';
import { uploadLessonMediaToCloudinary } from '../../../utils/cloudinary';

interface Props {
  coverImageUrl: string | null;
  audioUrl: string | null;
  audioFileName: string | null;
  audioLanguageLabel: string;
  onCoverImageChange: (url: string | null) => void;
  onAudioChange: (next: { url: string | null; fileName: string | null }) => void;
}

const IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif';
const AUDIO_ACCEPT = 'audio/mpeg,audio/wav,audio/x-m4a,audio/mp3,audio/mp4';

export function CulturalContentMediaPanel({
  coverImageUrl,
  audioUrl,
  audioFileName,
  audioLanguageLabel,
  onCoverImageChange,
  onAudioChange,
}: Props) {
  return (
    <aside className="rounded-2xl border border-border bg-white p-5 h-[350px]">
      <h3 className="font-display text-base font-bold text-neutral">Media &amp; Audio</h3>
      <p className="text-xs text-neutral-variant">
        Add images and audio for LexiRoot learners
      </p>

      <div className="mt-5">
        <label className="mb-2 block text-xs font-semibold text-neutral">Cover Image</label>
        <ImageDrop value={coverImageUrl} onChange={onCoverImageChange} />
      </div>

      <div className="mt-5">
        <label className="mb-2 block text-xs font-semibold text-neutral">
          Audio ({audioLanguageLabel} Narration)
        </label>
        <AudioDrop
          url={audioUrl}
          fileName={audioFileName}
          onChange={onAudioChange}
        />
      </div>
    </aside>
  );
}

function ImageDrop({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [sign] = useSignCulturalImageMutation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(file: File) {
    setError(null);
    setBusy(true);
    try {
      const signature = await sign().unwrap();
      const url = await uploadLessonMediaToCloudinary(file, signature);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  if (value) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-border">
        <img src={value} alt="" className="h-36 w-full object-cover" />
        <div className="absolute right-2 top-2 flex gap-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="rounded-md bg-white/90 px-2 py-1 text-[11px] font-semibold text-neutral hover:bg-white"
          >
            {busy ? 'Uploading…' : 'Edit Image'}
          </button>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded-md bg-white/90 p-1 text-neutral hover:bg-white hover:text-error"
            aria-label="Remove image"
          >
            <X size={14} />
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_ACCEPT}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) pick(f);
          }}
        />
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center gap-3 rounded-xl border border-dashed border-border bg-neutral-soft/30 p-4 text-left hover:border-primary-border hover:bg-primary-softer/60"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-softer text-primary">
          {busy ? <Loader2 size={20} className="animate-spin" /> : <ImageIcon size={20} />}
        </span>
        <span>
          <span className="block text-sm font-bold text-neutral">Upload Image</span>
          <span className="block text-xs text-neutral-variant">PNG, JPG up to 5MB</span>
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) pick(f);
        }}
      />
      {error ? <p className="mt-2 text-xs text-error">{error}</p> : null}
    </>
  );
}

function AudioDrop({
  url,
  fileName,
  onChange,
}: {
  url: string | null;
  fileName: string | null;
  onChange: (next: { url: string | null; fileName: string | null }) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [sign] = useSignCulturalAudioMutation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(file: File) {
    setError(null);
    setBusy(true);
    try {
      const signature = await sign().unwrap();
      const uploadedUrl = await uploadLessonMediaToCloudinary(file, signature);
      onChange({ url: uploadedUrl, fileName: file.name });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  if (url) {
    return (
      <div className="rounded-xl border border-border bg-white p-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-softer text-primary">
            <AudioWaveform size={18} />
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-neutral">
            {fileName ?? 'Audio file'}
          </span>
          <button
            type="button"
            onClick={() => onChange({ url: null, fileName: null })}
            className="rounded-md p-1 text-neutral-variant hover:bg-neutral-soft hover:text-error"
            aria-label="Remove audio"
          >
            <X size={14} />
          </button>
        </div>
        <audio src={url} controls className="mt-2 h-9 w-full" />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="mt-2 w-full rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-neutral hover:bg-neutral-soft"
        >
          {busy ? 'Uploading…' : 'Replace audio'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={AUDIO_ACCEPT}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) pick(f);
          }}
        />
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center gap-3 rounded-xl border border-dashed border-border bg-neutral-soft/30 p-4 text-left hover:border-primary-border hover:bg-primary-softer/60"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-softer text-primary">
          {busy ? <Loader2 size={20} className="animate-spin" /> : <AudioWaveform size={20} />}
        </span>
        <span>
          <span className="block text-sm font-bold text-neutral">Upload Audio</span>
          <span className="block text-xs text-neutral-variant">Mp3, WAV up to 10MB</span>
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={AUDIO_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) pick(f);
        }}
      />
      {error ? <p className="mt-2 text-xs text-error">{error}</p> : null}
    </>
  );
}
