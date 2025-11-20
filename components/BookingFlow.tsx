import React, { useState, useEffect } from 'react';
import { Scissors, User, Calendar, CheckCircle, ChevronLeft, ChevronRight, Clock, Star, Loader2, AlertCircle, FileText, X } from 'lucide-react';
import { BookingState, Service, Barber } from '../types';
import { TIME_SLOTS } from '../constants';
import { Button } from './Button';
import { storageService } from '../services/storageService';

interface BookingFlowProps {
  initialNote?: string;
  onClose: () => void;
}

export const BookingFlow: React.FC<BookingFlowProps> = ({ initialNote, onClose }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const [booking, setBooking] = useState<BookingState>({
    step: 1,
    service: null,
    barber: null,
    date: null,
    timeSlot: null,
    customerName: '',
    customerPhone: '',
    styleNotes: ''
  });

  // Blocked dates for the selected barber
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());

  // Update booking notes when initialNote changes (from AI)
  useEffect(() => {
    if (initialNote) {
      setBooking(prev => ({ ...prev, styleNotes: initialNote }));
    }
  }, [initialNote]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unavailableSlots, setUnavailableSlots] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load Master Data from Supabase
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        setIsLoadingData(true);
        const [fetchedServices, fetchedBarbers] = await Promise.all([
          storageService.getServices(),
          storageService.getBarbers()
        ]);
        setServices(fetchedServices);
        setBarbers(fetchedBarbers);
      } catch (err) {
        console.error("Gagal memuat data:", err);
        setDataError("Gagal memuat data layanan. Pastikan koneksi internet anda stabil.");
      } finally {
        setIsLoadingData(false);
      }
    };
    loadMasterData();
  }, []);

  // Fetch Blocked Dates when Barber is Selected
  useEffect(() => {
    const fetchBlockedDates = async () => {
      if (booking.barber) {
        const availabilities = await storageService.getBarberAvailability(booking.barber.id);
        const blockedSet = new Set(availabilities.map(a => a.unavailable_date));
        setBlockedDates(blockedSet);
      }
    };
    fetchBlockedDates();
  }, [booking.barber]);

  // Reset booking state helper
  const resetBooking = () => {
    setBooking({
      step: 1,
      service: null,
      barber: null,
      date: null,
      timeSlot: null,
      customerName: '',
      customerPhone: '',
      styleNotes: ''
    });
    setUnavailableSlots([]);
    setError(null);
    setBlockedDates(new Set());
  };

  // Effect to check availability when Date or Barber changes
  useEffect(() => {
    const checkSlots = async () => {
      if (booking.barber && booking.date && booking.step === 3) {
        const takenSlots: string[] = [];
        // Check all slots in parallel logic (simulated)
        const checks = TIME_SLOTS.map(async (time) => {
          const isAvailable = await storageService.checkAvailability(
            booking.barber!.id,
            booking.date!,
            time
          );
          if (!isAvailable) return time;
          return null;
        });
        
        const results = await Promise.all(checks);
        setUnavailableSlots(results.filter((t): t is string => t !== null));
      }
    };

    checkSlots();
  }, [booking.barber, booking.date, booking.step]);

  // Helper to format currency
  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number);
  };

  // Generate next 7 days for date selection
  const getNextDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const days = getNextDays();

  const handleNext = async () => {
    if (booking.step === 4) {
      // Final Submission
      setIsSubmitting(true);
      setError(null);
      try {
        const success = await storageService.createBooking(booking);
        if (success) {
          setBooking(prev => ({ ...prev, step: prev.step + 1 }));
        } else {
          setError("Gagal membuat booking. Slot mungkin sudah diambil atau terjadi kesalahan sistem.");
        }
      } catch (e) {
        setError("Terjadi kesalahan jaringan.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setBooking(prev => ({ ...prev, step: prev.step + 1 }));
    }
  };

  const handleBack = () => {
    setBooking(prev => ({ ...prev, step: prev.step - 1 }));
    setError(null);
  };

  if (isLoadingData) {
    return (
      <div className="w-full h-[400px] flex flex-col items-center justify-center text-gold-500 bg-dark-900 rounded-2xl">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p>Memuat data barbershop...</p>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="w-full h-[400px] flex flex-col items-center justify-center text-red-400 p-6 text-center bg-dark-900 rounded-2xl">
        <AlertCircle className="w-10 h-10 mb-4" />
        <p>{dataError}</p>
        <Button variant="outline" onClick={onClose} className="mt-4">Tutup</Button>
      </div>
    );
  }

  // Step 1: Select Service
  const renderServiceStep = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-serif font-bold text-gold-500 mb-6">Pilih Layanan</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => (
          <div
            key={service.id}
            onClick={() => setBooking({ ...booking, service })}
            className={`p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:bg-dark-700 ${
              booking.service?.id === service.id
                ? 'border-gold-500 bg-dark-700 shadow-lg shadow-gold-500/10'
                : 'border-dark-700 bg-dark-800'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg text-white">{service.name}</h3>
              <span className="text-gold-400 font-bold">{formatRupiah(service.price)}</span>
            </div>
            <p className="text-gray-400 text-sm mb-3">{service.description}</p>
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="w-3 h-3 mr-1" />
              {service.durationMinutes} Menit
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Step 2: Select Barber
  const renderBarberStep = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-serif font-bold text-gold-500 mb-6">Pilih Barberman</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {barbers.map((barber) => (
          <div
            key={barber.id}
            onClick={() => setBooking({ ...booking, barber })}
            className={`group relative overflow-hidden rounded-xl cursor-pointer transition-all duration-300 ${
               booking.barber?.id === barber.id ? 'ring-2 ring-gold-500 scale-105' : 'hover:scale-105'
            }`}
          >
            <div className="aspect-square w-full relative">
              <img 
                src={barber.image} 
                alt={barber.name}
                className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-90" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-xl font-bold text-white mb-1">{barber.name}</h3>
                <p className="text-gold-400 text-sm mb-2">{barber.specialty}</p>
                <div className="flex items-center gap-1 text-xs text-gray-300">
                  <Star className="w-3 h-3 fill-gold-500 text-gold-500" />
                  {barber.rating} • {barber.experience} Tahun Pengalaman
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Step 3: Select Date & Time
  const renderDateTimeStep = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-serif font-bold text-gold-500 mb-6">Pilih Waktu</h2>
      
      {/* Date Selector */}
      <div className="space-y-2">
        <label className="text-sm text-gray-400 uppercase tracking-wider">Tanggal</label>
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
          {days.map((day, idx) => {
            const dateStr = day.toLocaleDateString('en-CA'); // YYYY-MM-DD
            const isBlocked = blockedDates.has(dateStr);
            const isSelected = booking.date?.toDateString() === day.toDateString();
            
            return (
              <button
                key={idx}
                disabled={isBlocked}
                onClick={() => !isBlocked && setBooking({ ...booking, date: day, timeSlot: null })} // Reset time when date changes
                className={`flex-shrink-0 w-24 h-28 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all relative ${
                  isBlocked
                    ? 'bg-dark-900 border-dark-700 text-gray-600 cursor-not-allowed opacity-50'
                    : isSelected
                        ? 'bg-gold-500 border-gold-500 text-dark-900'
                        : 'bg-dark-800 border-dark-700 text-gray-400 hover:border-gold-500/50'
                }`}
              >
                <span className="text-xs font-medium">{day.toLocaleDateString('id-ID', { weekday: 'short' })}</span>
                <span className="text-2xl font-bold">{day.getDate()}</span>
                
                {isBlocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl backdrop-blur-[1px]">
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider bg-black/80 px-1 py-0.5 rounded">Libur</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Selector */}
      {booking.date && (
        <div className="space-y-2 animate-in fade-in">
          <label className="text-sm text-gray-400 uppercase tracking-wider">
             Jam Tersedia untuk {booking.barber?.name.split(' ')[0]}
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {TIME_SLOTS.map((time) => {
              const isTaken = unavailableSlots.includes(time);
              return (
                <button
                  key={time}
                  disabled={isTaken}
                  onClick={() => setBooking({ ...booking, timeSlot: time })}
                  className={`py-2 px-4 rounded-lg text-sm font-semibold border transition-all relative ${
                    isTaken 
                      ? 'bg-dark-800 text-gray-600 border-dark-700 cursor-not-allowed' 
                      : booking.timeSlot === time
                        ? 'bg-white text-dark-900 border-white'
                        : 'bg-transparent text-white border-dark-600 hover:border-gold-500 hover:text-gold-500'
                  }`}
                >
                  {time}
                  {isTaken && (
                    <span className="absolute top-0 right-0 -mt-1 -mr-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>
              );
            })}
          </div>
          {unavailableSlots.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">* Tanda merah menandakan jadwal sudah penuh.</p>
          )}
        </div>
      )}
    </div>
  );

  // Step 4: Customer Info
  const renderInfoStep = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-serif font-bold text-gold-500 mb-6">Informasi Kontak</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Nama Lengkap</label>
          <input
            type="text"
            value={booking.customerName}
            onChange={(e) => setBooking({ ...booking, customerName: e.target.value })}
            className="w-full bg-dark-800 border border-dark-600 rounded-lg p-3 text-white focus:ring-1 focus:ring-gold-500 focus:border-gold-500 outline-none"
            placeholder="Masukkan nama anda"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Nomor WhatsApp</label>
          <input
            type="tel"
            value={booking.customerPhone}
            onChange={(e) => setBooking({ ...booking, customerPhone: e.target.value })}
            className="w-full bg-dark-800 border border-dark-600 rounded-lg p-3 text-white focus:ring-1 focus:ring-gold-500 focus:border-gold-500 outline-none"
            placeholder="0812..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gold-500 mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Catatan Gaya / Request Khusus
          </label>
          <textarea
            value={booking.styleNotes}
            onChange={(e) => setBooking({ ...booking, styleNotes: e.target.value })}
            className="w-full h-24 bg-dark-800 border border-dark-600 rounded-lg p-3 text-white focus:ring-1 focus:ring-gold-500 focus:border-gold-500 outline-none resize-none"
            placeholder="Contoh: Samping tipis 0, atas dibiarkan panjang sedikit..."
          />
          <p className="text-xs text-gray-500 mt-1">Jika anda menggunakan fitur AI Consultant, saran gaya otomatis masuk di sini.</p>
        </div>
      </div>

      <div className="mt-8 bg-dark-800 p-6 rounded-xl border border-dark-700">
        <h3 className="text-lg font-bold text-white mb-4">Ringkasan Booking</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Layanan</span>
            <span className="text-white">{booking.service?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Barber</span>
            <span className="text-white">{booking.barber?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Waktu</span>
            <span className="text-white">
              {booking.date?.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}, {booking.timeSlot}
            </span>
          </div>
          <div className="border-t border-dark-600 my-2 pt-2 flex justify-between text-base font-bold text-gold-500">
            <span>Total</span>
            <span>{formatRupiah(booking.service?.price || 0)}</span>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-lg flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );

  // Step 5: Success
  const renderSuccessStep = () => (
    <div className="flex flex-col items-center text-center py-12 animate-in zoom-in duration-500">
      <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
        <CheckCircle className="w-10 h-10 text-green-500" />
      </div>
      <h2 className="text-3xl font-serif font-bold text-white mb-2">Booking Berhasil!</h2>
      <p className="text-gray-400 max-w-md mb-8">
        Terima kasih, {booking.customerName}. Booking anda dengan {booking.barber?.name} telah dikonfirmasi untuk tanggal {booking.date?.toLocaleDateString()}.
      </p>
      <Button onClick={() => { resetBooking(); onClose(); }} variant="primary">
        Selesai & Tutup
      </Button>
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto bg-dark-900 rounded-2xl border border-dark-700 p-6 md:p-10 shadow-2xl relative">
      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-dark-800 hover:bg-dark-700 rounded-full transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      {booking.step < 5 && (
        <div className="flex items-center justify-between mb-8 border-b border-dark-700 pb-6 pr-8">
          <div className="flex items-center gap-2">
            {booking.step > 1 && (
              <button 
                onClick={handleBack} 
                className="text-gray-400 hover:text-white disabled:opacity-50"
                disabled={isSubmitting}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            <span className="text-gold-500 font-bold">Langkah {booking.step}/4</span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`h-1 w-8 rounded-full ${s <= booking.step ? 'bg-gold-500' : 'bg-dark-700'}`} />
            ))}
          </div>
        </div>
      )}

      <div className="min-h-[400px]">
        {booking.step === 1 && renderServiceStep()}
        {booking.step === 2 && renderBarberStep()}
        {booking.step === 3 && renderDateTimeStep()}
        {booking.step === 4 && renderInfoStep()}
        {booking.step === 5 && renderSuccessStep()}
      </div>

      {booking.step < 5 && (
        <div className="flex justify-end mt-8 pt-6 border-t border-dark-700">
          <Button
            onClick={handleNext}
            disabled={
              (booking.step === 1 && !booking.service) ||
              (booking.step === 2 && !booking.barber) ||
              (booking.step === 3 && (!booking.date || !booking.timeSlot)) ||
              (booking.step === 4 && (!booking.customerName || !booking.customerPhone)) ||
              isSubmitting
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                {booking.step === 4 ? 'Konfirmasi Booking' : 'Lanjut'}
                {booking.step !== 4 && <ChevronRight className="w-4 h-4" />}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};