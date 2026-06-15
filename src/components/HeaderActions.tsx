import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Upload, Download, MoreHorizontal } from "lucide-react";

interface HeaderActionsProps {
  onImport: () => void;
  onExport: () => void;
}

export function HeaderActions({ onImport, onExport }: HeaderActionsProps) {
  return (
    <>
      {/* Inline on tablet/desktop */}
      <div className="hidden sm:flex items-center gap-2">
        <Button variant="ghost" size="sm" className="rounded-full" onClick={onImport}>
          <Upload className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">Import</span>
        </Button>
        <Button variant="ghost" size="sm" className="rounded-full" onClick={onExport}>
          <Download className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">Export</span>
        </Button>
      </div>

      {/* Overflow menu on mobile */}
      <div className="sm:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9" aria-label="More actions">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onImport}>
              <Upload className="h-4 w-4 mr-2" /> Import
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExport}>
              <Download className="h-4 w-4 mr-2" /> Export
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}
