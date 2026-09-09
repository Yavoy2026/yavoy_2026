import { Loader2 } from "lucide-react";
import { Navigate } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";

/**
 * /admin сам по себе страницы не имеет: раздел по умолчанию зависит от роли —
 * партнёру показывать очередь модерации бессмысленно, у него её нет.
 */
export default function AdminIndex() {
  const { role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 size={28} className="animate-spin text-teal" />
      </div>
    );
  }

  return <Navigate to={role === "partner" ? "/admin/tours" : "/admin/bookings"} replace />;
}
