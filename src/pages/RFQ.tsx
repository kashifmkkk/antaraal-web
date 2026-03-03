import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { fetchJson } from "@/lib/api";

const RFQ = () => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      name: (form.get("name") as string) || undefined,
      company: (form.get("company") as string) || undefined,
      email: (form.get("email") as string) || undefined,
      phone: (form.get("phone") as string) || undefined,
      partNumber: (form.get("partNumber") as string) || undefined,
      quantity: (form.get("quantity") as string) || undefined,
      urgency: (form.get("urgency") as string) || undefined,
      message: (form.get("message") as string) || undefined,
    };

    try {
      setSubmitting(true);
      await fetchJson("/api/rfqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      toast({ title: "RFQ submitted", description: "Our vendor relations desk will respond shortly." });
      event.currentTarget.reset();
    } catch (error) {
      toast({ title: "Submission failed", description: "Please retry or reach out to support.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mb-10 space-y-3">
        <h1 className="text-4xl font-semibold">Request for Quotation</h1>
        <p className="text-muted-foreground text-lg">
          Share your requirement and our team will route it to the ideal vendor within minutes. We keep your RFQs structured and traceable.
        </p>
      </div>

      <Card className="max-w-3xl border-primary/10 bg-card/80">
        <CardHeader>
          <CardTitle>RFQ Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input id="name" name="name" placeholder="e.g. Arjun Menon" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Organisation</Label>
                <Input id="company" name="company" placeholder="Air India Engineering" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Work Email</Label>
                <Input id="email" name="email" type="email" placeholder="you@company.in" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Contact Number</Label>
                <Input id="phone" name="phone" placeholder="+91 98765 00000" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
              <div className="space-y-2">
                <Label htmlFor="partNumber">Part name / SKU</Label>
                <Input id="partNumber" name="partNumber" placeholder="CFM56-7B turbine blade" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" name="quantity" type="number" min="1" defaultValue="1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="urgency">Urgency</Label>
                <Select name="urgency" defaultValue="standard">
                  <SelectTrigger id="urgency">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard (30+ days)</SelectItem>
                    <SelectItem value="priority">Priority (7-30 days)</SelectItem>
                    <SelectItem value="critical">Critical (under 7 days)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Operational requirement</Label>
              <Textarea
                id="message"
                name="message"
                rows={6}
                placeholder="Provide aircraft tail numbers, compliance requirements, logistics notes, or any supporting detail."
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" size="lg" disabled={submitting}>
                {submitting ? "Sending..." : "Submit RFQ"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RFQ;
