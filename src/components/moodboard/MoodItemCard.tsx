import { useState } from "react";
import type { MoodItem } from "@/types/project";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Pencil,
  Trash2,
  ImageOff,
  ArrowRightToLine,
  Check,
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

interface MoodItemCardProps {
  item: MoodItem;
  onEdit: () => void;
  onDelete: () => void;
  onPromote: () => void;
}

export function MoodItemCard({ item, onEdit, onDelete, onPromote }: MoodItemCardProps) {
  const [imgError, setImgError] = useState(false);
  const host = hostOf(item.url);
  const hasImage = item.imageUrl && !imgError;

  return (
    <div className="group relative rounded-2xl overflow-hidden bg-muted shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
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

      {/* Top-left "in costs" badge */}
      {item.linkedCostItemId && (
        <div
          className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-success/90 text-success-foreground text-[10px] font-medium px-2 py-0.5 backdrop-blur-sm"
          title="In Cost Tracker"
        >
          <Check className="h-3 w-3" /> In costs
        </div>
      )}

      {/* Top-right hover actions */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {item.url && (
          <Button size="icon" variant="secondary" className="h-7 w-7 shadow-md" asChild>
            <a href={item.url} target="_blank" rel="noopener noreferrer" title="Open link">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        )}
        <Button
          size="icon"
          variant="secondary"
          className="h-7 w-7 shadow-md"
          onClick={onEdit}
          title="Edit"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="h-7 w-7 shadow-md"
          onClick={onDelete}
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Bottom hover overlay with info */}
      {hasImage && (
        <div className="absolute inset-x-0 bottom-0 p-3 pt-10 bg-gradient-to-t from-black/80 via-black/50 to-transparent text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-sm font-medium line-clamp-2 leading-snug">{item.title}</p>
          <div className="flex items-center justify-between mt-1 text-xs text-white/80">
            {host ? <span className="truncate">{host}</span> : <span />}
            {item.price !== undefined && (
              <span className="font-semibold text-white">{fmt(item.price)}</span>
            )}
          </div>
          {!item.linkedCostItemId && (
            <Button
              size="sm"
              variant="secondary"
              className="mt-2 h-7 text-xs w-full"
              onClick={onPromote}
            >
              <ArrowRightToLine className="h-3.5 w-3.5 mr-1" /> Add to costs
            </Button>
          )}
        </div>
      )}

      {/* For imageless cards, show meta inline (no overlay to reveal) */}
      {!hasImage && (item.price !== undefined || host || !item.linkedCostItemId) && (
        <div className="px-3 pb-3 -mt-1 flex items-center justify-between text-xs text-muted-foreground">
          {host ? <span className="truncate">{host}</span> : <span />}
          {item.price !== undefined && (
            <span className="font-semibold text-foreground">{fmt(item.price)}</span>
          )}
        </div>
      )}
    </div>
  );
}
