# Decorative desk screens

These WebP assets are captures of the existing native JSX in
`components/arcade/project-screen-mocks.tsx`. Every value is sample data.
They replace hundreds of DOM nodes in moving CSS-3D screen panels; project
information and accessible controls remain native text outside these images.

To regenerate after editing the source mocks:

1. Temporarily render each mock inside a `.reference-desk .desk` wrapper, on
   `var(--paper)`, at these frame sizes: web 390×248, phone 92×186, POS 500×300.
2. Capture the full frame at increased scale with both root palettes
   (`html.arcade-dark` on/off), after local fonts finish loading.
3. Export WebP at quality 90. Keep the six current filenames and update intrinsic
   dimensions in `components/arcade/desk-screen.tsx` if the capture scale changes.
4. Remove the temporary capture route before building. Confirm all images load
   before selecting a project, and retain the subtle paper/ink/signal palette.

The six images total approximately 240 KiB. Screen containers are decorative;
never replace the actual detail text, links, or keyboard controls with captures.

## POS menu illustrations

`npm run generate:project-menu-art` bakes the supplied cat-window ZIP's twelve
menu symbols to `public/projects/menu/{index}-{light,dark}.png` (32×22).
`project-screen-mocks.tsx` uses these flat pixel images in place of the old
checkerboards. Regenerate them before recapturing the two POS screens. The
source generator uses Sharp from the existing Next.js dependency tree. No
thumbnail canvas or SVG parsing ships in the moving desk.
