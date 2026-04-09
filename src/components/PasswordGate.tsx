import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HardHat, Lock } from "lucide-react";

const PASSCODE = "ABCE12";

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(
    () => sessionStorage.getItem("rl_auth") === "true"
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === PASSCODE) {
      sessionStorage.setItem("rl_auth", "true");
      setAuthenticated(true);
    } else {
      setError(true);
    }
  };

  if (authenticated) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 p-6 rounded-xl border border-border bg-card">
        <div className="flex flex-col items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center">
            <HardHat className="h-5 w-5 text-accent-foreground" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Roebuck Lane</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" /> Enter password to continue
          </p>
        </div>
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(false); }}
          autoFocus
        />
        {error && <p className="text-sm text-destructive">Incorrect password</p>}
        <Button type="submit" className="w-full">Enter</Button>
      </form>
    </div>
  );
}
