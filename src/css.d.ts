// Lets TypeScript accept CSS imports used by the web build.
declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}
declare module '*.css';
