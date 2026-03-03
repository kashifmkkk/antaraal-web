import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchJson } from "@/lib/api";
import CreateQuoteModal from "@/components/CreateQuoteModal";
import { Building2, MapPin, Star } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import LoadingLogo from "@/components/LoadingLogo";

type Vendor = {
  id: number;
  name: string;
  location?: string | null;
  rating?: number | null;
  specialty?: string | null;
  image?: string | null;
  certifications?: string[] | null;
};

const Vendors = () => {
  const [openCreate, setOpenCreate] = useState(false);
  const { user } = useAuth();
  const isVendor = user?.role === "VENDOR";
  const { data, isLoading, isError } = useQuery({
    queryKey: ["vendors"],
    queryFn: () => fetchJson<Vendor[]>("/api/vendors"),
    staleTime: 30_000,
  });
  const vendors = data ?? [];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mb-12 space-y-3">
        <h1 className="text-4xl font-semibold">Verified overhaul & supply partners</h1>
        <p className="text-muted-foreground text-lg">
          Work with trusted Indian aerospace vendors for engines, avionics, structural assemblies, and component repair. Each partner is vetted for certifications and export controls.
        </p>
      </div>

      {isLoading && <div><LoadingLogo /></div>}
      {isError && !isLoading && <div className="text-muted-foreground">Unable to load vendors.</div>}

      {!isLoading && !isError && vendors.length === 0 && (
        <div className="text-muted-foreground">No vendors available.</div>
      )}

      {!isLoading && !isError && vendors.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {vendors.map((vendor) => {
            const rating = typeof vendor.rating === "number" ? vendor.rating : 4.5;
            const certifications = Array.isArray(vendor.certifications)
              ? vendor.certifications.filter((cert): cert is string => Boolean(cert))
              : [];

            return (
              <Link key={vendor.id} to={`/vendors/${vendor.id}`} className="no-underline">
                <Card className="border-primary/10 bg-card/80 hover:border-primary/30 hover:shadow-card transition-all">
                  <CardHeader className="space-y-2">
                  <Badge variant="outline" className="w-fit items-center gap-2 text-xs uppercase">
                    <Building2 className="h-3 w-3" />
                    Verified Vendor
                  </Badge>
                  <CardTitle className="text-xl leading-tight text-foreground">{vendor.name}</CardTitle>
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 text-primary" />
                    {vendor.location ?? "Location on request"}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <div>
                    <p className="uppercase text-xs tracking-wide text-primary/80">Specialization</p>
                    <p className="text-foreground font-medium">{vendor.specialty ?? "General aerospace supply"}</p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    {rating.toFixed(1)} service rating
                  </div>

                  {certifications.length > 0 && (
                    <div className="space-y-2 text-xs">
                      <p className="uppercase tracking-wide text-primary/80">Verified certificates</p>
                      <div className="flex flex-wrap gap-2">
                        {certifications.map((cert) => (
                          <Badge key={cert} variant="secondary" className="border-primary/30 bg-primary/5 text-foreground">
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {isVendor && (
                    <div className="pt-2">
                      <Button className="w-full" size="sm" onClick={(e) => {
                        e.preventDefault();
                        setOpenCreate(true);
                      }}>
                        Create Quote
                      </Button>
                    </div>
                  )}
                </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {isVendor && (
        <CreateQuoteModal isOpen={openCreate} onClose={() => setOpenCreate(false)} defaultRfqId={null} />
      )}
    </div>
  );
};

export default Vendors;
