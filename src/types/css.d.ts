// Next.js only ships ambient type declarations for CSS Modules
// (`*.module.css`), not for plain global stylesheet side-effect imports
// (e.g. `import '../globals.css'`). Newer versions of TypeScript report
// TS2882 ("Cannot find module or type declarations for side-effect
// import") for those imports without this declaration.
declare module '*.css';
