import "ky";

declare module "ky" {
  interface Options {
    skipAuth?: boolean;
  }
}
