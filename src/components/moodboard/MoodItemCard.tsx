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

  return (
    <div className="group rounded-xl border border-border bg-card overflow-hidden flex flex-col hover:border-primary/40 transition-colors">
      <div className="relative aspect-square bg-muted flex items-center justify-center overflow-hidden">
        {item.imageUrl && !imgError ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <ImageOff className="h-8 w-8 text-muted-foreground/40" />
        )}
        {item.linkedCostItemId && (
          <div
            className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-success/90 text-success-foreground text-[10px] font-medium px-2 py-0.5"
            title="In Cost Tracker"
          >
            <Check className="h-3 w-3" /> In costs
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {item.url && (
            <Button
              size="icon"
              variant="secondary"
              className="h-7 w-7"
              asChild
            >
              <a href={item.url} target="_blank" rel="noopener noreferrer" title="Open link">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
          <Button
            size="icon"
            variant="secondary"
            className="h-7 w-7"
            onClick={onEdit}
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-7 w-7"
            onClick={onDelete}
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="p-3 flex-1 flex flex-col gap-1.5">
        <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
          {item.title}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {host ? (
            <span className="truncate">{host}</span>
          ) : (
            <span className="text-muted-foreground/50">no link</span>
          )}
          {item.price !== undefined && (
            <span className="font-semibold text-foreground">{fmt(item.price)}</span>
          )}
        </div>
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {item.tags.map((t) => (
              <span
                key={t}
                className="text-[10px] rounded-full bg-accent text-accent-foreground px-1.5 py-0.5"
              >
                {t}
              </span>
            ))}
          </div>
        )}
        {!item.linkedCostItemId && (
          <Button
            size="sm"
            variant="ghost"
            className="mt-1 h-7 text-xs justify-start px-2 text-muted-foreground hover:text-foreground"
            onClick={onPromote}
          >
            <ArrowRightToLine className="h-3.5 w-3.5 mr-1" /> Add to costs
          </Button>
        )}
      </div>
    </div>
  );
}
