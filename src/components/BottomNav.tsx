import { NavLink } from "react-router-dom";
import { House, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav({ readOnly }: { readOnly?: boolean }) {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex h-full min-w-0 flex-col items-center justify-center gap-1.5 px-2 text-[11px] font-medium leading-none transition-colors",
      isActive
        ? "text-accent-foreground"
        : "text-muted-foreground hover:text-foreground"
    );

  return (
    <nav
      className="sm:hidden fixed inset-x-0 bottom-0 z-20 border-t border-border/60 bg-background/95 backdrop-blur-md [padding-bottom:env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <div className={cn("mx-auto grid h-16 max-w-5xl items-stretch px-2", readOnly ? "grid-cols-1" : "grid-cols-2")}>
        <NavLink to="/moodboard" className={linkClass}>
          {({ isActive }) => (
            <>
              <div
                className={cn(
                  "flex h-8 w-12 shrink-0 items-center justify-center rounded-full transition-colors",
                  isActive ? "bg-accent" : "bg-transparent"
                )}
              >
                <ImageIcon className="h-4 w-4" />
              </div>
              <span>Moodboard</span>
            </>
          )}
        </NavLink>
        {!readOnly && (
          <NavLink to="/cost-tracker" className={linkClass}>
            {({ isActive }) => (
              <>
                <div
                  className={cn(
                    "flex h-8 w-12 shrink-0 items-center justify-center rounded-full transition-colors",
                    isActive ? "bg-accent" : "bg-transparent"
                  )}
                >
                  <House className="h-4 w-4" />
                </div>
                <span>Cost Tracker</span>
              </>
            )}
          </NavLink>
        )}
      </div>
    </nav>
  );
}
