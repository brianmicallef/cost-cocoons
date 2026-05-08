import { useState } from "react";
import type { MoodItem, MoodBoard } from "@/types/project";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Pencil,
  Trash2,
  ImageOff,
  ArrowRightToLine,
  Check,
  X,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

const hostOf = (url?: string) => {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
};

interface MoodTileProps {
  item: MoodItem;
  board: MoodBoard;
  expanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPromote: () => void;
}

export function MoodTile({
  item,
  board,
  expanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onPromote,
}: MoodTileProps) {
  const [imgError, setImgError] = useState(false);
  const host = hostOf(item.url);
  const hasImage = item.imageUrl && !imgError;

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div
      className={`group relative rounded-2xl overflow-hidden bg-muted shadow-sm hover:shadow-xl transition-all duration-200 cursor-pointer ${
        expanded ? "ring-2 ring-accent shadow-xl" : "hover:-translate-y-0.5"
      }`}
      onClick={onToggleExpand}
    >
      {hasImage ? (
        <img
          src={item.imageUrl}
          alt={item.title}
          className="w-full h-auto block"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-full aspect-[4/5] flex flex-col items-center justify-center gap-2 p-4 text-center">
          <ImageOff className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground line-clamp-3">{item.title}</p>
        </div>
      )}

      {/* Category badge — visible on hover */}
      <div
        className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-background/90 backdrop-blur-sm text-foreground text-[10px] font-medium pl-1.5 pr-2 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
        title={board.name}
      >
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: board.color }} />
        <span className="truncate max-w-[120px]">{board.name}</span>
      </div>

      {item.linkedCostItemId && (
        <div
          className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-success/90 text-success-foreground text-[10px] font-medium px-2 py-0.5 backdrop-blur-sm"
          title="In Cost Tracker"
        >
          <Check className="h-3 w-3" /> In costs
        </div>
      )}

      {/* Hover bottom info gradient (only when not expanded) */}
      {hasImage && !expanded && (
        <div className="absolute inset-x-0 bottom-0 p-3 pt-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <p className="text-sm font-medium line-clamp-2 leading-snug">{item.title}</p>
          <div className="flex items-center justify-between mt-0.5 text-xs text-white/80">
            {host ? <span className="truncate">{host}</span> : <span />}
            {item.price !== undefined && (
              <span className="font-semibold text-white">{fmt(item.price)}</span>
            )}
          </div>
        </div>
      )}

      {/* Expanded info panel */}
      {expanded && (
        <div className="bg-card border-t border-border p-4 space-y-3" onClick={stop}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-base leading-tight">{item.title}</h3>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: board.color }} />
                <span>{board.name}</span>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 -mt-1 -mr-1 shrink-0"
              onClick={(e) => { stop(e); onToggleExpand(); }}
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {item.price !== undefined && (
              <div>
                <div className="text-muted-foreground">Price</div>
                <div className="font-semibold text-foreground text-sm">{fmt(item.price)}</div>
              </div>
            )}
            {host && (
              <div className="min-w-0">
                <div className="text-muted-foreground">Source</div>
                <div className="truncate text-foreground">{host}</div>
              </div>
            )}
            <div>
              <div className="text-muted-foreground">Added</div>
              <div className="text-foreground">
                {new Date(item.createdAt).toLocaleDateString("en-GB")}
              </div>
            </div>
            {item.linkedCostItemId && (
              <div>
                <div className="text-muted-foreground">Status</div>
                <div className="text-success font-medium">In Cost Tracker</div>
              </div>
            )}
          </div>

          {item.notes && (
            <div className="text-xs">
              <div className="text-muted-foreground mb-0.5">Notes</div>
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">{item.notes}</p>
            </div>
          )}

          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.tags.map((t) => (
                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  #{t}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 pt-1">
            {item.url && (
              <Button size="sm" variant="outline" className="h-7 text-xs" asChild onClick={stop}>
                <a href={item.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-1" /> Open
                </a>
              </Button>
            )}
            {!item.linkedCostItemId && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={(e) => { stop(e); onPromote(); }}
              >
                <ArrowRightToLine className="h-3.5 w-3.5 mr-1" /> Add to costs
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={(e) => { stop(e); onEdit(); }}
            >
              <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-muted-foreground hover:text-destructive"
              onClick={(e) => { stop(e); onDelete(); }}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
