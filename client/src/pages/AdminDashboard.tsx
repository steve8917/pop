import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../utils/api';
import { CheckCircle, XCircle, Clock, Trash2, FileDown } from 'lucide-react';

interface Availability {
  _id: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    gender: string;
  };
  shift: {
    day: string;
    location: string;
    startTime: string;
    endTime: string;
  };
  date: string;
  status: 'pending' | 'confirmed' | 'rejected';
}

interface ScheduleItem {
  _id: string;
  shift: {
    day: string;
    location: string;
    startTime: string;
    endTime: string;
  };
  date: string;
  assignedUsers: {
    user: {
      _id?: string;
      firstName: string;
      lastName: string;
      gender: string;
    } | string;
    gender: string;
  }[];
  isConfirmed: boolean;
}


const DAY_NAMES: { [key: string]: string } = {
  monday: 'Lunedì',
  thursday: 'Giovedì',
  friday: 'Venerdì',
  saturday: 'Sabato',
  sunday: 'Domenica'
};

const IT_MONTHS = [
  'Gennaio',
  'Febbraio',
  'Marzo',
  'Aprile',
  'Maggio',
  'Giugno',
  'Luglio',
  'Agosto',
  'Settembre',
  'Ottobre',
  'Novembre',
  'Dicembre'
];

const DAY_FILTERS: { value: 'all' | 'monday' | 'thursday' | 'friday' | 'saturday' | 'sunday'; label: string }[] = [
  { value: 'all', label: 'Tutti i giorni' },
  { value: 'monday', label: 'Lunedì' },
  { value: 'thursday', label: 'Giovedì' },
  { value: 'friday', label: 'Venerdì' },
  { value: 'saturday', label: 'Sabato' },
  { value: 'sunday', label: 'Domenica' }
];

const AdminDashboard = () => {
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed'>('pending');
  const [dayFilter, setDayFilter] = useState<'all' | 'monday' | 'thursday' | 'friday' | 'saturday' | 'sunday'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [pdfMonth, setPdfMonth] = useState(new Date().getMonth() + 1);
  const [pdfYear, setPdfYear] = useState(new Date().getFullYear());
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  useEffect(() => {
    fetchAvailabilities();
  }, [statusFilter, dayFilter]);


  const fetchAvailabilities = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      if (dayFilter !== 'all') {
        params.day = dayFilter;
      }

      const { data } = await api.get('/availability/all', { params });
      setAvailabilities(data.availabilities);
    } catch (error) {
      console.error('Error fetching availabilities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'confirmed' | 'rejected') => {
    try {
      await api.patch(`/availability/${id}/status`, { status });
      toast.success(`Disponibilità ${status === 'confirmed' ? 'confermata' : 'rifiutata'}!`);
      fetchAvailabilities();
    } catch (error) {
      toast.error('Errore durante l\'aggiornamento');
    }
  };

  const handleDeleteAvailability = async (id: string) => {
    const confirmed = window.confirm('Confermi di voler eliminare questo turno?');
    if (!confirmed) return;

    try {
      await api.delete(`/availability/${id}`);
      toast.success('Disponibilità eliminata');
      fetchAvailabilities();
    } catch (error) {
      toast.error('Errore durante l\'eliminazione');
    }
  };

  const formatScheduleDate = (dateString: string) => {
    const date = new Date(dateString);
    const dayName = date.toLocaleDateString('it-IT', { weekday: 'long' });
    const monthName = date.toLocaleDateString('it-IT', { month: 'long' });
    return `${dayName} ${date.getDate()} ${monthName}`.toLowerCase();
  };

  const getAssignedNames = (schedule: ScheduleItem) => {
    return schedule.assignedUsers
      .map((assignment) => {
        if (typeof assignment.user === 'string' || !assignment.user) {
          return 'Utente';
        }
        return `${assignment.user.firstName} ${assignment.user.lastName}`.trim();
      })
      .filter(Boolean);
  };

  const handleExportPdf = async () => {
    setIsPdfGenerating(true);
    try {
      const { data } = await api.get('/schedule/monthly', {
        params: { month: pdfMonth, year: pdfYear }
      });

      const schedules: ScheduleItem[] = (data.schedules || []).slice();
      schedules.sort((a, b) => {
        const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        return a.shift.startTime.localeCompare(b.shift.startTime);
      });

      const doc = new jsPDF('p', 'pt', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginX = 28;
      const headerHeight = 84;
      const tableTop = headerHeight + 22;
      const title = 'Testimonianza Pubblica - Firenze Statuto';
      const subtitle = `${IT_MONTHS[pdfMonth - 1]} ${pdfYear}`;
      const generatedAt = new Date().toLocaleDateString('it-IT');

      const drawHeader = () => {
        doc.setFillColor(38, 38, 46);
        doc.rect(0, 0, pageWidth, headerHeight, 'F');
        doc.setFillColor(125, 64, 204);
        doc.rect(0, headerHeight - 6, pageWidth, 6, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text(title, pageWidth / 2, 34, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.text(subtitle, pageWidth / 2, 54, { align: 'center' });
        doc.setTextColor(210, 210, 210);
        doc.setFontSize(9);
        doc.text(`Generato il ${generatedAt}`, pageWidth - marginX, 70, { align: 'right' });
      };

      const rows = schedules.map((schedule) => {
        const dateLabel = formatScheduleDate(schedule.date);
        const location = `${schedule.shift.location}\n${schedule.shift.startTime}–${schedule.shift.endTime}`;
        const names = getAssignedNames(schedule);
        return [dateLabel, location, names.join('\n') || ''];
      });

      autoTable(doc, {
        startY: tableTop,
        head: [['DATA', 'LUOGO E ORARIO', 'PROCLAMATORI']],
        body: rows,
        theme: 'striped',
        styles: {
          font: 'helvetica',
          fontSize: 10.5,
          textColor: [38, 38, 46],
          cellPadding: { top: 6, right: 8, bottom: 6, left: 8 },
          valign: 'middle',
          lineColor: [210, 210, 220],
          lineWidth: 0.5
        },
        headStyles: {
          fillColor: [58, 58, 70],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
          lineColor: [58, 58, 70],
          lineWidth: 0.8,
          minCellHeight: 26
        },
        bodyStyles: {
          fillColor: [255, 255, 255]
        },
        alternateRowStyles: {
          fillColor: [246, 246, 250]
        },
        columnStyles: {
          0: { cellWidth: 150 },
          1: { cellWidth: 240 },
          2: { cellWidth: 150 }
        },
        margin: { left: marginX, right: marginX, top: tableTop, bottom: 36 },
        didParseCell: (data) => {
          if (data.section === 'body') {
            if (data.column.index === 0) {
              data.cell.styles.halign = 'left';
              data.cell.styles.fontStyle = 'bold';
            }
            if (data.column.index === 1) {
              data.cell.styles.halign = 'center';
              data.cell.styles.fontStyle = 'normal';
              data.cell.text = [''];
            }
            if (data.column.index === 2) {
              data.cell.styles.halign = 'right';
              data.cell.styles.fontStyle = 'normal';
            }
          }
        },
        didDrawCell: (data) => {
          if (data.section === 'body' && data.column.index === 1) {
            const rawText = Array.isArray(data.cell.raw) ? data.cell.raw.join('\n') : String(data.cell.raw ?? '');
            const [line1, line2] = rawText.split('\n');
            const fontSize = data.cell.styles.fontSize || 10.5;
            const lineHeight = fontSize * 1.2;
            const textX = data.cell.x + data.cell.width / 2;
            const startY = data.cell.y + (data.cell.height - lineHeight * 2) / 2 + fontSize;
            doc.setTextColor(38, 38, 46);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(fontSize);
            doc.text(line1 || '', textX, startY, { align: 'center' });
            doc.setFont('helvetica', 'normal');
            doc.text(line2 || '', textX, startY + lineHeight, { align: 'center' });
          }
        },
        didDrawPage: () => {
          drawHeader();
          const pageNumber = doc.getNumberOfPages();
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(150, 150, 160);
          doc.text(`Pagina ${pageNumber}`, pageWidth - marginX, pageHeight - 16, { align: 'right' });
        },
        pageBreak: 'auto',
        rowPageBreak: 'auto'
      });

      doc.save(`programma-${pdfMonth}-${pdfYear}.pdf`);
      toast.success('PDF generato');
    } catch (error) {
      toast.error('Errore durante la generazione del PDF');
    } finally {
      setIsPdfGenerating(false);
    }
  };


  const pending = availabilities.filter(a => a.status === 'pending');
  const confirmed = availabilities.filter(a => a.status === 'confirmed');

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="page-title">Gestione Admin</h1>
            <p className="page-subtitle">Conferma le disponibilità dei proclamatori</p>
          </div>
          <Link
            to="/admin/users"
            className="px-4 py-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/15 transition-all"
          >
            Vai agli utenti
          </Link>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-yellow-400/10 border-yellow-400/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70">In Attesa</p>
              <p className="text-3xl font-bold text-yellow-200">{pending.length}</p>
            </div>
            <Clock className="w-12 h-12 text-yellow-200" />
          </div>
        </div>

        <div className="card bg-green-400/10 border-green-400/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70">Confermate</p>
              <p className="text-3xl font-bold text-green-200">{confirmed.length}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="card bg-purple-400/10 border-purple-400/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70">Totali</p>
              <p className="text-3xl font-bold text-purple-200">{availabilities.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              statusFilter === 'pending'
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-white/80 hover:bg-white/15'
            }`}
          >
            In Attesa
          </button>
          <button
            onClick={() => setStatusFilter('confirmed')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              statusFilter === 'confirmed'
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-white/80 hover:bg-white/15'
            }`}
          >
            Confermate
          </button>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              statusFilter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-white/80 hover:bg-white/15'
            }`}
          >
            Tutte
          </button>
          <div className="ml-auto flex items-center gap-2 w-full md:w-auto">
            <label className="text-white/80 text-sm">Giorno</label>
            <select
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value as typeof dayFilter)}
              className="bg-white/10 text-white px-3 py-2 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 w-full md:w-auto"
            >
              {DAY_FILTERS.map((day) => (
                <option key={day.value} value={day.value} className="text-black">
                  {day.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Availabilities List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-600"></div>
        </div>
      ) : availabilities.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-white/60">Nessuna disponibilità da mostrare</p>
        </div>
      ) : (
        <div className="space-y-4">
          {availabilities.map((availability) => {
            const date = new Date(availability.date);

            return (
              <motion.div
                key={availability._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="card"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-lg text-white">
                        {availability.user.firstName} {availability.user.lastName}
                      </span>
                      <span className="text-sm px-2 py-1 bg-purple-400/15 text-purple-200 border border-purple-400/20 rounded">
                        {availability.user.gender === 'male' ? 'Fratello' : 'Sorella'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm text-white/70">
                      <div>
                        <span className="font-medium text-white/80">Data:</span>{' '}
                        {date.toLocaleDateString('it-IT')}
                      </div>
                      <div>
                        <span className="font-medium text-white/80">Giorno:</span>{' '}
                        {DAY_NAMES[availability.shift.day]}
                      </div>
                      <div>
                        <span className="font-medium text-white/80">Luogo:</span> {availability.shift.location}
                      </div>
                      <div>
                        <span className="font-medium text-white/80">Orario:</span>{' '}
                        {availability.shift.startTime} - {availability.shift.endTime}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 w-full">
                    {availability.status === 'pending' ? (
                      <div className="flex flex-col sm:flex-row gap-2 w-full">
                        <button
                          onClick={() => handleUpdateStatus(availability._id, 'confirmed')}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors w-full sm:w-auto"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Conferma
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(availability._id, 'rejected')}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors w-full sm:w-auto"
                        >
                          <XCircle className="w-4 h-4" />
                          Rifiuta
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <span
                            className={`px-4 py-2 rounded-lg font-medium w-full sm:w-auto text-center ${
                              availability.status === 'confirmed'
                                ? 'bg-green-400/15 text-green-200 border border-green-400/20'
                                : 'bg-red-400/15 text-red-200 border border-red-400/20'
                            }`}
                          >
                            {availability.status === 'confirmed' ? 'Confermata' : 'Rifiutata'}
                          </span>

                          {availability.status === 'confirmed' && (
                            <button
                              onClick={() => handleDeleteAvailability(availability._id)}
                              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors w-full sm:w-auto"
                            >
                              <Trash2 className="w-4 h-4" />
                              Elimina turno
                            </button>
                          )}
                        </div>

                        {/* PDF Export */}
                        <div className="card space-y-3 sm:space-y-4 w-full p-4 sm:p-6">
                          <div>
                            <h2 className="text-base sm:text-lg font-semibold text-white">Esporta programma mensile</h2>
                            <p className="text-xs sm:text-sm text-white/60">
                              Genera il PDF anche se il programma è parziale.
                            </p>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <select
                              value={pdfMonth}
                              onChange={(e) => setPdfMonth(parseInt(e.target.value))}
                              className="input-field w-full sm:max-w-[180px]"
                            >
                              {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                  {IT_MONTHS[i]}
                                </option>
                              ))}
                            </select>
                            <select
                              value={pdfYear}
                              onChange={(e) => setPdfYear(parseInt(e.target.value))}
                              className="input-field w-full sm:max-w-[140px]"
                            >
                              <option value={2024}>2024</option>
                              <option value={2025}>2025</option>
                              <option value={2026}>2026</option>
                              <option value={2027}>2027</option>
                            </select>
                            <button
                              onClick={handleExportPdf}
                              disabled={isPdfGenerating}
                              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-60 w-full sm:w-auto"
                            >
                              <FileDown className="w-4 h-4" />
                              {isPdfGenerating ? 'Generazione in corso...' : 'Genera PDF'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
