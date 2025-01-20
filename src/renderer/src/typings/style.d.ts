declare module '*.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*?url' {
  const value: string;
  export default value;
}
