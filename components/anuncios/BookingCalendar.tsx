"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BookingCalendarProps {
  occupiedDates: { start: Date; end: Date }[];
  onDateChange?: (start: Date | null, end: Date | null) => void;
}

export default function BookingCalendar({ occupiedDates, onDateChange }: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const isDateOccupied = (date: Date) => {
    return occupiedDates.some(range => {
      const start = new Date(range.start);
      const end = new Date(range.end);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
    });
  };

  const isSelected = (date: Date) => {
    if (!startDate) return false;
    if (startDate && !endDate) return date.getTime() === startDate.getTime();
    return date >= startDate && date <= endDate!;
  };

  const handleDateClick = (day: number) => {
    const selected = new Date(year, month, day);
    if (isDateOccupied(selected)) return;

    if (!startDate || (startDate && endDate)) {
      setStartDate(selected);
      setEndDate(null);
      onDateChange?.(selected, null);
    } else if (startDate && !endDate) {
      if (selected < startDate) {
        setStartDate(selected);
        setEndDate(null);
        onDateChange?.(selected, null);
      } else {
        setEndDate(selected);
        onDateChange?.(startDate, selected);
      }
    }
  };

  const calendarDays = useMemo(() => {
    const days = [];
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);

    // Padding for first week
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= totalDays; i++) {
      days.push(i);
    }

    return days;
  }, [year, month]);

  return (
    <div className="w-full bg-bg-secondary border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-bold text-white flex items-center gap-3">
          <CalendarIcon className="text-gold w-5 h-5" />
          {monthNames[month]} {year}
        </h3>
        <div className="flex gap-2">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-colors">
            <ChevronLeft size={20} />
          </button>
          <button onClick={handleNextMonth} className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(day => (
          <div key={day} className="text-[10px] font-black uppercase tracking-widest text-gray-600 text-center py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          
          const date = new Date(year, month, day);
          const occupied = isDateOccupied(date);
          const selected = isSelected(date);
          const isStart = startDate && date.getTime() === startDate.getTime();
          const isEnd = endDate && date.getTime() === endDate.getTime();
          const isToday = new Date().toDateString() === date.toDateString();

          return (
            <button
              key={day}
              disabled={occupied}
              onClick={() => handleDateClick(day)}
              className={`
                relative h-12 md:h-14 flex items-center justify-center text-sm font-bold rounded-xl transition-all duration-300
                ${occupied ? 'text-gray-700 cursor-not-allowed opacity-30' : 'text-gray-400 hover:bg-white/5'}
                ${selected && !occupied ? 'bg-gold/10 text-gold' : ''}
                ${isStart || isEnd ? 'bg-gold !text-black shadow-lg shadow-gold/20 scale-105 z-10' : ''}
                ${isToday && !selected ? 'border border-gold/30 text-gold' : ''}
              `}
            >
              {day}
              {occupied && (
                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                  <div className="w-full h-[1px] bg-gray-500 rotate-45" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-8 pt-8 border-t border-white/5 flex flex-wrap gap-6">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
          <div className="w-3 h-3 rounded-sm bg-gold" /> Seleccionado
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
          <div className="w-3 h-3 rounded-sm bg-gray-800 relative overflow-hidden">
             <div className="absolute inset-0 w-full h-[1px] bg-gray-500 rotate-45 top-1/2" />
          </div> Ocupado
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
          <div className="w-3 h-3 rounded-sm border border-gold/30" /> Hoy
        </div>
      </div>

      <AnimatePresence>
        {startDate && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-4 bg-gold/5 border border-gold/20 rounded-2xl flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gold/10 rounded-xl">
                <Info size={18} className="text-gold" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gold/60">Fechas Seleccionadas</p>
                <p className="text-white font-bold text-sm">
                  {startDate.toLocaleDateString()} {endDate ? `— ${endDate.toLocaleDateString()}` : '(Selecciona fecha final)'}
                </p>
              </div>
            </div>
            {endDate && (
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-gold/60">Total Estimado</p>
                <p className="text-white font-mono font-black text-lg tracking-tighter">
                  Procesando...
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
// creado por Patodev y Invertilo
