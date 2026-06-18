import { useState } from "react";
import type { MoodItem, MoodBoard } from "@/types/project";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Instagram,
  Globe,
  Maximize2,
} from "lucide-react";
import { useCurrentUser } from "@/contexts/UserContext";
import { detectSource, faviconFor } from "@/lib/moodSources";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);


interface MoodTileProps {
  item: MoodItem;
  board: MoodBoard;
  expanded: boolean;
  readOnly?: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPromote: () => void;
  onUnpromote: () => void;
  onVote: (type: "up" | "down") => void;
  onSourceClick?: (key: string) => void;
}

export function MoodTile({
  item,
  board,
  expanded,
  readOnly,
  onToggleExpand,
  onEdit,
  onDelete,
  onPromote,
  onUnpromote,
  onVote,
  onSourceClick,
}: MoodTileProps) {
  const [imgError, setImgError] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const currentUser = useCurrentUser();
  const source = detectSource(item.url);

  const hasImage = item.imageUrl && !imgError;

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const votes = item.votes || [];
  const upVoters = votes.filter((v) => v.type === "up").map((v) => v.user);
  const downVoters = votes.filter((v) => v.type === "down").map((v) => v.user);
  const myVote = votes.find((v) => v.user === currentUser)?.type;

  const reactionRing =
    upVoters.length > 0 && downVoters.length === 0
      ? "ring-2 ring-success/60"
      : downVoters.length > 0 && upVoters.length === 0
      ? "ring-2 ring-warning/60"
      : upVoters.length > 0 && downVoters.length > 0
      ? "ring-2 ring-muted-foreground/40"
      : "";

  return (
    <div
      className={`group relative rounded-2xl overflow-hidden bg-muted shadow-sm hover:shadow-xl transition-all duration-200 cursor-pointer ${
        expanded ? "ring-2 ring-accent shadow-xl" : `${reactionRing} hover:-translate-y-0.5`
      }`}
      onClick={onToggleExpand}
    >
      {hasImage ? (
        <button
          type="button"
          className="relative block w-full cursor-zoom-in"
          onClick={(e) => {
            stop(e);
            setImageOpen(true);
          }}
        >
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-auto block"
            loading="lazy"
            onError={() => setImgError(true)}
          />
          <span className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <Maximize2 className="h-3.5 w-3.5" />
          </span>
        </button>
      ) : (
        <div className="w-full aspect-[4/5] flex flex-col items-center justify-center gap-2 p-4 text-center">
          <ImageOff className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground line-clamp-3">{item.title}</p>
        </div>
      )}

      {/* Category + Source badges */}
      <div className="absolute top-2 left-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <div
          className="flex items-center gap-1.5 rounded-full bg-background/90 backdrop-blur-sm text-foreground text-[10px] font-medium pl-1.5 pr-2 py-0.5 shadow-sm"
          title={board.name}
        >
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: board.color }} />
          <span className="truncate max-w-[120px]">{board.name}</span>
        </div>
        {source && onSourceClick && (
          <button
            type="button"
            onClick={(e) => {
              stop(e);
              onSourceClick(source.key);
            }}
            title={`Filter by ${source.label}`}
            className="flex items-center gap-1 rounded-full bg-background/90 hover:bg-background backdrop-blur-sm text-foreground text-[10px] font-medium pl-1 pr-2 py-0.5 shadow-sm transition-colors"
          >
            {source.kind === "instagram" ? (
              <Instagram className="h-3 w-3" />
            ) : source.kind === "site" && faviconFor(source.host) ? (
              <img
                src={faviconFor(source.host)!}
                alt=""
                className="h-3 w-3 rounded-sm"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <Globe className="h-3 w-3" />
            )}
            <span className="truncate max-w-[120px]">{source.label}</span>
          </button>
        )}
      </div>


      {/* Voting buttons + counts */}
      {!readOnly && (
      <div
        className={`absolute bottom-2 right-2 flex items-center gap-1 transition-opacity ${
          votes.length > 0 || expanded ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
        onClick={stop}
      >
        <button
          type="button"
          onClick={(e) => {
            stop(e);
            onVote("up");
          }}
          title={
            upVoters.length > 0
              ? `Liked by ${upVoters.join(", ")}`
              : myVote === "up"
              ? "Remove your thumbs up"
              : "Thumbs up"
          }
          className={`h-7 rounded-full backdrop-blur-sm flex items-center gap-1 px-2 shadow-sm transition-colors ${
            myVote === "up"
              ? "bg-success text-success-foreground"
              : upVoters.length > 0
              ? "bg-success/80 text-success-foreground"
              : "bg-background/90 text-foreground hover:bg-success hover:text-success-foreground"
          }`}
        >
          <ThumbsUp className="h-3.5 w-3.5" />
          {upVoters.length > 0 && <span className="text-[11px] font-semibold">{upVoters.length}</span>}
        </button>
        <button
          type="button"
          onClick={(e) => {
            stop(e);
            onVote("down");
          }}
          title={
            downVoters.length > 0
              ? `Disliked by ${downVoters.join(", ")}`
              : myVote === "down"
              ? "Remove your thumbs down"
              : "Thumbs down"
          }
          className={`h-7 rounded-full backdrop-blur-sm flex items-center gap-1 px-2 shadow-sm transition-colors ${
            myVote === "down"
              ? "bg-warning text-warning-foreground"
              : downVoters.length > 0
              ? "bg-warning/80 text-warning-foreground"
              : "bg-background/90 text-foreground hover:bg-warning hover:text-warning-foreground"
          }`}
        >
          <ThumbsDown className="h-3.5 w-3.5" />
          {downVoters.length > 0 && (
            <span className="text-[11px] font-semibold">{downVoters.length}</span>
          )}
        </button>
      </div>
      )}
      {readOnly && votes.length > 0 && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          {upVoters.length > 0 && (
            <span
              className="h-7 rounded-full backdrop-blur-sm flex items-center gap-1 px-2 shadow-sm bg-success/80 text-success-foreground"
              title={`Liked by ${upVoters.join(", ")}`}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              <span className="text-[11px] font-semibold">{upVoters.length}</span>
            </span>
          )}
          {downVoters.length > 0 && (
            <span
              className="h-7 rounded-full backdrop-blur-sm flex items-center gap-1 px-2 shadow-sm bg-warning/80 text-warning-foreground"
              title={`Disliked by ${downVoters.join(", ")}`}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
              <span className="text-[11px] font-semibold">{downVoters.length}</span>
            </span>
          )}
        </div>
      )}

      {item.linkedCostItemId && !readOnly && (
        <button
          type="button"
          onClick={(e) => {
            stop(e);
            if (confirm(`Remove "${item.title}" from the cost tracker?`)) onUnpromote();
          }}
          title="In Cost Tracker — click to untick & remove"
          className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-success/90 hover:bg-success text-success-foreground text-[10px] font-medium px-2 py-0.5 backdrop-blur-sm transition-colors"
        >
          <Check className="h-3 w-3" /> In costs
        </button>
      )}
      {item.linkedCostItemId && readOnly && (
        <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-success/90 text-success-foreground text-[10px] font-medium px-2 py-0.5 backdrop-blur-sm">
          <Check className="h-3 w-3" /> In costs
        </span>
      )}

      {/* Hover bottom info gradient (only when not expanded) */}
      {hasImage && !expanded && (
        <div className="absolute inset-x-0 bottom-0 p-3 pt-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <p className="text-sm font-medium line-clamp-2 leading-snug">{item.title}</p>
          <div className="flex items-center justify-between mt-0.5 text-xs text-white/80">
            {source ? <span className="truncate">{source.label}</span> : <span />}
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
              onClick={(e) => {
                stop(e);
                onToggleExpand();
              }}
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
            {source && (
              <div className="min-w-0">
                <div className="text-muted-foreground">Source</div>
                {onSourceClick ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      stop(e);
                      onSourceClick(source.key);
                    }}
                    className="truncate text-foreground hover:underline inline-flex items-center gap-1 max-w-full"
                    title={`Filter by ${source.label}`}
                  >
                    {source.kind === "instagram" ? (
                      <Instagram className="h-3 w-3 shrink-0" />
                    ) : (
                      <Globe className="h-3 w-3 shrink-0" />
                    )}
                    <span className="truncate">{source.label}</span>
                  </button>
                ) : (
                  <div className="truncate text-foreground">{source.label}</div>
                )}
              </div>
            )}
            <div>
              <div className="text-muted-foreground">Added</div>
              <div className="text-foreground">
                {new Date(item.createdAt).toLocaleDateString("en-GB")}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Added by</div>
              <div className="text-foreground">{item.createdBy || "Brian"}</div>
            </div>
            {item.linkedCostItemId && (
              <div>
                <div className="text-muted-foreground">Status</div>
                <div className="text-success font-medium">In Cost Tracker</div>
              </div>
            )}
          </div>

          {(upVoters.length > 0 || downVoters.length > 0) && (
            <div className="text-xs space-y-1 border-t border-border pt-2">
              {upVoters.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <ThumbsUp className="h-3 w-3 text-success" />
                  <span className="text-muted-foreground">Liked by</span>
                  <span className="text-foreground">{upVoters.join(", ")}</span>
                </div>
              )}
              {downVoters.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <ThumbsDown className="h-3 w-3 text-warning" />
                  <span className="text-muted-foreground">Disliked by</span>
                  <span className="text-foreground">{downVoters.join(", ")}</span>
                </div>
              )}
            </div>
          )}

          {item.notes && (
            <div className="text-xs">
              <div className="text-muted-foreground mb-0.5">Notes</div>
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">{item.notes}</p>
            </div>
          )}

          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.tags.map((t) => (
                <span
                  key={t}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                >
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
            {!readOnly && (
              <>
                {item.linkedCostItemId ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={(e) => {
                      stop(e);
                      if (confirm(`Remove "${item.title}" from the cost tracker?`)) onUnpromote();
                    }}
                  >
                    <X className="h-3.5 w-3.5 mr-1" /> Remove from costs
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={(e) => {
                      stop(e);
                      onPromote();
                    }}
                  >
                    <ArrowRightToLine className="h-3.5 w-3.5 mr-1" /> Add to costs
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    stop(e);
                    onEdit();
                  }}
                >
                  <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    stop(e);
                    onDelete();
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Image lightbox */}
      <Dialog open={imageOpen} onOpenChange={setImageOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-0 bg-transparent shadow-none">
          <DialogTitle className="sr-only">{item.title}</DialogTitle>
          <img
            src={item.imageUrl}
            alt={item.title}
            className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
            onError={() => setImgError(true)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
