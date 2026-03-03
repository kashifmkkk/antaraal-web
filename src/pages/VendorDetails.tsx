import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import QuoteModal from "@/components/QuoteModal";
import { Building2, MapPin, Star } from "lucide-react";

type Vendor = {
  id: number;
  name: string;
  location?: string | null;
  rating?: number | null;
  specialty?: string | null;
  image?: string | null;
  certifications?: string[] | null;
};

export default function VendorDetails() {
  const { id } = useParams();
  const [open, setOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["vendor", id],
    enabled: !!id,
    queryFn: () => fetchJson<Vendor>(`/api/vendors/${id}`),
  });

  if (isLoading) return <div className="container mx-auto py-10"><Skeleton className="h-40 w-full" /></div>;
  if (isError || !data) return <div className="container mx-auto py-10">Vendor not found</div>;

  const vendor = data;

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <Link to="/vendors" className="text-sm text-primary underline">← Back to vendors</Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Building2 className="h-5 w-5" />
            {vendor.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> {vendor.location ?? 'Location on request'}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Star className="h-4 w-4 fill-primary text-primary" /> {(vendor.rating ?? 4.5).toFixed(1)} service rating
              </div>
              <div className="space-y-2">
                <h4 className="text-xs uppercase tracking-wide text-primary/80">Specialization</h4>
                <p className="font-medium">{vendor.specialty ?? 'General aerospace supply'}</p>
              </div>
              <div>
                <h4 className="text-xs uppercase tracking-wide text-primary/80">Certifications</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(vendor.certifications ?? []).map((c) => (
                    <Badge key={c} variant="secondary">{c}</Badge>
                  ))}
                </div>
              </div>
              <div className="pt-4">
                <button className="btn btn-primary" onClick={() => setOpen(true)}>Request Quote / Contact</button>
              </div>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground">Vendor profile and capabilities will be shown here. Contact the vendor to request parts, MRO services, or certifications.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <QuoteModal isOpen={open} onClose={() => setOpen(false)} productName={undefined} />
    </div>
  );
}
