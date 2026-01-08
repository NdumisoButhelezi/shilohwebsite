// Example: Firebase-based Admin Events Page
// This shows how to migrate an admin page from Supabase to Firebase
// Replace src/pages/admin/Events.tsx with this approach

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import {
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  Event,
} from "@/integrations/firebase/firestore/church";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Calendar, Plus, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";

export default function FirebaseEventsExample() {
  const { isAdmin } = useFirebaseAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventDate: "",
    startTime: "",
    endTime: "",
    location: "",
    eventType: "general",
    isActive: true,
  });

  // Fetch events
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["admin-events"],
    queryFn: getAllEvents,
    enabled: isAdmin,
  });

  // Create event mutation
  const createMutation = useMutation({
    mutationFn: async (data: Omit<Event, "id" | "createdAt" | "updatedAt">) => {
      return await createEvent(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      toast.success("Event created successfully");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to create event: ${error.message}`);
    },
  });

  // Update event mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Event> }) => {
      return await updateEvent(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      toast.success("Event updated successfully");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to update event: ${error.message}`);
    },
  });

  // Delete event mutation
  const deleteMutation = useMutation({
    mutationFn: async (eventId: string) => {
      return await deleteEvent(eventId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      toast.success("Event deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete event: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      eventDate: "",
      startTime: "",
      endTime: "",
      location: "",
      eventType: "general",
      isActive: true,
    });
    setEditingEvent(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const eventData = {
      ...formData,
      eventDate: new Date(formData.eventDate),
    };

    if (editingEvent?.id) {
      updateMutation.mutate({
        id: editingEvent.id,
        data: eventData,
      });
    } else {
      createMutation.mutate(eventData);
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    
    // Convert Timestamp to date string for form
    let dateString = "";
    if (event.eventDate instanceof Timestamp) {
      dateString = format(event.eventDate.toDate(), "yyyy-MM-dd");
    } else if (event.eventDate instanceof Date) {
      dateString = format(event.eventDate, "yyyy-MM-dd");
    }

    setFormData({
      title: event.title,
      description: event.description || "",
      eventDate: dateString,
      startTime: event.startTime,
      endTime: event.endTime || "",
      location: event.location || "",
      eventType: event.eventType || "general",
      isActive: event.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (eventId: string) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      deleteMutation.mutate(eventId);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8">
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Events</h1>
          <p className="text-muted-foreground">Manage church events</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingEvent ? "Edit Event" : "Create Event"}
              </DialogTitle>
              <DialogDescription>
                {editingEvent
                  ? "Update the event details"
                  : "Add a new church event"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="eventDate">Event Date *</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) =>
                      setFormData({ ...formData, eventDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="eventType">Event Type</Label>
                  <Input
                    id="eventType"
                    value={formData.eventType}
                    onChange={(e) =>
                      setFormData({ ...formData, eventType: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editingEvent
                    ? "Update Event"
                    : "Create Event"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading events...</div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No events yet. Create your first event!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => {
            let eventDate = "";
            if (event.eventDate instanceof Timestamp) {
              eventDate = format(event.eventDate.toDate(), "MMMM d, yyyy");
            } else if (event.eventDate instanceof Date) {
              eventDate = format(event.eventDate, "MMMM d, yyyy");
            }

            return (
              <Card key={event.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{event.title}</CardTitle>
                      <CardDescription>
                        {eventDate} • {event.startTime}
                        {event.endTime && ` - ${event.endTime}`}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(event)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => event.id && handleDelete(event.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {event.description && (
                  <CardContent>
                    <p>{event.description}</p>
                    {event.location && (
                      <p className="text-sm text-muted-foreground mt-2">
                        📍 {event.location}
                      </p>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
