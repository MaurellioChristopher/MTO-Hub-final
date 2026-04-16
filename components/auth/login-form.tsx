"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, LogIn, Loader2, AlertCircle, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      triggerError("Username dan password tidak boleh kosong.");
      return;
    }

    startTransition(async () => {
      const result = await signIn("credentials", {
        username: username.trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        triggerError("Username atau password salah. Silakan coba lagi.");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    });
  };

  function triggerError(msg: string) {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 600);
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className={shake ? "animate-shake" : ""}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="space-y-5">
        {/* Username field */}
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Label htmlFor="username" className="text-sm font-medium text-foreground/80">
            Username
          </Label>
          <div className="relative">
            <User
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="username"
              type="text"
              placeholder="contoh: MaurellINTI"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isPending}
              autoComplete="username"
              className="h-12 rounded-xl border-white/10 bg-white/5 pl-10 text-foreground placeholder:text-muted-foreground/50 focus:border-[#DC143C] focus:ring-[#DC143C]/20 focus:ring-2 transition-all duration-200"
            />
          </div>
          <p className="text-[11px] text-muted-foreground/60 pl-1">
            Format: <span className="text-[#D4AF37] font-semibold">NamaPendek</span> + <span className="text-[#4F8EF7] font-semibold">DEPT</span> — e.g. <em>MaurellINTI</em>
          </p>
        </motion.div>

        {/* Password field */}
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Label htmlFor="password" className="text-sm font-medium text-foreground/80">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isPending}
              autoComplete="current-password"
              className="h-12 rounded-xl border-white/10 bg-white/5 pr-12 text-foreground placeholder:text-muted-foreground/50 focus:border-[#DC143C] focus:ring-[#DC143C]/20 focus:ring-2 transition-all duration-200"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground/60 pl-1">
            Default: <span className="text-[#D4AF37] font-semibold">NamaPendek</span><span className="text-white/60 font-semibold">123</span>
          </p>
        </motion.div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit button */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            type="submit"
            id="login-submit"
            disabled={isPending}
            className="h-12 w-full rounded-xl font-semibold text-base transition-all duration-300"
            style={{
              background: isPending
                ? "rgba(220,20,60,0.5)"
                : "linear-gradient(135deg, #DC143C 0%, #8B0000 100%)",
              boxShadow: isPending
                ? "none"
                : "0 4px 24px rgba(220,20,60,0.35), 0 1px 0 rgba(255,255,255,0.1) inset",
            }}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                Masuk...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <LogIn size={18} />
                Masuk ke MTO-Hub
              </span>
            )}
          </Button>
        </motion.div>


      </div>
    </motion.form>
  );
}
