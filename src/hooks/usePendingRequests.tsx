import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getPendingAdminRequests } from "@/integrations/firebase/firestore/users";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { toast } from "sonner";

interface AdminRequest {
  id: string;
  userId: string;
  email: string;
  status: string;
  createdAt: Date;
  reviewedAt: Date | null;
  reviewedBy: string | null;
}

export function usePendingRequests() {
  const queryClient = useQueryClient();

  const { data: pendingRequests = [], ...queryResult } = useQuery({
    queryKey: ["pending-admin-requests"],
    queryFn: async () => {
      const requests = await getPendingAdminRequests();
      return requests.map(req => ({
        id: req.id || req.userId,
        userId: req.userId,
        email: req.email,
        status: req.status,
        createdAt: req.createdAt instanceof Date ? req.createdAt : new Date(),
        reviewedAt: req.reviewedAt instanceof Date ? req.reviewedAt : null,
        reviewedBy: req.reviewedBy || null
      })) as AdminRequest[];
    },
    refetchInterval: 30000, // Background refresh every 30 seconds
  });

  // Set up Firestore realtime listener for new requests
  useEffect(() => {
    const requestsRef = collection(db, 'admin_requests');
    const q = query(requestsRef, where('status', '==', 'pending'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const newRequest = change.doc.data();
          toast.info(`New admin request from ${newRequest.email}`, {
            description: "Review the request in the Admins page",
            duration: 5000,
          });
        }
      });
      
      // Refetch to update the count
      queryClient.invalidateQueries({ queryKey: ["pending-admin-requests"] });
    });

    return () => unsubscribe();
  }, [queryClient]);

  return {
    pendingRequests,
    pendingCount: pendingRequests.length,
    ...queryResult,
  };
}
