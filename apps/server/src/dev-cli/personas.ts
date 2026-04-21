import { promises as fs } from "node:fs";
import path from "node:path";

import { withPrismaClient } from "./runtime";

export type PersonaRecord = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  handle: string;
  nfcCardUid?: string | null;
  stationId?: string | null;
  agencyId?: string | null;
};

type PersonaState = {
  currentPersonaEmail: string;
};

const STATE_FILE_NAME = ".mebike-dev-cli.json";

const personaSelect = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  nfcCardUid: true,
  orgAssignment: {
    select: {
      stationId: true,
      agencyId: true,
    },
  },
} as const;

const roleRank: Record<string, number> = {
  ADMIN: 0,
  MANAGER: 1,
  STAFF: 2,
  AGENCY: 3,
  TECHNICIAN: 4,
};

function toPersonaRecord(row: {
  id: string;
  fullName: string;
  email: string;
  role: string;
  nfcCardUid: string | null;
  orgAssignment: {
    stationId: string | null;
    agencyId: string | null;
  } | null;
}): PersonaRecord {
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    role: row.role,
    handle: row.email.replace(/@mebike\.local$/u, ""),
    nfcCardUid: row.nfcCardUid,
    stationId: row.orgAssignment?.stationId ?? null,
    agencyId: row.orgAssignment?.agencyId ?? null,
  } satisfies PersonaRecord;
}

export async function listSeededPersonas(connectionString: string) {
  void connectionString;
  const rows = await withPrismaClient(client =>
    client.user.findMany({
      where: {
        email: { endsWith: "@mebike.local" },
      },
      select: personaSelect,
    }),
  );

  return rows
    .map(toPersonaRecord)
    .sort((left, right) => {
      const rankDiff = (roleRank[left.role] ?? 99) - (roleRank[right.role] ?? 99);
      return rankDiff !== 0 ? rankDiff : left.email.localeCompare(right.email);
    });
}

export async function resolvePersona(connectionString: string, value: string) {
  const personas = await listSeededPersonas(connectionString);
  return personas.find(persona => persona.email === value || persona.handle === value) ?? null;
}

export async function resolveUserCardTarget(connectionString: string, value: string) {
  void connectionString;
  const handleEmail = value.includes("@") ? value : `${value}@mebike.local`;
  const rows = await withPrismaClient(client =>
    client.user.findMany({
      where: {
        OR: [
          { id: value },
          { email: value },
          { email: handleEmail },
        ],
      },
      select: personaSelect,
      take: 5,
    }),
  );

  return rows
    .map(toPersonaRecord)
    .sort((left, right) => {
      const leftRank = left.id === value ? 0 : left.email === value ? 1 : 2;
      const rightRank = right.id === value ? 0 : right.email === value ? 1 : 2;
      return leftRank - rightRank;
    })[0] ?? null;
}

export async function readCurrentPersona(repoRoot: string) {
  const state = await readStateFile(repoRoot);
  return state?.currentPersonaEmail ?? null;
}

export async function writeCurrentPersona(repoRoot: string, persona: PersonaRecord) {
  const statePath = getStateFilePath(repoRoot);
  const nextState: PersonaState = {
    currentPersonaEmail: persona.email,
  };

  await fs.writeFile(statePath, JSON.stringify(nextState, null, 2), "utf8");
}

export async function clearCurrentPersona(repoRoot: string) {
  const statePath = getStateFilePath(repoRoot);
  try {
    await fs.unlink(statePath);
  }
  catch (error) {
    if (!isMissingFileError(error)) {
      throw error;
    }
  }
}

function getStateFilePath(repoRoot: string) {
  return path.join(repoRoot, STATE_FILE_NAME);
}

async function readStateFile(repoRoot: string) {
  const statePath = getStateFilePath(repoRoot);

  try {
    const raw = await fs.readFile(statePath, "utf8");
    return JSON.parse(raw) as PersonaState;
  }
  catch (error) {
    if (isMissingFileError(error)) {
      return null;
    }

    throw error;
  }
}

function isMissingFileError(error: unknown) {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}
