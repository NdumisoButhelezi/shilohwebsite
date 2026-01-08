// Admin Setup Page - Use this to create the first admin
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { createSuperAdmin } from "@/integrations/firebase/firestore/users";
import { Shield, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SetupAdmin() {
  const [userId, setUserId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId.trim()) {
      toast.error("Please enter a user ID");
      return;
    }

    setIsLoading(true);
    try {
      await createSuperAdmin(userId.trim());
      toast.success("Super admin created successfully!");
      setUserId("");
    } catch (error: any) {
      toast.error(error.message || "Failed to create admin");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border-0 shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Admin Setup</CardTitle>
          <CardDescription>
            Create a super admin user for your Firebase application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>How to find User ID</AlertTitle>
            <AlertDescription className="text-sm space-y-2">
              <p>1. Sign in to your Firebase account</p>
              <p>2. Go to Firebase Console → Authentication</p>
              <p>3. Find the user and copy their UID</p>
              <p className="font-semibold mt-2">Note: The first user to register is automatically made a super admin</p>
            </AlertDescription>
          </Alert>

          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userId">User ID (UID)</Label>
              <Input
                id="userId"
                type="text"
                placeholder="Enter Firebase User UID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create Super Admin"}
            </Button>
          </form>

          <div className="text-sm text-muted-foreground text-center space-y-1">
            <p>This page should only be accessible during initial setup</p>
            <p>Remove or protect this route in production</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
