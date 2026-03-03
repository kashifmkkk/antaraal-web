import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { fetchJson } from "@/lib/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultRfqId?: number;
  onCreated?: () => void;
}

export default function CreateQuoteModal({ isOpen, onClose, defaultRfqId, onCreated }: Props) {
  const { toast } = useToast();
  const [rfqId, setRfqId] = useState(defaultRfqId?.toString() || '');
  const [amount, setAmount] = useState('');
  const [comments, setComments] = useState('');

  useEffect(() => {
    if (defaultRfqId !== undefined && defaultRfqId !== null) {
      setRfqId(defaultRfqId.toString());
    }
  }, [defaultRfqId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!rfqId || Number.isNaN(Number(rfqId))) {
        toast({ title: 'Invalid RFQ', description: 'Please provide a valid RFQ ID.' });
        return;
      }
      if (!amount || Number.isNaN(Number(amount))) {
        toast({ title: 'Invalid amount', description: 'Enter a numeric amount for the quote.' });
        return;
      }
      await fetchJson('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfqId: Number(rfqId), amount: Number(amount), comments }),
      });
      toast({ title: 'Quote created' });
      setAmount('');
      setComments('');
      setRfqId(defaultRfqId?.toString() || '');
      onCreated?.();
      onClose();
    } catch (err) {
      toast({ title: 'Failed', description: String(err) });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Quote</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rfqId">RFQ ID</Label>
              <Input id="rfqId" value={rfqId} onChange={(e) => setRfqId(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
          </div>
          <div>
            <Label htmlFor="comments">Comments</Label>
            <Textarea id="comments" value={comments} onChange={(e) => setComments(e.target.value)} rows={4} />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
