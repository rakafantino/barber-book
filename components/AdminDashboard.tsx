import React, { useState, useEffect, useRef } from "react";
import { LayoutDashboard, Users, Scissors, LogOut, Trash2, Plus, Calendar, DollarSign, Clock, Star, Search, Loader2, AlertCircle, CalendarOff, Info } from "lucide-react";
import { storageService } from "../services/storageService";
import { BookingRecord, Service, Barber, BarberAvailability } from "../types";
import { Button } from "./Button";

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<"bookings" | "services" | "barbers" | "schedule">("bookings");
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Hack to reload data

  // Data States
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toLocaleDateString("en-CA"));
  const [filterBarberId, setFilterBarberId] = useState<string>("");
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);

  // Schedule Data
  const [selectedBarberForSchedule, setSelectedBarberForSchedule] = useState<string>("");
  const [availabilities, setAvailabilities] = useState<BarberAvailability[]>([]);

  // Form States (Simple version)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});

  // PIN Login State (Local to this component for simplicity)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [loginError, setLoginError] = useState("");

  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const bookingsDateRef = useRef<HTMLInputElement>(null);
  const scheduleDateRef = useRef<HTMLInputElement>(null);

  // --- DATA FETCHING ---
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Always fetch barbers to be used in multiple tabs
        const barberData = await storageService.getBarbers();
        setBarbers(barberData);

        if (activeTab === "bookings") {
          const data = await storageService.getBookings(selectedDate || undefined, filterBarberId || undefined);
          setBookings(data);
        } else if (activeTab === "services") {
          const data = await storageService.getServices();
          setServices(data);
        }
      } catch (error) {
        console.error("Error fetching admin data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [activeTab, refreshTrigger, isAuthenticated, selectedDate, filterBarberId]);

  // Fetch availability when selected barber changes in Schedule tab
  useEffect(() => {
    const fetchAvailability = async () => {
      if (activeTab === "schedule" && selectedBarberForSchedule) {
        setIsLoading(true);
        const data = await storageService.getBarberAvailability(selectedBarberForSchedule);
        setAvailabilities(data);
        setIsLoading(false);
      } else {
        setAvailabilities([]);
      }
    };
    fetchAvailability();
  }, [selectedBarberForSchedule, activeTab, refreshTrigger]);

  // --- HANDLERS ---

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === "1234") {
      setIsAuthenticated(true);
    } else {
      setLoginError("PIN Salah. Coba 1234.");
    }
  };

  const handleDeleteService = async (id: string) => {
    if (confirm("Hapus layanan ini?")) {
      await storageService.deleteService(id);
      setRefreshTrigger((prev) => prev + 1);
    }
  };

  const handleDeleteBarber = async (id: string) => {
    if (confirm("Hapus barber ini?")) {
      await storageService.deleteBarber(id);
      setRefreshTrigger((prev) => prev + 1);
    }
  };

  const handleDeleteAvailability = async (id: string) => {
    if (confirm("Hapus jadwal libur ini?")) {
      await storageService.deleteBarberAvailability(id);
      setRefreshTrigger((prev) => prev + 1);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    let success = false;

    if (activeTab === "services") {
      success = await storageService.addService({
        name: formData.name,
        price: parseInt(formData.price),
        durationMinutes: parseInt(formData.durationMinutes),
        description: formData.description,
      });
    } else if (activeTab === "barbers") {
      success = await storageService.addBarber({
        name: formData.name,
        specialty: formData.specialty,
        image: formData.image || "https://picsum.photos/200/200",
        experience: parseInt(formData.experience),
        rating: parseFloat(formData.rating),
      });
    } else if (activeTab === "schedule") {
      success = await storageService.addBarberAvailability(selectedBarberForSchedule, formData.date, formData.reason);
    }

    setIsLoading(false);
    if (success) {
      setIsAddModalOpen(false);
      setFormData({});
      setRefreshTrigger((prev) => prev + 1);
    } else {
      alert("Gagal menambah data.");
    }
  };

  // --- RENDER HELPERS ---

  const formatRupiah = (num: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900 text-white px-4">
        <div className="w-full max-w-sm bg-dark-800 border border-dark-700 p-8 rounded-2xl shadow-2xl">
          <div className="text-center mb-6">
            <Scissors className="w-12 h-12 text-gold-500 mx-auto mb-2" />
            <h1 className="text-2xl font-serif font-bold">Admin Login</h1>
            <p className="text-gray-500 text-sm">Restricted Access Area</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setLoginError("");
                }}
                className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-3 text-center text-2xl tracking-widest focus:border-gold-500 outline-none"
                placeholder="Enter PIN"
                autoFocus
              />
            </div>
            {loginError && <p className="text-red-500 text-center text-sm">{loginError}</p>}
            <Button type="submit" className="w-full">
              Masuk
            </Button>
            <button type="button" onClick={onLogout} className="w-full text-gray-500 text-sm hover:text-white mt-2">
              Kembali ke Home
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-dark-800 border-b border-dark-700 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-gold-500/20 p-2 rounded-lg">
            <LayoutDashboard className="text-gold-500 w-5 h-5" />
          </div>
          <h1 className="font-bold text-lg">
            GantengMaksimal <span className="text-gray-500 font-normal">| Admin</span>
          </h1>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors text-sm">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </header>

      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        {/* Sidebar Tabs */}
        <aside className="w-full md:w-64 bg-dark-800/50 border-r border-dark-700 flex-shrink-0">
          <nav className="p-4 space-y-2">
            <button
              onClick={() => setActiveTab("bookings")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "bookings" ? "bg-gold-500 text-dark-900 font-bold" : "text-gray-400 hover:bg-dark-700 hover:text-white"}`}
            >
              <Calendar className="w-5 h-5" /> Bookings
            </button>
            <button
              onClick={() => setActiveTab("services")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "services" ? "bg-gold-500 text-dark-900 font-bold" : "text-gray-400 hover:bg-dark-700 hover:text-white"}`}
            >
              <Scissors className="w-5 h-5" /> Services
            </button>
            <button
              onClick={() => setActiveTab("barbers")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "barbers" ? "bg-gold-500 text-dark-900 font-bold" : "text-gray-400 hover:bg-dark-700 hover:text-white"}`}
            >
              <Users className="w-5 h-5" /> Barbers
            </button>
            <button
              onClick={() => setActiveTab("schedule")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "schedule" ? "bg-gold-500 text-dark-900 font-bold" : "text-gray-400 hover:bg-dark-700 hover:text-white"}`}
            >
              <CalendarOff className="w-5 h-5" /> Schedule (Off)
            </button>
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-serif font-bold capitalize">{activeTab === "schedule" ? "Jadwal Libur" : activeTab + " Manager"}</h2>

            {activeTab !== "bookings" && (
              <Button
                onClick={() => {
                  setFormData({});
                  setIsAddModalOpen(true);
                }}
                variant="outline"
                className="text-sm py-2"
                disabled={activeTab === "schedule" && !selectedBarberForSchedule}
              >
                <Plus className="w-4 h-4 mr-2" /> Tambah {activeTab === "services" ? "Layanan" : activeTab === "barbers" ? "Barber" : "Libur"}
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
            </div>
          ) : (
            <>
              {/* --- BOOKINGS VIEW --- */}
              {activeTab === "bookings" && (
                <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden shadow-xl">
                  <div className="p-4 border-b border-dark-700 bg-dark-700/30 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input ref={bookingsDateRef} type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-dark-900 border border-dark-600 text-white rounded px-3 py-2 pr-10" />
                        <Calendar onClick={() => { const el = bookingsDateRef.current; if (el) { (el as any).showPicker ? (el as any).showPicker() : el.focus(); } }} className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-500 cursor-pointer" />
                      </div>
                      <select value={filterBarberId} onChange={(e) => setFilterBarberId(e.target.value)} className="bg-dark-900 border border-dark-600 text-white rounded px-3 py-2">
                        <option value="">Semua Barber</option>
                        {barbers.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedDate(new Date().toLocaleDateString("en-CA"));
                          setFilterBarberId("");
                        }}
                        className="px-3 py-2 text-sm bg-dark-700 text-white rounded hover:bg-dark-600"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-dark-700 text-gray-300">
                        <tr>
                          <th className="p-4">Date & Time</th>
                          <th className="p-4">Customer</th>
                          <th className="p-4">Service</th>
                          <th className="p-4">Barber</th>
                          <th className="p-4">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-700">
                        {bookings.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-gray-500">
                              Belum ada booking masuk.
                            </td>
                          </tr>
                        )}
                        {bookings.map((b) => (
                          <tr key={b.id} className="hover:bg-dark-700/50 transition-colors">
                            <td className="p-4">
                              <div className="font-bold text-white">{b.booking_date}</div>
                              <div className="text-gold-500">{b.time_slot}</div>
                            </td>
                            <td className="p-4">
                              <div className="font-medium text-white">{b.customer_name}</div>
                              <div className="text-xs text-gray-500">{b.customer_phone}</div>
                            </td>
                            <td className="p-4">
                              <div>{b.services?.name}</div>
                              <div className="text-xs text-gray-500">{formatRupiah(b.services?.price || 0)}</div>
                            </td>
                            <td className="p-4 text-gray-300">{b.barbers?.name}</td>
                            <td className="p-4 max-w-xs text-gray-400">
                              <div className="truncate" title={b.style_notes}>
                                {b.style_notes || "-"}
                              </div>
                              {b.style_notes && (
                                <button
                                  onClick={() => {
                                    setSelectedBooking(b);
                                    setIsDetailOpen(true);
                                  }}
                                  className="mt-2 text-xs text-gold-500 hover:text-gold-400"
                                >
                                  Lihat detail
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* --- SERVICES VIEW --- */}
              {activeTab === "services" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {services.map((s) => (
                    <div key={s.id} className="bg-dark-800 p-4 rounded-xl border border-dark-700 flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">{s.name}</h3>
                        <div className="text-gold-500 font-mono mb-1">{formatRupiah(s.price)}</div>
                        <p className="text-xs text-gray-400">{s.description}</p>
                        <div className="mt-2 text-xs bg-dark-700 inline-block px-2 py-1 rounded">{s.durationMinutes} min</div>
                      </div>
                      <button onClick={() => handleDeleteService(s.id)} className="text-gray-600 hover:text-red-500 p-2">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* --- BARBERS VIEW --- */}
              {activeTab === "barbers" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {barbers.map((b) => (
                    <div key={b.id} className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
                      <div className="h-40 bg-gray-700 relative">
                        <img src={b.image} className="w-full h-full object-cover" alt={b.name} />
                        <button onClick={() => handleDeleteBarber(b.id)} className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-lg">{b.name}</h3>
                        <p className="text-gold-500 text-sm mb-2">{b.specialty}</p>
                        <div className="flex justify-between text-xs text-gray-400 border-t border-dark-600 pt-2">
                          <span>Exp: {b.experience} thn</span>
                          <span className="flex items-center gap-1 text-yellow-400">
                            <Star className="w-3 h-3 fill-current" /> {b.rating}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* --- SCHEDULE VIEW --- */}
              {activeTab === "schedule" && (
                <div className="space-y-6">
                  {/* Barber Selector */}
                  <div className="bg-dark-800 p-4 rounded-xl border border-dark-700">
                    <label className="block text-sm text-gray-400 mb-2">Pilih Barber untuk Kelola Jadwal</label>
                    <div className="flex gap-4 overflow-x-auto pb-2">
                      {barbers.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => setSelectedBarberForSchedule(b.id)}
                          className={`flex-shrink-0 px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${
                            selectedBarberForSchedule === b.id ? "bg-gold-500 text-dark-900 border-gold-500 font-bold" : "bg-dark-700 text-gray-400 border-dark-600 hover:border-gray-500"
                          }`}
                        >
                          <img src={b.image} className="w-6 h-6 rounded-full object-cover" alt="" />
                          {b.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Availability List */}
                  {selectedBarberForSchedule ? (
                    <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden shadow-xl">
                      <div className="p-4 border-b border-dark-700 bg-dark-700/30 flex justify-between items-center">
                        <h3 className="font-bold text-white">Daftar Libur/Cuti</h3>
                      </div>
                      {availabilities.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          <CalendarOff className="w-10 h-10 mx-auto mb-2 opacity-50" />
                          Barber ini belum memiliki jadwal libur.
                        </div>
                      ) : (
                        <table className="w-full text-left text-sm">
                          <thead className="bg-dark-700 text-gray-300">
                            <tr>
                              <th className="p-4">Tanggal</th>
                              <th className="p-4">Alasan</th>
                              <th className="p-4 w-20">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-dark-700">
                            {availabilities.map((a) => (
                              <tr key={a.id} className="hover:bg-dark-700/50">
                                <td className="p-4 font-mono text-gold-500">{a.unavailable_date}</td>
                                <td className="p-4 text-white">{a.reason}</td>
                                <td className="p-4">
                                  <button onClick={() => handleDeleteAvailability(a.id)} className="text-gray-500 hover:text-red-500 transition-colors">
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  ) : (
                    <div className="p-10 text-center text-gray-500 bg-dark-800 rounded-xl border border-dark-700 border-dashed">Silahkan pilih barber di atas untuk melihat jadwalnya.</div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ADD MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dark-800 border border-dark-600 p-6 rounded-2xl w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-white">{activeTab === "schedule" ? "Tambah Hari Libur" : activeTab === "services" ? "Tambah Layanan" : "Tambah Barber"}</h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              {/* FORM SERVICES */}
              {activeTab === "services" && (
                <>
                  <div>
                    <label className="text-sm text-gray-400">Nama Layanan</label>
                    <input required className="w-full bg-dark-900 border border-dark-600 p-2 rounded text-white" onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400">Harga (Rp)</label>
                      <input type="number" required className="w-full bg-dark-900 border border-dark-600 p-2 rounded text-white" onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Durasi (Menit)</label>
                      <input type="number" required className="w-full bg-dark-900 border border-dark-600 p-2 rounded text-white" onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Deskripsi</label>
                    <textarea required className="w-full bg-dark-900 border border-dark-600 p-2 rounded text-white" onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                  </div>
                </>
              )}

              {/* FORM BARBERS */}
              {activeTab === "barbers" && (
                <>
                  <div>
                    <label className="text-sm text-gray-400">Nama</label>
                    <input required className="w-full bg-dark-900 border border-dark-600 p-2 rounded text-white" onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Spesialisasi</label>
                    <input required className="w-full bg-dark-900 border border-dark-600 p-2 rounded text-white" onChange={(e) => setFormData({ ...formData, specialty: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">URL Foto (Opsional)</label>
                    <input className="w-full bg-dark-900 border border-dark-600 p-2 rounded text-white" placeholder="https://..." onChange={(e) => setFormData({ ...formData, image: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400">Pengalaman (Thn)</label>
                      <input type="number" required className="w-full bg-dark-900 border border-dark-600 p-2 rounded text-white" onChange={(e) => setFormData({ ...formData, experience: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Rating Awal</label>
                      <input type="number" step="0.1" max="5" required className="w-full bg-dark-900 border border-dark-600 p-2 rounded text-white" onChange={(e) => setFormData({ ...formData, rating: e.target.value })} />
                    </div>
                  </div>
                </>
              )}

              {/* FORM SCHEDULE */}
              {activeTab === "schedule" && (
                <>
                  <div className="bg-dark-900/50 p-3 rounded border border-gold-500/30 mb-4 text-sm text-gray-400">
                    Menambahkan hari libur untuk: <span className="text-white font-bold">{barbers.find((b) => b.id === selectedBarberForSchedule)?.name}</span>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Tanggal Libur</label>
                    <div className="relative">
                      <input ref={scheduleDateRef} type="date" required className="w-full bg-dark-900 border border-dark-600 p-2 rounded text-white pr-10" onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                      <Calendar onClick={() => { const el = scheduleDateRef.current; if (el) { (el as any).showPicker ? (el as any).showPicker() : el.focus(); } }} className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-500 cursor-pointer" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Alasan</label>
                    <input required className="w-full bg-dark-900 border border-dark-600 p-2 rounded text-white" placeholder="Cuti / Sakit / Libur Rutin" onChange={(e) => setFormData({ ...formData, reason: e.target.value })} />
                  </div>
                </>
              )}

              <div className="flex gap-3 mt-6 pt-4 border-t border-dark-700">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsAddModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDetailOpen && selectedBooking && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dark-800 border border-dark-600 rounded-2xl w-full max-w-xl overflow-hidden">
            <div className="p-4 border-b border-dark-700 bg-dark-700/30 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Detail Booking</h3>
              <button
                onClick={() => {
                  setIsDetailOpen(false);
                  setSelectedBooking(null);
                }}
                className="text-gray-400 hover:text-white text-sm"
              >
                Tutup
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Tanggal</div>
                  <div className="font-mono text-gold-500">{selectedBooking.booking_date}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Waktu</div>
                  <div className="font-mono text-gold-500">{selectedBooking.time_slot}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Customer</div>
                  <div className="text-white font-medium">{selectedBooking.customer_name}</div>
                  <div className="text-xs text-gray-500">{selectedBooking.customer_phone}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Barber</div>
                  <div className="text-white">{selectedBooking.barbers?.name || "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Service</div>
                  <div className="text-white">{selectedBooking.services?.name || "-"}</div>
                  <div className="text-xs text-gray-500">{formatRupiah(selectedBooking.services?.price || 0)}</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Notes</div>
                <div className="mt-1 bg-dark-900 border border-dark-700 rounded p-3 text-gray-300 whitespace-pre-wrap">{selectedBooking.style_notes || "-"}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};