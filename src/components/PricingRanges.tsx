import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchJson } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const PricingRanges = ({ role }: { role?: 'BUYER' | 'VENDOR' | null }) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['pricing-ranges'],
    queryFn: () => fetchJson<any>('/api/pricing-ranges'),
  });

  const buyers = data?.buyers ?? [];
  const sellers = data?.sellers ?? [];

  const rows = role === 'VENDOR' ? sellers : role === 'BUYER' ? buyers : null;

  return (
    <div className="space-y-4">
      {isLoading && <div className="text-sm text-muted-foreground">Loading pricing ranges...</div>}
      {isError && (
        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          Pricing guidance is unavailable right now. Try again once the backend API is running.
        </div>
      )}
      {rows ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rows.map((r: any, idx: number) => (
            <Card key={idx} className="p-4">
              <CardHeader>
                <CardTitle className="text-lg">{r.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">Range: {r.min} — {r.max}</div>
                {r.description && <div className="text-xs text-muted-foreground mt-2">{r.description}</div>}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Buyers</h3>
            {buyers.map((r: any, idx: number) => (
              <Card key={idx} className="mb-3 p-3">
                <CardHeader>
                  <CardTitle className="text-md">{r.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">{r.min} — {r.max}</div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Sellers</h3>
            {sellers.map((r: any, idx: number) => (
              <Card key={idx} className="mb-3 p-3">
                <CardHeader>
                  <CardTitle className="text-md">{r.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">{r.min} — {r.max}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingRanges;
