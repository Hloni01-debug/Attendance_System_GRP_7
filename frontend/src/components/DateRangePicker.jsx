import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { formatDate } from '../utils/helpers';

export default function DateRangePicker({ onRangeChange, initialStartDate, initialEndDate, className = '' }) {
  const [startDate, setStartDate] = useState(initialStartDate || '');
  const [endDate, setEndDate] = useState(initialEndDate || '');
  const [showPicker, setShowPicker] = useState(false);
  const [tempStart, setTempStart] = useState('');
  const [tempEnd, setTempEnd] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleApply = () => {
    if (tempStart && tempEnd) {
      setStartDate(tempStart);
      setEndDate(tempEnd);
      onRangeChange(tempStart, tempEnd);
    }
    setShowPicker(false);
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    setTempStart('');
    setTempEnd('');
    onRangeChange('', '');
    setShowPicker(false);
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const isDateInRange = (year, month, day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (tempStart && tempEnd) {
      return dateStr >= tempStart && dateStr <= tempEnd;
    }
    return false;
  };

  const handleDateClick = (year, month, day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(dateStr);
      setTempEnd('');
    } else if (tempStart && !tempEnd) {
      if (dateStr >= tempStart) {
        setTempEnd(dateStr);
      } else {
        setTempEnd(tempStart);
        setTempStart(dateStr);
      }
    }
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Previous month days
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const isStart = tempStart === `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isEnd = tempEnd === `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const inRange = isDateInRange(year, month, day);
      
      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(year, month, day)}
          className={`
            h-10 w-10 rounded-lg text-sm transition-colors
            ${isStart || isEnd ? 'bg-blue-600 text-white' : ''}
            ${inRange && !isStart && !isEnd ? 'bg-blue-100' : ''}
            ${!isStart && !isEnd && !inRange ? 'hover:bg-gray-100' : ''}
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const quickRanges = [
    { label: 'Today', getValue: () => {
        const today = new Date();
        return { start: formatDateForInput(today), end: formatDateForInput(today) };
      }
    },
    { label: 'Yesterday', getValue: () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return { start: formatDateForInput(yesterday), end: formatDateForInput(yesterday) };
      }
    },
    { label: 'Last 7 Days', getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 7);
        return { start: formatDateForInput(start), end: formatDateForInput(end) };
      }
    },
    { label: 'Last 30 Days', getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        return { start: formatDateForInput(start), end: formatDateForInput(end) };
      }
    },
    { label: 'This Month', getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { start: formatDateForInput(start), end: formatDateForInput(end) };
      }
    },
    { label: 'Last Month', getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return { start: formatDateForInput(start), end: formatDateForInput(end) };
      }
    },
  ];

  const formatDateForInput = (date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <div ref={pickerRef} className={`relative ${className}`}>
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Calendar size={16} className="text-gray-500" />
        <span className="text-sm">
          {startDate && endDate ? `${startDate} to ${endDate}` : 'Select date range'}
        </span>
      </button>

      {showPicker && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 p-4 w-[600px]">
          <div className="flex gap-6">
            {/* Calendar */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="font-semibold">
                  {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
              
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} className="h-10 flex items-center justify-center text-xs font-semibold text-gray-500">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {renderCalendar()}
              </div>
            </div>

            {/* Quick ranges */}
            <div className="w-40 border-l pl-4">
              <div className="text-xs font-semibold text-gray-500 mb-2">Quick ranges</div>
              <div className="space-y-1">
                {quickRanges.map(range => (
                  <button
                    key={range.label}
                    onClick={() => {
                      const { start, end } = range.getValue();
                      setTempStart(start);
                      setTempEnd(end);
                      setStartDate(start);
                      setEndDate(end);
                      onRangeChange(start, end);
                      setShowPicker(false);
                    }}
                    className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded"
                  >
                    {range.label}
                  </button>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="text-xs font-semibold text-gray-500 mb-2">Selected</div>
                <div className="text-xs space-y-1">
                  <div>From: {tempStart || '-'}</div>
                  <div>To: {tempEnd || '-'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <button onClick={handleClear} className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">
              Clear
            </button>
            <button onClick={handleApply} className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}