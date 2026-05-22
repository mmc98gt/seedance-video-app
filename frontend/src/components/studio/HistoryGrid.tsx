import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLocalHistory } from "@/hooks/useLocalHistory";
import type { GenerationFormValues } from "@/types/generation.types";
import { HistoryCard } from "./HistoryCard";

export function HistoryGrid({ onReuse }: { onReuse: (values: Partial<GenerationFormValues>) => void }) {
  const { items, removeItem, clearHistory } = useLocalHistory();

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Historial reciente</h2>
          <p className="text-sm text-muted-foreground">Máximo 50 generaciones guardadas localmente.</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm" disabled={!items.length}>
              <Trash2 className="h-4 w-4" />
              Limpiar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Borrar historial</DialogTitle>
              <DialogDescription>Esta acción eliminará las generaciones guardadas en localStorage. No borra archivos del servidor.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
              <DialogClose asChild><Button type="button" variant="destructive" onClick={clearHistory}>Borrar historial</Button></DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {items.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => <HistoryCard key={item.id} item={item} onReuse={onReuse} onRemove={removeItem} />)}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-white/10 bg-card/50 p-8 text-center text-sm text-muted-foreground">Todavía no hay generaciones guardadas.</div>
      )}
    </section>
  );
}
