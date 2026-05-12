"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  fetchReviews, 
  approveReview, 
  rejectReview, 
  deleteReview,
  replyToReview,
  type ProductReview 
} from "@/lib/api/reviews";
import { 
  Star, 
  MessageSquare, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Loader2, 
  Image as ImageIcon,
  ExternalLink,
  Clock,
  ThumbsUp,
  Filter
} from "lucide-react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { BASE_URL } from "@/lib/api/client";

export default function ReviewsManagementPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [activeTab, setActiveTab] = useState("Pending");
  const [selectedReview, setSelectedReview] = useState<ProductReview | null>(null);
  const [replyingTo, setReplyingTo] = useState<ProductReview | null>(null);
  const [replyText, setReplyText] = useState("");
  const [savingReply, setSavingReply] = useState(false);

  const loadReviews = async (status: string) => {
    setLoading(true);
    try {
      const data = await fetchReviews(status);
      setReviews(data);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews(activeTab);
  }, [activeTab]);

  const handleApprove = async (id: number) => {
    try {
      await approveReview(id);
      toast({ title: "Success", description: "Review approved and visible on storefront" });
      loadReviews(activeTab);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleReject = async (id: number) => {
    try {
      await rejectReview(id);
      toast({ title: "Rejected", description: "Review marked as rejected" });
      loadReviews(activeTab);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to permanently delete this review?")) return;
    try {
      await deleteReview(id);
      toast({ title: "Deleted", description: "Review removed from system" });
      loadReviews(activeTab);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleSaveReply = async () => {
    if (!replyingTo || !replyText) return;
    setSavingReply(true);
    try {
      await replyToReview(replyingTo.id, replyText);
      toast({ title: "Success", description: "Reply saved successfully" });
      setReplyingTo(null);
      setReplyText("");
      loadReviews(activeTab);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSavingReply(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${
              star <= rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout title="Review Management">
      <div className="flex flex-col gap-6 w-full pb-20 animate-in fade-in duration-500">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">Review Management</h1>
              <p className="text-muted-foreground text-sm">Moderate and manage product reviews submitted by customers.</p>
           </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
           <TabsList className="bg-muted/50 p-1 border">
              <TabsTrigger value="Pending" className="gap-2 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                 <Clock className="w-4 h-4" />
                 Pending
              </TabsTrigger>
              <TabsTrigger value="Approved" className="gap-2 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                 <CheckCircle2 className="w-4 h-4" />
                 Approved
              </TabsTrigger>
              <TabsTrigger value="Rejected" className="gap-2 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                 <XCircle className="w-4 h-4" />
                 Rejected
              </TabsTrigger>
           </TabsList>

           <div className="mt-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                   <Loader2 className="w-8 h-8 animate-spin text-primary" />
                   <p className="text-sm font-bold text-muted-foreground">Loading reviews...</p>
                </div>
              ) : reviews.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed rounded-xl bg-muted/20">
                   <MessageSquare className="w-12 h-12 mx-auto opacity-10 mb-4" />
                   <p className="text-lg font-bold text-muted-foreground">No {activeTab.toLowerCase()} reviews found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {reviews.map((review) => (
                      <Card key={review.id} className="border shadow-sm hover:border-primary/40 transition-all group overflow-hidden">
                         <CardHeader className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                               <Badge variant={review.status === 'Approved' ? 'default' : review.status === 'Rejected' ? 'destructive' : 'secondary'} className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5">
                                  {review.status}
                               </Badge>
                               <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-bold">
                                  <Clock className="w-3 h-3" />
                                  {new Date(review.created_at).toLocaleDateString()}
                               </span>
                            </div>
                            <div className="space-y-1">
                               <h3 className="font-bold text-sm line-clamp-1">{review.product_name}</h3>
                               <p className="text-[10px] font-black text-primary uppercase tracking-tighter">{review.part_number}</p>
                            </div>
                            <div className="flex items-center justify-between py-2 border-y border-dashed">
                               <div className="flex flex-col">
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Rating</span>
                                  {renderStars(review.rating)}
                               </div>
                               <div className="flex flex-col items-end">
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase text-right">Customer</span>
                                  <span className="text-xs font-black truncate max-w-[120px]">{review.customer_name}</span>
                               </div>
                            </div>
                         </CardHeader>
                         <CardContent className="p-4 space-y-4">
                            <div className="bg-muted/30 p-3 rounded-lg border text-sm italic min-h-[60px]">
                               "{review.comment}"
                            </div>
                            
                            {review.admin_reply && (
                              <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 text-sm">
                                <p className="text-[10px] font-black uppercase text-primary mb-1 tracking-widest">Our Response</p>
                                <p className="italic text-muted-foreground">"{review.admin_reply}"</p>
                              </div>
                            )}
                            
                            {review.images && review.images.length > 0 && (
                               <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                  {review.images.map((img) => (
                                     <div key={img.id} className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden border group/img cursor-pointer" onClick={() => setSelectedReview(review)}>
                                        <img 
                                           src={`${BASE_URL}/${img.image_path}`} 
                                           alt="Review" 
                                           className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                                           <ImageIcon className="w-4 h-4 text-white" />
                                        </div>
                                     </div>
                                  ))}
                               </div>
                            )}

                            <div className="flex items-center gap-2 pt-2 border-t">
                               {review.status !== 'Approved' && (
                                 <Button size="sm" className="flex-1 font-bold gap-2 bg-green-600 hover:bg-green-700 h-9" onClick={() => handleApprove(review.id)}>
                                    <CheckCircle2 className="w-4 h-4" />
                                    Approve
                                 </Button>
                               )}
                               {review.status !== 'Rejected' && (
                                 <Button size="sm" variant="outline" className="flex-1 font-bold gap-2 text-destructive hover:bg-destructive/10 h-9" onClick={() => handleReject(review.id)}>
                                    <XCircle className="w-4 h-4" />
                                    Reject
                                 </Button>
                               )}
                               <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(review.id)}>
                                  <Trash2 className="w-4 h-4" />
                               </Button>
                               <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-primary" onClick={() => {
                                  setReplyingTo(review);
                                  setReplyText(review.admin_reply || "");
                               }}>
                                  <MessageSquare className="w-4 h-4" />
                               </Button>
                            </div>
                         </CardContent>
                      </Card>
                   ))}
                </div>
              )}
           </div>
        </Tabs>

        {/* Image Preview Dialog */}
        <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
           <DialogContent className="sm:max-w-4xl">
              <DialogHeader>
                 <DialogTitle>Review Images - {selectedReview?.product_name}</DialogTitle>
                 <DialogDescription>
                    Images uploaded by {selectedReview?.customer_name}
                 </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4 max-h-[60vh] overflow-y-auto">
                 {selectedReview?.images?.map((img) => (
                    <div key={img.id} className="rounded-xl border overflow-hidden bg-muted flex items-center justify-center aspect-square">
                       <img 
                          src={`${BASE_URL}/${img.image_path}`} 
                          alt="Review" 
                          className="w-full h-full object-contain"
                       />
                    </div>
                 ))}
              </div>
           </DialogContent>
        </Dialog>

        {/* Reply Dialog */}
        <Dialog open={!!replyingTo} onOpenChange={() => setReplyingTo(null)}>
           <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                 <DialogTitle>Reply to Review</DialogTitle>
                 <DialogDescription>
                    Your response will be visible to all customers on the storefront.
                 </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                 <div className="p-3 bg-muted rounded-lg text-sm italic border">
                    "{replyingTo?.comment}"
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest">Your Response</label>
                    <Textarea 
                       placeholder="Thank you for your feedback! We are glad you enjoyed..."
                       value={replyText}
                       onChange={(e) => setReplyText(e.target.value)}
                       className="min-h-[120px] resize-none"
                    />
                 </div>
              </div>
              <div className="flex justify-end gap-2">
                 <Button variant="outline" onClick={() => setReplyingTo(null)}>Cancel</Button>
                 <Button disabled={savingReply || !replyText} onClick={handleSaveReply}>
                    {savingReply && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Response
                 </Button>
              </div>
           </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
}
