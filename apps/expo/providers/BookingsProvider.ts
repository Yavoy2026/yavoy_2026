import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import createContextHook from "@nkzw/create-context-hook";
import type { BookedTour } from "@/types/tour";
import { useAuth } from "@/providers/AuthProvider";
import {
  cancelBooking as apiCancelBooking,
  createBooking as apiCreateBooking,
  fetchMyBookings,
  type CreateBookingPayload,
} from "@/services/bookings";

export const [BookingsProvider, useBookings] = createContextHook(() => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const bookingsQuery = useQuery({
    queryKey: ["my-bookings"],
    queryFn: fetchMyBookings,
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });

  const bookings = useMemo(() => bookingsQuery.data ?? [], [bookingsQuery.data]);

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
    void queryClient.invalidateQueries({ queryKey: ["catalog"] }); // seats_left изменились
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: apiCreateBooking,
    onSuccess: invalidate,
  });

  const cancelMutation = useMutation({
    mutationFn: apiCancelBooking,
    onSuccess: invalidate,
  });

  const createBooking = useCallback(
    (payload: CreateBookingPayload): Promise<{ booking: BookedTour; paymentUrl: string | null }> =>
      createMutation.mutateAsync(payload),
    [createMutation],
  );

  const cancelBooking = useCallback(
    (id: string): Promise<BookedTour> => cancelMutation.mutateAsync(id),
    [cancelMutation],
  );

  const upcomingBookings = useMemo(
    () => bookings.filter((b) => b.status === "upcoming"),
    [bookings],
  );

  const completedBookings = useMemo(
    () => bookings.filter((b) => b.status === "completed"),
    [bookings],
  );

  return useMemo(
    () => ({
      bookings,
      upcomingBookings,
      completedBookings,
      createBooking,
      cancelBooking,
      isLoading: bookingsQuery.isLoading,
      isCreating: createMutation.isPending,
    }),
    [bookings, upcomingBookings, completedBookings, createBooking, cancelBooking, bookingsQuery.isLoading, createMutation.isPending],
  );
});
