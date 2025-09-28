# Notes on `@mebike/shared` setup

> Reminder to future me: NestJS is still annoying, but at least we figured out how to force it to run.

## Why build CommonJS?
- NestJS (out of the box) runs under Node’s CommonJS runtime, so every package must expose a `require` entry.
- Previously this package only exposed `import` in `exports`, so calling `require('@mebike/shared')` blew up with `ERR_PACKAGE_PATH_NOT_EXPORTED`.
- Bundler/ESM apps like Hono kept working because they only rely on `import`.

## Changes made
- Dropped "type": "module" in `package.json` and added `require`/`default` pointing at `dist/index.js`.
- Switched `tsconfig.json` to `module: "commonjs"`, with `moduleResolution: "node10"` to match.
- Rebuilt via `pnpm --filter @mebike/shared build` so `dist/` contains the correct JS and d.ts outputs.
- In the Nest app, remember to use runtime imports (`import { AppService } ...`) instead of `import type`, otherwise Nest can’t inject the provider.

## If you ever need ESM support too
1. Create a dual build (`index.cjs` and `index.mjs`).
2. Update `exports`:
   ```json
   {
     ".": {
       "types": "./dist/index.d.ts",
       "import": "./dist/index.mjs",
       "require": "./dist/index.cjs",
       "default": "./dist/index.mjs"
     }
   }
   ```
3. Ensure every Nest or other consumer uses the appropriate entry point.

## Still want to rant about NestJS?
- Hono runs through `tsx`/a bundler so it never hits this issue; NestJS clings to old-school CommonJS.
- Going full ESM with Nest means dealing with `node --loader ts-node/esm` and updating every import.

Keep this file so future me doesn’t have to debug the same nonsense again.
