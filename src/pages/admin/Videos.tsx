import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, GripVertical, Video } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface VideoFormData {
  title: string;
  youtube_video_id: string;
  description: string;
  is_active: boolean;
}

const defaultFormData: VideoFormData = {
  title: "",
  youtube_video_id: "",
  description: "",
  is_active: true,
};

function extractYouTubeId(url: string): string {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return url;
}

export default function AdminVideos() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<string | null>(null);
  const [formData, setFormData] = useState<VideoFormData>(defaultFormData);

  const { data: videos, isLoading } = useQuery({
    queryKey: ["admin-videos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: VideoFormData) => {
      const maxOrder = videos?.length ? Math.max(...videos.map(v => v.display_order || 0)) : 0;
      const { error } = await supabase.from("videos").insert({
        ...data,
        youtube_video_id: extractYouTubeId(data.youtube_video_id),
        display_order: maxOrder + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-videos"] });
      setIsDialogOpen(false);
      setFormData(defaultFormData);
      toast.success("Video added successfully");
    },
    onError: () => toast.error("Failed to add video"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: VideoFormData }) => {
      const { error } = await supabase
        .from("videos")
        .update({
          ...data,
          youtube_video_id: extractYouTubeId(data.youtube_video_id),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-videos"] });
      setIsDialogOpen(false);
      setEditingVideo(null);
      setFormData(defaultFormData);
      toast.success("Video updated successfully");
    },
    onError: () => toast.error("Failed to update video"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("videos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-videos"] });
      toast.success("Video deleted successfully");
    },
    onError: () => toast.error("Failed to delete video"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingVideo) {
      updateMutation.mutate({ id: editingVideo, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (video: any) => {
    setEditingVideo(video.id);
    setFormData({
      title: video.title,
      youtube_video_id: video.youtube_video_id,
      description: video.description || "",
      is_active: video.is_active ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingVideo(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Videos</h1>
          <p className="text-muted-foreground">Manage YouTube video gallery</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Video
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingVideo ? "Edit Video" : "Add New Video"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Video Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Sunday Worship Highlights"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="youtube_video_id">YouTube URL or Video ID</Label>
                <Input
                  id="youtube_video_id"
                  value={formData.youtube_video_id}
                  onChange={(e) => setFormData({ ...formData, youtube_video_id: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Paste the full YouTube URL or just the video ID
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the video"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active (visible on website)</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingVideo ? "Update" : "Add Video"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Videos Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-md overflow-hidden">
              <Skeleton className="aspect-video w-full" />
              <CardContent className="p-4">
                <Skeleton className="h-5 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : videos && videos.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <Card key={video.id} className="border-0 shadow-md overflow-hidden group">
              <div className="relative aspect-video bg-muted">
                <img
                  src={`https://img.youtube.com/vi/${video.youtube_video_id}/mqdefault.jpg`}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                {!video.is_active && (
                  <div className="absolute top-2 left-2 bg-muted text-muted-foreground text-xs px-2 py-1 rounded">
                    Draft
                  </div>
                )}
                <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="icon" variant="secondary" onClick={() => handleEdit(video)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="destructive" 
                    onClick={() => deleteMutation.mutate(video.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground line-clamp-1">{video.title}</h3>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-md">
          <CardContent className="p-12 text-center">
            <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No videos yet. Add your first YouTube video!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
