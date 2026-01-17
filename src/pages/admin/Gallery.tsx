import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllGalleryAlbums, createGalleryAlbum, updateGalleryAlbum, deleteGalleryAlbum, getGalleryImagesByAlbum, createGalleryImage, deleteGalleryImage, updateImageOrder, getAllEvents } from "@/integrations/firebase/firestore/church";
import { uploadFile, deleteFile } from "@/integrations/firebase/client";
import { compressImageToBase64, addBase64Prefix, isValidBase64Image } from "@/utils/imageCompression";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Image, Upload, X, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";

interface Album {
  id: string;
  title: string;
  description: string | null;
  eventId?: string | null;
  coverImageUrl: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
}

interface GalleryImage {
  id: string;
  albumId: string;
  imageUrl: string;
  caption: string | null;
  displayOrder: number;
}

export default function Gallery() {
  const [isAlbumDialogOpen, setIsAlbumDialogOpen] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [newAlbum, setNewAlbum] = useState({ title: "", description: "", eventId: "" });
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: albums, isLoading } = useQuery({
    queryKey: ["admin-albums"],
    queryFn: async () => {
      console.log("Fetching all gallery albums...");
      const result = await getAllGalleryAlbums();
      console.log("Gallery albums fetched:", result);
      console.log("Number of albums:", result.length);
      if (result.length > 0) {
        console.log("First album structure:", result[0]);
        console.log("Album createdAt type:", typeof result[0].createdAt, result[0].createdAt);
      }
      return result;
    },
    refetchInterval: 5000, // Background refresh every 5 seconds
  });

  const { data: events } = useQuery({
    queryKey: ["all-events-for-gallery"],
    queryFn: getAllEvents,
  });

  const { data: albumImages } = useQuery({
    queryKey: ["album-images", selectedAlbum?.id],
    queryFn: async () => {
      if (!selectedAlbum) return [];
      console.log("Fetching images for album:", selectedAlbum.id, selectedAlbum.title);
      const images = await getGalleryImagesByAlbum(selectedAlbum.id);
      console.log("Images fetched:", images);
      console.log("Number of images:", images.length);
      if (images.length > 0) {
        console.log("First image:", images[0]);
        console.log("Image URL length:", images[0].imageUrl?.length);
      }
      return images;
    },
    enabled: !!selectedAlbum,
    refetchInterval: 5000, // Background refresh every 5 seconds
  });

  const createAlbumMutation = useMutation({
    mutationFn: async (album: { title: string; description: string; eventId: string }) => {
      await createGalleryAlbum({
        title: album.title,
        description: album.description || undefined,
        eventId: album.eventId || null,
        isActive: true,
        displayOrder: 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-albums"] });
      setIsAlbumDialogOpen(false);
      setNewAlbum({ title: "", description: "", eventId: "" });
      toast({ title: "Album created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error creating album", description: error.message, variant: "destructive" });
    },
  });

  const deleteAlbumMutation = useMutation({
    mutationFn: async (albumId: string) => {
      await deleteGalleryAlbum(albumId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-albums"] });
      setSelectedAlbum(null);
      toast({ title: "Album deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error deleting album", description: error.message, variant: "destructive" });
    },
  });

  const toggleAlbumVisibility = useMutation({
    mutationFn: async ({ albumId, isActive }: { albumId: string; isActive: boolean }) => {
      await updateGalleryAlbum(albumId, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-albums"] });
      toast({ title: "Album visibility updated" });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (image: GalleryImage) => {
      // Delete from Firestore (base64 stored in document)
      await deleteGalleryImage(image.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["album-images", selectedAlbum?.id] });
      toast({ title: "Image deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error deleting image", description: error.message, variant: "destructive" });
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !selectedAlbum) return;

    setUploading(true);
    const files = Array.from(e.target.files);
    console.log("Starting upload of", files.length, "files for album:", selectedAlbum.id);

    try {
      for (const file of files) {
        console.log("Compressing file:", file.name, "Size:", file.size, "bytes");
        
        // Compress image to base64
        const base64Image = await compressImageToBase64(file, {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.8,
          outputFormat: 'jpeg'
        });

        console.log("Compressed base64 length:", base64Image.length, "characters");

        // Save to Firestore with base64 data
        const imageId = await createGalleryImage({
          albumId: selectedAlbum.id,
          imageUrl: base64Image, // Store base64 directly
          caption: null,
          displayOrder: 0,
        });

        console.log("Image saved with ID:", imageId);

        // Update cover image if first image
        if (!selectedAlbum.coverImageUrl) {
          await updateGalleryAlbum(selectedAlbum.id, { coverImageUrl: base64Image });
          console.log("Updated cover image for album");
        }
      }

      queryClient.invalidateQueries({ queryKey: ["album-images", selectedAlbum.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-albums"] });
      toast({ title: `${files.length} image(s) uploaded successfully` });
      console.log("Upload complete, queries invalidated");
    } catch (error: unknown) {
      console.error("Upload error:", error);
      toast({
        title: "Error uploading images",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Photo Gallery</h1>
          <p className="text-muted-foreground">Manage photo albums and images</p>
        </div>
        <Dialog open={isAlbumDialogOpen} onOpenChange={setIsAlbumDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Album
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Album</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Album Title</Label>
                <Input
                  id="title"
                  value={newAlbum.title}
                  onChange={(e) => setNewAlbum({ ...newAlbum, title: e.target.value })}
                  placeholder="e.g., Sunday 14th Service"
                />
              </div>
              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={newAlbum.description}
                  onChange={(e) => setNewAlbum({ ...newAlbum, description: e.target.value })}
                  placeholder="Brief description of the album"
                />
              </div>
              <div>
                <Label htmlFor="event">Link to Event (optional)</Label>
                <Select
                  value={newAlbum.eventId || "none"}
                  onValueChange={(value) => setNewAlbum({ ...newAlbum, eventId: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an event" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Event</SelectItem>
                    {events?.map((event) => (
                      <SelectItem key={event.id} value={event.id!}>
                        {event.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => createAlbumMutation.mutate(newAlbum)}
                disabled={!newAlbum.title || createAlbumMutation.isPending}
                className="w-full"
              >
                Create Album
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Albums List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="font-semibold text-lg">Albums</h2>
          {(() => {
            console.log("Render check - isLoading:", isLoading, "albums:", albums, "albums.length:", albums?.length);
            if (isLoading) {
              return <p className="text-muted-foreground">Loading...</p>;
            } else if (albums && albums.length > 0) {
              console.log("Rendering albums:", albums.length);
              return (
                <div className="space-y-2">
                  {albums.map((album) => (
                    <Card
                      key={album.id}
                      className={`cursor-pointer transition-colors ${
                        selectedAlbum?.id === album.id ? "border-primary" : ""
                      }`}
                      onClick={() => setSelectedAlbum(album)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate">{album.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {album.createdAt && format(
                                album.createdAt instanceof Date 
                                  ? album.createdAt 
                                  : new Date((album.createdAt as any).seconds * 1000), 
                                "MMM d, yyyy"
                              )}
                            </p>
                          </div>
                          <Badge variant={album.isActive ? "default" : "secondary"}>
                            {album.isActive ? "Active" : "Hidden"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              );
            } else {
              console.log("No albums to show");
              return <p className="text-muted-foreground text-center py-8">No albums yet</p>;
            }
          })()}
        </div>

        {/* Album Details */}
        <div className="lg:col-span-2">
          {selectedAlbum ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{selectedAlbum.title}</CardTitle>
                  {selectedAlbum.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedAlbum.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      toggleAlbumVisibility.mutate({
                        albumId: selectedAlbum.id,
                        isActive: !selectedAlbum.isActive,
                      })
                    }
                    title={selectedAlbum.isActive ? "Hide album" : "Show album"}
                  >
                    {selectedAlbum.isActive ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => deleteAlbumMutation.mutate(selectedAlbum.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upload Button */}
                <div className="flex items-center gap-4">
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted transition-colors">
                      <Upload className="h-4 w-4" />
                      {uploading ? "Uploading..." : "Upload Images"}
                    </div>
                    <Input
                      id="file-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </Label>
                </div>

                {/* Images Grid */}
                {(() => {
                  // Debug render-time info
                  // eslint-disable-next-line no-console
                  console.log('Render - albumImages:', albumImages);
                  if (albumImages && albumImages.length > 0) {
                    return (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {albumImages.map((image) => {
                          let raw = (image as any).imageUrl || (image as any).imageData || (image as any).image_url || '';
                          let src = raw;
                          if (raw && !raw.startsWith('data:image')) {
                            if (isValidBase64Image(raw)) {
                              src = addBase64Prefix(raw);
                            }
                          }
                          return (
                            <div key={image.id} className="relative group aspect-square">
                              <img
                                src={src}
                                alt={image.caption || "Gallery image"}
                                className="w-full h-full object-cover rounded-lg"
                              />
                              <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                                onClick={() => deleteImageMutation.mutate(image)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }
                  return (
                    <div className="text-center py-12 text-muted-foreground">
                      <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No images in this album yet</p>
                      <p className="text-sm">Upload some photos to get started</p>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">
                <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select an album to view and manage photos</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
