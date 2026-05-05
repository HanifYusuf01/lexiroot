import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Search' }: SearchInputProps) {
  return (
    <label className="relative flex h-10 w-full items-center sm:w-72">
      <Search size={16} className="absolute left-3 text-neutral-variant" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-full w-full rounded-full border border-border bg-neutral-soft/50 pl-9 pr-4 text-sm text-neutral placeholder:text-neutral-variant focus:border-primary focus:bg-white focus:outline-none"
      />
    </label>
  );
}
