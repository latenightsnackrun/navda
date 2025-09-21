import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import FlightInfoAssistant from './FlightInfoAssistant';

// Individual Flight Strip Component
const FlightStrip = ({ strip, onEdit, isDragging = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: strip.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const truncateText = (text, maxLength) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative cursor-grab active:cursor-grabbing select-none ${
        isDragging || isSortableDragging ? 'z-50' : 'z-10'
      }`}
      style={{
        ...style,
        width: '300px',
        height: '85px',
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
        fontSize: '8px',
        lineHeight: '1.0',
        background: '#fefefe',
        border: '1px solid #d1d5db',
        position: 'relative',
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      layout
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Faint light blue grid background */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(to right, #87ceeb 0.5px, transparent 0.5px),
            linear-gradient(to bottom, #87ceeb 0.5px, transparent 0.5px)
          `,
          backgroundSize: '8px 8px',
        }}
      />

      {/* Strip Rack Margin with Ticks */}
      <div className="absolute left-0 top-0 w-1.5 h-full border-r border-gray-200">
        <div className="absolute top-1 left-0.5 w-0.5 h-0.5 bg-gray-300"></div>
        <div className="absolute top-2.5 left-0.5 w-0.5 h-0.5 bg-gray-300"></div>
        <div className="absolute top-4 left-0.5 w-0.5 h-0.5 bg-gray-300"></div>
        <div className="absolute top-5.5 left-0.5 w-0.5 h-0.5 bg-gray-300"></div>
        <div className="absolute top-7 left-0.5 w-0.5 h-0.5 bg-gray-300"></div>
        <div className="absolute top-8.5 left-0.5 w-0.5 h-0.5 bg-gray-300"></div>
      </div>

      {/* Main Content */}
      <div className="pl-2 pr-1 py-1 h-full flex flex-col">
        {/* Top Row: Callsign + Aircraft */}
        <div className="flex justify-between items-center h-4 border-b border-blue-200">
          <span className="text-black uppercase tracking-wide text-xs">{strip.callsign}</span>
          <span className="text-gray-700 uppercase text-xs">{strip.aircraft}</span>
        </div>

        {/* Second Row: Squawk + Altitude */}
        <div className="flex justify-between items-center h-4 border-b border-blue-200 px-2">
          <div className="border border-gray-300 px-0.5 py-0 text-xs w-6 h-4 flex items-center justify-center">
            {strip.squawk}
          </div>
          <div className="border border-gray-300 px-0.5 py-0 text-xs w-6 h-4 flex items-center justify-center">
            {strip.altitude}
          </div>
        </div>

        {/* Third Row: Route + ETA */}
        <div className="h-4 border-b border-blue-200 flex items-center justify-between">
          <span className="text-black uppercase text-xs flex-1 text-center">{truncateText(strip.route, 20)}</span>
          <span className="text-gray-700 text-xs ml-2">{strip.eta || '--:--'}</span>
        </div>

        {/* Fourth Row: Route/Fixes */}
        <div className="h-4 flex items-center">
          <span className="text-gray-600 text-xs uppercase">
            {truncateText(strip.fixes, 30)}
          </span>
        </div>

        {/* Fifth Row: Special Notes - small red text, bottom row */}
        {strip.notes && (
          <div className="h-4 flex items-center">
            <span className="text-red-600 text-xs uppercase">
              {truncateText(strip.notes, 30)}
            </span>
          </div>
        )}
      </div>

      {/* Click overlay for editing */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(strip);
        }}
      />
    </motion.div>
  );
};

// TRACON Dot Component
const TraconDot = ({ strip, onRemove }) => {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          onRemove(strip.id); // Remove dot when countdown hits 0
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [strip.id, onRemove]);

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="flex items-center justify-center h-8 w-8 mx-auto"
    >
      <div className="relative">
        {/* Glowing outer ring */}
        <div className="absolute inset-0 w-6 h-6 bg-red-500 rounded-full animate-ping opacity-75"></div>
        <div className="absolute inset-0 w-6 h-6 bg-red-400 rounded-full animate-pulse"></div>
        
        {/* Main dot with countdown */}
        <div className="relative w-6 h-6 bg-red-500 rounded-full border-2 border-red-300 shadow-lg flex items-center justify-center">
          <span className="text-white text-xs font-bold">
            {countdown}
          </span>
        </div>
      </div>
      <div className="ml-2 text-xs text-gray-400 font-mono">
        {strip.callsign}
      </div>
    </motion.div>
  );
};

// Column Component
const StripColumn = ({ column, strips, onEdit, onRemoveTracon }) => {
  const isTracon = column.id === 'tracon';
  const { setNodeRef } = useDroppable({
    id: column.id,
  });
  
  return (
    <div 
      ref={setNodeRef}
      className={`flex-shrink-0 ${isTracon ? 'w-48' : 'w-80'} bg-gray-100 rounded-lg border border-gray-200 shadow-sm`}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-gray-300">
        <h3 className="text-lg font-bold text-gray-800">{column.name}</h3>
        <div className="text-sm text-gray-600 mt-1">
          {isTracon ? `${strips.length} dots` : `${strips.length} strips`}
        </div>
      </div>

      {/* Strips Container */}
      <div className="p-3 space-y-2 min-h-96 flex flex-col items-center">
        <SortableContext items={strips.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence>
            {strips.map((strip) => (
              isTracon ? (
                <TraconDot
                  key={strip.id}
                  strip={strip}
                  onRemove={onRemoveTracon}
                />
              ) : (
                <FlightStrip
                  key={strip.id}
                  strip={strip}
                  onEdit={onEdit}
                />
              )
            ))}
          </AnimatePresence>
        </SortableContext>

        {/* Empty State */}
        {strips.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-8">
            {isTracon ? 'Dots appear here' : 'Drop strips here'}
          </div>
        )}
      </div>
    </div>
  );
};

// Main Component
const FlightStripsView = () => {
  const [isAssistantOpen, setIsAssistantOpen] = useState(true);
  const [strips, setStrips] = useState([
    {
      id: 1,
      callsign: 'AAL1234',
      aircraft: 'B737',
      squawk: '1234',
      altitude: 'FL350',
      route: 'KJFK → KLAX',
      fixes: 'JFK..BAYST..LAX',
      eta: '14:25',
      notes: 'Request direct BAYST',
      column: 'clearance'
    },
    {
      id: 2,
      callsign: 'UAL5678',
      aircraft: 'A320',
      squawk: '5678',
      altitude: 'FL120',
      route: 'KORD → KJFK',
      fixes: 'ORD..JFK',
      eta: '14:30',
      notes: 'ILS RWY 04L',
      column: 'ground'
    },
    {
      id: 3,
      callsign: 'DLH456',
      aircraft: 'B777',
      squawk: '0456',
      altitude: 'FL080',
      route: 'EDDF → KJFK',
      fixes: 'FRA..JFK',
      eta: '14:22',
      notes: 'Heavy, RWY 04L',
      column: 'tower'
    },
    {
      id: 4,
      callsign: 'SWA789',
      aircraft: 'B737',
      squawk: '0789',
      altitude: 'FL250',
      route: 'KDFW → KLAX',
      fixes: 'DFW..LAX',
      eta: '15:45',
      notes: 'Request higher',
      column: 'tower'
    },
    {
      id: 5,
      callsign: 'JBU234',
      aircraft: 'A320',
      squawk: '0234',
      altitude: 'FL180',
      route: 'KJFK → KBOS',
      fixes: 'JFK..BOS',
      eta: '13:15',
      notes: 'Weather deviation',
      column: 'tracon'
    },
    {
      id: 6,
      callsign: 'BAW789',
      aircraft: 'A380',
      squawk: '0789',
      altitude: 'FL400',
      route: 'EGLL → KJFK',
      fixes: 'LHR..JFK',
      eta: '16:30',
      notes: 'Heavy, RWY 04R',
      column: 'clearance'
    },
    {
      id: 7,
      callsign: 'AFR456',
      aircraft: 'A350',
      squawk: '0456',
      altitude: 'FL380',
      route: 'LFPG → KJFK',
      fixes: 'CDG..JFK',
      eta: '17:15',
      notes: 'Request lower',
      column: 'clearance'
    }
  ]);

  const [editingStrip, setEditingStrip] = useState(null);
  const [editNotes, setEditNotes] = useState('');
  const [activeId, setActiveId] = useState(null);

  const columns = [
    { id: 'clearance', name: 'Clearance Delivery' },
    { id: 'ground', name: 'Ground Control' },
    { id: 'tower', name: 'Local Control' },
    { id: 'tracon', name: 'TRACON Handoff' }
  ];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find the active strip
    const activeStrip = strips.find(strip => strip.id === activeId);
    if (!activeStrip) return;

    // Check if we're dropping on a column (overId is a column id)
    const targetColumn = columns.find(col => col.id === overId);
    
    if (targetColumn) {
      // Dropping on a column - move strip to that column
      setStrips(prevStrips =>
        prevStrips.map(strip =>
          strip.id === activeId
            ? { ...strip, column: targetColumn.id }
            : strip
        )
      );
    } else {
      // Dropping on another strip - reorder within the same column
      const overStrip = strips.find(strip => strip.id === overId);
      if (overStrip && activeStrip.column === overStrip.column) {
        const oldIndex = strips.findIndex((item) => item.id === activeId);
        const newIndex = strips.findIndex((item) => item.id === overId);
        setStrips(arrayMove(strips, oldIndex, newIndex));
      }
    }
  };

  const handleEditStrip = (strip) => {
    setEditingStrip(strip);
    setEditNotes(strip.notes || '');
  };

  const handleSaveNotes = () => {
    if (editingStrip) {
      setStrips(prevStrips =>
        prevStrips.map(strip =>
          strip.id === editingStrip.id
            ? { ...strip, notes: editNotes }
            : strip
        )
      );
      setEditingStrip(null);
      setEditNotes('');
    }
  };

  const handleUpdateStripNotes = (callsign, note) => {
    setStrips(prevStrips =>
      prevStrips.map(strip =>
        strip.callsign.toUpperCase() === callsign.toUpperCase()
          ? { ...strip, notes: note }
          : strip
      )
    );
  };

  const handleUpdateStripSquawk = (callsign, squawk) => {
    setStrips(prevStrips =>
      prevStrips.map(strip =>
        strip.callsign.toUpperCase() === callsign.toUpperCase()
          ? { ...strip, squawk: squawk }
          : strip
      )
    );
  };

  const handleCancelEdit = () => {
    setEditingStrip(null);
    setEditNotes('');
  };

  const handleRemoveTracon = (stripId) => {
    setStrips(prevStrips => prevStrips.filter(strip => strip.id !== stripId));
  };

  // Auto-save notes as user types
  useEffect(() => {
    if (editingStrip && editNotes !== editingStrip.notes) {
      const timeoutId = setTimeout(() => {
        setStrips(prevStrips =>
          prevStrips.map(strip =>
            strip.id === editingStrip.id
              ? { ...strip, notes: editNotes }
              : strip
          )
        );
      }, 500); // Auto-save after 500ms of no typing

      return () => clearTimeout(timeoutId);
    }
  }, [editNotes, editingStrip]);

  const getStripsForColumn = (columnId) => {
    return strips.filter(strip => strip.column === columnId);
  };

  const activeStrip = strips.find(strip => strip.id === activeId);

  return (
    <div className="h-full bg-black flex flex-col relative">
      {/* Header */}
      <div className="bg-gray-900/50 border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">Flight Progress Strips</h1>
            <p className="text-gray-400 mt-1">FAA-style digital flight progress strips with drag & drop workflow</p>
          </div>
          <button
            onClick={() => setIsAssistantOpen(!isAssistantOpen)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">Ask Assistant</span>
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className={`flex-1 flex overflow-x-auto p-6 space-x-6 transition-all duration-300 ${
          isAssistantOpen ? 'pr-96' : ''
        }`}>
          {columns.map(column => (
            <StripColumn
              key={column.id}
              column={column}
              strips={getStripsForColumn(column.id)}
              onEdit={handleEditStrip}
              onRemoveTracon={handleRemoveTracon}
            />
          ))}
                </div>

        <DragOverlay>
          {activeStrip ? (
            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: 1.05 }}
              className="shadow-2xl"
            >
              <FlightStrip strip={activeStrip} isDragging={true} />
            </motion.div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingStrip && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-lg p-6 w-96 max-w-md"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Edit Strip: {editingStrip.callsign}
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">
                  Special Notes:
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500 font-mono text-sm"
                  rows={4}
                  placeholder="Enter special notes..."
                  autoFocus
                />
                <div className="text-xs text-gray-500 mt-1">
                  Auto-saves as you type
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  Cancel
                  </button>
                <button
                  onClick={handleSaveNotes}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Save
                  </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flight Info Assistant Side Panel */}
      <FlightInfoAssistant 
        isOpen={isAssistantOpen}
        onToggle={() => setIsAssistantOpen(!isAssistantOpen)}
        flightStrips={strips}
        columns={columns}
        onMoveStrip={handleDragEnd}
        onUpdateStripNotes={handleUpdateStripNotes}
        onUpdateStripSquawk={handleUpdateStripSquawk}
      />

      {/* Footer Stats */}
      <div className="bg-gray-900 border-t border-gray-700 p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-6">
            {columns.map(column => (
              <div key={column.id} className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded bg-gray-500"></div>
                <span className="text-gray-400">
                  {column.name}: {getStripsForColumn(column.id).length}
                </span>
            </div>
            ))}
          </div>
          <div className="text-gray-400">
            Total Strips: {strips.length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightStripsView;