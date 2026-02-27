import React, { useEffect, useState, useCallback, useRef } from 'react';
import { getAssignments, getHolidays, reassignParty, dragAllFromDate, markCompleted, swapAssignments } from '../api';
import { useApp } from '../context/AppContext';
import {
  format, parseISO, isToday, isSaturday, isSunday,
  startOfMonth, endOfMonth, eachDayOfInterval,
  addMonths, subMonths, getDay
} from 'date-fns';
import toast from 'react-hot-toast';
import { fireSmallConfetti } from '../utils/confetti';

const CalendarPage = () => {
  const [assignments, setAssignments] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [draggedAssignment, setDraggedAssignment] = useState(null);
  const [showDragAllModal, setShowDragAllModal] = useState(false);
  const [dragAllFromDateVal, setDragAllFromDateVal] = useState('');
  const [dragAllToDateVal, setDragAllToDateVal] = useState('');
  const [view, setView] = useState('calendar');
  const [dragOverId, setDragOverId] = useState(null);
  const [hoveredZone, setHoveredZone] = useState(null); // 'prev' | 'next' | null
  const { isAdmin } = useApp();

  // Refs for auto-month-flip logic
  const monthFlipTimer = useRef(null);
  const isDraggingRef = useRef(false);
  const currentMonthRef = useRef(currentMonth);
  currentMonthRef.current = currentMonth;

  const fetchData = useCallback(async () => {
    try {
      const [assignRes, holidayRes] = await Promise.all([getAssignments(), getHolidays()]);
      setAssignments(Array.isArray(assignRes.data) ? assignRes.data : []);
      setHolidays(Array.isArray(holidayRes.data) ? holidayRes.data.map(h => h.holidayDate) : []);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Clear flip timer when drag ends
  const clearFlipTimer = () => {
    if (monthFlipTimer.current) {
      clearTimeout(monthFlipTimer.current);
      monthFlipTimer.current = null;
    }
  };

  const getAssignmentForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return assignments.find(a => a.partyDate === dateStr);
  };

  const isHoliday = (date) => holidays.includes(format(date, 'yyyy-MM-dd'));

  // ── Edge zone hover handlers (trigger month flip while dragging) ──
  const handleZoneDragEnter = (direction) => {
    if (!isDraggingRef.current) return;
    setHoveredZone(direction);
    clearFlipTimer();
    // Flip after 800ms of hovering on the edge
    monthFlipTimer.current = setTimeout(() => {
      setCurrentMonth(m => direction === 'prev' ? subMonths(m, 1) : addMonths(m, 1));
      setHoveredZone(null);
    }, 800);
  };

  const handleZoneDragLeave = () => {
    clearFlipTimer();
    setHoveredZone(null);
  };

  // ── Calendar drag handlers ──
  const handleCalendarDragStart = (assignment, e) => {
    if (!isAdmin) return;
    e.dataTransfer.effectAllowed = 'move';
    setDraggedAssignment(assignment);
    isDraggingRef.current = true;
  };

  const handleCalendarDragEnd = () => {
    isDraggingRef.current = false;
    clearFlipTimer();
    setHoveredZone(null);
    setDraggedAssignment(null);
  };

  const handleCalendarDrop = async (targetDate, e) => {
    e.preventDefault();
    clearFlipTimer();
    setHoveredZone(null);
    if (!draggedAssignment || !isAdmin) return;
    const saved = draggedAssignment;
    setDraggedAssignment(null);
    isDraggingRef.current = false;
    await doReassign(saved, format(targetDate, 'yyyy-MM-dd'), targetDate);
  };

  // ── List drag handlers ──
  const handleListDragStart = (assignment, e) => {
    if (!isAdmin) return;
    e.dataTransfer.effectAllowed = 'move';
    setDraggedAssignment(assignment);
    isDraggingRef.current = true;
  };

  const handleListDrop = async (targetAssignment, e) => {
    e.preventDefault();
    setDragOverId(null);
    isDraggingRef.current = false;
    if (!draggedAssignment || !isAdmin) return;
    if (draggedAssignment.id === targetAssignment.id) { setDraggedAssignment(null); return; }
    const saved = draggedAssignment;
    setDraggedAssignment(null);
    try {
      await swapAssignments({ assignmentId1: saved.id, assignmentId2: targetAssignment.id });
      toast.success(`Swapped ${saved.userName} ↔ ${targetAssignment.userName} 🔄`);
      fetchData();
    } catch {
      toast.error('Swap failed');
    }
  };

  const doReassign = async (assignment, dateStr, dateObj) => {
    if (isSaturday(dateObj) || isSunday(dateObj) || isHoliday(dateObj)) {
      toast.error("Can't assign to weekends or holidays!");
      return;
    }
    const existing = assignments.find(a => a.partyDate === dateStr);
    if (existing && existing.id !== assignment.id) {
      try {
        await swapAssignments({ assignmentId1: assignment.id, assignmentId2: existing.id });
        toast.success(`Swapped ${assignment.userName} ↔ ${existing.userName} 🔄`);
        fetchData();
      } catch { toast.error('Swap failed'); }
    } else {
      try {
        await reassignParty({ assignmentId: assignment.id, newDate: dateStr });
        toast.success(`Moved ${assignment.userName} to ${format(dateObj, 'MMM d')} ✅`);
        fetchData();
      } catch { toast.error('Reassignment failed'); }
    }
  };

  const handleDragAllSubmit = async () => {
    if (!dragAllFromDateVal || !dragAllToDateVal) { toast.error('Please select both dates'); return; }
    try {
      await dragAllFromDate({ fromDate: dragAllFromDateVal, toDate: dragAllToDateVal });
      toast.success('All assignments moved! 📅');
      setShowDragAllModal(false);
      fetchData();
    } catch { toast.error('Failed to move assignments'); }
  };

  const handleMarkComplete = async (assignment) => {
    if (!isAdmin) return;
    try {
      await markCompleted(assignment.id);
      toast.success(`${assignment.userName}'s party marked complete! 🎉`);
      fireSmallConfetti();
      fetchData();
    } catch { toast.error('Failed to update'); }
  };

  // ── Calendar grid ──
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);
  const calendarDays = [...Array(startPad).fill(null), ...daysInMonth];

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div style={{ fontSize: '4rem', animation: 'spin 1s linear infinite' }}>🎊</div>
    </div>
  );

  // Shared edge zone style
  const edgeZoneStyle = (direction) => ({
    position: 'absolute',
    top: 0,
    bottom: 0,
    [direction === 'prev' ? 'left' : 'right']: 0,
    width: '80px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: '4px',
    zIndex: 20,
    borderRadius: direction === 'prev' ? '16px 0 0 16px' : '0 16px 16px 0',
    background: hoveredZone === direction
      ? 'rgba(255,107,107,0.25)'
      : draggedAssignment
        ? 'rgba(255,107,107,0.08)'
        : 'transparent',
    border: hoveredZone === direction ? '2px dashed var(--primary)' : '2px dashed transparent',
    transition: 'all 0.2s',
    cursor: 'grab',
    pointerEvents: draggedAssignment ? 'all' : 'none',
  });

  return (
    <div className="page" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '4px' }}>📅 Party Calendar</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            {isAdmin
              ? 'Drag to a date to reassign. Hover left/right edges while dragging to switch months.'
              : 'View the party schedule'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '4px', gap: '4px' }}>
            <button
              className={`btn ${view === 'calendar' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '7px 14px', fontSize: '13px' }}
              onClick={() => setView('calendar')}
            >📅 Calendar</button>
            <button
              className={`btn ${view === 'list' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '7px 14px', fontSize: '13px' }}
              onClick={() => setView('list')}
            >📋 List</button>
          </div>
          {isAdmin && (
            <button className="btn btn-yellow" onClick={() => setShowDragAllModal(true)}>
              📦 Drag All From Date
            </button>
          )}
        </div>
      </div>

      {/* ── CALENDAR VIEW ── */}
      {view === 'calendar' && (
        <>
          {/* Month navigation — also acts as drop zones when dragging */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', justifyContent: 'center' }}>

            {/* Prev button — lights up when dragging */}
            <button
              className="btn btn-ghost"
              style={{
                padding: '10px 18px',
                fontSize: '18px',
                background: hoveredZone === 'prev' ? 'rgba(255,107,107,0.3)' : undefined,
                border: hoveredZone === 'prev' ? '2px solid var(--primary)' : undefined,
                transform: hoveredZone === 'prev' ? 'scale(1.15)' : 'scale(1)',
                transition: 'all 0.2s',
              }}
              onClick={() => setCurrentMonth(m => subMonths(m, 1))}
              onDragEnter={() => handleZoneDragEnter('prev')}
              onDragOver={e => { e.preventDefault(); }}
              onDragLeave={handleZoneDragLeave}
              onDrop={e => { e.preventDefault(); setCurrentMonth(m => subMonths(m, 1)); setHoveredZone(null); clearFlipTimer(); }}
            >
              {hoveredZone === 'prev' ? '⏪' : '←'} Prev
              {hoveredZone === 'prev' && (
                <div style={{ fontSize: '11px', color: 'var(--primary)', display: 'block', marginTop: '2px' }}>
                  releasing...
                </div>
              )}
            </button>

            <h2 style={{ fontSize: '1.5rem', minWidth: '220px', textAlign: 'center' }}>
              {format(currentMonth, 'MMMM yyyy')}
              {draggedAssignment && (
                <div style={{ fontSize: '12px', color: 'var(--primary)', marginTop: '4px', animation: 'pulse 1s ease-in-out infinite' }}>
                  ← hover arrows to switch month →
                </div>
              )}
            </h2>

            {/* Next button — lights up when dragging */}
            <button
              className="btn btn-ghost"
              style={{
                padding: '10px 18px',
                fontSize: '18px',
                background: hoveredZone === 'next' ? 'rgba(255,107,107,0.3)' : undefined,
                border: hoveredZone === 'next' ? '2px solid var(--primary)' : undefined,
                transform: hoveredZone === 'next' ? 'scale(1.15)' : 'scale(1)',
                transition: 'all 0.2s',
              }}
              onClick={() => setCurrentMonth(m => addMonths(m, 1))}
              onDragEnter={() => handleZoneDragEnter('next')}
              onDragOver={e => { e.preventDefault(); }}
              onDragLeave={handleZoneDragLeave}
              onDrop={e => { e.preventDefault(); setCurrentMonth(m => addMonths(m, 1)); setHoveredZone(null); clearFlipTimer(); }}
            >
              Next {hoveredZone === 'next' ? '⏩' : '→'}
              {hoveredZone === 'next' && (
                <div style={{ fontSize: '11px', color: 'var(--primary)', display: 'block', marginTop: '2px' }}>
                  releasing...
                </div>
              )}
            </button>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap', fontSize: '13px' }}>
            {[
              { color: 'rgba(255,107,107,0.4)', label: '🎉 Party Day' },
              { color: 'rgba(107,203,119,0.4)', label: '✅ Completed' },
              { color: 'var(--purple)', label: '📌 Today' },
              { color: 'rgba(77,150,255,0.3)', label: '🏖️ Holiday' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: l.color }} />
                <span style={{ color: 'var(--text-muted)' }}>{l.label}</span>
              </div>
            ))}
          </div>

          {/* Calendar grid — wrapped in relative container for edge zones */}
          <div style={{ position: 'relative' }}>

            {/* LEFT edge drop zone */}
            {isAdmin && (
              <div
                style={edgeZoneStyle('prev')}
                onDragEnter={() => handleZoneDragEnter('prev')}
                onDragOver={e => e.preventDefault()}
                onDragLeave={handleZoneDragLeave}
                onDrop={e => { e.preventDefault(); setCurrentMonth(m => subMonths(m, 1)); setHoveredZone(null); clearFlipTimer(); }}
              >
                {draggedAssignment && (
                  <>
                    <span style={{ fontSize: '1.6rem' }}>◀</span>
                    <span style={{ fontSize: '11px', color: hoveredZone === 'prev' ? 'var(--primary)' : 'var(--text-muted)', textAlign: 'center', fontWeight: 700 }}>
                      {hoveredZone === 'prev' ? 'Switching...' : 'Prev\nMonth'}
                    </span>
                  </>
                )}
              </div>
            )}

            {/* RIGHT edge drop zone */}
            {isAdmin && (
              <div
                style={edgeZoneStyle('next')}
                onDragEnter={() => handleZoneDragEnter('next')}
                onDragOver={e => e.preventDefault()}
                onDragLeave={handleZoneDragLeave}
                onDrop={e => { e.preventDefault(); setCurrentMonth(m => addMonths(m, 1)); setHoveredZone(null); clearFlipTimer(); }}
              >
                {draggedAssignment && (
                  <>
                    <span style={{ fontSize: '1.6rem' }}>▶</span>
                    <span style={{ fontSize: '11px', color: hoveredZone === 'next' ? 'var(--primary)' : 'var(--text-muted)', textAlign: 'center', fontWeight: 700 }}>
                      {hoveredZone === 'next' ? 'Switching...' : 'Next\nMonth'}
                    </span>
                  </>
                )}
              </div>
            )}

            <div className="card" style={{ padding: '16px' }}>
              {/* Day headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} style={{ textAlign: 'center', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', padding: '8px' }}>
                    {day}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                {calendarDays.map((day, idx) => {
                  if (!day) return <div key={`empty-${idx}`} />;
                  const weekend = isSaturday(day) || isSunday(day);
                  const holiday = isHoliday(day);
                  const today = isToday(day);
                  const assignment = getAssignmentForDate(day);
                  const notAssignable = weekend || holiday;
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const isDragTarget = draggedAssignment && !notAssignable;

                  let bg = 'rgba(255,255,255,0.02)';
                  let border = '1px solid rgba(255,255,255,0.05)';
                  if (today) { bg = 'rgba(132,94,194,0.15)'; border = '1px solid var(--purple)'; }
                  if (holiday) { bg = 'rgba(77,150,255,0.08)'; border = '1px dashed rgba(77,150,255,0.3)'; }
                  if (assignment && !assignment.completed) { bg = 'rgba(255,107,107,0.12)'; border = '1px solid rgba(255,107,107,0.4)'; }
                  if (assignment?.completed) { bg = 'rgba(107,203,119,0.12)'; border = '1px solid rgba(107,203,119,0.4)'; }

                  return (
                    <div
                      key={dateStr}
                      style={{
                        background: bg,
                        border,
                        borderRadius: '10px',
                        padding: '8px',
                        minHeight: '80px',
                        position: 'relative',
                        opacity: weekend && !assignment ? 0.4 : 1,
                        transition: 'all 0.15s',
                        outline: isDragTarget ? '1px dashed rgba(255,107,107,0.2)' : 'none',
                      }}
                      onDragOver={e => { if (!notAssignable) e.preventDefault(); }}
                      onDrop={e => { if (!notAssignable) handleCalendarDrop(day, e); }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: today ? 800 : 600, color: today ? 'var(--purple)' : 'var(--text-muted)', marginBottom: '4px' }}>
                        {format(day, 'd')}
                      </div>
                      {holiday && <div style={{ fontSize: '10px', color: 'var(--blue)', fontWeight: 700 }}>🏖️ Holiday</div>}
                      {assignment && (
                        <div
                          draggable={isAdmin && !assignment.completed}
                          onDragStart={e => handleCalendarDragStart(assignment, e)}
                          onDragEnd={handleCalendarDragEnd}
                          style={{
                            background: assignment.completed ? 'rgba(107,203,119,0.2)' : 'rgba(255,107,107,0.2)',
                            border: `1px solid ${assignment.completed ? 'rgba(107,203,119,0.5)' : 'rgba(255,107,107,0.5)'}`,
                            borderRadius: '6px', padding: '4px 6px', fontSize: '11px', fontWeight: 700,
                            color: assignment.completed ? 'var(--accent)' : 'var(--primary)',
                            cursor: isAdmin && !assignment.completed ? 'grab' : 'default',
                            display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px',
                            userSelect: 'none',
                          }}
                        >
                          {assignment.completed ? '✅' : '🎉'} {assignment.userName}
                        </div>
                      )}
                      {isAdmin && assignment && !assignment.completed && isToday(day) && (
                        <button className="btn btn-success" style={{ padding: '2px 6px', fontSize: '10px', marginTop: '2px' }} onClick={() => handleMarkComplete(assignment)}>
                          Done!
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── LIST VIEW ── */}
      {view === 'list' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3>📋 Full Schedule — {assignments.length} parties</h3>
            {isAdmin && <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>↕ Drag rows to swap across any date</p>}
          </div>
          {assignments.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '48px' }}>No active cycle. Ask admin to start one!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {assignments.map(a => {
                const dateObj = parseISO(a.partyDate);
                const today = isToday(dateObj);
                const isDragOver = dragOverId === a.id;
                return (
                  <div
                    key={a.id}
                    draggable={isAdmin && !a.completed}
                    onDragStart={e => handleListDragStart(a, e)}
                    onDragEnd={() => { isDraggingRef.current = false; setDragOverId(null); }}
                    onDragOver={e => { e.preventDefault(); if (isAdmin) setDragOverId(a.id); }}
                    onDragLeave={() => setDragOverId(null)}
                    onDrop={e => handleListDrop(a, e)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '16px',
                      padding: '12px 16px',
                      background: isDragOver ? 'rgba(255,107,107,0.25)' : today ? 'rgba(132,94,194,0.15)' : a.completed ? 'rgba(107,203,119,0.08)' : 'rgba(255,255,255,0.02)',
                      border: `2px solid ${isDragOver ? 'var(--primary)' : today ? 'var(--purple)' : a.completed ? 'rgba(107,203,119,0.3)' : 'rgba(255,255,255,0.05)'}`,
                      borderRadius: '12px',
                      cursor: isAdmin && !a.completed ? 'grab' : 'default',
                      transition: 'all 0.15s',
                      transform: isDragOver ? 'scale(1.01)' : 'scale(1)',
                      userSelect: 'none',
                    }}
                  >
                    {isAdmin && !a.completed && <span style={{ color: 'var(--text-muted)', fontSize: '18px' }}>⠿</span>}
                    <div style={{ fontSize: '1.4rem' }}>{a.completed ? '✅' : today ? '🎊' : '🎉'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: today ? 'var(--purple)' : 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {a.userName}
                        {today && <span className="badge badge-purple">TODAY!</span>}
                        {a.completed && <span className="badge badge-green">Done</span>}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {format(dateObj, 'EEEE, MMMM do yyyy')}
                      </div>
                    </div>
                    {isAdmin && !a.completed && today && (
                      <button className="btn btn-success" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleMarkComplete(a)}>
                        ✅ Mark Done
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Drag All Modal */}
      {showDragAllModal && (
        <div className="modal-overlay" onClick={() => setShowDragAllModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '8px' }}>📦 Drag All Assignments</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
              Move all assignments from a specific date onwards to a new start date.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>From Date</label>
                <input type="date" className="input" value={dragAllFromDateVal} onChange={e => setDragAllFromDateVal(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>New Start Date</label>
                <input type="date" className="input" value={dragAllToDateVal} onChange={e => setDragAllToDateVal(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowDragAllModal(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleDragAllSubmit}>Move All 📦</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
