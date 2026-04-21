import process from "node:process";

export function writeLine(value: string) {
  process.stdout.write(`${value}\n`);
}

export function writeError(value: string) {
  process.stderr.write(`${value}\n`);
}
