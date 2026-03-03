import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { fetchJson } from '@/lib/api';

export default function SubmitProduct() {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category) return toast({ title: 'Name and category required' });
    setIsSubmitting(true);
    try {
      const res = await fetchJson('/api/products', {
        method: 'POST',
        body: JSON.stringify({ name, category, image, description }),
      });
      toast({ title: 'Product submitted', description: 'Awaiting admin approval' });
      navigate('/vendor/profile');
    } catch (err) {
      toast({ title: 'Submission failed', description: String(err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Submit Product for Approval</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div>
                <Label>Product name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <Label>Category</Label>
                <Input value={category} onChange={(e) => setCategory(e.target.value)} required />
              </div>
              <div>
                <Label>Image URL</Label>
                <Input value={image} onChange={(e) => setImage(e.target.value)} />
              </div>
              <div>
                <Label>Description</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="pt-2">
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting…' : 'Submit product'}</Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
