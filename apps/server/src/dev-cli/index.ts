import chalk from "chalk";
import dotenv from "dotenv";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  formatTimestamp,
  getBikeInspection,
  getEmailJobById,
  getPersonaRentalDetail,
  getStationInspection,
  listEmailJobs,
  listPersonaRentalHistory,
  listStations,
  processOneEmailJob,
  sendSampleEmails,
  stripHtml,
} from "./data";
import {
  getDeviceConfig,
  resolveDevicePort,
  restartDevice,
  setDeviceConfig,
} from "./device";
import { runInteractiveCli } from "./interactive";
import { writeError, writeLine } from "./output";
import { printPersona } from "./persona-output";
import {
  clearCurrentPersona,
  listSeededPersonas,
  readCurrentPersona,
  resolvePersona,
  writeCurrentPersona,
} from "./personas";
import { disposeCliRuntimes } from "./runtime";
import { updateUserCardBinding } from "./user-card";

const filePath = fileURLToPath(import.meta.url);
const serverRoot = path.resolve(path.dirname(filePath), "../..");
const repoRoot = path.resolve(serverRoot, "../..");
const serverEnvPath = path.join(serverRoot, ".env");
const serverLocalEnvPath = path.join(serverRoot, ".env.local");

dotenv.config({ path: serverEnvPath });
dotenv.config({ path: serverLocalEnvPath, override: true });

const [command = "list", ...args] = process.argv.slice(2);

try {
  switch (command) {
    case "help":
    case "--help":
    case "-h": {
      printHelp();
      break;
    }
    case "interactive": {
      const connectionString = requireConnectionString();
      await runInteractiveCli({ connectionString, repoRoot });
      break;
    }
    case "persona": {
      const connectionString = requireConnectionString();
      await handlePersonaCommand(connectionString, args, repoRoot);
      break;
    }
    case "device": {
      await handleDeviceCommand(args);
      break;
    }
    case "user-card": {
      const connectionString = requireConnectionString();
      await handleUserCardCommand(connectionString, args);
      break;
    }
    case "list": {
      const connectionString = requireConnectionString();
      if (args.includes("--interactive")) {
        await runInteractiveCli({ connectionString, repoRoot });
        break;
      }

      const status = normalizeStatus(args[0]);
      const jobs = await listEmailJobs({ connectionString, status, limit: 20 });
      writeLine(chalk.cyan(`Email jobs (${status})`));
      if (jobs.length === 0) {
        writeLine(chalk.yellow("No email jobs found."));
        break;
      }

      for (const job of jobs) {
        writeLine(
          [
            colorStatus(job.status).padEnd(19),
            chalk.white(job.id),
            chalk.gray(job.payloadKind),
            chalk.green(job.to),
            chalk.white(job.subject),
          ].join("  "),
        );
      }
      break;
    }
    case "stations": {
      const connectionString = requireConnectionString();
      const search = args[0];
      const stations = await listStations({ connectionString, search, limit: 30 });
      writeLine(chalk.cyan(`Stations${search ? ` matching ${search}` : ""}`));
      if (stations.length === 0) {
        writeLine(chalk.yellow("No stations found."));
        break;
      }

      for (const station of stations) {
        writeLine(`${chalk.white(station.name)}  ${chalk.gray(station.id)}  bikes ${station.totalBikes}/${station.totalCapacity}  available ${station.availableBikes}  booked ${station.bookedBikes}  reserved ${station.reservedBikes}`);
      }
      break;
    }
    case "station": {
      const connectionString = requireConnectionString();
      const value = args[0];
      if (!value) {
        throw new Error("Need station id or name: pnpm dev:cli station <station-id|name>");
      }

      const station = await getStationInspection({ connectionString, value });
      if (!station) {
        throw new Error(`Station not found: ${value}`);
      }

      writeLine(chalk.cyan(`Station ${station.name}`));
      writeLine(`${chalk.gray("id")}: ${station.id}`);
      writeLine(`${chalk.gray("type")}: ${station.stationType}`);
      writeLine(`${chalk.gray("address")}: ${station.address}`);
      writeLine(`${chalk.gray("capacity")}: ${station.totalBikes}/${station.totalCapacity}`);
      writeLine(`${chalk.gray("returnSlots")}: ${station.returnSlotLimit}`);
      writeLine(`${chalk.gray("bikes")}: available ${station.availableBikes}, booked ${station.bookedBikes}, reserved ${station.reservedBikes}, broken ${station.brokenBikes}, redistributing ${station.redistributingBikes}, lost ${station.lostBikes}, disabled ${station.disabledBikes}`);
      for (const bike of station.bikes) {
        writeLine(`- ${bike.bikeNumber} ${bike.status} ${bike.id}`);
      }
      break;
    }
    case "bike": {
      const connectionString = requireConnectionString();
      const value = args[0];
      if (!value) {
        throw new Error("Need bike id or bike number: pnpm dev:cli bike <value>");
      }

      const bike = await getBikeInspection({ connectionString, value });
      if (!bike) {
        throw new Error(`Bike not found: ${value}`);
      }

      writeLine(chalk.cyan(`Bike ${bike.bikeNumber}`));
      writeLine(`${chalk.gray("id")}: ${bike.id}`);
      writeLine(`${chalk.gray("status")}: ${bike.status}`);
      writeLine(`${chalk.gray("station")}: ${bike.stationName ?? "-"}`);
      writeLine(`${chalk.gray("supplier")}: ${bike.supplierName ?? "-"}`);
      writeLine(`${chalk.gray("activeRental")}: ${bike.activeRentalId ?? "-"}`);
      writeLine(`${chalk.gray("pendingReservation")}: ${bike.pendingReservationId ?? "-"}`);
      writeLine(`${chalk.gray("updated")}: ${formatTimestamp(bike.updatedAt)}`);
      for (const rental of bike.recentRentals) {
        writeLine(`- rental ${rental.id} ${rental.status} ${formatTimestamp(rental.startTime)} ${rental.userEmail}`);
      }
      break;
    }
    case "rentals": {
      const connectionString = requireConnectionString();
      await handleRentalHistoryCommand(connectionString, args, repoRoot);
      break;
    }
    case "rental": {
      const connectionString = requireConnectionString();
      await handleRentalDetailCommand(connectionString, args, repoRoot);
      break;
    }
    case "show": {
      const connectionString = requireConnectionString();
      const id = args[0];
      if (!id) {
        throw new Error("Need job id: pnpm dev:cli show <job-id>");
      }
      const job = await getEmailJobById({ connectionString, id });
      if (!job) {
        throw new Error(`Email job not found: ${id}`);
      }

      writeLine(chalk.cyan(`Email job ${job.id}`));
      writeLine(`${chalk.gray("status")}: ${colorStatus(job.status)}`);
      writeLine(`${chalk.gray("kind")}: ${job.payloadKind}`);
      writeLine(`${chalk.gray("to")}: ${job.to}`);
      writeLine(`${chalk.gray("subject")}: ${job.subject}`);
      writeLine(`${chalk.gray("attempts")}: ${String(job.attempts)}`);
      writeLine(`${chalk.gray("created")}: ${formatTimestamp(job.createdAt)}`);
      writeLine(`${chalk.gray("runAt")}: ${formatTimestamp(job.runAt)}`);
      writeLine(`${chalk.gray("sentAt")}: ${formatTimestamp(job.sentAt)}`);
      writeLine(`${chalk.gray("dedupe")}: ${job.dedupeKey ?? "-"}`);
      writeLine(`${chalk.gray("lastError")}: ${job.lastError ?? "-"}`);
      writeLine(chalk.magenta("preview"));
      writeLine(stripHtml(job.html) || "(empty)");
      break;
    }
    case "process-once": {
      requireConnectionString();
      const result = await processOneEmailJob();
      if (result.status === "empty") {
        writeLine(chalk.yellow("No pending email job."));
      }
      else {
        writeLine(chalk.green(`Processed email job ${result.jobId}.`));
      }
      break;
    }
    case "send-samples": {
      requireConnectionString();
      const to = args[0];
      if (!to) {
        throw new Error("Need target email: pnpm dev:cli send-samples <email>");
      }

      const subjects = await sendSampleEmails({ to });
      writeLine(chalk.cyan(`Sent ${subjects.length} sample emails to ${to}`));
      for (const subject of subjects) {
        writeLine(`- ${subject}`);
      }
      break;
    }
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}
catch (error) {
  writeError(chalk.red(error instanceof Error ? error.message : String(error)));
  printHelp();
  process.exitCode = 1;
}
finally {
  await disposeCliRuntimes();
}

function requireConnectionString() {
  const connectionString = process.env.DATABASE_URL ?? process.env.TEST_DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL or TEST_DATABASE_URL. Load server env first.");
  }

  return connectionString;
}

function normalizeStatus(input?: string) {
  switch (input?.toUpperCase()) {
    case undefined:
    case "ALL":
      return "ALL" as const;
    case "PENDING":
    case "SENT":
    case "FAILED":
    case "CANCELLED":
      return input.toUpperCase() as "PENDING" | "SENT" | "FAILED" | "CANCELLED";
    default:
      throw new Error(`Unknown status filter: ${input}`);
  }
}

function colorStatus(status: string) {
  switch (status) {
    case "PENDING":
      return chalk.yellow(status);
    case "SENT":
      return chalk.green(status);
    case "FAILED":
      return chalk.red(status);
    case "CANCELLED":
      return chalk.gray(status);
    default:
      return chalk.white(status);
  }
}

function printHelp() {
  writeLine(chalk.cyan("Usage"));
  writeLine("  pnpm dev:cli persona list");
  writeLine("  pnpm dev:cli persona current");
  writeLine("  pnpm dev:cli persona use <handle|email>");
  writeLine("  pnpm dev:cli persona clear");
  writeLine("  pnpm dev:cli device config get [--port <serial-port>]");
  writeLine("  pnpm dev:cli device config set --bike-id <id> [--wifi-ssid <ssid>] [--wifi-pass <pass>] [--mqtt-broker-ip <ip>] [--mqtt-port <port>] [--mqtt-username <user>] [--mqtt-password <pass>] [--port <serial-port>]");
  writeLine("  pnpm dev:cli device restart [--port <serial-port>]");
  writeLine("  pnpm dev:cli user-card <user-id|email|handle> <card-uid>");
  writeLine("  pnpm dev:cli user-card <user-id|email|handle> --clear");
  writeLine("  pnpm dev:cli list [ALL|PENDING|SENT|FAILED|CANCELLED]");
  writeLine("  pnpm dev:cli list --interactive");
  writeLine("  pnpm dev:cli stations [search]");
  writeLine("  pnpm dev:cli station <station-id|name>");
  writeLine("  pnpm dev:cli bike <bike-id|bike-number>");
  writeLine("  pnpm dev:cli rentals [RENTED|COMPLETED|OVERDUE_UNRETURNED]");
  writeLine("  pnpm dev:cli rental <rental-id>");
  writeLine("  pnpm dev:cli show <job-id>");
  writeLine("  pnpm dev:cli process-once");
  writeLine("  pnpm dev:cli send-samples <email>");
  writeLine("  pnpm dev:cli interactive");
}

async function handleUserCardCommand(connectionString: string, args: string[]) {
  const [target, cardUid] = args;
  if (!target || !cardUid) {
    throw new Error("Need target user and card uid: pnpm dev:cli user-card <user-id|email|handle> <card-uid|--clear>");
  }

  const nextCardUid = cardUid === "--clear" ? null : cardUid;
  const updated = await updateUserCardBinding({
    connectionString,
    target,
    cardUid: nextCardUid,
  });

  writeLine(chalk.cyan(`Updated card binding for ${updated.fullName}`));
  writeLine(`${chalk.gray("id")}: ${updated.id}`);
  writeLine(`${chalk.gray("email")}: ${updated.email}`);
  writeLine(`${chalk.gray("handle")}: ${updated.handle}`);
  writeLine(`${chalk.gray("nfcCardUid")}: ${updated.nfcCardUid ?? "-"}`);
}

async function handleDeviceCommand(args: string[]) {
  const [subcommand, maybeAction, ...rest] = args;

  if (subcommand === "restart") {
    const flags = parseFlags([maybeAction, ...rest].filter(Boolean) as string[]);
    const portPath = await resolveDevicePort(flags.port);
    await restartDevice(portPath);
    writeLine(chalk.green(`Restart command sent to ${portPath}.`));
    return;
  }

  const action = maybeAction;
  const flags = parseFlags(rest);
  const portPath = await resolveDevicePort(flags.port);

  if (subcommand === "config" && action === "get") {
    const config = await getDeviceConfig(portPath);
    writeLine(chalk.cyan(`Device config from ${portPath}`));
    writeLine(`${chalk.gray("bikeId")}: ${config.bikeId}`);
    writeLine(`${chalk.gray("wifiSsid")}: ${config.wifiSsid}`);
    writeLine(`${chalk.gray("wifiPass")}: ${config.wifiPass || "-"}`);
    writeLine(`${chalk.gray("mqttBrokerIP")}: ${config.mqttBrokerIP}`);
    writeLine(`${chalk.gray("mqttPort")}: ${String(config.mqttPort)}`);
    writeLine(`${chalk.gray("mqttUsername")}: ${config.mqttUsername || "-"}`);
    writeLine(`${chalk.gray("mqttPassword")}: ${config.mqttPassword || "-"}`);
    return;
  }

  if (subcommand === "config" && action === "set") {
    const updates = {
      bikeId: flags["bike-id"],
      wifiSsid: flags["wifi-ssid"],
      wifiPass: flags["wifi-pass"],
      mqttBrokerIP: flags["mqtt-broker-ip"],
      mqttPort: flags["mqtt-port"] ? Number(flags["mqtt-port"]) : undefined,
      mqttUsername: flags["mqtt-username"],
      mqttPassword: flags["mqtt-password"],
    };

    if (Object.values(updates).every(value => value === undefined)) {
      throw new Error("Need at least one config field to update.");
    }
    if (updates.mqttPort !== undefined && Number.isNaN(updates.mqttPort)) {
      throw new Error(`Invalid --mqtt-port value: ${flags["mqtt-port"]}`);
    }

    await setDeviceConfig(portPath, updates);
    writeLine(chalk.green(`Saved config to ${portPath}. Device is restarting.`));
    return;
  }

  throw new Error(`Unknown device command: ${[subcommand, action].filter(Boolean).join(" ")}`);
}

async function handlePersonaCommand(connectionString: string, args: string[], repoRoot: string) {
  const [subcommand = "current", value] = args;

  switch (subcommand) {
    case "list": {
      const personas = await listSeededPersonas(connectionString);
      const currentPersonaEmail = await readCurrentPersona(repoRoot);
      if (personas.length === 0) {
        writeLine(chalk.yellow("No seeded personas found."));
        return;
      }

      for (const persona of personas) {
        printPersona(persona, currentPersonaEmail);
      }
      return;
    }
    case "current": {
      const currentPersonaEmail = await readCurrentPersona(repoRoot);
      if (!currentPersonaEmail) {
        writeLine(chalk.yellow("No current persona selected."));
        return;
      }

      const persona = await resolvePersona(connectionString, currentPersonaEmail);
      if (!persona) {
        writeLine(chalk.red(`Current persona not found in database: ${currentPersonaEmail}`));
        return;
      }

      printPersona(persona, currentPersonaEmail);
      return;
    }
    case "use": {
      if (!value) {
        throw new Error("Need persona handle or email: pnpm dev:cli persona use <handle|email>");
      }

      const persona = await resolvePersona(connectionString, value);
      if (!persona) {
        throw new Error(`Seeded persona not found: ${value}`);
      }

      await writeCurrentPersona(repoRoot, persona);
      writeLine(chalk.green(`Current persona set to ${persona.handle}.`));
      printPersona(persona, persona.email);
      return;
    }
    case "clear": {
      await clearCurrentPersona(repoRoot);
      writeLine(chalk.yellow("Cleared current persona."));
      return;
    }
    default:
      throw new Error(`Unknown persona command: ${subcommand}`);
  }
}

async function handleRentalHistoryCommand(connectionString: string, args: string[], repoRoot: string) {
  const persona = await requireCurrentPersona(connectionString, repoRoot);
  const status = normalizeRentalStatus(args[0]);
  const rentals = await listPersonaRentalHistory({
    connectionString,
    userId: persona.id,
    status,
    limit: 20,
  });

  writeLine(chalk.cyan(`Rental history for ${persona.handle}${status ? ` (${status})` : ""}`));
  if (rentals.length === 0) {
    writeLine(chalk.yellow("No rentals found."));
    return;
  }

  for (const rental of rentals) {
    writeLine(
      `${chalk.white(rental.id)} ${rental.status.padEnd(10)} ${rental.bikeNumber.padEnd(8)} ${formatTimestamp(rental.startTime)} -> ${formatTimestamp(rental.endTime)} ${chalk.gray(`${rental.startStationName} -> ${rental.endStationName ?? "-"}`)}`,
    );
  }
}

async function handleRentalDetailCommand(connectionString: string, args: string[], repoRoot: string) {
  const rentalId = args[0];
  if (!rentalId) {
    throw new Error("Need rental id: pnpm dev:cli rental <rental-id>");
  }

  const persona = await requireCurrentPersona(connectionString, repoRoot);
  const rental = await getPersonaRentalDetail({
    connectionString,
    userId: persona.id,
    rentalId,
  });

  if (!rental) {
    throw new Error(`Rental not found for current persona: ${rentalId}`);
  }

  writeLine(chalk.cyan(`Rental ${rental.id}`));
  writeLine(`${chalk.gray("user")}: ${rental.userEmail}`);
  writeLine(`${chalk.gray("status")}: ${rental.status}`);
  writeLine(`${chalk.gray("bike")}: ${rental.bikeNumber} ${chalk.gray(`(${rental.bikeId})`)}`);
  writeLine(`${chalk.gray("bikeStatus")}: ${rental.bikeStatus}`);
  writeLine(`${chalk.gray("startStation")}: ${rental.startStationName} ${chalk.gray(`(${rental.startStationId})`)}`);
  writeLine(`${chalk.gray("endStation")}: ${rental.endStationName ?? "-"} ${rental.endStationId ? chalk.gray(`(${rental.endStationId})`) : ""}`.trimEnd());
  writeLine(`${chalk.gray("startTime")}: ${formatTimestamp(rental.startTime)}`);
  writeLine(`${chalk.gray("endTime")}: ${formatTimestamp(rental.endTime)}`);
  writeLine(`${chalk.gray("duration")}: ${rental.durationMinutes ?? "-"}`);
  writeLine(`${chalk.gray("totalPrice")}: ${rental.totalPrice ?? "-"}`);
  writeLine(`${chalk.gray("subscriptionId")}: ${rental.subscriptionId ?? "-"}`);
  writeLine(`${chalk.gray("updated")}: ${formatTimestamp(rental.updatedAt)}`);
  writeLine(`${chalk.gray("returnConfirmedAt")}: ${formatTimestamp(rental.returnConfirmedAt)}`);
  writeLine(`${chalk.gray("returnMethod")}: ${rental.returnConfirmationMethod ?? "-"}`);
  writeLine(`${chalk.gray("handoverStatus")}: ${rental.returnHandoverStatus ?? "-"}`);
  writeLine(`${chalk.gray("confirmedBy")}: ${rental.returnConfirmedByUserEmail ?? rental.returnConfirmedByUserId ?? "-"}`);
  writeLine(`${chalk.gray("returnStation")}: ${rental.returnConfirmationStationName ?? rental.returnConfirmationStationId ?? "-"}`);
  writeLine(`${chalk.gray("billedTotal")}: ${rental.billedTotalAmount ?? "-"}`);
  writeLine(`${chalk.gray("billedBase")}: ${rental.billedBaseAmount ?? "-"}`);
  writeLine(`${chalk.gray("couponDiscount")}: ${rental.billedCouponDiscountAmount ?? "-"}`);
  writeLine(`${chalk.gray("subscriptionDiscount")}: ${rental.billedSubscriptionDiscountAmount ?? "-"}`);
  writeLine(`${chalk.gray("depositForfeited")}: ${rental.billedDepositForfeited ?? "-"}`);
}

async function requireCurrentPersona(connectionString: string, repoRoot: string) {
  const currentPersonaEmail = await readCurrentPersona(repoRoot);
  if (!currentPersonaEmail) {
    throw new Error("No current persona selected. Use: pnpm dev:cli persona use <handle|email>");
  }

  const persona = await resolvePersona(connectionString, currentPersonaEmail);
  if (!persona) {
    throw new Error(`Current persona not found in database: ${currentPersonaEmail}`);
  }

  return persona;
}

function normalizeRentalStatus(input?: string) {
  switch (input?.toUpperCase()) {
    case undefined:
      return undefined;
    case "RENTED":
    case "COMPLETED":
    case "OVERDUE_UNRETURNED":
      return input.toUpperCase() as "RENTED" | "COMPLETED" | "OVERDUE_UNRETURNED";
    default:
      throw new Error(`Unknown rental status filter: ${input}`);
  }
}

function parseFlags(args: string[]) {
  const flags: Record<string, string> = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith("--")) {
      throw new Error(`Unexpected argument: ${arg}`);
    }

    const key = arg.slice(2);
    const value = args[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }

    flags[key] = value;
    index += 1;
  }

  return flags;
}
