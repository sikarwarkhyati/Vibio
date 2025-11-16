// src/pages/SuperadminRequests.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../hooks/use-toast";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Loader2 } from "lucide-react";

interface Requester {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
}

type ApprovalPayload = {
  orgName?: string;
  organizationName?: string;
  [key: string]: unknown;
};

interface ApprovalRequestItem {
  _id: string;
  requesterId?: Requester | null;
  requesterRole: "admin" | "organizer";
  status: "pending" | "approved" | "rejected";
  payload?: ApprovalPayload | null;
  createdAt?: string;
}

const fetchApprovalRequests = async (): Promise<ApprovalRequestItem[]> => {
  const response = await api.get("/superadmin/requests");
  return response.data?.requests ?? [];
};

const SuperadminRequests: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [processing, setProcessing] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loading && user && user.role !== "superadmin") {
      navigate("/", { replace: true });
    }
    if (!loading && !user) {
      navigate("/role-auth", { replace: true });
    }
  }, [user, loading, navigate]);

  const {
    data: requests = [],
    isLoading,
    isFetching,
    refetch,
    error,
  } = useQuery({
    queryKey: ["superadmin", "approvalRequests"],
    queryFn: fetchApprovalRequests,
    enabled: !loading && user?.role === "superadmin",
  });

  const handleAction = async (id: string, action: "approve" | "reject") => {
    const key = `${id}:${action}`;
    try {
      setProcessing(key);
      await api.patch(`/superadmin/requests/${id}/${action}`);
      queryClient.setQueryData<ApprovalRequestItem[] | undefined>(
        ["superadmin", "approvalRequests"],
        (existing) =>
          Array.isArray(existing)
            ? existing.filter((request) => request._id !== id)
            : existing
      );
      toast({
        title: action === "approve" ? "Request approved" : "Request rejected",
        description:
          action === "approve"
            ? "The user has been approved successfully."
            : "The request has been marked as rejected.",
      });
      await refetch();
    } catch (error: unknown) {
      let message = "Something went wrong";

      if (typeof error === "object" && error !== null) {
        const maybeResponse = (error as {
          response?: { data?: { message?: string } };
          message?: string;
        }).response;
        const maybeMessage =
          maybeResponse?.data?.message || (error as { message?: string }).message;
        if (maybeMessage) {
          message = maybeMessage;
        }
      }

      toast({
        title: "Action failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  if (loading || user?.role !== "superadmin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading superadmin tools...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 p-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            Pending Approval Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading || isFetching ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Fetching requests...</span>
            </div>
          ) : error ? (
            <div className="rounded-md bg-destructive/10 p-6 text-destructive">
              Unable to load approval requests. Please try again shortly.
            </div>
          ) : requests.length === 0 ? (
            <div className="rounded-md bg-muted p-6 text-center text-muted-foreground">
              No pending approval requests at the moment.
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => {
                const requester = request.requesterId;
                const orgName =
                  request.payload?.orgName || request.payload?.organizationName;
                return (
                  <div
                    key={request._id}
                    className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {requester?.name || "Unknown User"}
                        </span>
                        <Badge variant="outline" className="capitalize">
                          {request.requesterRole}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {requester?.email || "No email provided"}
                      </p>
                      {orgName && (
                        <p className="text-sm text-muted-foreground">
                          Organization: <span className="font-medium">{orgName}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="default"
                        onClick={() => handleAction(request._id, "approve")}
                        disabled={processing === `${request._id}:approve`}
                      >
                        {processing === `${request._id}:approve` ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleAction(request._id, "reject")}
                        disabled={processing === `${request._id}:reject`}
                      >
                        {processing === `${request._id}:reject` ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Reject
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperadminRequests;
