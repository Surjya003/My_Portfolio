# Surjya Kamal Saha — Personal Portfolio

A modern portfolio website with a 3D interactive background built with Three.js, glassmorphism UI, and responsive design.

## Tech Stack

- **HTML5 / CSS3** — Semantic markup, glassmorphism effects, responsive layout
- **JavaScript (ES modules)** — Tab navigation, modal system, filtering
- **Three.js** — Neural network particle system, skill galaxy, project showcase
- **Vite** — Dev server and bundler

## Project Structure

```
├── index.html              # Main portfolio page
├── main.js                 # Entry point (dynamic imports Three.js)
├── style.css               # Glassmorphism overrides
├── assets/
│   ├── css/style.css       # Base styles (Poppins, Ionicons)
│   ├── js/script.js        # UI interactions (sidebar, modals, filters, nav)
│   └── images/             # WebP images, SVG icons, favicon
├── src/
│   ├── managers/
│   │   ├── SceneManager.js # Three.js scene, renderer, animation loop
│   │   └── CameraManager.js # Camera path along spline
│   ├── components/
│   │   ├── NeuralNetwork.js # 4000-particle cloud
│   │   ├── SkillGalaxy.js   # Orbiting skill spheres
│   │   └── ProjectShowcase.js # Heart + Ship project visuals
│   └── shaders/            # GLSL vertex/fragment shaders
├── robots.txt
├── sitemap.xml
└── vite.config.js
```

## Features

- 3D neural network particle background with mouse interaction
- Tab-based navigation with smooth camera transitions
- Glassmorphism card design
- Project filtering by category
- Responsive (mobile/desktop)
- Accessibility: skip-to-content, ARIA labels, prefers-reduced-motion support
- SEO: meta description, Open Graph, JSON-LD structured data

## Getting Started

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
