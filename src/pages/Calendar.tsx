import { useState } from 'react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isWeekend } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, User } from 'lucide-react';

export default function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 0, 1)); // Iniciamos en Enero 2026
  const holidays = useLiveQuery(() => db.holidays.toArray()) || [];

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <CalendarIcon className="text-accent" />
          <h2 style={{ textTransform: 'capitalize' }}>
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn" onClick={prevMonth}><ChevronLeft size={20} /></button>
          <button className="btn" onClick={nextMonth}><ChevronRight size={20} /></button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
          <div key={d} style={{ background: 'var(--bg)', padding: '0.75rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            {d}
          </div>
        ))}
        
        {/* Espaciado inicial si el mes no empieza en lunes */}
        {Array.from({ length: (days[0].getDay() + 6) % 7 }).map((_, i) => (
          <div key={`empty-${i}`} style={{ background: 'var(--card-bg)', minHeight: '100px' }}></div>
        ))}

        {days.map(day => {
          const holiday = holidays.find(h => isSameDay(new Date(h.fecha), day));
          const isOff = isWeekend(day) || holiday;

          return (
            <div 
              key={day.toString()} 
              style={{ 
                background: isOff ? 'var(--bg)' : 'var(--card-bg)', 
                minHeight: '120px', 
                padding: '0.5rem',
                border: '1px solid var(--border)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 600, color: isOff ? 'var(--error)' : 'inherit' }}>{format(day, 'd')}</span>
                {holiday && (
                  <span style={{ fontSize: '0.65rem', background: 'var(--error)', color: 'white', padding: '1px 4px', borderRadius: '4px' }}>
                    {holiday.nombre}
                  </span>
                )}
              </div>
              
              {/* Slot para Guardia (Simulado por ahora hasta asignar rotación) */}
              <div style={{ marginTop: '0.5rem' }}>
                {day.getDay() === 1 && ( // Ejemplo: Rotación semanal los lunes
                  <div style={{ fontSize: '0.7rem', background: 'var(--accent)', color: 'white', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <User size={10} /> Guardia: Oficial {1 + (day.getDate() % 3)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', gap: '2rem', fontSize: '0.875rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 12, height: 12, background: 'var(--error)', borderRadius: '3px' }}></div>
          <span>Festivo / Fin de Semana</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 12, height: 12, background: 'var(--accent)', borderRadius: '3px' }}></div>
          <span>Semana de Guardia</span>
        </div>
      </div>
    </div>
  );
}
