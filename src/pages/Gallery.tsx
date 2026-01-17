import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getActiveGalleryAlbums, getGalleryImagesByAlbum, getActiveVideos, getAllEvents } from "@/integrations/firebase/firestore/church";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, ChevronLeft, ChevronRight, X, Image, Video, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

interface Album {
  id: string;
  title: string;
  description: string | null;
  eventId?: string | null;
  cover_image_url: string | null;
  created_at: string;
}

interface GalleryImage {
  id: string;
  image_url: string;
  caption: string | null;
}

interface VideoType {
  id: string;
  title: string;
  youtubeVideoId: string;
  description: string | null;
  eventId?: string | null;
  isActive: boolean;
}

interface EventType {
  id: string;
  title: string;
  eventDate: Date;
}

export default function Gallery() {
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedEventFilter, setSelectedEventFilter] = useState<string | null>(null);

  const { data: albums, isLoading: albumsLoading } = useQuery({
    queryKey: ["public-albums"],
    queryFn: async () => {
      const firebaseAlbums = await getActiveGalleryAlbums();
      return firebaseAlbums.map(album => ({
        id: album.id || '',
        title: album.title,
        description: album.description || null,
        eventId: album.eventId || null,
        cover_image_url: album.coverImageUrl || null,
        created_at: album.createdAt instanceof Date ? album.createdAt.toISOString() : new Date().toISOString()
      }));
    },
  });

  const { data: videos, isLoading: videosLoading } = useQuery({
    queryKey: ["public-videos"],
    queryFn: async () => {
      const firebaseVideos = await getActiveVideos();
      return firebaseVideos.map(video => ({
        id: video.id || '',
        title: video.title,
        youtubeVideoId: video.youtubeVideoId,
        description: video.description || null,
        eventId: video.eventId || null,
        isActive: video.isActive
      }));
    },
  });

  const { data: events } = useQuery({
    queryKey: ["gallery-events"],
    queryFn: async () => {
      const allEvents = await getAllEvents();
      return allEvents.map(event => ({
        id: event.id || '',
        title: event.title,
        eventDate: event.eventDate instanceof Date ? event.eventDate : new Date(event.eventDate)
      }));
    },
  });

  const { data: albumImages, isLoading: imagesLoading } = useQuery({
    queryKey: ["public-album-images", selectedAlbum?.id],
    queryFn: async () => {
      if (!selectedAlbum) return [];
      const firebaseImages = await getGalleryImagesByAlbum(selectedAlbum.id);
      return firebaseImages.map(img => ({
        id: img.id || '',
        image_url: img.imageUrl,
        caption: img.description || null
      }));
    },
    enabled: !!selectedAlbum,
  });

  const navigateLightbox = (direction: "prev" | "next") => {
    if (lightboxIndex === null || !albumImages) return;
    if (direction === "prev") {
      setLightboxIndex(lightboxIndex > 0 ? lightboxIndex - 1 : albumImages.length - 1);
    } else {
      setLightboxIndex(lightboxIndex < albumImages.length - 1 ? lightboxIndex + 1 : 0);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="section-padding bg-background">
          <div className="container mx-auto">
            {/* Header */}
            <div className="mb-8">
              {selectedAlbum ? (
                <div>
                  <Button
                    variant="ghost"
                    className="mb-4 gap-2"
                    onClick={() => setSelectedAlbum(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Gallery
                  </Button>
                  <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-2">
                    {selectedAlbum.title}
                  </h1>
                  {selectedAlbum.description && (
                    <p className="text-muted-foreground text-lg">
                      {selectedAlbum.description}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    {format(new Date(selectedAlbum.created_at), "MMMM d, yyyy")}
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <Link
                    to="/#gallery"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                  </Link>
                  <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
                    Gallery
                  </h1>
                  <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Browse through our photos, event galleries, and video collection.
                  </p>
                </div>
              )}
            </div>

            {/* Gallery Content with Tabs */}
            {!selectedAlbum ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
                  <TabsTrigger value="all" className="gap-2">
                    <Image className="h-4 w-4" />
                    All Photos
                  </TabsTrigger>
                  <TabsTrigger value="events" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    Events
                  </TabsTrigger>
                  <TabsTrigger value="videos" className="gap-2">
                    <Video className="h-4 w-4" />
                    Videos
                  </TabsTrigger>
                </TabsList>

                {/* All Photos Tab */}
                <TabsContent value="all" className="mt-6">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {albumsLoading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i} className="overflow-hidden">
                          <CardContent className="p-0">
                            <Skeleton className="aspect-video w-full" />
                            <div className="p-4">
                              <Skeleton className="h-6 w-3/4 mb-2" />
                              <Skeleton className="h-4 w-1/2" />
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : albums && albums.length > 0 ? (
                      albums.map((album) => (
                        <Card
                          key={album.id}
                          className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
                          onClick={() => setSelectedAlbum(album)}
                        >
                          <CardContent className="p-0">
                            <div className="aspect-video bg-muted overflow-hidden">
                              {album.cover_image_url ? (
                                <img
                                  src={album.cover_image_url}
                                  alt={album.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Image className="h-12 w-12 text-muted-foreground/50" />
                                </div>
                              )}
                            </div>
                            <div className="p-4">
                              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                {album.title}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(album.created_at), "MMMM d, yyyy")}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-12">
                        <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No photo albums available yet.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Event-Based Photos Tab */}
                <TabsContent value="events" className="mt-6">
                  <div className="space-y-8">
                    {/* Event Filter */}
                    <div className="flex justify-center">
                      <div className="inline-flex gap-2 flex-wrap justify-center">
                        <Button
                          variant={selectedEventFilter === null ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedEventFilter(null)}
                        >
                          All Events
                        </Button>
                        {events?.map((event) => (
                          <Button
                            key={event.id}
                            variant={selectedEventFilter === event.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedEventFilter(event.id)}
                          >
                            {event.title}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Event Albums Grid */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {albumsLoading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                          <Card key={i} className="overflow-hidden">
                            <CardContent className="p-0">
                              <Skeleton className="aspect-video w-full" />
                              <div className="p-4">
                                <Skeleton className="h-6 w-3/4 mb-2" />
                                <Skeleton className="h-4 w-1/2" />
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : albums && albums.length > 0 ? (
                        albums
                          .filter((album) => 
                            !selectedEventFilter || album.eventId === selectedEventFilter
                          )
                          .filter((album) => album.eventId) // Only show albums with events
                          .map((album) => {
                            const event = events?.find((e) => e.id === album.eventId);
                            return (
                              <Card
                                key={album.id}
                                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
                                onClick={() => setSelectedAlbum(album)}
                              >
                                <CardContent className="p-0">
                                  <div className="aspect-video bg-muted overflow-hidden">
                                    {album.cover_image_url ? (
                                      <img
                                        src={album.cover_image_url}
                                        alt={album.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Image className="h-12 w-12 text-muted-foreground/50" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="p-4">
                                    {event && (
                                      <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="h-3 w-3 text-primary" />
                                        <span className="text-xs text-primary font-medium">
                                          {event.title}
                                        </span>
                                      </div>
                                    )}
                                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                      {album.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                      {format(new Date(album.created_at), "MMMM d, yyyy")}
                                    </p>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })
                      ) : (
                        <div className="col-span-full text-center py-12">
                          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No event albums available yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Videos Tab */}
                <TabsContent value="videos" className="mt-6">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videosLoading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i} className="overflow-hidden">
                          <CardContent className="p-0">
                            <Skeleton className="aspect-video w-full" />
                            <div className="p-4">
                              <Skeleton className="h-6 w-3/4 mb-2" />
                              <Skeleton className="h-4 w-full" />
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : videos && videos.length > 0 ? (
                      videos.map((video) => {
                        const event = events?.find((e) => e.id === video.eventId);
                        return (
                          <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                            <CardContent className="p-0">
                              <div className="aspect-video bg-muted overflow-hidden">
                                <iframe
                                  src={`https://www.youtube.com/embed/${video.youtubeVideoId}`}
                                  title={video.title}
                                  className="w-full h-full"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              </div>
                              <div className="p-4">
                                {event && (
                                  <div className="flex items-center gap-2 mb-2">
                                    <Calendar className="h-3 w-3 text-primary" />
                                    <span className="text-xs text-primary font-medium">
                                      {event.title}
                                    </span>
                                  </div>
                                )}
                                <h3 className="font-semibold text-foreground mb-2">
                                  {video.title}
                                </h3>
                                {video.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {video.description}
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    ) : (
                      <div className="col-span-full text-center py-12">
                        <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No videos available yet.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              // Album Images Grid (when album is selected)
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {imagesLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square w-full rounded-lg" />
                  ))
                ) : albumImages && albumImages.length > 0 ? (
                  albumImages.map((image, index) => (
                    <div
                      key={image.id}
                      className="aspect-square cursor-pointer group"
                      onClick={() => setLightboxIndex(index)}
                    >
                      <img
                        src={image.image_url}
                        alt={image.caption || "Gallery photo"}
                        className="w-full h-full object-cover rounded-lg group-hover:opacity-90 transition-opacity"
                      />
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No photos in this album yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />

      {/* Lightbox */}
      <Dialog open={lightboxIndex !== null} onOpenChange={() => setLightboxIndex(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
          <DialogTitle className="sr-only">Image viewer</DialogTitle>
          {lightboxIndex !== null && albumImages && albumImages[lightboxIndex] && (
            <div className="relative flex items-center justify-center h-[90vh]">
              <img
                src={albumImages[lightboxIndex].image_url}
                alt={albumImages[lightboxIndex].caption || "Gallery photo"}
                className="max-w-full max-h-full object-contain"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 text-white hover:bg-white/20"
                onClick={() => setLightboxIndex(null)}
              >
                <X className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                onClick={() => navigateLightbox("prev")}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                onClick={() => navigateLightbox("next")}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
                {lightboxIndex + 1} / {albumImages.length}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
