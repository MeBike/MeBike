declare module "@ungap/structured-clone" {
  const structuredClone: <T>(value: T) => T;

  export default structuredClone;
}

declare module "react-native/Libraries/Utilities/PolyfillFunctions" {
  export function polyfillGlobal<T>(
    name: string,
    getValue: () => T,
  ): void;
}
