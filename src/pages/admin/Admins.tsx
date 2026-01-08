import { useState, useEffect } from "react";
import { getAllAdmins, getUsersByRole, getUserProfile, getPendingAdminRequests, approveAdminRequest, denyAdminRequest } from "@/integrations/firebase/firestore/users";
import { usePendingRequests } from "@/hooks/usePendingRequests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Trash2, UserCog, Loader2, Check, X, Clock, UserPlus } from "lucide-react";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useQueryClient } from "@tanstack/react-query";

interface AdminUser {
  id: string;
  userId: string;
  email: string;
  createdAt: string;
}

export default function Admins() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { user } = useFirebaseAuth();
  const queryClient = useQueryClient();
  const { pendingRequests, pendingCount, refetch: refetchPending } = usePendingRequests();

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const roles = await getAllAdmins();

      const adminsWithEmail: AdminUser[] = await Promise.all(
        roles.map(async (role) => {
          const profile = await getUserProfile(role.userId);
          return {
            id: role.userId,
            userId: role.userId,
            email: profile?.email || role.userId,
            createdAt: role.assignedAt instanceof Date 
              ? role.assignedAt.toISOString() 
              : (role.assignedAt as any).toDate().toISOString(),
          };
        })
      );

      setAdmins(adminsWithEmail);
    } catch (error: unknown) {
      toast.error("Failed to fetch admins");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim() || !user?.uid) {
      toast.error("Please enter an email address");
      return;
    }

    setIsSubmitting(true);
    try {
      // In Firebase, we need to search for user by email in the users collection
      // This is a simplified version - you may need to implement a cloud function
      // to search users by email since Firebase doesn't provide this directly
      toast.error("Please ask the user to request admin access through the sign-up page");
      setIsSubmitting(false);
      return;

      // Alternatively, if you have implemented a cloud function to add admins:
      // await setUserRole(userId, 'admin', user.uid);
      // toast.success("Admin added successfully");
      // setNewAdminEmail("");
      // setIsAddDialogOpen(false);
      // fetchAdmins();
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : "Failed to add admin";
      toast.error(errMessage);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveAdmin = async (adminId: string, adminUserId: string) => {
    if (adminUserId === user?.uid) {
      toast.error("You cannot remove your own admin access");
      return;
    }

    setProcessingId(adminId);
    try {
      // Call Netlify function to completely delete the user from the system
      const response = await fetch("/.netlify/functions/delete-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: adminUserId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove user");
      }

      toast.success("User completely removed from system");
      fetchAdmins();
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : "Failed to remove user";
      toast.error(errMessage);
      console.error(error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveRequest = async (requestId: string, userId: string, email: string) => {
    if (!user?.uid) return;
    
    setProcessingId(requestId);
    try {
      await approveAdminRequest(requestId, userId, user.uid);

      toast.success(`${email} has been approved as admin`);
      refetchPending();
      fetchAdmins();
      queryClient.invalidateQueries({ queryKey: ["pending-admin-requests"] });
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : "Failed to approve request";
      toast.error(errMessage);
      console.error(error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRequest = async (requestId: string, userId: string, email: string) => {
    setProcessingId(requestId);
    try {
      // Completely delete the user from the system via Netlify function
      const response = await fetch("/.netlify/functions/delete-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reject request");
      }

      toast.success(`Request from ${email} has been rejected and user removed`);
      refetchPending();
      queryClient.invalidateQueries({ queryKey: ["pending-admin-requests"] });
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : "Failed to reject request";
      toast.error(errMessage);
      console.error(error);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Admin Management
          </h1>
          <p className="text-muted-foreground">
            Manage administrator access and approve new requests
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Admin</DialogTitle>
              <DialogDescription>
                Enter the email address of the person you want to grant admin access.
                They must have an existing account.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddAdmin}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="user-email">Email Address</Label>
                  <Input
                    id="user-email"
                    type="email"
                    placeholder="e.g., user@example.com"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    The user must sign up first before you can add them as an admin.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Admin"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending" className="relative">
            Pending Requests
            {pendingCount > 0 && (
              <span className="ml-2 bg-amber-500 text-white text-xs font-medium px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="admins">Current Admins</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <div className="bg-background rounded-lg border">
            {pendingRequests.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium text-foreground mb-1">No pending requests</h3>
                <p className="text-sm text-muted-foreground">
                  New sign-up requests will appear here for your approval
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Requested On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.email}</TableCell>
                      <TableCell>
                        {new Date(request.createdAt instanceof Date ? request.createdAt : (request.createdAt as any).toDate()).toLocaleDateString()} at{" "}
                        {new Date(request.createdAt instanceof Date ? request.createdAt : (request.createdAt as any).toDate()).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              handleApproveRequest(request.id || '', request.userId, request.email)
                            }
                            disabled={processingId === request.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {processingId === request.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </>
                            )}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={processingId === request.id}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Reject Request</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to reject the admin request from{" "}
                                  <strong>{request.email}</strong>? They will not be able to
                                  access the admin panel.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleRejectRequest(request.id || '', request.userId, request.email);
                                  }}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Reject Request
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="admins" className="mt-4">
          <div className="bg-background rounded-lg border">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : admins.length === 0 ? (
              <div className="text-center py-12">
                <UserCog className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium text-foreground mb-1">No admins found</h3>
                <p className="text-sm text-muted-foreground">
                  Add an admin to get started
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Added On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell>
                        {admin.email}
                        {admin.userId === user?.uid && (
                          <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(admin.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={admin.userId === user?.uid || processingId === admin.id}
                            >
                              {processingId === admin.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove User From System</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to completely remove this user from the system? 
                                This will delete their account, profile, and all associated data. 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleRemoveAdmin(admin.id, admin.userId);
                                }}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete User
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
