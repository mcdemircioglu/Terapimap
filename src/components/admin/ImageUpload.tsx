'use client';

import { useRef, useState } from 'react';

interface ImageUploadProps {
  /** Current image URL (from professionals.image_url) */
  currentUrl: string;
  /** Called with the new public URL after a successful upload */
  onUploaded: (url: string) => void;
  /** Same password header sent by the rest of the admin API calls */
  adminPassword: string;
}

const ACCEPT = '.jpg,.jpeg,.png,.webp';
const MAX_MB = 5;

export default function ImageUpload({ currentUrl, onUploaded, adminPassword }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>(currentUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    setError('');

    // Client-side guard (server also validates)
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Yalnızca JPG, PNG veya WebP yükleyebilirsiniz.');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Dosya boyutu ${MAX_MB} MB'ı geçemez.`);
      return;
    }

    // Optimistic local preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'x-admin-password': adminPassword },
        body: fd,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Yükleme başarısız.');
        setPreview(currentUrl); // revert preview
        return;
      }

      onUploaded(data.url);
      setPreview(data.url);
    } catch {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.');
      setPreview(currentUrl);
    } finally {
      setUploading(false);
      URL.revokeObjectURL(objectUrl);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so the same file can be re-selected after an error
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="flex items-start gap-4">
      {/* Avatar preview */}
      <div className="flex-shrink-0">
        {preview ? (
          <img
            src={preview}
            alt="Profil fotoğrafı"
            className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 bg-gray-100"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-brand-50 border-2 border-dashed border-brand-200 flex items-center justify-center text-brand-300">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
        )}
      </div>

      {/* Drop zone + button */}
      <div className="flex-1 min-w-0">
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl px-4 py-5 text-center transition-colors cursor-pointer select-none
            ${uploading
              ? 'border-brand-200 bg-brand-50 cursor-not-allowed'
              : 'border-gray-300 hover:border-brand-400 hover:bg-brand-50'
            }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            onChange={handleChange}
            disabled={uploading}
            className="sr-only"
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-brand-600">
              {/* Spinner */}
              <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span className="text-sm font-medium">Yükleniyor…</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-gray-500">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <span className="text-sm">
                <span className="font-medium text-brand-600">Dosya seç</span>
                {' '}veya sürükle bırak
              </span>
              <span className="text-xs text-gray-400">JPG, PNG, WebP — maks {MAX_MB} MB</span>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-1.5 text-xs text-red-600">{error}</p>
        )}

        {preview && !uploading && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setPreview(''); onUploaded(''); }}
            className="mt-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            × Fotoğrafı kaldır
          </button>
        )}
      </div>
    </div>
  );
}
