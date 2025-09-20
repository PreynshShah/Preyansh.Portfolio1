RailAI Control — Frontend
=========================

A clean, responsive static frontend demonstrating AI-powered precise train traffic control to maximize section throughput. Includes an interactive simulation using Chart.js and Tailwind via CDN.

Quick start
-----------

Open `index.html` in a modern browser. No build step is required.

Structure
---------

- `index.html` — Main page with sections and demo
- `assets/js/app.js` — Chart + simulation logic
- `assets/img/logo.svg` — Simple logo

Tech
----

- Tailwind CSS via CDN (no tooling)
- Google Fonts (Inter)
- Chart.js for charts

Customize
---------

- Update copy in `index.html`
- Adjust colors in the inline Tailwind config
- Tweak the simulation model in `assets/js/app.js` (`computeMetrics`)

Deploy
------

Serve the folder with any static host. Example:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

