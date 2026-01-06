import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Trash2, UserCog, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  created_at: string;
}

export default function Admins() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      // Get all admin roles with profile info
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("id, user_id, created_at")
        .eq("role", "admin");

      if (rolesError) throw rolesError;

      // Get profiles for all admin user_ids
      const userIds = (roles || []).map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p.email]) || []);

      const adminsWithEmail: AdminUser[] = (roles || []).map((role) => ({
        id: role.id,
        user_id: role.user_id,
        email: profileMap.get(role.user_id) || role.user_id,
        created_at: role.created_at,
      }));

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
    if (!newAdminEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setIsSubmitting(true);
    try {
      // Find user by email in profiles table
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", newAdminEmail.trim().toLowerCase())
        .maybeSingle();

      if (!profile) {
        toast.error("No user found with that email. They must sign up first.");
        setIsSubmitting(false);
        return;
      }

      // Check if user already has admin role
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", profile.id)
        .eq("role", "admin")
        .maybeSingle();

      if (existing) {
        toast.error("User is already an admin");
        setIsSubmitting(false);
        return;
      }

      // Add admin role
      const { error } = await supabase.from("user_roles").insert({
        user_id: profile.id,
        role: "admin",
      });

      if (error) throw error;

      toast.success("Admin added successfully");
      setNewAdminEmail("");
      setIsAddDialogOpen(false);
      fetchAdmins();
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : "Failed to add admin";
      toast.error(errMessage);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveAdmin = async (adminId: string, adminUserId: string) => {
    // Prevent removing yourself
    if (adminUserId === user?.id) {
      toast.error("You cannot remove your own admin access");
      return;
    }

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", adminId);

      if (error) throw error;

      toast.success("Admin removed successfully");
      fetchAdmins();
    } catch (error: unknown) {
      toast.error("Failed to remove admin");
      console.error(error);
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
            Manage administrator access for the dashboard
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
                    {admin.user_id === user?.id && (
                      <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(admin.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          disabled={admin.user_id === user?.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Admin Access</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove admin access for this
                            user? They will no longer be able to access the admin
                            dashboard.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveAdmin(admin.id, admin.user_id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remove Admin
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
    </div>
  );
}