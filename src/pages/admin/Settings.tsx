import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getChurchInfo, updateChurchInfo } from "@/integrations/firebase/firestore/church";
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
    queryFn: getChurchInfo,
  });

  const [formData, setFormData] = useState({
    churchName: "",
    address: "",
    phone: "",
    email: "",
    missionStatement: "",
    visionStatement: "",
    youtubeChannelUrl: "",
    facebookUrl: "",
    instagramUrl: "",
    googleMapsEmbedUrl: "",
  });

  useEffect(() => {
    if (churchInfo) {
      setFormData({
        churchName: churchInfo.churchName || "",
        address: churchInfo.address || "",
        phone: churchInfo.phone || "",
        email: churchInfo.email || "",
        missionStatement: churchInfo.missionStatement || "",
        visionStatement: churchInfo.visionStatement || "",
        youtubeChannelUrl: churchInfo.youtubeChannelUrl || "",
        facebookUrl: churchInfo.facebookUrl || "",
        instagramUrl: churchInfo.instagramUrl || "",
        googleMapsEmbedUrl: churchInfo.googleMapsEmbedUrl || "",
      });
    }
  }, [churchInfo]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      await updateChurchInfo(data);
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
                  <Label htmlFor="churchName">Church Name</Label>
                  <Input
                    id="churchName"
                    value={formData.churchName}
                    onChange={(e) => setFormData({ ...formData, churchName: e.target.value })}
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
                  <Label htmlFor="googleMapsEmbedUrl">Google Maps Embed URL</Label>
                  <Input
                    id="googleMapsEmbedUrl"
                    value={formData.googleMapsEmbedUrl}
                    onChange={(e) => setFormData({ ...formData, googleMapsEmbedUrl: e.target.value })}
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
                  <Label htmlFor="missionStatement">Mission Statement</Label>
                  <Textarea
                    id="missionStatement"
                    value={formData.missionStatement}
                    onChange={(e) => setFormData({ ...formData, missionStatement: e.target.value })}
                    rows={4}
                    placeholder="Our church mission is..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visionStatement">Vision Statement</Label>
                  <Textarea
                    id="visionStatement"
                    value={formData.visionStatement}
                    onChange={(e) => setFormData({ ...formData, visionStatement: e.target.value })}
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
                  <Label htmlFor="youtubeChannelUrl">YouTube Channel URL</Label>
                  <Input
                    id="youtubeChannelUrl"
                    value={formData.youtubeChannelUrl}
                    onChange={(e) => setFormData({ ...formData, youtubeChannelUrl: e.target.value })}
                    placeholder="https://www.youtube.com/@yourchannel"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facebookUrl">Facebook Page URL</Label>
                  <Input
                    id="facebookUrl"
                    value={formData.facebookUrl}
                    onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                    placeholder="https://www.facebook.com/yourpage"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagramUrl">Instagram Profile URL</Label>
                  <Input
                    id="instagramUrl"
                    value={formData.instagramUrl}
                    onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
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
