import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import createContextHook from "@nkzw/create-context-hook";
import { BookedTour } from "@/types/tour";

const BOOKINGS_KEY = "yavoy_bookings";

export const [BookingsProvider, useBookings] = createContextHook(() => {
  const [bookings, setBookings] = useState<BookedTour[]>([]);
  const queryClient = useQueryClient();

  const bookingsQuery = useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(BOOKINGS_KEY);
      console.log("[BookingsProvider] Loaded bookings:", stored ? JSON.parse(stored).length : 0);
      return stored ? (JSON.parse(stored) as BookedTour[]) : [];
    },
  });

  useEffect(() => {
    if (bookingsQuery.data) {
      setBookings(bookingsQuery.data);
    }
  }, [bookingsQuery.data]);

  const syncMutation = useMutation({
    mutationFn: async (items: BookedTour[]) => {
      await AsyncStorage.setItem(BOOKINGS_KEY, JSON.stringify(items));
      return items;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });

  const addBooking = useCallback(
    (booking: BookedTour) => {
      const updated = [booking, ...bookings];
      setBookings(updated);
      syncMutation.mutate(updated);
      console.log("[BookingsProvider] Added booking:", booking.id);
    },
    [bookings, syncMutation]
  );

  const upcomingBookings = useMemo(
    () => bookings.filter((b) => b.status === "upcoming"),
    [bookings]
  );

  const completedBookings = useMemo(
    () => bookings.filter((b) => b.status === "completed"),
    [bookings]
  );

  return useMemo(
    () => ({
      bookings,
      upcomingBookings,
      completedBookings,
      addBooking,
      isLoading: bookingsQuery.isLoading,
    }),
    [bookings, upcomingBookings, completedBookings, addBooking, bookingsQuery.isLoading]
  );
});
