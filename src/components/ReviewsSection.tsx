import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Trash2, Edit2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Review {
  id: number;
  productId: number;
  userId: number;
  userName: string;
  rating: number;
  comment: string;
  status: "Pending" | "Approved" | "Rejected";
  createdAt: string;
}

interface ReviewsSectionProps {
  productId: string;
}

const ReviewsSection = ({ productId }: ReviewsSectionProps) => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [editingReview, setEditingReview] = useState<number | null>(null);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: () => fetchJson<Review[]>(`/api/reviews/product/${productId}`),
  });

  const createMutation = useMutation({
    mutationFn: async () =>
      fetchJson("/api/reviews", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ productId: parseInt(productId), rating, comment }),
      }),
    onSuccess: () => {
      toast({ title: "Review submitted! Pending admin approval." });
      setComment("");
      setRating(5);
      queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit review",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ reviewId, rating, comment }: { reviewId: number; rating: number; comment: string }) =>
      fetchJson(`/api/reviews/${reviewId}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ rating, comment }),
      }),
    onSuccess: () => {
      toast({ title: "Review updated successfully!" });
      setEditingReview(null);
      setComment("");
      setRating(5);
      queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update review",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (reviewId: number) =>
      fetchJson(`/api/reviews/${reviewId}`, {
        method: "DELETE",
        headers: authHeaders,
      }),
    onSuccess: () => {
      toast({ title: "Review deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete review",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const renderStars = (rating: number, interactive: boolean = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 cursor-pointer transition-all ${
              star <= rating ? "fill-yellow-500 text-yellow-500" : "text-gray-300"
            }`}
            onClick={() => interactive && onRate && onRate(star)}
          />
        ))}
      </div>
    );
  };

  const handleSubmit = () => {
    if (!user) {
      toast({ title: "Please login to submit a review", variant: "destructive" });
      return;
    }
    if (comment.trim().length < 10) {
      toast({ title: "Review must be at least 10 characters", variant: "destructive" });
      return;
    }
    if (editingReview) {
      updateMutation.mutate({ reviewId: editingReview, rating, comment });
    } else {
      createMutation.mutate();
    }
  };

  const handleEdit = (review: Review) => {
    setEditingReview(review.id);
    setRating(review.rating);
    setComment(review.comment);
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingReview(null);
    setComment("");
    setRating(5);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <>
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </>
          ) : reviews && reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.id} className="border-b pb-4 last:border-b-0">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{review.userName}</span>
                      {renderStars(review.rating)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {user && user.id === review.userId && review.status === "Pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(review)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(review.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="mt-2 text-sm">{review.comment}</p>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground">No reviews yet. Be the first to review!</p>
          )}
        </CardContent>
      </Card>

      {user && (
        <Card>
          <CardHeader>
            <CardTitle>{editingReview ? "Edit Your Review" : "Write a Review"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Rating</label>
              {renderStars(rating, true, setRating)}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Your Review</label>
              <Textarea
                placeholder="Share your experience with this product..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingReview ? "Update Review" : "Submit Review"}
              </Button>
              {editingReview && (
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReviewsSection;
