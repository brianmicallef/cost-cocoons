import { NavLink } from "react-router-dom";
import { House, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function TopNav() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors",
      isActive
        ? "bg-accent text-accent-foreground"
        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
    );

  return (
    <nav className="flex items-center gap-1">
      <NavLink to="/moodboard" className={linkClass}>
        <ImageIcon className="h-4 w-4" /> Moodboard
      </NavLink>
      <NavLink to="/cost-tracker" className={linkClass}>
        <House className="h-4 w-4" /> Cost Tracker
      </NavLink>
    </nav>
  );
}
