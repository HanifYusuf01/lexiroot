interface AvatarProps {
  name: string;
  size?: number;
  src?: string | null;
}

const PALETTE = ['#E35336', '#814231', '#BF9828', '#1FC0E0', '#16A34A', '#7A7878'];

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('');
}

export function Avatar({ name, size = 32, src }: AvatarProps) {
  const color = PALETTE[hashCode(name) % PALETTE.length];
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.4 }}
    >
      {initials(name) || '?'}
    </div>
  );
}
