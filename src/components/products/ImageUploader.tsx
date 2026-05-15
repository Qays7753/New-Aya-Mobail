import React, { useRef, useState, useEffect } from 'react';
import { Camera, Image as ImageIcon, Trash2, Loader2 } from 'lucide-react';
import { compressImage } from '@/lib/imageStorage';
import { toast } from 'sonner';

interface ImageUploaderProps {
  initialImageBlobUrl?: string; // e.g. previously saved image preview
  onImageChange: (blob: Blob | null) => void;
}

export function ImageUploader({ initialImageBlobUrl, onImageChange }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(initialImageBlobUrl || null);
  const [isCompressing, setIsCompressing] = useState(false);
  
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // If parent updates initial blob URL, reflect it
    if (initialImageBlobUrl !== undefined && preview === null && initialImageBlobUrl !== null) {
      setPreview(initialImageBlobUrl);
    }
  }, [initialImageBlobUrl]);

  const handleFile = async (file: File) => {
    try {
      setIsCompressing(true);
      const compressedBlob = await compressImage(file);
      const url = URL.createObjectURL(compressedBlob);
      setPreview(url);
      onImageChange(compressedBlob);
    } catch (error: any) {
      toast.error(error.message || 'خطأ أثناء معالجة الصورة');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemove = () => {
    if (preview) {
      // Don't revoke if it's the initial URL, just clear local state 
      // If we created it, we can revoke it, but it's fine.
    }
    setPreview(null);
    onImageChange(null);
  };

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-border">
          <img src={preview} alt="Product" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute bottom-2 end-2 p-2 bg-white/90 text-danger rounded-full shadow hover:bg-white transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            disabled={isCompressing}
            className="flex-1 h-12 flex items-center justify-center gap-2 bg-surface border border-border rounded-xl text-text-secondary hover:bg-muted transition-colors disabled:opacity-50"
          >
            {isCompressing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
            <span>اختر من المعرض</span>
          </button>
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            disabled={isCompressing}
            className="flex-1 h-12 flex items-center justify-center gap-2 bg-surface border border-border rounded-xl text-text-secondary hover:bg-muted transition-colors disabled:opacity-50"
          >
            {isCompressing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
            <span>التقط بالكاميرا</span>
          </button>
        </div>
      )}

      {/* Hidden inputs */}
      <input
        type="file"
        ref={galleryRef}
        accept="image/*"
        onChange={(e) => {
          if (e.target.files?.[0]) handleFile(e.target.files[0]);
          e.target.value = '';
        }}
        className="hidden"
      />
      <input
        type="file"
        ref={cameraRef}
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          if (e.target.files?.[0]) handleFile(e.target.files[0]);
          e.target.value = '';
        }}
        className="hidden"
      />
    </div>
  );
}
