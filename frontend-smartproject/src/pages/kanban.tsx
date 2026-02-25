import { useState } from "react";
import { useRoute } from "wouter";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, patch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Archive, Loader2, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const COLUMNS = [
  { id: "wish" as const, title: "Wish" },
  { id: "ready" as const, title: "Ready" },
  { id: "doing" as const, title: "Doing" },
  { id: "done" as const, title: "Done" },
];

// 3D column styles: light bg + shadow/depth per lane
const LANE_STYLES: Record<ColumnId, string> = {
  wish: "bg-sky-50/95 border-sky-200/80 shadow-[0_4px_0_0_rgba(14,165,233,0.2),0_8px_16px_-4px_rgba(14,165,233,0.15)]",
  ready: "bg-amber-50/95 border-amber-200/80 shadow-[0_4px_0_0_rgba(245,158,11,0.2),0_8px_16px_-4px_rgba(245,158,11,0.15)]",
  doing: "bg-emerald-50/95 border-emerald-200/80 shadow-[0_4px_0_0_rgba(16,185,129,0.2),0_8px_16px_-4px_rgba(16,185,129,0.15)]",
  done: "bg-violet-50/95 border-violet-200/80 shadow-[0_4px_0_0_rgba(139,92,246,0.2),0_8px_16px_-4px_rgba(139,92,246,0.15)]",
};

// Irregular border-radius presets (different per card for organic look)
const TASK_BORDER_RADII = [
  "rounded-[20px_6px_18px_8px]",
  "rounded-[8px_20px_6px_18px]",
  "rounded-[16px_16px_4px_4px]",
  "rounded-[6px_6px_20px_20px]",
  "rounded-[14px_4px_14px_4px]",
  "rounded-[4px_18px_4px_18px]",
];

// Light task card background colors (cycle so each stands out)
const TASK_CARD_COLORS = [
  "bg-rose-50/95 border-rose-200/70",
  "bg-cyan-50/95 border-cyan-200/70",
  "bg-lime-50/95 border-lime-200/70",
  "bg-amber-50/95 border-amber-200/70",
  "bg-sky-50/95 border-sky-200/70",
  "bg-fuchsia-50/95 border-fuchsia-200/70",
  "bg-teal-50/95 border-teal-200/70",
  "bg-orange-50/95 border-orange-200/70",
];

type ColumnId = "wish" | "ready" | "doing" | "done";

interface KanbanCardItem {
  id: string;
  title: string;
  description?: string;
}

interface Lane {
  id: ColumnId;
  title: string;
  cards: KanbanCardItem[];
}

interface KanbanBoard {
  lanes: Lane[];
}

function reorderLanes(lanes: Lane[], result: DropResult): Lane[] {
  const { source, destination } = result;
  if (!destination) return lanes;

  const sourceLane = lanes.find((l) => l.id === source.droppableId);
  const destLane = lanes.find((l) => l.id === destination.droppableId);
  if (!sourceLane || !destLane) return lanes;

  const sourceCards = [...sourceLane.cards];
  const [removed] = sourceCards.splice(source.index, 1);
  if (!removed) return lanes;

  if (source.droppableId === destination.droppableId) {
    sourceCards.splice(destination.index, 0, removed);
    return lanes.map((lane) =>
      lane.id === source.droppableId ? { ...lane, cards: sourceCards } : lane
    );
  }

  const destCards = [...destLane.cards];
  destCards.splice(destination.index, 0, removed);
  return lanes.map((lane) => {
    if (lane.id === source.droppableId) return { ...lane, cards: sourceCards };
    if (lane.id === destination.droppableId) return { ...lane, cards: destCards };
    return lane;
  });
}

export default function KanbanPage() {
  const [, params] = useRoute<{ projectId: string }>("/projects/:projectId/kanban");
  const projectId = params?.projectId ?? "";
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const { data, isLoading } = useQuery<KanbanBoard>({
    queryKey: [`/api/projects/${projectId}/kanban`],
    queryFn: () => get(`/projects/${projectId}/kanban`),
    enabled: !!projectId,
  });

  const moveMutation = useMutation({
    mutationFn: ({
      cardId,
      column,
      position,
    }: {
      cardId: number;
      column: ColumnId;
      position: number;
    }) =>
      patch(`/projects/${projectId}/kanban/cards/${cardId}`, { column, position }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/kanban`] });
    },
    onError: (err: Error) => {
      toast({ title: "Move failed", description: err.message, variant: "destructive" });
    },
  });

  const createMutation = useMutation({
    mutationFn: (body: { title: string; description?: string }) =>
      post(`/projects/${projectId}/kanban/cards`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/kanban`] });
      setAddOpen(false);
      setNewTitle("");
      setNewDescription("");
      toast({ title: "Card added", description: "New card added to Wish." });
    },
    onError: (err: Error) => {
      toast({ title: "Add failed", description: err.message, variant: "destructive" });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (cardId: number) =>
      post(`/projects/${projectId}/kanban/cards/${cardId}/archive`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/kanban`] });
      toast({ title: "Card archived", description: "Card removed from board." });
    },
    onError: (err: Error) => {
      toast({ title: "Archive failed", description: err.message, variant: "destructive" });
    },
  });

  const lanes = data?.lanes ?? COLUMNS.map((c) => ({ ...c, cards: [] as KanbanCardItem[] }));

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const next = reorderLanes(lanes, result);
    const cardId = parseInt(result.draggableId, 10);
    if (isNaN(cardId)) return;
    const destLane = next.find((l) => l.id === result.destination!.droppableId);
    const position = result.destination.index;
    moveMutation.mutate({
      cardId,
      column: result.destination.droppableId as ColumnId,
      position,
    });
  };

  const handleAddCard = () => {
    if (!newTitle.trim()) return;
    createMutation.mutate({ title: newTitle.trim(), description: newDescription.trim() || undefined });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Kanban</h1>
        <Button onClick={() => setAddOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add card
        </Button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {lanes.map((lane) => (
            <Droppable key={lane.id} droppableId={lane.id}>
              {(provided, snapshot) => (
                <Card
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`min-h-[320px] flex flex-col border-2 transition-all duration-200 ${LANE_STYLES[lane.id]} ${
                    snapshot.isDraggingOver
                      ? "scale-[1.02] shadow-[0_6px_0_0_currentColor,0_12px_24px_-4px_rgba(0,0,0,0.12)] ring-2 ring-teal-400/50"
                      : ""
                  }`}
                >
                  <CardHeader className="py-3 px-4 border-b border-black/5 bg-white/50 backdrop-blur-sm">
                    <CardTitle className="text-sm font-medium uppercase tracking-wide">
                      {lane.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 p-3 overflow-y-auto">
                    {lane.cards.map((card, index) => {
                      const radiusClass = TASK_BORDER_RADII[index % TASK_BORDER_RADII.length];
                      const colorClass = TASK_CARD_COLORS[index % TASK_CARD_COLORS.length];
                      return (
                      <Draggable
                        key={card.id}
                        draggableId={card.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`mb-3 border-2 p-3 transition-all duration-200 ${radiusClass} ${colorClass} ${
                              snapshot.isDragging
                                ? "shadow-[0_8px_20px_-4px_rgba(0,0,0,0.25)] scale-105 ring-2 ring-teal-400"
                                : "shadow-[0_2px_6px_-2px_rgba(0,0,0,0.1)]"
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <div
                                {...provided.dragHandleProps}
                                className="mt-0.5 text-muted-foreground cursor-grab active:cursor-grabbing"
                              >
                                <GripVertical className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-gray-900 truncate">
                                  {card.title}
                                </p>
                                {card.description && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {card.description}
                                  </p>
                                )}
                                {lane.id === "done" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-2 h-7 text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-50"
                                    onClick={() => archiveMutation.mutate(parseInt(card.id, 10))}
                                    disabled={archiveMutation.isPending}
                                  >
                                    <Archive className="h-3 w-3 mr-1" />
                                    Archive
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </CardContent>
                </Card>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add card</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Task title"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="desc">Description (optional)</Label>
              <Input
                id="desc"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Brief description"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddCard}
              disabled={!newTitle.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Add to Wish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
