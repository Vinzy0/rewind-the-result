# Rewind the Result

A small interactive portfolio direction study for Vince. Tavo is visible immediately; select **See how this happened**, scrub the timeline, inspect a layer, or use **Ask Vince AI** to focus an observation in the same system.

## Run locally

```sh
npm install
npm run dev
```

## GitHub Pages

The public prototype is published from `docs/` on the `main` branch. To update it, run `npm run build`, copy the contents of `dist/` into `docs/`, and commit the changes. Keep `docs/.nojekyll` in place. Vite uses relative asset paths so the prototype works under the repository URL.

## Prototype scope

The CRM screen, customer record, workflow, and AI responses are illustrative. No RAG or backend is connected. Profile content uses Vince's supplied facts; résumé and contact controls show concept placeholders.

Built with Vite, GSAP, CSS 3D, SVG geometry, Manrope and Bodoni Moda. Font packages include their open font licenses. Keyboard-accessible timeline; reduced-motion preference supported.
