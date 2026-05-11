import { useEffect, useRef, useState } from 'react';
import { AudioWaveform, CheckCircle2, Loader2, Mic, Pause, Play, Square, Upload, X } from 'lucide-react';
import { useSignLessonAudioMutation } from '../../../../services/uploadsApi';
import { uploadLessonMediaToCloudinary } from '../../../../utils/cloudinary';

type Phase = 'idle' | 'recording' | 'preview' | 'uploading';

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

function extFor(mime: string): string {
  if (mime.includes('webm')) return 'webm';
  if (mime.includes('mp4') || mime.includes('aac')) return 'm4a';
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('wav')) return 'wav';
  return 'audio';
}

export function AudioRecorder({ value, onChange, variant = 'card' }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [recordingMs, setRecordingMs] = useState(0);
  const [storedDurationMs, setStoredDurationMs] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tickRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
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

  // Load duration of the saved value (when present and not actively recording).
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

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (tickRef.current !== null) cancelAnimationFrame(tickRef.current);
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        try {
          recorderRef.current.stop();
        } catch {
          /* ignore */
        }
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startRecording() {
    setError(null);
    if (typeof window === 'undefined' || !('MediaRecorder' in window)) {
      setError('Recording is not supported in this browser.');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Microphone access is not available in this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const mime = recorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mime });
        const url = URL.createObjectURL(blob);
        setPreviewBlob(blob);
        setPreviewUrl(url);
        setPhase('preview');
      };
      recorder.start();
      startedAtRef.current = Date.now();
      setRecordingMs(0);
      setPhase('recording');
      const tick = () => {
        setRecordingMs(Date.now() - startedAtRef.current);
        tickRef.current = requestAnimationFrame(tick);
      };
      tickRef.current = requestAnimationFrame(tick);
    } catch (err) {
      const e = err as { name?: string };
      if (e.name === 'NotAllowedError') {
        setError('Microphone permission denied. Allow access in your browser to record.');
      } else if (e.name === 'NotFoundError') {
        setError('No microphone found. Plug one in and try again.');
      } else {
        setError('Could not start recording. Try again.');
      }
    }
  }

  function stopRecording() {
    if (tickRef.current !== null) {
      cancelAnimationFrame(tickRef.current);
      tickRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  function discardPreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewBlob(null);
    setPhase('idle');
  }

  async function confirmPreview() {
    if (!previewBlob) return;
    setPhase('uploading');
    setError(null);
    try {
      const signature = await signAudio().unwrap();
      const ext = extFor(previewBlob.type);
      const file = new File([previewBlob], `recording.${ext}`, { type: previewBlob.type });
      const url = await uploadLessonMediaToCloudinary(file, signature);
      onChange(url);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setPreviewBlob(null);
      setPhase('idle');
    } catch {
      setError('Could not save the recording. Try again.');
      setPhase('preview');
    }
  }

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
        previewUrl={previewUrl}
        recordingMs={recordingMs}
        storedDurationMs={storedDurationMs}
        playing={playing}
        error={error}
        onStart={startRecording}
        onStop={stopRecording}
        onConfirm={confirmPreview}
        onDiscard={discardPreview}
        onTogglePlay={togglePlay}
        onClear={clearStored}
        onUploadClick={openFilePicker}
      />
    ) : (
      <CardView
        phase={phase}
        value={value}
        previewUrl={previewUrl}
        recordingMs={recordingMs}
        storedDurationMs={storedDurationMs}
        playing={playing}
        error={error}
        onStart={startRecording}
        onStop={stopRecording}
        onConfirm={confirmPreview}
        onDiscard={discardPreview}
        onTogglePlay={togglePlay}
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

interface ViewProps {
  phase: Phase;
  value: string | null;
  previewUrl: string | null;
  recordingMs: number;
  storedDurationMs: number | null;
  playing: boolean;
  error: string | null;
  onStart: () => void;
  onStop: () => void;
  onConfirm: () => void;
  onDiscard: () => void;
  onTogglePlay: () => void;
  onClear: () => void;
  onUploadClick: () => void;
}

function CardView({
  phase,
  value,
  previewUrl,
  recordingMs,
  storedDurationMs,
  error,
  onStart,
  onStop,
  onConfirm,
  onDiscard,
  onClear,
  onUploadClick,
}: ViewProps) {
  return (
    <div className="space-y-3">
      {value && phase === 'idle' ? (
        <audio src={value} controls className="w-full" />
      ) : null}
      <DashedBlock>
        {phase === 'recording' ? (
          <div className="flex w-full items-center gap-5">
            <span className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-error/15 text-error">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-error opacity-50" />
              <Mic size={26} className="relative" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-base font-extrabold text-error">Recording…</div>
              <div className="font-mono text-sm text-neutral">{formatDuration(recordingMs)}</div>
            </div>
            <button
              type="button"
              onClick={onStop}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-2 text-xs font-semibold text-neutral hover:bg-neutral-soft"
            >
              <Square size={12} />
              Stop
            </button>
          </div>
        ) : phase === 'preview' && previewUrl ? (
          <div className="w-full space-y-3">
            <div className="flex items-center gap-5">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-softer text-primary">
                <AudioWaveform size={26} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-base font-extrabold text-neutral">Preview your recording</div>
                <audio src={previewUrl} controls className="mt-1 h-9 w-full max-w-md" />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onConfirm}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90"
              >
                <CheckCircle2 size={12} />
                Use this recording
              </button>
              <button
                type="button"
                onClick={onDiscard}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-4 py-2 text-xs font-semibold text-neutral hover:bg-neutral-soft"
              >
                Re-record
              </button>
            </div>
          </div>
        ) : phase === 'uploading' ? (
          <div className="flex w-full items-center gap-3">
            <Loader2 size={20} className="animate-spin text-primary" />
            <span className="text-sm font-semibold text-neutral">Saving recording…</span>
          </div>
        ) : (
          <div className="w-full space-y-3">
            <button
              type="button"
              onClick={onStart}
              className="flex w-full items-center gap-5 text-left"
            >
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-softer text-primary">
                <AudioWaveform size={26} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-extrabold text-neutral">
                  {value ? 'Change Audio' : 'Record Audio'}
                </span>
                <span className="block text-sm text-neutral-variant">
                  {value
                    ? 'Click to record a new audio and replace the current one.'
                    : 'Click to record audio from your microphone.'}
                </span>
              </span>
            </button>
            <div className="flex items-center gap-3 pl-[calc(4rem+1.25rem)] text-xs text-neutral-variant">
              <span className="text-neutral-variant">or</span>
              <button
                type="button"
                onClick={onUploadClick}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-2.5 py-1 font-semibold text-neutral hover:bg-neutral-soft"
              >
                <Upload size={11} />
                {value ? 'Upload a different file' : 'Upload an audio file'}
              </button>
              <span className="hidden sm:inline">MP3, WAV up to 10MB</span>
            </div>
          </div>
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
      {storedDurationMs !== null && phase === 'idle' && value ? (
        <span className="sr-only">{formatDuration(storedDurationMs)}</span>
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

function InlineView({
  phase,
  value,
  previewUrl,
  recordingMs,
  storedDurationMs,
  playing,
  error,
  onStart,
  onStop,
  onConfirm,
  onDiscard,
  onTogglePlay,
  onClear,
  onUploadClick,
}: ViewProps) {
  if (phase === 'recording') {
    return (
      <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-error/40 bg-error/5 pl-1.5 pr-2 text-xs">
        <span className="relative flex h-3 w-3 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-error opacity-70" />
          <span className="relative h-2 w-2 rounded-full bg-error" />
        </span>
        <span className="font-mono font-semibold text-error">{formatDuration(recordingMs)}</span>
        <button
          type="button"
          onClick={onStop}
          className="ml-1 rounded-full p-0.5 text-error hover:bg-error/10"
          aria-label="Stop"
        >
          <Square size={10} />
        </button>
      </span>
    );
  }

  if (phase === 'preview' && previewUrl) {
    return (
      <span className="inline-flex h-7 items-center gap-1 rounded-full border border-primary-border bg-primary-softer pl-1 pr-1 text-xs">
        <audio src={previewUrl} controls className="h-6" />
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-full p-0.5 text-primary hover:bg-primary/10"
          title="Use this"
        >
          <CheckCircle2 size={12} />
        </button>
        <button
          type="button"
          onClick={onDiscard}
          className="rounded-full p-0.5 text-neutral-variant hover:bg-neutral-soft"
          title="Re-record"
        >
          <X size={10} />
        </button>
      </span>
    );
  }

  if (phase === 'uploading') {
    return (
      <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border bg-white px-2 text-xs text-neutral-variant">
        <Loader2 size={12} className="animate-spin" />
        Saving…
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
        onClick={onStart}
        className="inline-flex h-7 items-center gap-1 rounded-full border border-dashed border-border bg-white px-2 text-xs text-neutral-variant hover:border-primary hover:text-primary"
      >
        <Mic size={11} />
        Record
      </button>
      <button
        type="button"
        onClick={onUploadClick}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-border bg-white text-neutral-variant hover:border-primary hover:text-primary"
        title="Upload audio file"
        aria-label="Upload audio file"
      >
        <Upload size={11} />
      </button>
      {error ? <span className="ml-1 text-[11px] text-error">{error}</span> : null}
    </span>
  );
}
