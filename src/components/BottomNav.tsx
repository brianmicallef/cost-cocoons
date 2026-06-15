import { NavLink } from "react-router-dom";
import { House, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav({ readOnly }: { readOnly?: boolean }) {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
      isActive
        ? "text-accent-foreground"
        : "text-muted-foreground hover:text-foreground"
    );

  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-20 border-t border-border/60 bg-background/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <div className="flex items-stretch max-w-5xl mx-auto">
        <NavLink to="/moodboard" className={linkClass}>
          {({ isActive }) => (
            <>
              <div
                className={cn(
                  "h-8 w-12 rounded-full flex items-center justify-center transition-colors",
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
                    "h-8 w-12 rounded-full flex items-center justify-center transition-colors",
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
