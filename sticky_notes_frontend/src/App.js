import React, { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

/**
 * Data model for a Sticky Note
 * id: string
 * title: string
 * content: string
 * color: string
 * x,y: number (for freeform)
 * width,height: number
 * createdAt, updatedAt: number
 */

// Utilities
const NOTE_COLORS = [
  { name: 'Yellow', value: '#ffeb3b' },   // primary
  { name: 'Amber', value: '#ffc107' },    // secondary
  { name: 'Sky', value: '#e3f2fd' },      // light blue background
  { name: 'Blue', value: '#2196f3' },     // accent
  { name: 'Mint', value: '#e8f5e9' },
  { name: 'Rose', value: '#ffebee' },
];

const DEFAULT_COLOR = NOTE_COLORS[0].value;
const STORAGE_KEY = 'sticky_notes_v1';
const STORAGE_LAYOUT_KEY = 'sticky_notes_layout_v1';
const genId = () => Math.random().toString(36).slice(2, 10);

// PUBLIC_INTERFACE
export function useLocalNotes() {
  /** A small CRUD-like client which abstracts the current persistence (localStorage)
   * and can be replaced later with a local DB without changing UI components.
   */
  const readAll = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };
  const writeAll = (notes) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  };

  // PUBLIC_INTERFACE
  const create = (note) => {
    const notes = readAll();
    notes.push(note);
    writeAll(notes);
    return note;
  };

  // PUBLIC_INTERFACE
  const update = (id, partial) => {
    const notes = readAll();
    const idx = notes.findIndex(n => n.id === id);
    if (idx >= 0) {
      notes[idx] = { ...notes[idx], ...partial, updatedAt: Date.now() };
      writeAll(notes);
      return notes[idx];
    }
    return null;
  };

  // PUBLIC_INTERFACE
  const remove = (id) => {
    const notes = readAll().filter(n => n.id !== id);
    writeAll(notes);
  };

  return { readAll, writeAll, create, update, remove };
}

// PUBLIC_INTERFACE
function App() {
  /** Sticky Notes Organizer main component
   * Features:
   * - Create, edit, delete notes
   * - Color-code notes
   * - Freeform layout with drag and resize, or grid layout
   * - Local persistence via localStorage
   * - Minimalistic light theme
   */
  const [notes, setNotes] = useState([]);
  const [layout, setLayout] = useState(() => localStorage.getItem(STORAGE_LAYOUT_KEY) || 'freeform'); // 'freeform' | 'grid'
  const [filter, setFilter] = useState('');
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLOR);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [activeId, setActiveId] = useState(null); // being dragged
  const containerRef = useRef(null);
  const storage = useLocalNotes();

  // load initial
  useEffect(() => {
    setNotes(storage.readAll());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // persist layout choice
  useEffect(() => {
    localStorage.setItem(STORAGE_LAYOUT_KEY, layout);
  }, [layout]);

  const filteredNotes = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(n =>
      (n.title || '').toLowerCase().includes(q) ||
      (n.content || '').toLowerCase().includes(q)
    );
  }, [notes, filter]);

  // CRUD handlers
  const handleCreate = () => {
    const id = genId();
    const now = Date.now();
    const rect = containerRef.current?.getBoundingClientRect();
    const safeX = rect ? Math.max(8, rect.width / 2 - 100) : 40;
    const safeY = 24 + (notes.length % 5) * 16;

    const note = {
      id,
      title: newTitle.trim() || 'Untitled',
      content: newContent.trim(),
      color: selectedColor || DEFAULT_COLOR,
      x: safeX,
      y: safeY,
      width: 220,
      height: 180,
      createdAt: now,
      updatedAt: now
    };
    storage.create(note);
    setNotes(prev => [...prev, note]);
    setNewTitle('');
    setNewContent('');
  };

  const handleDelete = (id) => {
    storage.remove(id);
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const handleUpdate = (id, partial) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...partial, updatedAt: Date.now() } : n));
    storage.update(id, partial);
  };

  // Drag logic for freeform
  const onMouseDown = (e, id) => {
    if (layout !== 'freeform') return;
    setActiveId(id);
    const note = notes.find(n => n.id === id);
    const startX = e.clientX;
    const startY = e.clientY;
    const baseX = note?.x || 0;
    const baseY = note?.y || 0;

    const onMove = (me) => {
      const dx = me.clientX - startX;
      const dy = me.clientY - startY;
      const nextX = baseX + dx;
      const nextY = baseY + dy;
      handleUpdate(id, { x: nextX, y: nextY });
    };
    const onUp = () => {
      setActiveId(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // UI
  return (
    <div className="App app-root">
      <header className="toolbar">
        <div className="brand">
          <span className="logo">🗒️</span>
          <span className="title">Sticky Notes</span>
        </div>

        <div className="controls">
          <input
            className="input"
            placeholder="Search notes..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Search notes"
          />
          <div className="layout-toggle" role="group" aria-label="Layout selector">
            <button
              className={`btn ${layout === 'freeform' ? 'btn-active' : ''}`}
              onClick={() => setLayout('freeform')}
              title="Freeform layout"
            >
              Freeform
            </button>
            <button
              className={`btn ${layout === 'grid' ? 'btn-active' : ''}`}
              onClick={() => setLayout('grid')}
              title="Grid layout"
            >
              Grid
            </button>
          </div>
        </div>
      </header>

      <section className="composer">
        <div className="composer-left">
          <input
            className="input"
            placeholder="Note title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            aria-label="Note title"
          />
          <textarea
            className="textarea"
            placeholder="Write your note..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={3}
            aria-label="Note content"
          />
        </div>
        <div className="composer-right">
          <div className="palette" aria-label="Color palette">
            {NOTE_COLORS.map(c => (
              <button
                key={c.value}
                className={`swatch ${selectedColor === c.value ? 'swatch-active' : ''}`}
                style={{ background: c.value }}
                aria-label={`Select color ${c.name}`}
                onClick={() => setSelectedColor(c.value)}
                title={c.name}
              />
            ))}
          </div>
          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={!newTitle.trim() && !newContent.trim()}
          >
            Add Note
          </button>
        </div>
      </section>

      <main
        ref={containerRef}
        className={`board ${layout === 'grid' ? 'board-grid' : 'board-free'}`}
      >
        {filteredNotes.length === 0 && (
          <div className="empty">No notes yet. Create your first one above.</div>
        )}
        {filteredNotes.map(note => (
          <article
            key={note.id}
            className={`note ${activeId === note.id ? 'note-active' : ''}`}
            style={{
              background: note.color || DEFAULT_COLOR,
              left: layout === 'freeform' ? (note.x || 0) : undefined,
              top: layout === 'freeform' ? (note.y || 0) : undefined,
              width: note.width || 220,
              height: note.height || 180,
              position: layout === 'freeform' ? 'absolute' : 'relative'
            }}
          >
            <div
              className="note-header"
              onMouseDown={(e) => onMouseDown(e, note.id)}
              role="button"
              title={layout === 'freeform' ? 'Drag to move' : 'Repositioning disabled in grid'}
            >
              <input
                className="note-title"
                value={note.title}
                onChange={(e) => handleUpdate(note.id, { title: e.target.value })}
                aria-label="Edit title"
              />
              <div className="note-actions">
                <select
                  className="note-color-select"
                  value={note.color}
                  onChange={(e) => handleUpdate(note.id, { color: e.target.value })}
                  aria-label="Change note color"
                  title="Change color"
                >
                  {NOTE_COLORS.map(c => (
                    <option key={c.value} value={c.value}>{c.name}</option>
                  ))}
                </select>
                <button
                  className="icon-btn"
                  onClick={() => handleDelete(note.id)}
                  aria-label="Delete note"
                  title="Delete note"
                >
                  🗑️
                </button>
              </div>
            </div>
            <textarea
              className="note-content"
              value={note.content}
              onChange={(e) => handleUpdate(note.id, { content: e.target.value })}
              aria-label="Edit content"
            />
          </article>
        ))}
      </main>
      <footer className="statusbar">
        <span>{notes.length} notes</span>
        <span>Layout: {layout}</span>
      </footer>
    </div>
  );
}

export default App;
