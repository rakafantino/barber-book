import { Barber, Service } from './types';

export const SERVICES: Service[] = [
  {
    id: 's1',
    name: 'Gentleman\'s Cut',
    price: 60000,
    durationMinutes: 45,
    description: 'Potong rambut presisi, keramas, dan styling pomade.'
  },
  {
    id: 's2',
    name: 'Beard Sculpting',
    price: 35000,
    durationMinutes: 30,
    description: 'Merapikan jenggot dan kumis dengan hot towel treatment.'
  },
  {
    id: 's3',
    name: 'Full Service Package',
    price: 90000,
    durationMinutes: 75,
    description: 'Paket lengkap potong rambut, cukur jenggot, dan pijat kepala relaksasi.'
  },
  {
    id: 's4',
    name: 'Hair Tattoo / Design',
    price: 80000,
    durationMinutes: 60,
    description: 'Desain artistik pada potongan rambut.'
  }
];

export const BARBERS: Barber[] = [
  {
    id: 'b1',
    name: 'Budi "The Blade"',
    specialty: 'Classic Fade',
    image: 'https://picsum.photos/200/200?random=1',
    experience: 8,
    rating: 4.9
  },
  {
    id: 'b2',
    name: 'Reza Styles',
    specialty: 'Modern Mullet & Crop',
    image: 'https://picsum.photos/200/200?random=2',
    experience: 5,
    rating: 4.7
  },
  {
    id: 'b3',
    name: 'Pak Harto',
    specialty: 'Traditional & Shaving',
    image: 'https://picsum.photos/200/200?random=3',
    experience: 15,
    rating: 5.0
  }
];

export const TIME_SLOTS = [
  "10:00", "11:00", "12:00", "13:00", "14:00", 
  "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
];
