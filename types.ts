export interface Service {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  description: string;
}

export interface Barber {
  id: string;
  name: string;
  specialty: string;
  image: string;
  experience: number; // years
  rating: number;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface BarberAvailability {
  id: string;
  barber_id: string;
  unavailable_date: string; // YYYY-MM-DD
  reason: string;
}

export interface BookingState {
  step: number;
  service: Service | null;
  barber: Barber | null;
  date: Date | null;
  timeSlot: string | null;
  customerName: string;
  customerPhone: string;
  styleNotes: string; 
}

// Tipe data untuk Booking yang sudah diambil dari DB (ada ID dan relasi)
export interface BookingRecord {
  id: string;
  created_at: string;
  booking_date: string; // YYYY-MM-DD
  time_slot: string;
  customer_name: string;
  customer_phone: string;
  style_notes: string;
  // Joined data from Supabase
  barbers: { name: string } | null;
  services: { name: string; price: number } | null;
}

export enum AIStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface StyleRecommendation {
  title: string;
  description: string;
  imageKeyword: string; 
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string; 
  recommendations?: StyleRecommendation[]; 
}

export interface AIResponse {
  type: 'conversation' | 'recommendation';
  text?: string;
  data?: StyleRecommendation[];
}