import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BadgeCheck, ClipboardList, ShieldCheck, Wrench } from "lucide-react";

const ServicesSection = () => {
  const featureCards = [
    {
      title: "Verified vendor onboarding",
      description: "Every supplier passes DGCA checks, sanction screening, and historical performance review before listing.",
      icon: BadgeCheck,
      bullets: ["Regulatory compliance documents", "Dedicated account manager", "Digital traceability for each shipment"],
    },
    {
      title: "Warranty intelligence",
      description: "Track expiry, attach maintenance events, and trigger claims with a single click.",
      icon: ShieldCheck,
      bullets: ["Automated reminders", "Escalation workflow", "Evidence vault for claims"],
    },
    {
      title: "Complaint & claim desk",
      description: "Log incidents, assign root-cause owners, and keep buyers and vendors aligned.",
      icon: ClipboardList,
      bullets: ["Response SLAs", "Live resolution tracker", "Regulatory-ready reports"],
    },
    {
      title: "MRO & overhaul coordination",
      description: "Source certified slots, compare turnaround times, and track work scopes in one place.",
      icon: Wrench,
      bullets: ["Pan-India partner network", "TAT benchmarks", "Return-to-service documentation"],
    },
  ];

  const warrantyAlerts = [
    {
      part: "Fuel flow transmitter",
      vendor: "AeroPulse Systems",
      expiry: "25 Apr 2026",
      status: "Action in 30 days",
    },
    {
      part: "Landing gear actuator",
      vendor: "Precision Hydraulics",
      expiry: "17 Jun 2026",
      status: "Planned maintenance scheduled",
    },
  ];

  const mroPartners = [
    {
      provider: "Elite MRO Services",
      focus: "CFM56 hot section overhaul",
      certification: "EASA Part 145",
      turnaround: "45-60 days",
      location: "Mumbai",
    },
    {
      provider: "Skyline Avionics",
      focus: "Flight deck upgrades & testing",
      certification: "DGCA CAR 145",
      turnaround: "14-21 days",
      location: "Hyderabad",
    },
    {
      provider: "Precision Landing Systems",
      focus: "B737 landing gear exchange",
      certification: "FAA Repair Station",
      turnaround: "30-40 days",
      location: "Bengaluru",
    },
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14 space-y-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold">Operational assurance for Indian fleets</h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Built for procurement, maintenance, and reliability teams who need transparency and speed without the clutter of legacy platforms.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 mb-16">
          {featureCards.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="h-full border-primary/10 bg-card/80">
                <CardHeader className="space-y-3">
                  <Badge variant="outline" className="w-fit items-center gap-2 text-xs uppercase tracking-wide">
                    <Icon className="h-3 w-3 text-primary" />
                    Core Capability
                  </Badge>
                  <CardTitle className="text-xl text-foreground leading-snug">{feature.title}</CardTitle>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-muted-foreground">
                  {feature.bullets.map((bullet) => (
                    <div key={bullet} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] mb-16">
          <Card className="border-primary/10 bg-card/80">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Warranty tracking cockpit</CardTitle>
                <p className="text-sm text-muted-foreground">Live alerts across components, work orders, and tail numbers.</p>
              </div>
              <Badge variant="secondary" className="text-xs uppercase tracking-wide">Real-time</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {warrantyAlerts.map((alert) => (
                <div key={alert.part} className="rounded-lg border border-primary/15 bg-background/40 px-4 py-3">
                  <div className="flex items-baseline justify-between">
                    <p className="font-medium text-foreground">{alert.part}</p>
                    <span className="text-xs text-primary">{alert.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Vendor: {alert.vendor} • Expiry: {alert.expiry}</p>
                </div>
              ))}
              <Button variant="outline" size="sm" className="mt-2 self-start">View warranty register</Button>
            </CardContent>
          </Card>

          <Card className="border-primary/10 bg-card/80">
            <CardHeader>
              <CardTitle className="text-2xl">Complaint & claim desk</CardTitle>
              <p className="text-sm text-muted-foreground">Structured resolution workflows for non-conformances.</p>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="rounded-lg border border-primary/15 px-3 py-2">
                <p className="font-medium text-foreground">Log an incident</p>
                <p className="text-xs">Capture photos, inspection notes, and airworthiness impact in one form.</p>
              </div>
              <div className="rounded-lg border border-primary/15 px-3 py-2">
                <p className="font-medium text-foreground">Track SLA commitments</p>
                <p className="text-xs">Automatic reminders keep vendors aligned with agreed turnaround times.</p>
              </div>
              <Button size="sm" className="w-full">Open complaint workspace</Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-2xl font-semibold">Certified MRO partners</h3>
              <p className="text-sm text-muted-foreground">Slots are coordinated for you. Pricing is shared once requirements are vetted.</p>
            </div>
            <Button variant="outline" size="sm">
              View partner network
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {mroPartners.map((partner) => (
              <Card key={partner.provider} className="border-primary/10 bg-card/80">
                <CardHeader className="space-y-2">
                  <Badge variant="outline" className="w-fit gap-2 text-xs uppercase">
                    <Wrench className="h-3 w-3 text-primary" />
                    Overhaul
                  </Badge>
                  <CardTitle className="text-xl leading-tight">{partner.provider}</CardTitle>
                  <p className="text-sm text-muted-foreground">{partner.focus}</p>
                </CardHeader>
                <CardContent className="space-y-3 text-xs text-muted-foreground">
                  <div className="rounded-lg border border-primary/15 px-3 py-2">
                    Certification: <span className="text-foreground font-medium">{partner.certification}</span>
                  </div>
                  <div className="rounded-lg border border-primary/15 px-3 py-2">
                    Turnaround: <span className="text-foreground font-medium">{partner.turnaround}</span>
                  </div>
                  <div className="rounded-lg border border-primary/15 px-3 py-2">
                    Location: <span className="text-foreground font-medium">{partner.location}</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    Contact for slot
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;