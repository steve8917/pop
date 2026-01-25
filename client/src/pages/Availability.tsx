import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { createPortal } from 'react-dom';

const SHIFTS = [
  { day: 'monday', location: 'Careggi', startTime: '09:30', endTime: '11:30' },
  { day: 'thursday', location: 'Piazza Dalmazia', startTime: '10:00', endTime: '12:00' },
  { day: 'friday', location: 'Social Hub Belfiore', startTime: '15:30', endTime: '17:30' },
  { day: 'saturday', location: 'Piazza Dalmazia', startTime: '09:00', endTime: '11:00' },
  { day: 'saturday', location: 'Piazza Dalmazia', startTime: '11:00', endTime: '13:00' },
  { day: 'sunday', location: 'Piazza SS. Annunziata', startTime: '15:30', endTime: '17:30' }
];

const DAY_NAMES: { [key: string]: string } = {
  monday: 'Lunedì',
  thursday: 'Giovedì',
  friday: 'Venerdì',
  saturday: 'Sabato',
  sunday: 'Domenica'
};

const formatLocalDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const Availability = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedAvailabilities, setSelectedAvailabilities] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  const getDatesForMonth = () => {
    const dates: { date: Date; shift: typeof SHIFTS[0] }[] = [];
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

    const dayMapping: { [key: number]: string } = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday'
    };

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedYear, selectedMonth, day);
      const dayName = dayMapping[date.getDay()];

      SHIFTS.filter(shift => shift.day === dayName).forEach(shift => {
        dates.push({ date, shift });
      });
    }

    return dates;
  };

  const dates = getDatesForMonth();

  const toggleAvailability = (dateStr: string, shift: typeof SHIFTS[0]) => {
    const key = `${dateStr}|${shift.location}|${shift.startTime}`;
    const newSelected = new Set(selectedAvailabilities);

    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }

    setSelectedAvailabilities(newSelected);
  };

  const handleSubmit = async () => {
    if (selectedAvailabilities.size === 0) {
      toast.error('Seleziona almeno una disponibilità');
      return;
    }

    setIsLoading(true);

    try {
      const availabilities = Array.from(selectedAvailabilities).map(key => {
        const [dateStr, location, startTime] = key.split('|');

        const shift = SHIFTS.find(s => s.location === location && s.startTime === startTime);

        if (!shift) {
          console.error('Shift non trovato:', { location, startTime, key });
          throw new Error('Errore: turno non trovato');
        }

        return {
          date: dateStr,
          shift: {
            day: shift.day,
            location: shift.location,
            startTime: shift.startTime,
            endTime: shift.endTime
          }
        };
      });

      console.log('Invio disponibilità:', availabilities);
      await api.post('/availability', { availabilities });
      toast.success('Disponibilità inviate con successo!');
      setSelectedAvailabilities(new Set());
    } catch (error: any) {
      console.error('Errore invio disponibilità:', error);
      toast.error(error.message || 'Errore durante l\'invio');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-28">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="page-title">Dai la tua Disponibilità</h1>
        <p className="page-subtitle">Seleziona i turni per cui sei disponibile</p>
      </motion.div>

      {/* Month Selector */}
      <div className="card">
        <div className="flex gap-4">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="input-field"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>
                {new Date(2024, i).toLocaleString('it-IT', { month: 'long' })}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="input-field"
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
        </div>
      </div>

      {selectedAvailabilities.size > 0 && portalTarget &&
        createPortal(
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed left-0 right-0 bottom-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+12px)]"
          >
            <div className="mx-auto max-w-4xl">
              <div className="bg-black/60 border border-white/10 backdrop-blur-md rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl">
                <div className="text-white/80 text-sm">
                  Selezionate: <span className="text-white font-semibold">{selectedAvailabilities.size}</span>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="btn-primary w-full sm:w-auto px-6 py-3 text-base"
                >
                  {isLoading ? 'Invio...' : 'Invia disponibilità'}
                </button>
              </div>
            </div>
          </motion.div>,
          portalTarget
        )
      }

      {/* Shifts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dates.map(({ date, shift }, index) => {
          const dateStr = formatLocalDate(date);
          const key = `${dateStr}|${shift.location}|${shift.startTime}`;
          const isSelected = selectedAvailabilities.has(key);

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02 }}
              onClick={() => toggleAvailability(dateStr, shift)}
              className={`card cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'ring-2 ring-purple-400/70 bg-purple-500/10'
                  : 'hover:shadow-xl hover:-translate-y-1'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-purple-300" />
                  <span className="font-semibold text-white">
                    {date.getDate()} {date.toLocaleString('it-IT', { month: 'short' })}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-white/80">
                  <span className="font-medium text-white">{DAY_NAMES[shift.day]}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-white/70">
                  <MapPin className="w-4 h-4 text-white/60" />
                  <span>{shift.location}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-white/70">
                  <Clock className="w-4 h-4 text-white/60" />
                  <span>
                    {shift.startTime} - {shift.endTime}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Submit Button */}
    </div>
  );
};

export default Availability;
