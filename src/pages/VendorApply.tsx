import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "@/lib/api";

export default function VendorApply() {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [certs, setCerts] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const { toast } = useToast();
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const [useApi, setUseApi] = useState(false);
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!useApi) {
      const subject = encodeURIComponent("Vendor application: " + name);
      const body = encodeURIComponent(`Name: ${name}\nLocation: ${location}\nSpecialty: ${specialty}\nCertifications: ${certs}\nEmail: ${email}\nPhone: ${phone}\n\nPlease review and create a vendor account.`);
      // open mail client to contact admin
      window.location.href = `mailto:ops@skyway.aero?subject=${subject}&body=${body}`;
      toast({ title: "Application started", description: "Opening your mail client to contact admin." });
      return;
    }

    if (!password) {
      toast({ title: 'Password required for programmatic registration' });
      return;
    }

    // Basic client-side validation
    const missing: string[] = [];
    if (!name || name.trim().length === 0) missing.push('company name');
    if (!email || email.trim().length === 0) missing.push('email');
    if (!password || password.trim().length === 0) missing.push('password');
    if (missing.length > 0) {
      toast({ title: 'Missing required fields', description: `Please provide: ${missing.join(', ')}` });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { vendorName: name, name, email, password, location, specialty, certifications: certs ? certs.split(',').map(s => s.trim()) : [] };
      const res = await fetch(apiUrl('/api/vendors/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let json: any = undefined;
      try {
        json = await res.json();
      } catch (err) {
        // ignore
      }

      if (!res.ok) {
        const serverMessage = json && typeof json === 'object' && 'error' in json ? json.error : (await res.text().catch(() => 'Registration failed'));
        console.error('Vendor registration failed', { status: res.status, body: json || serverMessage });
        // If server indicates email-error, show inline and focus
        if (serverMessage && typeof serverMessage === 'string' && serverMessage.toLowerCase().includes('email')) {
          setEmailError(serverMessage);
          if (emailRef.current) emailRef.current.focus();
          return;
        }
        throw new Error(serverMessage || `Request failed with status ${res.status}`);
      }
      const data = json as { token: string; user: any };
      setSession(data.token, data.user);
      toast({ title: 'Vendor account created' });
      navigate('/vendor/profile');
    } catch (err) {
      toast({ title: 'Registration failed', description: String(err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Apply to become a verified vendor</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div>
                <Label htmlFor="vendorName">Name (company)</Label>
                <Input id="vendorName" placeholder="Company name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="vendorLocation">Location</Label>
                <Input id="vendorLocation" placeholder="City, State or Country" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="vendorSpecialty">Specialty</Label>
                <Input id="vendorSpecialty" placeholder="Primary product/service" value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="vendorCerts">Certifications (comma separated)</Label>
                <Input id="vendorCerts" placeholder="AS9100, Nadcap, ..." value={certs} onChange={(e) => setCerts(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="vendorEmail">Contact email</Label>
                <Input id="vendorEmail" ref={(el) => (emailRef.current = el)} type="email" placeholder="you@company.com" value={email} onChange={(e) => { setEmail(e.target.value); setEmailError(null); }} required />
                {emailError && <p className="text-sm text-destructive mt-1">{emailError}</p>}
              </div>
              <div>
                <Label htmlFor="vendorPhone">Phone</Label>
                <Input id="vendorPhone" placeholder="+91 12345 67890" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <input id="useApi" title="Register programmatically" aria-label="Register programmatically" type="checkbox" checked={useApi} onChange={(e) => setUseApi(e.target.checked)} />
                <Label htmlFor="useApi">Register programmatically (create vendor account now)</Label>
              </div>
              {useApi && (
                <div>
                  <Label htmlFor="vendorPassword">Password for account</Label>
                  <Input id="vendorPassword" type="password" placeholder="Choose a secure password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
              )}
              <div className="pt-2">
                <Button type="submit" disabled={isSubmitting}>{useApi ? (isSubmitting ? 'Registering…' : 'Register as vendor') : 'Send application to admin'}</Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
