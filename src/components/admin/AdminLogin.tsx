import { useState } from "react";

export default function AdminLogin({ onLogin }: { onLogin: (pw: string) => boolean }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onLogin(password)) {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-card border border-border rounded-xl p-8 space-y-4">
        <h2 className="font-heading text-2xl font-bold text-foreground text-center">Admin Access</h2>
        <input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(false); }}
          placeholder="Enter admin password"
          className="w-full rounded-lg bg-secondary border border-border px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {error && <p className="text-destructive text-sm text-center">Incorrect password</p>}
        <button
          type="submit"
          className="w-full bg-primary text-primary-foreground font-semibold py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          Login
        </button>
      </form>
    </div>
  );
}
