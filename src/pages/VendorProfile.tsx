import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, MapPin, Star } from "lucide-react";

export default function VendorProfile() {
  const { user } = useAuth();
  const vendorId = user?.vendorId;
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["vendor", vendorId],
    enabled: !!vendorId,
    queryFn: () => fetchJson(`/api/vendors/${vendorId}`),
  });

  if (!vendorId) return <div className="container mx-auto py-10">No vendor account associated with your user.</div>;
  if (isLoading) return <div className="container mx-auto py-10"><Skeleton className="h-40 w-full" /></div>;
  if (isError || !data) return <div className="container mx-auto py-10">Vendor not found</div>;

  const vendor = data as any;

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <Building2 className="h-5 w-5" />
              {vendor.name}
            </CardTitle>
            <div>
              <Button variant="outline" onClick={() => navigate('/vendor/submit-product')}>Submit Product</Button>
            </div>
          </div>
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
                  {(vendor.certifications ?? []).map((c: string) => (
                    <Badge key={c} variant="secondary">{c}</Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground">This is your vendor profile. To change verification status or public visibility, contact the platform administrators.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
