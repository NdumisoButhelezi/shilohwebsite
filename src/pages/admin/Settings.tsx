import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Save } from "lucide-react";

export default function AdminSettings() {
  const queryClient = useQueryClient();

  const { data: churchInfo, isLoading } = useQuery({
    queryKey: ["admin-church-info"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("church_info")
        .select("*")
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const [formData, setFormData] = useState({
    church_name: "",
    address: "",
    phone: "",
    email: "",
    mission_statement: "",
    vision_statement: "",
    youtube_channel_url: "",
    facebook_url: "",
    instagram_url: "",
    google_maps_embed_url: "",
  });

  useEffect(() => {
    if (churchInfo) {
      setFormData({
        church_name: churchInfo.church_name || "",
        address: churchInfo.address || "",
        phone: churchInfo.phone || "",
        email: churchInfo.email || "",
        mission_statement: churchInfo.mission_statement || "",
        vision_statement: churchInfo.vision_statement || "",
        youtube_channel_url: churchInfo.youtube_channel_url || "",
        facebook_url: churchInfo.facebook_url || "",
        instagram_url: churchInfo.instagram_url || "",
        google_maps_embed_url: churchInfo.google_maps_embed_url || "",
      });
    }
  }, [churchInfo]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!churchInfo?.id) throw new Error("No church info found");
      
      const { error } = await supabase
        .from("church_info")
        .update(data)
        .eq("id", churchInfo.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-church-info"] });
      queryClient.invalidateQueries({ queryKey: ["church-info"] });
      toast.success("Settings saved successfully");
    },
    onError: () => toast.error("Failed to save settings"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card className="border-0 shadow-md">
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage church information and website settings</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>General Information</CardTitle>
                <CardDescription>Basic church contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="church_name">Church Name</Label>
                  <Input
                    id="church_name"
                    value={formData.church_name}
                    onChange={(e) => setFormData({ ...formData, church_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Church Street, City, Country"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+27 11 123 4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="info@church.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="google_maps_embed_url">Google Maps Embed URL</Label>
                  <Input
                    id="google_maps_embed_url"
                    value={formData.google_maps_embed_url}
                    onChange={(e) => setFormData({ ...formData, google_maps_embed_url: e.target.value })}
                    placeholder="https://www.google.com/maps/embed?..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Get this from Google Maps: Share → Embed a map → Copy the src URL
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="about">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>About the Church</CardTitle>
                <CardDescription>Mission, vision, and core values</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mission_statement">Mission Statement</Label>
                  <Textarea
                    id="mission_statement"
                    value={formData.mission_statement}
                    onChange={(e) => setFormData({ ...formData, mission_statement: e.target.value })}
                    rows={4}
                    placeholder="Our church mission is..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vision_statement">Vision Statement</Label>
                  <Textarea
                    id="vision_statement"
                    value={formData.vision_statement}
                    onChange={(e) => setFormData({ ...formData, vision_statement: e.target.value })}
                    rows={4}
                    placeholder="Our vision is to..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="social">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Social Media</CardTitle>
                <CardDescription>Connect your social media profiles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="youtube_channel_url">YouTube Channel URL</Label>
                  <Input
                    id="youtube_channel_url"
                    value={formData.youtube_channel_url}
                    onChange={(e) => setFormData({ ...formData, youtube_channel_url: e.target.value })}
                    placeholder="https://www.youtube.com/@yourchannel"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facebook_url">Facebook Page URL</Label>
                  <Input
                    id="facebook_url"
                    value={formData.facebook_url}
                    onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                    placeholder="https://www.facebook.com/yourpage"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagram_url">Instagram Profile URL</Label>
                  <Input
                    id="instagram_url"
                    value={formData.instagram_url}
                    onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                    placeholder="https://www.instagram.com/yourprofile"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6">
          <Button
            type="submit"
            size="lg"
            className="gap-2"
            disabled={updateMutation.isPending}
          >
            <Save className="h-4 w-4" />
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
