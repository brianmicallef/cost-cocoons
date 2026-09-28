import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { House, Lock, Eye } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { Link } from "react-router-dom";

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const { authenticated, login } = useUser();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = login("Brian", password);
    if (!ok) setError("Incorrect password");
  };

  if (authenticated) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 p-6 rounded-xl border border-border bg-card">
        <div className="flex flex-col items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center">
            <House className="h-5 w-5 text-accent-foreground" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Roebuck Lane</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" /> Sign in to continue
          </p>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Password</label>
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(null); }}
            autoFocus
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={!password}>Enter</Button>
        <Link
          to="/moodboard/guest"
          className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors pt-1"
        >
          <Eye className="h-3.5 w-3.5" />
          View moodboard as guest
        </Link>
      </form>
    </div>
  );
}
