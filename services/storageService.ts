import { BookingState, Service, Barber, BookingRecord, BarberAvailability } from "../types";
import { supabase } from "./supabaseClient";

export const storageService = {
  // --- PUBLIC METHODS ---

  getServices: async (): Promise<Service[]> => {
    try {
      const { data, error } = await supabase.from("services").select("*").order("price", { ascending: true });

      if (error) throw error;

      return data.map((item: any) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        durationMinutes: item.duration_minutes,
        description: item.description,
      }));
    } catch (err) {
      console.error("Gagal mengambil services:", err);
      return [];
    }
  },

  getBarbers: async (): Promise<Barber[]> => {
    try {
      const { data, error } = await supabase.from("barbers").select("*").order("rating", { ascending: false });

      if (error) throw error;

      return data.map((item: any) => ({
        id: item.id,
        name: item.name,
        specialty: item.specialty,
        image: item.image,
        experience: item.experience,
        rating: item.rating,
      }));
    } catch (err) {
      console.error("Gagal mengambil barbers:", err);
      return [];
    }
  },

  // Mengambil daftar tanggal libur untuk barber tertentu
  getBarberAvailability: async (barberId: string): Promise<BarberAvailability[]> => {
    try {
      const { data, error } = await supabase.from("barber_availability").select("*").eq("barber_id", barberId);

      if (error) throw error;
      return data as BarberAvailability[];
    } catch (err) {
      console.error("Gagal mengambil availability:", err);
      return [];
    }
  },

  checkAvailability: async (barberId: string, date: Date, time: string): Promise<boolean> => {
    try {
      const dateStr = date.toLocaleDateString("en-CA");

      const { data, error } = await supabase.from("bookings").select("id").eq("barber_id", barberId).eq("booking_date", dateStr).eq("time_slot", time);

      if (error) {
        console.error("Error checking availability:", error);
        return false;
      }
      return data.length === 0;
    } catch (err) {
      console.error("Connection error:", err);
      return false;
    }
  },

  createBooking: async (booking: BookingState): Promise<boolean> => {
    if (!booking.service || !booking.barber || !booking.date || !booking.timeSlot) {
      return false;
    }

    try {
      const isAvailable = await storageService.checkAvailability(booking.barber.id, booking.date, booking.timeSlot);

      if (!isAvailable) {
        return false;
      }

      const dateStr = booking.date.toLocaleDateString("en-CA");

      const { error } = await supabase.from("bookings").insert([
        {
          service_id: booking.service.id,
          barber_id: booking.barber.id,
          booking_date: dateStr,
          time_slot: booking.timeSlot,
          customer_name: booking.customerName,
          customer_phone: booking.customerPhone,
          style_notes: booking.styleNotes,
        },
      ]);

      if (error) {
        console.error("Error creating booking:", error);
        return false;
      }

      return true;
    } catch (err) {
      console.error("Transaction error:", err);
      return false;
    }
  },

  // --- ADMIN METHODS ---

  // 1. Get All Bookings (Joined)
  getAllBookings: async (): Promise<BookingRecord[]> => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          *,
          barbers:bookings_barber_id_fkey (name),
          services:bookings_service_id_fkey (name, price)
        `
        )
        .order("booking_date", { ascending: false })
        .order("time_slot", { ascending: true });

      if (!error) {
        return data as unknown as BookingRecord[];
      }

      const bookingsRes = await supabase.from("bookings").select("*").order("booking_date", { ascending: false }).order("time_slot", { ascending: true });

      if (bookingsRes.error) throw bookingsRes.error;

      const barbersRes = await supabase.from("barbers").select("id,name");

      if (barbersRes.error) throw barbersRes.error;

      const servicesRes = await supabase.from("services").select("id,name,price");

      if (servicesRes.error) throw servicesRes.error;

      const barberMap = new Map<string, { name: string }>();
      for (const b of barbersRes.data as any[]) {
        barberMap.set(b.id, { name: b.name });
      }

      const serviceMap = new Map<string, { name: string; price: number }>();
      for (const s of servicesRes.data as any[]) {
        serviceMap.set(s.id, { name: s.name, price: s.price });
      }

      const joined = (bookingsRes.data as any[]).map((row) => ({
        ...row,
        barbers: barberMap.get(row.barber_id) || null,
        services: serviceMap.get(row.service_id) || null,
      }));

      return joined as unknown as BookingRecord[];
    } catch (err) {
      console.error("Admin fetch error:", err);
      return [];
    }
  },

  getBookings: async (date?: string, barberId?: string): Promise<BookingRecord[]> => {
    try {
      let q = supabase.from("bookings").select(`
          *,
          barbers:bookings_barber_id_fkey (name),
          services:bookings_service_id_fkey (name, price)
        `);

      if (date) q = q.eq("booking_date", date);
      if (barberId) q = q.eq("barber_id", barberId);

      if (date && !barberId) {
        q = q.order("time_slot", { ascending: true });
      } else {
        q = q.order("booking_date", { ascending: false }).order("time_slot", { ascending: true });
      }

      const { data, error } = await q;
      if (!error) {
        return data as unknown as BookingRecord[];
      }

      let bookingsQ = supabase.from("bookings").select("*");
      if (date) bookingsQ = bookingsQ.eq("booking_date", date);
      if (barberId) bookingsQ = bookingsQ.eq("barber_id", barberId);
      if (date && !barberId) {
        bookingsQ = bookingsQ.order("time_slot", { ascending: true });
      } else {
        bookingsQ = bookingsQ.order("booking_date", { ascending: false }).order("time_slot", { ascending: true });
      }
      const bookingsRes = await bookingsQ;
      if (bookingsRes.error) throw bookingsRes.error;

      const barbersRes = await supabase.from("barbers").select("id,name");
      if (barbersRes.error) throw barbersRes.error;
      const servicesRes = await supabase.from("services").select("id,name,price");
      if (servicesRes.error) throw servicesRes.error;

      const barberMap = new Map<string, { name: string }>();
      for (const b of barbersRes.data as any[]) barberMap.set(b.id, { name: b.name });
      const serviceMap = new Map<string, { name: string; price: number }>();
      for (const s of servicesRes.data as any[]) serviceMap.set(s.id, { name: s.name, price: s.price });

      const joined = (bookingsRes.data as any[]).map((row) => ({
        ...row,
        barbers: barberMap.get(row.barber_id) || null,
        services: serviceMap.get(row.service_id) || null,
      }));
      return joined as unknown as BookingRecord[];
    } catch (err) {
      console.error("Admin filtered fetch error:", err);
      return [];
    }
  },

  // 2. Service Management
  addService: async (service: Omit<Service, "id">): Promise<boolean> => {
    try {
      const { error } = await supabase.from("services").insert([
        {
          id: `s_${Date.now()}`, // Generate simple ID
          name: service.name,
          price: service.price,
          duration_minutes: service.durationMinutes,
          description: service.description,
        },
      ]);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error("Add Service Error", e);
      return false;
    }
  },

  deleteService: async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error("Delete Service Error", e);
      return false;
    }
  },

  // 3. Barber Management
  addBarber: async (barber: Omit<Barber, "id">): Promise<boolean> => {
    try {
      const { error } = await supabase.from("barbers").insert([
        {
          id: `b_${Date.now()}`,
          name: barber.name,
          specialty: barber.specialty,
          image: barber.image, // Assuming valid URL
          experience: barber.experience,
          rating: barber.rating,
        },
      ]);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error("Add Barber Error", e);
      return false;
    }
  },

  deleteBarber: async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("barbers").delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error("Delete Barber Error", e);
      return false;
    }
  },

  // 4. Availability / Schedule Management
  addBarberAvailability: async (barberId: string, date: string, reason: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("barber_availability").insert([
        {
          barber_id: barberId,
          unavailable_date: date,
          reason: reason,
        },
      ]);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error("Add Availability Error", e);
      return false;
    }
  },

  deleteBarberAvailability: async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("barber_availability").delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error("Delete Availability Error", e);
      return false;
    }
  },
};