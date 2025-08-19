# Sticky Notes Frontend

This is a lightweight React frontend for a virtual sticky notes organizer.

Features:
- Create, edit, delete sticky notes
- Color-code notes with a minimal light theme
- Freeform layout (drag notes) or Grid layout toggle
- Local persistence (localStorage)
- CRUD-like abstraction (`useLocalNotes`) to enable easy replacement with a local DB later

How to run:
- npm install
- npm start

Architecture:
- App.js contains the main UI and a small persistence layer using localStorage.
- `useLocalNotes` exposes PUBLIC_INTERFACE methods: create, update, remove, readAll, writeAll.
  Replace these implementations with actual DB calls later while keeping the UI unchanged.

Customization:
- Colors can be modified in App.css.
- Default note size is 220x180; adjust in App.js style if needed.

Testing:
- App.test.js checks for the presence of the "Sticky Notes" title in the toolbar.
