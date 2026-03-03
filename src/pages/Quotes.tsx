import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import CreateQuoteModal from "@/components/CreateQuoteModal";
import { Button } from "@/components/ui/button";
import { fetchJson } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import LoadingLogo from "@/components/LoadingLogo";

type Quote = {
  id: number;
  rfqId: number;
  userId?: number | null;
  vendorId?: number | null;
  vendor?: { id: number; name: string | null } | null;
  amount: number;
  comments?: string | null;
  createdAt: string;
};

export default function Quotes() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const endpoint = useMemo(() => (user?.role === "ADMIN" ? "/api/quotes" : "/api/quotes/my"), [user?.role]);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["quotes", endpoint],
    queryFn: () => fetchJson<Quote[]>(endpoint),
    staleTime: 30_000,
  });
  const quotes = data ?? [];
  const canCreate = user?.role === "VENDOR";

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Quotes</h1>
        {canCreate && <Button onClick={() => setOpen(true)}>Create Quote</Button>}
      </div>

      {isLoading && <div className="mt-4"><LoadingLogo size={40} /></div>}
      {isError && !isLoading && <div className="mt-4 text-muted-foreground">Unable to load quotes.</div>}

      {!isLoading && !isError && (
        <div className="mt-4 grid gap-4">
          {quotes.map((q) => (
            <div key={q.id} className="p-4 border rounded">
              <div className="text-sm text-muted-foreground">RFQ #{q.rfqId} — {new Date(q.createdAt).toLocaleString()}</div>
              <div className="text-lg font-semibold">Amount: {q.amount}</div>
              <div className="text-sm">Comments: {q.comments ?? "No comments"}</div>
              <div className="text-xs text-muted-foreground">
                Vendor: {q.vendor?.name ?? `User #${q.userId ?? "N/A"}`}
              </div>
            </div>
          ))}
          {quotes.length === 0 && <div className="text-muted-foreground">No quotes available yet.</div>}
        </div>
      )}

      {canCreate && (
        <CreateQuoteModal
          isOpen={open}
          onClose={() => setOpen(false)}
          onCreated={() => {
            queryClient.invalidateQueries({ queryKey: ["quotes", endpoint] });
          }}
        />
      )}
    </div>
  );
}
