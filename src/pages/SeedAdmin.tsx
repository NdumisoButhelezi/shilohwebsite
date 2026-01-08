// Seed Admin Page - One-time setup
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { seedAdmin } from "@/utils/seedAdmin";
import { Database, CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SeedAdmin() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSeeded, setIsSeeded] = useState(false);

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await seedAdmin();
      toast.success("Admin user created successfully!");
      setIsSeeded(true);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast.info("Admin user already exists");
        setIsSeeded(true);
      } else {
        toast.error(error.message || "Failed to create admin user");
        console.error(error);
      }
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border-0 shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Database className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Seed Admin User</CardTitle>
          <CardDescription>
            Create the initial admin account for Shiloh Intercession Mountain
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isSeeded ? (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  This will create an admin account with email:{" "}
                  <span className="font-semibold">shilointercessionmountain@gmail.com</span>
                  <br />
                  <span className="text-xs text-muted-foreground mt-1 block">
                    Only run this once during initial setup
                  </span>
                </AlertDescription>
              </Alert>

              <Button 
                onClick={handleSeed} 
                className="w-full"
                disabled={isSeeding}
                size="lg"
              >
                {isSeeding ? "Creating Admin User..." : "Create Admin User"}
              </Button>

              <div className="text-sm text-muted-foreground text-center">
                <p>After seeding, you can sign in at:</p>
                <a href="/auth" className="text-primary hover:underline font-medium">
                  /auth
                </a>
              </div>
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-600 mb-2">
                  Admin User Created Successfully!
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">Login Credentials:</p>
                  <div className="bg-muted p-3 rounded-md text-left">
                    <p><span className="text-muted-foreground">Email:</span> shilointercessionmountain@gmail.com</p>
                    <p><span className="text-muted-foreground">Password:</span> Repentorperish01</p>
                  </div>
                </div>
              </div>
              <Button asChild className="w-full" size="lg">
                <a href="/auth">Go to Login</a>
              </Button>
            </div>
          )}

          <div className="text-xs text-muted-foreground text-center pt-4 border-t">
            <p>⚠️ Delete this page after initial setup for security</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
