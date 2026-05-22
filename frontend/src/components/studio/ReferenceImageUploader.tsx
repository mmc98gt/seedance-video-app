import { ImagePlus, X } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ACCEPTED_IMAGE_TYPES, formatBytes, isAcceptedImage, MAX_IMAGE_SIZE } from "@/lib/file";
import { cn } from "@/lib/cn";

interface ReferenceImageUploaderProps {
  value?: File | null;
  error?: string;
  onChange: (file: File | null) => void;
}

export function ReferenceImageUploader({ value, error, onChange }: ReferenceImageUploaderProps) {
  const inputId = useId();
  const [isDragging, setIsDragging] = useState(false);
  const previewUrl = useMemo(() => (value ? URL.createObjectURL(value) : null), [value]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFile = (file?: File) => {
    if (!file || !isAcceptedImage(file)) return;
    onChange(file);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>Imagen de referencia</Label>
      <div
        className={cn("relative flex min-h-44 flex-col items-center justify-center rounded-lg border border-dashed border-input bg-background/60 p-4 text-center transition-colors", isDragging && "border-primary bg-primary/10")}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFile(event.dataTransfer.files[0]);
        }}
      >
        {previewUrl ? (
          <>
            <img src={previewUrl} alt="Preview de imagen de referencia" className="max-h-56 rounded-md object-contain" />
            <Button type="button" size="icon" variant="destructive" className="absolute right-3 top-3" onClick={() => onChange(null)} aria-label="Eliminar imagen">
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <div className="space-y-3">
            <ImagePlus className="mx-auto h-9 w-9 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Arrastra una imagen o selecciónala</p>
              <p className="text-xs text-muted-foreground">JPG, PNG o WebP hasta {formatBytes(MAX_IMAGE_SIZE)}</p>
            </div>
            <Button type="button" variant="outline" onClick={() => document.getElementById(inputId)?.click()}>
              Seleccionar archivo
            </Button>
          </div>
        )}
        <input id={inputId} className="sr-only" type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} onChange={(event) => handleFile(event.target.files?.[0])} />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
