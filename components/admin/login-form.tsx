"use client";

import { useActionState } from "react";

import type { LoginActionState } from "@/app/(admin)/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginFormProps = {
  action: (prevState: LoginActionState, formData: FormData) => Promise<LoginActionState>;
  nextPath?: string;
};

export function LoginForm({ action, nextPath }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={nextPath ?? "/admin"} />
      <div className="space-y-2">
        <Label htmlFor="password">Passwort</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Anmeldung..." : "Einloggen"}
      </Button>
    </form>
  );
}
