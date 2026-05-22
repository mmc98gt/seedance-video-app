import { Copy, Download, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { GenerationJob } from "@/types/generation.types";

export function GenerationActions({ job, onReuse }: { job: GenerationJob; onReuse: () => void }) {
  const copyUrl = async () => {
    if (!job.videoUrl) return;
    await navigator.clipboard.writeText(job.videoUrl);
    toast.success("URL copiada.");
  };

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <Button asChild disabled={!job.videoUrl} variant="secondary">
        <a href={job.videoUrl ?? "#"} download>
          <Download className="h-4 w-4" />
          Descargar
        </a>
      </Button>
      <Button type="button" variant="outline" onClick={copyUrl} disabled={!job.videoUrl}>
        <Copy className="h-4 w-4" />
        Copiar URL
      </Button>
      <Button type="button" variant="outline" onClick={onReuse}>
        <RotateCcw className="h-4 w-4" />
        Reusar
      </Button>
    </div>
  );
}
