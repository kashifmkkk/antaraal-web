import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, FileText, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { fetchJson } from "@/lib/api";

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName?: string;
}

const QuoteModal = ({ isOpen, onClose, productName }: QuoteModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    quantity: "",
    urgency: "",
    additionalNotes: "",
    contactEmail: "",
    companyName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: productName || 'RFQ',
      company: formData.companyName,
      email: formData.contactEmail,
      phone: undefined,
      partNumber: undefined,
      message: `Quantity: ${formData.quantity}\nUrgency: ${formData.urgency}\nNotes: ${formData.additionalNotes}`,
    };

    try {
      await fetchJson('/api/rfqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      toast({ title: 'Quote Request Submitted Successfully!', description: `Your RFQ for ${productName || 'the selected items'} has been sent to vendors.` });
      onClose();
      setFormData({ quantity: '', urgency: '', additionalNotes: '', contactEmail: '', companyName: '' });
    } catch (err) {
      toast({ title: 'Submission failed', description: String(err) });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Request for Quote (RFQ)
          </DialogTitle>
          {productName && (
            <p className="text-muted-foreground">for {productName}</p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                placeholder="Your company name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email *</Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                placeholder="your.email@company.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity Required *</Label>
              <Input
                id="quantity"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                placeholder="e.g., 5 units"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Urgency Level *</Label>
              <Select value={formData.urgency} onValueChange={(value) => setFormData({...formData, urgency: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard (2-4 weeks)</SelectItem>
                  <SelectItem value="urgent">Urgent (1 week)</SelectItem>
                  <SelectItem value="emergency">Emergency (24-48 hours)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalNotes">Additional Requirements</Label>
            <Textarea
              id="additionalNotes"
              value={formData.additionalNotes}
              onChange={(e) => setFormData({...formData, additionalNotes: e.target.value})}
              placeholder="Specify any special requirements, certifications needed, delivery location, etc."
              rows={4}
            />
          </div>

          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              What happens next?
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Your RFQ will be sent to qualified vendors</li>
              <li>• You'll receive quotes within 24-48 hours</li>
              <li>• Compare offers and negotiate directly with vendors</li>
              <li>• Finalize purchase through our secure platform</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              <Send className="w-4 h-4 mr-2" />
              Send RFQ
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuoteModal;