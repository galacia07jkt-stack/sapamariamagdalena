import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';

interface DateInputFormattedProps {
  value: string; // format 'YYYY-MM-DD' or ''
  onChange: (value: string) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export const DateInputFormatted: React.FC<DateInputFormattedProps> = ({
  value,
  onChange,
  label,
  className = '',
  disabled = false,
  required = false,
}) => {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  const dayRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);
  const datePickerRef = useRef<HTMLInputElement>(null);
  const isInternalRef = useRef(false);

  // Parse date string (YYYY-MM-DD or DD/MM/YYYY)
  const parseDateValue = (val: string) => {
    if (!val) return { day: '', month: '', year: '' };
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      const [y, m, d] = val.split('-');
      return { day: d, month: m, year: y };
    }
    if (/^\d{2}[/-]\d{2}[/-]\d{4}$/.test(val)) {
      const parts = val.split(/[/-]/);
      return { day: parts[0], month: parts[1], year: parts[2] };
    }
    return { day: '', month: '', year: '' };
  };

  // Sync internal state when external `value` prop changes
  useEffect(() => {
    if (isInternalRef.current) {
      isInternalRef.current = false;
      return;
    }
    if (!value) {
      setDay('');
      setMonth('');
      setYear('');
      return;
    }
    const parts = parseDateValue(value);
    setDay(parts.day);
    setMonth(parts.month);
    setYear(parts.year);
  }, [value]);

  const emitChange = (d: string, m: string, y: string) => {
    isInternalRef.current = true;
    if (d && m && y && y.length === 4) {
      const paddedD = d.padStart(2, '0');
      const paddedM = m.padStart(2, '0');
      onChange(`${y}-${paddedM}-${paddedD}`);
    } else if (!d && !m && !y) {
      onChange('');
    } else {
      if (y.length === 4 && d.length >= 1 && m.length >= 1) {
        onChange(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
      } else {
        onChange('');
      }
    }
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 2) val = val.slice(0, 2);
    if (parseInt(val, 10) > 31) val = '31';
    setDay(val);
    emitChange(val, month, year);
    if (val.length === 2) {
      monthRef.current?.focus();
    }
  };

  const handleDayKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === '/' || e.key === 'Enter') {
      e.preventDefault();
      monthRef.current?.focus();
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 2) val = val.slice(0, 2);
    if (parseInt(val, 10) > 12) val = '12';
    setMonth(val);
    emitChange(day, val, year);
    if (val.length === 2) {
      yearRef.current?.focus();
    }
  };

  const handleMonthKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === '/' || e.key === 'Enter') {
      e.preventDefault();
      yearRef.current?.focus();
    } else if (e.key === 'Backspace' && !month) {
      dayRef.current?.focus();
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 4) val = val.slice(0, 4);
    setYear(val);
    emitChange(day, month, val);
  };

  const handleYearKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !year) {
      monthRef.current?.focus();
    }
  };

  const handleBlur = () => {
    let finalD = day;
    let finalM = month;
    if (finalD && finalD.length === 1 && parseInt(finalD, 10) > 0) {
      finalD = finalD.padStart(2, '0');
      setDay(finalD);
    }
    if (finalM && finalM.length === 1 && parseInt(finalM, 10) > 0) {
      finalM = finalM.padStart(2, '0');
      setMonth(finalM);
    }
    emitChange(finalD, finalM, year);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '');
    if (pasted.length >= 8) {
      const d = pasted.slice(0, 2);
      const m = pasted.slice(2, 4);
      const y = pasted.slice(4, 8);
      setDay(d);
      setMonth(m);
      setYear(y);
      emitChange(d, m, y);
      yearRef.current?.focus();
    }
  };

  const openPicker = () => {
    if (datePickerRef.current) {
      try {
        if ('showPicker' in datePickerRef.current) {
          (datePickerRef.current as any).showPicker();
        } else {
          datePickerRef.current.click();
        }
      } catch {
        datePickerRef.current.click();
      }
    }
  };

  const handleCalendarPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.value; // YYYY-MM-DD
    isInternalRef.current = false;
    if (selected) {
      const [y, m, d] = selected.split('-');
      setDay(d);
      setMonth(m);
      setYear(y);
      onChange(selected);
    } else {
      setDay('');
      setMonth('');
      setYear('');
      onChange('');
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="flex items-center px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-all shadow-2xs">
        {/* Day Input (DD) */}
        <input
          ref={dayRef}
          type="text"
          inputMode="numeric"
          maxLength={2}
          value={day}
          onChange={handleDayChange}
          onKeyDown={handleDayKeyDown}
          onBlur={handleBlur}
          onPaste={handlePaste}
          placeholder="DD"
          disabled={disabled}
          className="w-7 text-center text-xs font-bold text-slate-800 focus:outline-none placeholder-slate-400 bg-transparent"
        />

        {/* Permanent Slash 1 - cannot be deleted */}
        <span className="text-slate-400 font-black select-none mx-0.5 text-xs">/</span>

        {/* Month Input (MM) */}
        <input
          ref={monthRef}
          type="text"
          inputMode="numeric"
          maxLength={2}
          value={month}
          onChange={handleMonthChange}
          onKeyDown={handleMonthKeyDown}
          onBlur={handleBlur}
          onPaste={handlePaste}
          placeholder="MM"
          disabled={disabled}
          className="w-7 text-center text-xs font-bold text-slate-800 focus:outline-none placeholder-slate-400 bg-transparent"
        />

        {/* Permanent Slash 2 - cannot be deleted */}
        <span className="text-slate-400 font-black select-none mx-0.5 text-xs">/</span>

        {/* Year Input (YYYY) */}
        <input
          ref={yearRef}
          type="text"
          inputMode="numeric"
          maxLength={4}
          value={year}
          onChange={handleYearChange}
          onKeyDown={handleYearKeyDown}
          onBlur={handleBlur}
          onPaste={handlePaste}
          placeholder="YYYY"
          disabled={disabled}
          className="w-12 text-center text-xs font-bold text-slate-800 focus:outline-none placeholder-slate-400 bg-transparent"
        />

        {/* Calendar Icon Button Helper & Overlay Native Date Picker */}
        <div className="ml-auto flex items-center pl-1.5 border-l border-slate-200 relative">
          <button
            type="button"
            onClick={openPicker}
            disabled={disabled}
            title="Klik untuk memilih dari Kalender"
            className="p-1 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold shrink-0"
          >
            <Calendar className="w-4 h-4 text-orange-600 shrink-0" />
            <span className="hidden sm:inline text-[10px] text-orange-700 font-semibold">Kalender</span>
          </button>
          <input
            ref={datePickerRef}
            type="date"
            value={value || ''}
            onChange={handleCalendarPickerChange}
            onClick={(e) => {
              try {
                if ('showPicker' in e.currentTarget) {
                  e.currentTarget.showPicker();
                }
              } catch {}
            }}
            disabled={disabled}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 block"
            tabIndex={0}
            title="Klik untuk memilih tanggal dari kalender"
            aria-label="Pilih Tanggal"
          />
        </div>
      </div>
    </div>
  );
};
