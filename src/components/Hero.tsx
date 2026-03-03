
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Users, Building2 } from "lucide-react";
import heroImage from "@/assets/hero-aerospace.jpg";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const Hero = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section className="relative min-h-[80vh] bg-gradient-to-br from-background to-muted overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <img 
          src={heroImage} 
          alt="Aerospace parts marketplace" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-background/50"></div>
      </div>

      <div className="relative container mx-auto px-4 py-10 sm:py-16 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <span className="inline-flex items-center rounded-full border border-primary/40 bg-primary/5 px-4 py-1 text-sm uppercase tracking-[0.2em] text-primary">
                India's Aerospace Supply Network
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Reliable aerospace parts for mission-critical fleets
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl">
                Antaraal connects Indian airlines, MROs, and defense teams with a verified network of aerospace vendors. Evaluate parts quickly, track warranties, and raise RFQs without leaving a single workspace.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-warning hover:shadow-elegant"
                onClick={() => navigate("/products")}
              >
                Browse Catalog
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/vendors")}
              >
                Find Vendors
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="sm:w-auto"
                onClick={() => navigate("/rfq")}
              >
                Start RFQ
              </Button>
              {!user && (
                <Button variant="outline" size="lg" onClick={() => navigate('/vendor/apply')}>
                  Apply as vendor
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-6 sm:pt-10">
              <div className="rounded-xl border border-primary/20 bg-card/80 p-5 shadow-card">
                <div className="flex items-center gap-3 mb-3 text-primary">
                  <Users className="w-5 h-5" />
                  <span className="text-sm tracking-wide uppercase">Verified Vendors</span>
                </div>
                <p className="text-3xl font-bold">500+</p>
                <p className="text-sm text-muted-foreground">DGCA-compliant and audited annually</p>
              </div>
              <div className="rounded-xl border border-primary/20 bg-card/80 p-5 shadow-card">
                <div className="flex items-center gap-3 mb-3 text-primary">
                  <Shield className="w-5 h-5" />
                  <span className="text-sm tracking-wide uppercase">Warranty Tracking</span>
                </div>
                <p className="text-3xl font-bold">Real-time</p>
                <p className="text-sm text-muted-foreground">Expiry alerts and claim workflows</p>
              </div>
              <div className="rounded-xl border border-primary/20 bg-card/80 p-5 shadow-card">
                <div className="flex items-center gap-3 mb-3 text-primary">
                  <Building2 className="w-5 h-5" />
                  <span className="text-sm tracking-wide uppercase">MRO Network</span>
                </div>
                <p className="text-3xl font-bold">Pan-India</p>
                <p className="text-sm text-muted-foreground">Certified overhaul partners on standby</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {[{
              title: "Verified Vendor Network",
              description: "Every supplier is screened for regulatory compliance, export controls, and quality history before going live.",
            }, {
              title: "Warranty & Claim Management",
              description: "Automated reminders, claim documentation, and escalation tracking keep your fleet protected.",
            }, {
              title: "Overhaul & MRO Coordination",
              description: "Source overhaul slots, compare turnaround times, and issue work scopes directly to approved shops.",
            }].map((feature) => (
              <div key={feature.title} className="bg-card/80 backdrop-blur border border-primary/10 p-6 rounded-xl shadow-card">
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
