import { useEffect, useRef, useState } from 'react';
import { AudioWaveform, Loader2, Pause, Play, Upload, X } from 'lucide-react';
import { useSignLessonAudioMutation } from '../../../../services/uploadsApi';
import { uploadLessonMediaToCloudinary } from '../../../../utils/cloudinary';

type Phase = 'idle' | 'uploading';

interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
  variant?: 'card' | 'inline';
}

const AUDIO_ACCEPT = 'audio/mpeg,audio/wav,audio/x-m4a,audio/mp3,audio/mp4';

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function AudioRecorder({ value, onChange, variant = 'card' }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [storedDurationMs, setStoredDurationMs] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);

  const playbackRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [signAudio] = useSignLessonAudioMutation();

  async function uploadFile(file: File) {
    setError(null);
    setPhase('uploading');
    try {
      const signature = await signAudio().unwrap();
      const url = await uploadLessonMediaToCloudinary(file, signature);
      onChange(url);
      setPhase('idle');
    } catch {
      setError('Could not upload the audio file. Try again.');
      setPhase('idle');
    }
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  useEffect(() => {
    if (!value) {
      setStoredDurationMs(null);
      return;
    }
    const a = new Audio(value);
    playbackRef.current = a;
    const onLoaded = () => setStoredDurationMs(a.duration * 1000);
    const onEnded = () => setPlaying(false);
    a.addEventListener('loadedmetadata', onLoaded);
    a.addEventListener('ended', onEnded);
    return () => {
      a.pause();
      a.removeEventListener('loadedmetadata', onLoaded);
      a.removeEventListener('ended', onEnded);
      playbackRef.current = null;
    };
  }, [value]);

  function togglePlay() {
    if (!playbackRef.current) return;
    if (playing) {
      playbackRef.current.pause();
      setPlaying(false);
    } else {
      playbackRef.current.currentTime = 0;
      playbackRef.current.play().catch(() => undefined);
      setPlaying(true);
    }
  }

  function clearStored() {
    onChange(null);
  }

  const view =
    variant === 'inline' ? (
      <InlineView
        phase={phase}
        value={value}
        storedDurationMs={storedDurationMs}
        playing={playing}
        error={error}
        onTogglePlay={togglePlay}
        onClear={clearStored}
        onUploadClick={openFilePicker}
      />
    ) : (
      <CardView
        phase={phase}
        value={value}
        error={error}
        onClear={clearStored}
        onUploadClick={openFilePicker}
      />
    );

  return (
    <>
      {view}
      <input
        ref={fileInputRef}
        type="file"
        accept={AUDIO_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) uploadFile(f);
        }}
      />
    </>
  );
}

interface CardViewProps {
  phase: Phase;
  value: string | null;
  error: string | null;
  onClear: () => void;
  onUploadClick: () => void;
}

function CardView({ phase, value, error, onClear, onUploadClick }: CardViewProps) {
  return (
    <div className="space-y-3">
      {value && phase === 'idle' ? <audio src={value} controls className="w-full" /> : null}
      <DashedBlock>
        {phase === 'uploading' ? (
          <div className="flex w-full items-center gap-3">
            <Loader2 size={20} className="animate-spin text-primary" />
            <span className="text-sm font-semibold text-neutral">Uploading audio…</span>
          </div>
        ) : (
          <button type="button" onClick={onUploadClick} className="flex w-full items-center gap-5 text-left">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-softer text-primary">
              <AudioWaveform size={26} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-extrabold text-neutral">
                {value ? 'Change Audio' : 'Upload Audio'}
              </span>
              <span className="block text-sm text-neutral-variant">
                {value
                  ? 'Click to pick a new audio file and replace the current one.'
                  : 'Click to upload an audio file from your computer.'}
              </span>
              <span className="mt-1 block text-xs text-neutral-variant">
                MP3, WAV, M4A up to 10MB
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-2 text-xs font-semibold text-neutral">
              <Upload size={12} />
              {value ? 'Replace' : 'Upload'}
            </span>
          </button>
        )}
      </DashedBlock>
      {value && phase === 'idle' ? (
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-semibold text-neutral-variant hover:text-error"
        >
          Remove audio
        </button>
      ) : null}
      {error ? <p className="text-xs text-error">{error}</p> : null}
    </div>
  );
}

function DashedBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center rounded-xl border-2 border-dashed border-border bg-white px-6 py-5">
      {children}
    </div>
  );
}

interface InlineViewProps {
  phase: Phase;
  value: string | null;
  storedDurationMs: number | null;
  playing: boolean;
  error: string | null;
  onTogglePlay: () => void;
  onClear: () => void;
  onUploadClick: () => void;
}

function InlineView({
  phase,
  value,
  storedDurationMs,
  playing,
  error,
  onTogglePlay,
  onClear,
  onUploadClick,
}: InlineViewProps) {
  if (phase === 'uploading') {
    return (
      <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border bg-white px-2 text-xs text-neutral-variant">
        <Loader2 size={12} className="animate-spin" />
        Uploading…
      </span>
    );
  }

  if (value) {
    return (
      <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border bg-white pl-1 pr-2 text-xs text-neutral-variant">
        <button
          type="button"
          onClick={onTogglePlay}
          className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? <Pause size={10} /> : <Play size={10} />}
        </button>
        <span className="font-semibold text-neutral">
          {storedDurationMs !== null ? formatDuration(storedDurationMs) : '0:00'}
        </span>
        <button
          type="button"
          onClick={onClear}
          className="rounded-full p-0.5 text-neutral-variant hover:bg-error/10 hover:text-error"
          aria-label="Remove"
          title="Remove"
        >
          <X size={10} />
        </button>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={onUploadClick}
        className="inline-flex h-7 items-center gap-1 rounded-full border border-dashed border-border bg-white px-2 text-xs text-neutral-variant hover:border-primary hover:text-primary"
      >
        <Upload size={11} />
        Upload
      </button>
      {error ? <span className="ml-1 text-[11px] text-error">{error}</span> : null}
    </span>
  );
}
