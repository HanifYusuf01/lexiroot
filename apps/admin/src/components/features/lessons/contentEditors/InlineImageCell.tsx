import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { useSignLessonImageMutation } from '../../../../services/uploadsApi';
import { uploadLessonMediaToCloudinary } from '../../../../utils/cloudinary';

interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
}

const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif';

export function InlineImageCell({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [signImage] = useSignLessonImageMutation();
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const signature = await signImage().unwrap();
      const url = await uploadLessonMediaToCloudinary(file, signature);
      onChange(url);
    } catch {
      /* swallow inline; visual error UI can come later */
    } finally {
      setBusy(false);
    }
  }

  if (busy) {
    return (
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-white">
        <Loader2 size={14} className="animate-spin text-neutral-variant" />
      </span>
    );
  }

  if (value) {
    return (
      <span className="relative inline-flex h-9 w-9 overflow-hidden rounded-md border border-border bg-white">
        <img src={value} alt="" className="h-full w-full object-cover" />
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-bl-md bg-black/55 text-white hover:bg-error"
          aria-label="Remove image"
        >
          <X size={10} />
        </button>
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-dashed border-border bg-white text-neutral-variant hover:border-primary hover:text-primary"
        aria-label="Add image"
      >
        <ImagePlus size={14} />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) handleFile(f);
        }}
      />
    </>
  );
}
