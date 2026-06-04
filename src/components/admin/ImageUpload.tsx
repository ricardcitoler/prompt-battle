import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";

interface ImageUploadProps {
  value: File | string;
  onChange: (value: File | string) => void;
  disabled?: boolean;
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const previewUrl = value instanceof File ? URL.createObjectURL(value) : value || null;

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file?.type.startsWith("image/")) {
      onChange(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Upload image"
      className={[
        "relative rounded-md border-2 border-dashed transition-colors cursor-pointer overflow-hidden",
        dragging ? "border-primary bg-primary/5" : "border-border",
        disabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary/60",
      ].join(" ")}
      style={{ height: 120 }}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => e.key === "Enter" && !disabled && inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        disabled={disabled}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {previewUrl ? (
        <>
          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
          {!disabled && (
            <button
              type="button"
              aria-label="Remove image"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full gap-1.5 text-muted-foreground select-none">
          <Upload size={20} />
          <span className="text-xs">Drag or click to upload</span>
        </div>
      )}
    </div>
  );
}
