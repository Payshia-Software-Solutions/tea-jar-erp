"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Loader2, Video, FileText } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api/client";
import { Textarea } from "@/components/ui/textarea";
import { TiptapEditor } from "@/components/TiptapEditor";

export default function KioskContentEditPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const id = params.id as string;
  const [partName, setPartName] = useState("Loading...");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({
    id: null,
    title: "",
    content_html: "",
    video_url: ""
  });

  useEffect(() => {
    // Fetch part details
    const fetchPart = async () => {
      try {
        const res = await api(`/api/part/get/${id}`);
        const body = await res.json();
        setPartName(body.data?.part_name || `Item #${id}`);
      } catch (e) {
        console.error(e);
        setPartName(`Item #${id}`);
      }
    };
    
    
    const fetchContent = async () => {
      try {
        const res = await api(`/api/kioskcontent/getByPart/${id}`);
        const body = await res.json();
        const data = body.data;
        if (data) {
          setForm({
            id: data.id,
            part_id: id,
            title: data.title || "",
            content_html: data.content_html || "",
            video_url: data.video_url || ""
          });
        } else {
          setForm({ id: null, part_id: id, title: "", content_html: "", video_url: "" });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchPart();
    fetchContent();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        id: form.id,
        part_id: parseInt(id),
        title: form.title,
        content_html: form.content_html,
        video_url: form.video_url
      };
      
      const res = await api('/api/kioskcontent/save', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const body = await res.json();
      if (body.status === "success") {
        setForm(prev => ({ ...prev, id: body.data.id }));
      }
      toast({ title: "Saved successfully" });
    } catch (e: any) {
      toast({ title: "Save failed", description: e.response?.data?.message || e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 w-full max-w-full pb-20">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/kiosk/content')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Edit Content: {partName}</h1>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* Left Column: Editor */}
          <div className="flex-1 w-full space-y-4">
            <Card className="h-full">
              <CardContent className="p-0 border-none">
                <TiptapEditor 
                  content={form.content_html} 
                  onChange={(val) => setForm({...form, content_html: val})}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Properties */}
          <div className="w-full lg:w-80 xl:w-96 space-y-6 shrink-0 sticky top-6">
            <Card>
              <CardContent className="p-6 space-y-6">
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Content Title</label>
                  <Input 
                    placeholder="e.g. Traditional Spa Experience" 
                    value={form.title}
                    onChange={(e) => setForm({...form, title: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Video className="w-4 h-4" /> YouTube Video URL
                  </label>
                  <Input 
                    placeholder="https://www.youtube.com/watch?v=..." 
                    value={form.video_url}
                    onChange={(e) => setForm({...form, video_url: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    The video will be embedded at the top of the experience page.
                  </p>
                </div>

                <div className="pt-4 border-t border-border">
                  <Button className="w-full" onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                  </Button>
                </div>

              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
