import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth, AuthUser } from "@/context/AuthContext";

export function SignupComponent() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const base = import.meta.env.VITE_API_BASE || 'http://localhost:4000';
      const res = await fetch(`${base}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: email.split('@')[0], email, password }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = typeof json === 'object' && json && 'error' in json ? (json as { error?: string }).error : null;
        throw new Error(message || 'Registration failed');
      }
      const data = json as { token: string; user: AuthUser };
      setSession(data.token, data.user);
      toast({ title: 'Account created' });
      navigate('/');
    } catch (err) {
      toast({ title: 'Registration failed', description: String(err) });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <CardDescription>
            Enter your information to create an account.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" type="submit">Sign up</Button>
        </CardFooter>
      </Card>
    </form>
  );
}
