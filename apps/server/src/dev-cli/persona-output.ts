import chalk from "chalk";

import type { PersonaRecord } from "./personas";

import { writeLine } from "./output";

export function printPersona(persona: PersonaRecord, currentEmail?: string | null) {
  const currentMark = currentEmail === persona.email ? chalk.green("* current") : "";
  writeLine(
    [
      chalk.cyan(persona.handle.padEnd(12)),
      chalk.white(persona.email.padEnd(24)),
      chalk.yellow(persona.role.padEnd(10)),
      persona.fullName,
      currentMark,
    ].filter(Boolean).join("  "),
  );
}
