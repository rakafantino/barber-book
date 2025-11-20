import React, { useState } from 'react';
import { Scissors, Lock } from 'lucide-react';
import { BookingFlow } from './components/BookingFlow';
import { AIStylist } from './components/AIStylist';
import { AdminDashboard } from './components/AdminDashboard';

const App: React.FC = () => {
  const [selectedStyleNote, setSelectedStyleNote] = useState<string>('');
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [view, setView] = useState<'client' | 'admin'>('client'); // New State for Routing

  const handleStyleSelect = (note: string) => {
    setSelectedStyleNote(note);
    setIsBookingOpen(true);
  };

  const openBookingManual = () => {
    setSelectedStyleNote(''); // Reset notes for manual booking
    setIsBookingOpen(true);
  };

  // Render Admin View
  if (view === 'admin') {
    return <AdminDashboard onLogout={() => setView('client')} />;
  }

  // Render Client View (Original App)
  return (
    <div className="min-h-screen bg-dark-900 text-gray-200 font-sans selection:bg-gold-500 selection:text-dark-900 flex flex-col overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-dark-900/95 backdrop-blur-md border-b border-dark-700 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gold-500 rounded-lg flex items-center justify-center rotate-3 transform hover:rotate-0 transition-all duration-300">
                <Scissors className="text-dark-900 w-6 h-6" />
              </div>
              <div>
                <span className="block text-xl font-serif font-bold text-white tracking-wide">GantengMaksimal</span>
                <span className="block text-xs text-gold-500 tracking-widest uppercase">Premium Barbershop</span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <span className="hidden md:block text-gray-400 text-sm">Buka: 10.00 - 21.00 WIB</span>
              <button 
                onClick={openBookingManual}
                className="px-3 py-1.5 text-sm md:px-4 md:py-2 md:text-base bg-gold-500 text-dark-900 font-bold rounded-lg hover:bg-gold-400 transition-all shadow-lg shadow-gold-500/20"
              >
                Booking Sekarang
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Wrapper */}
      <div className="flex-grow pt-24 pb-12 px-4 md:pt-32 flex flex-col justify-center min-h-screen relative">
        
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gold-500/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative max-w-4xl mx-auto text-center mb-8 md:mb-12 z-10">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-4 md:mb-6 leading-tight">
            Waktunya Tampil <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-600">Berbeda</span>
          </h1>
          <p className="text-base md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed px-2">
            Nikmati pengalaman potong rambut premium dengan barber terbaik di kota. Konsultasikan gayamu dengan AI kami atau langsung booking jadwalmu.
          </p>
        </div>

        {/* AI Section */}
        <div className="max-w-3xl mx-auto w-full z-10">
          <AIStylist onSelectStyle={handleStyleSelect} />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-dark-800 border-t border-dark-700 py-8 mt-auto relative z-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Scissors className="text-gold-500 w-5 h-5" />
            <span className="font-serif font-bold text-white">GantengMaksimal</span>
          </div>
          <p className="text-gray-500 text-sm">
            © 2024 GantengMaksimal Barbershop. All rights reserved.
          </p>
          
          {/* Secret Admin Button */}
          <div className="mt-6 opacity-30 hover:opacity-100 transition-opacity">
            <button 
              onClick={() => setView('admin')}
              className="text-xs text-gray-600 hover:text-gold-500 flex items-center justify-center gap-1 mx-auto"
            >
              <Lock className="w-3 h-3" /> Admin Login
            </button>
          </div>
        </div>
      </footer>

      {/* Booking Modal Overlay */}
      {isBookingOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-4xl my-auto">
            <BookingFlow 
              initialNote={selectedStyleNote} 
              onClose={() => setIsBookingOpen(false)} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;