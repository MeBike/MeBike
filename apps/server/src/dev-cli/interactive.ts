import { confirm, input, select } from "@inquirer/prompts";
import chalk from "chalk";
import process from "node:process";
import { emitKeypressEvents } from "node:readline";

import type { EmailJobStatus } from "./data";

import {
  confirmRentalReturnAsStaff,
  formatTimestamp,
  getBikeInspection,
  getEmailJobById,
  getPersonaRentalDetail,
  getStationInspection,
  listActiveRentals,
  listEmailJobs,
  listPersonaRentalHistory,
  listStations,
  processOneEmailJob,
  sendSampleEmails,
  stripHtml,
} from "./data";
import { getDeviceConfig, restartDevice, setDeviceConfig } from "./device";
import { writeError, writeLine } from "./output";
import { printPersona } from "./persona-output";
import {
  clearCurrentPersona,
  listSeededPersonas,
  readCurrentPersona,
  resolvePersona,
  writeCurrentPersona,
} from "./personas";
import { updateUserCardBinding } from "./user-card";

const STATUS_OPTIONS: EmailJobStatus[] = ["ALL", "PENDING", "SENT", "FAILED", "CANCELLED"];
const DEFAULT_DEVICE_PORT = "/dev/ttyUSB0";

export async function runInteractiveCli(args: {
  connectionString: string;
  repoRoot: string;
}) {
  let status: EmailJobStatus = "ALL";
  let currentPersonaEmail = await readCurrentPersona(args.repoRoot);

  while (true) {
    const currentPersona = currentPersonaEmail
      ? await resolvePersona(args.connectionString, currentPersonaEmail)
      : null;

    writeLine("");
    writeLine(chalk.cyan(`Dev CLI interactive mode (filter: ${status})`));
    writeLine(chalk.gray(`Current persona: ${currentPersonaEmail ?? "none"}`));

    const action = await select<string>({
      message: "Choose action",
      choices: [
        { name: "Choose seeded persona", value: "persona" },
        ...(currentPersona ? [{ name: "My rental history", value: "my-rentals" }] : []),
        { name: "Bind user NFC card", value: "user-card" },
        ...(currentPersona?.role === "STAFF"
          ? [{ name: "End rental as staff", value: "staff-end-rental" }]
          : []),
        { name: "Device config", value: "device-config" },
        { name: "Browse recent email jobs", value: "browse" },
        { name: "Browse stations", value: "stations" },
        { name: "Inspect bike", value: "bike" },
        { name: "Change status filter", value: "filter" },
        { name: "Show job by id", value: "show" },
        { name: "Process one queued email", value: "process" },
        { name: "Send sample emails", value: "samples" },
        { name: "Quit", value: "quit" },
      ],
    });

    switch (action) {
      case "persona": {
        currentPersonaEmail = await choosePersona(args.connectionString, args.repoRoot, currentPersonaEmail);
        break;
      }
      case "my-rentals":
        await browsePersonaRentals(args.connectionString, currentPersona);
        break;
      case "user-card":
        await bindUserCardInteractive(args.connectionString);
        break;
      case "staff-end-rental":
        await endRentalAsStaffInteractive(args.connectionString, currentPersona);
        break;
      case "device-config":
        await runInteractiveAction(deviceConfigInteractive);
        break;
      case "browse":
        await browseJobs(args.connectionString, status);
        break;
      case "stations":
        await browseStations(args.connectionString);
        break;
      case "bike": {
        const value = await input({ message: "Bike id, bike number, or chip id" });
        if (value) {
          await inspectBike(args.connectionString, value);
        }
        break;
      }
      case "filter":
        status = await select({
          message: "Choose status filter",
          choices: STATUS_OPTIONS.map(value => ({ name: value, value })),
        });
        break;
      case "show": {
        const id = await input({ message: "Job id" });
        if (id) {
          await showJob(args.connectionString, id);
        }
        break;
      }
      case "process": {
        const result = await processOneEmailJob();
        if (result.status === "empty") {
          writeLine(chalk.yellow("No pending email job."));
        }
        else {
          writeLine(chalk.green(`Processed email job ${result.jobId}.`));
        }
        break;
      }
      case "samples": {
        const to = await input({ message: "Target email" });
        if (to) {
          const subjects = await sendSampleEmails({ to });
          writeLine(chalk.green(`Sent ${subjects.length} sample emails to ${to}`));
        }
        break;
      }
      case "quit":
        return;
    }
  }
}

async function runInteractiveAction(action: () => Promise<void>) {
  try {
    await action();
  }
  catch (error) {
    writeError(chalk.red(error instanceof Error ? error.message : String(error)));
  }
}

async function deviceConfigInteractive() {
  const portPath = await input({
    message: "Serial port",
    default: DEFAULT_DEVICE_PORT,
  });

  if (!portPath) {
    return;
  }

  while (true) {
    const action = await select<string>({
      message: `Device config (${portPath})`,
      choices: [
        { name: "Read current config", value: "read" },
        { name: "Update config", value: "update" },
        { name: "Restart device", value: "restart" },
        { name: "Back", value: "back" },
      ],
    });

    if (action === "back") {
      return;
    }

    if (action === "read") {
      await showDeviceConfig(portPath);
      continue;
    }

    if (action === "update") {
      await updateDeviceConfigInteractive(portPath);
      continue;
    }

    if (action === "restart") {
      const confirmed = await confirm({
        message: `Restart device on ${portPath}?`,
        default: true,
      });
      if (!confirmed) {
        continue;
      }

      await restartDevice(portPath);
      writeLine(chalk.green(`Restart command sent to ${portPath}.`));
    }
  }
}

async function showDeviceConfig(portPath: string) {
  const config = await getDeviceConfig(portPath);
  writeLine("");
  writeLine(chalk.cyan(`Device config from ${portPath}`));
  writeLine(`${chalk.gray("bikeId")}: ${config.bikeId}`);
  writeLine(`${chalk.gray("wifiSsid")}: ${config.wifiSsid}`);
  writeLine(`${chalk.gray("wifiPass")}: ${config.wifiPass || "-"}`);
  writeLine(`${chalk.gray("mqttBrokerIP")}: ${config.mqttBrokerIP}`);
  writeLine(`${chalk.gray("mqttPort")}: ${String(config.mqttPort)}`);
  writeLine(`${chalk.gray("mqttUsername")}: ${config.mqttUsername || "-"}`);
  writeLine(`${chalk.gray("mqttPassword")}: ${config.mqttPassword || "-"}`);
}

async function updateDeviceConfigInteractive(portPath: string) {
  const currentConfig = await getDeviceConfig(portPath);

  const bikeId = await input({ message: "Bike ID", default: currentConfig.bikeId });
  const wifiSsid = await input({ message: "Wi-Fi SSID", default: currentConfig.wifiSsid });
  const wifiPass = await input({ message: "Wi-Fi password", default: currentConfig.wifiPass });
  const mqttBrokerIP = await input({ message: "MQTT broker IP", default: currentConfig.mqttBrokerIP });
  const mqttPortValue = await input({ message: "MQTT port", default: String(currentConfig.mqttPort) });
  const mqttUsername = await input({ message: "MQTT username", default: currentConfig.mqttUsername });
  const mqttPassword = await input({ message: "MQTT password", default: currentConfig.mqttPassword });

  const mqttPort = Number(mqttPortValue);
  if (!Number.isInteger(mqttPort) || mqttPort <= 0) {
    throw new Error(`Invalid MQTT port: ${mqttPortValue}`);
  }

  writeLine("");
  writeLine(chalk.cyan(`New device config for ${portPath}`));
  writeLine(`${chalk.gray("bikeId")}: ${bikeId}`);
  writeLine(`${chalk.gray("wifiSsid")}: ${wifiSsid}`);
  writeLine(`${chalk.gray("wifiPass")}: ${wifiPass || "-"}`);
  writeLine(`${chalk.gray("mqttBrokerIP")}: ${mqttBrokerIP}`);
  writeLine(`${chalk.gray("mqttPort")}: ${String(mqttPort)}`);
  writeLine(`${chalk.gray("mqttUsername")}: ${mqttUsername || "-"}`);
  writeLine(`${chalk.gray("mqttPassword")}: ${mqttPassword || "-"}`);

  const confirmed = await confirm({
    message: `Save this config to ${portPath} and restart device?`,
    default: true,
  });
  if (!confirmed) {
    return;
  }

  await setDeviceConfig(portPath, {
    bikeId,
    wifiSsid,
    wifiPass,
    mqttBrokerIP,
    mqttPort,
    mqttUsername,
    mqttPassword,
  });

  writeLine(chalk.green(`Saved config to ${portPath}. Device is restarting.`));
}

async function choosePersona(connectionString: string, repoRoot: string, currentPersonaEmail: string | null) {
  const personas = await listSeededPersonas(connectionString);
  if (personas.length === 0) {
    writeLine(chalk.yellow("No seeded personas found."));
    return currentPersonaEmail;
  }

  const selected = await select<string>({
    message: "Choose seeded persona",
    choices: [
      ...personas.map(persona => ({
        name: `${persona.handle.padEnd(12)} ${persona.role.padEnd(10)} ${persona.email}`,
        value: persona.email,
      })),
      { name: "Clear current persona", value: "__clear" },
      { name: "Back", value: "__back" },
    ],
    pageSize: 14,
  });

  if (selected === "__back") {
    return currentPersonaEmail;
  }

  if (selected === "__clear") {
    await clearCurrentPersona(repoRoot);
    writeLine(chalk.yellow("Cleared current persona."));
    return null;
  }

  const persona = personas.find(item => item.email === selected)!;
  await writeCurrentPersona(repoRoot, persona);
  writeLine(chalk.green(`Current persona set to ${persona.handle} (${persona.email}).`));
  printPersona(persona, persona.email);
  return persona.email;
}

async function bindUserCardInteractive(connectionString: string) {
  const personas = await listSeededPersonas(connectionString);
  if (personas.length === 0) {
    writeLine(chalk.yellow("No seeded personas found."));
    return;
  }

  const selected = await select<string>({
    message: "Choose user to bind card",
    choices: [
      ...personas.map(persona => ({
        name: `${persona.handle.padEnd(12)} ${persona.role.padEnd(10)} ${persona.email} ${chalk.gray(persona.nfcCardUid ?? "")}`.trim(),
        value: persona.email,
      })),
      { name: "Back", value: "__back" },
    ],
    pageSize: 14,
  });

  if (selected === "__back") {
    return;
  }

  const cardUid = await input({
    message: "Card UID (type --clear to remove current binding)",
    default: "",
  });

  if (!cardUid) {
    return;
  }

  const updated = await updateUserCardBinding({
    connectionString,
    target: selected,
    cardUid: cardUid === "--clear" ? null : cardUid,
  });

  writeLine(chalk.green(`Updated card binding for ${updated.fullName}`));
  writeLine(`${chalk.gray("email")}: ${updated.email}`);
  writeLine(`${chalk.gray("handle")}: ${updated.handle}`);
  writeLine(`${chalk.gray("nfcCardUid")}: ${updated.nfcCardUid ?? "-"}`);
}

async function endRentalAsStaffInteractive(
  connectionString: string,
  currentPersona: Awaited<ReturnType<typeof resolvePersona>>,
) {
  if (!currentPersona || currentPersona.role !== "STAFF") {
    writeLine(chalk.yellow("Current persona is not a staff user."));
    return;
  }

  if (!currentPersona.stationId) {
    writeLine(chalk.yellow("Current staff persona has no station assignment."));
    return;
  }

  const rentals = await listActiveRentals({ connectionString, limit: 20 });
  if (rentals.length === 0) {
    writeLine(chalk.yellow("No active rentals found."));
    return;
  }

  const selectedRentalId = await select<string>({
    message: `Choose rental to end at station ${currentPersona.stationId}`,
    choices: [
      ...rentals.map(rental => ({
        name: `${rental.bikeNumber.padEnd(8)} ${rental.userEmail.padEnd(28)} ${formatTimestamp(rental.startTime)} ${rental.id}`,
        value: rental.id,
      })),
      { name: "Back", value: "__back" },
    ],
    pageSize: 14,
  });

  if (selectedRentalId === "__back") {
    return;
  }

  const chosenRental = rentals.find(rental => rental.id === selectedRentalId);
  if (!chosenRental) {
    writeLine(chalk.red(`Rental not found in selection: ${selectedRentalId}`));
    return;
  }

  const confirmed = await confirm({
    message: `End rental ${chosenRental.id} for ${chosenRental.userEmail}?`,
    default: true,
  });

  if (!confirmed) {
    return;
  }

  const completedRental = await confirmRentalReturnAsStaff({
    connectionString,
    rentalId: chosenRental.id,
    staffUserId: currentPersona.id,
    stationId: currentPersona.stationId,
  });

  writeLine(chalk.green(`Completed rental ${completedRental.id}`));
  writeLine(`${chalk.gray("bikeId")}: ${completedRental.bikeId}`);
  writeLine(`${chalk.gray("userId")}: ${completedRental.userId}`);
  writeLine(`${chalk.gray("status")}: ${completedRental.status}`);
  writeLine(`${chalk.gray("endTime")}: ${formatTimestamp(completedRental.endTime ?? null)}`);
}

async function browsePersonaRentals(
  connectionString: string,
  currentPersona: Awaited<ReturnType<typeof resolvePersona>>,
) {
  if (!currentPersona) {
    writeLine(chalk.yellow("Choose a persona first."));
    return;
  }

  const status = await select<"ALL" | "RENTED" | "COMPLETED" | "CANCELLED" | "__back">({
    message: "Choose rental status",
    choices: [
      { name: "All", value: "ALL" },
      { name: "Rented", value: "RENTED" },
      { name: "Completed", value: "COMPLETED" },
      { name: "Cancelled", value: "CANCELLED" },
      { name: "Back", value: "__back" },
    ],
  });

  if (status === "__back") {
    return;
  }

  const rentals = await listPersonaRentalHistory({
    connectionString,
    userId: currentPersona.id,
    status: status === "ALL" ? undefined : status,
    limit: 20,
  });

  if (rentals.length === 0) {
    writeLine(chalk.yellow("No rentals found for current persona."));
    return;
  }

  const selectedRentalId = await select<string>({
    message: `Choose rental for ${currentPersona.handle}`,
    choices: [
      ...rentals.map(rental => ({
        name: `${rental.status.padEnd(10)} ${rental.bikeNumber.padEnd(8)} ${formatTimestamp(rental.startTime)} ${rental.id}`,
        value: rental.id,
      })),
      { name: "Back", value: "__back" },
    ],
    pageSize: 14,
  });

  if (selectedRentalId === "__back") {
    return;
  }

  await inspectPersonaRental(connectionString, currentPersona.id, selectedRentalId);
}

async function inspectPersonaRental(connectionString: string, userId: string, rentalId: string) {
  while (true) {
    const rental = await getPersonaRentalDetail({ connectionString, userId, rentalId });
    if (!rental) {
      writeLine(chalk.red(`Rental not found: ${rentalId}`));
      return;
    }

    writeLine("");
    writeLine(chalk.cyan(`Rental ${rental.id}`));
    writeLine(`${chalk.gray("status")}: ${rental.status}`);
    writeLine(`${chalk.gray("bike")}: ${rental.bikeNumber} ${chalk.gray(`(${rental.bikeId})`)}`);
    writeLine(`${chalk.gray("chip")}: ${rental.bikeChipId}`);
    writeLine(`${chalk.gray("bikeStatus")}: ${rental.bikeStatus}`);
    writeLine(`${chalk.gray("startStation")}: ${rental.startStationName} ${chalk.gray(`(${rental.startStationAddress})`)}`);
    writeLine(`${chalk.gray("endStation")}: ${rental.endStationName ?? "-"} ${rental.endStationAddress ? chalk.gray(`(${rental.endStationAddress})`) : ""}`.trimEnd());
    writeLine(`${chalk.gray("startTime")}: ${formatTimestamp(rental.startTime)}`);
    writeLine(`${chalk.gray("endTime")}: ${formatTimestamp(rental.endTime)}`);
    writeLine(`${chalk.gray("duration")}: ${rental.durationMinutes ?? "-"}`);
    writeLine(`${chalk.gray("totalPrice")}: ${rental.totalPrice ?? "-"}`);
    writeLine(`${chalk.gray("updated")}: ${formatTimestamp(rental.updatedAt)}`);
    writeLine(`${chalk.gray("returnConfirmedAt")}: ${formatTimestamp(rental.returnConfirmedAt)}`);
    writeLine(`${chalk.gray("returnMethod")}: ${rental.returnConfirmationMethod ?? "-"}`);
    writeLine(`${chalk.gray("handoverStatus")}: ${rental.returnHandoverStatus ?? "-"}`);
    writeLine(`${chalk.gray("confirmedBy")}: ${rental.returnConfirmedByUserEmail ?? rental.returnConfirmedByUserId ?? "-"}`);
    writeLine(`${chalk.gray("returnStation")}: ${rental.returnConfirmationStationName ?? rental.returnConfirmationStationId ?? "-"}`);
    writeLine(`${chalk.gray("billedTotal")}: ${rental.billedTotalAmount ?? "-"}`);
    writeLine(`${chalk.gray("billedBase")}: ${rental.billedBaseAmount ?? "-"}`);
    writeLine(`${chalk.gray("billedOvertime")}: ${rental.billedOvertimeAmount ?? "-"}`);
    writeLine(`${chalk.gray("couponDiscount")}: ${rental.billedCouponDiscountAmount ?? "-"}`);
    writeLine(`${chalk.gray("subscriptionDiscount")}: ${rental.billedSubscriptionDiscountAmount ?? "-"}`);
    writeLine(`${chalk.gray("depositForfeited")}: ${rental.billedDepositForfeited ?? "-"}`);
    writeLine(`${chalk.gray("penalties")}: ${rental.penaltiesCount} item(s), total ${rental.penaltiesTotalAmount ?? 0}`);

    writeLine(chalk.gray("Press r to refresh, b/Enter/q to go back."));
    const action = await readDetailAction({ allowInspectBike: false });
    if (action === "refresh") {
      continue;
    }
    return;
  }
}

async function browseJobs(connectionString: string, status: EmailJobStatus) {
  const jobs = await listEmailJobs({ connectionString, status, limit: 20 });
  if (jobs.length === 0) {
    writeLine(chalk.yellow("No email jobs found."));
    return;
  }

  const selectedId = await select<string>({
    message: "Select email job",
    choices: [
      ...jobs.map(job => ({
        name: `${job.status.padEnd(9)} ${job.payloadKind.padEnd(16)} ${job.to} ${job.subject}`,
        value: job.id,
      })),
      { name: "Back", value: "__back" },
    ],
    pageSize: 12,
  });

  if (selectedId !== "__back") {
    await showJob(connectionString, selectedId);
  }
}

async function showJob(connectionString: string, id: string) {
  const job = await getEmailJobById({ connectionString, id });
  if (!job) {
    writeLine(chalk.red(`Email job not found: ${id}`));
    return;
  }

  writeLine("");
  writeLine(chalk.cyan(`Email job ${job.id}`));
  writeLine(`${chalk.gray("status")}: ${job.status}`);
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

  await confirm({ message: "Back to menu", default: true });
}

async function browseStations(connectionString: string) {
  const search = await input({ message: "Search station name or id (blank for recent)", default: "" });
  const stations = await listStations({
    connectionString,
    limit: 20,
    search: search.trim() || undefined,
  });

  if (stations.length === 0) {
    writeLine(chalk.yellow("No stations found."));
    return;
  }

  const selected = await select<string>({
    message: "Select station",
    choices: [
      ...stations.map(station => ({
        name: `${station.name.padEnd(24)} bikes ${String(station.totalBikes).padStart(2)}  available ${String(station.availableBikes).padStart(2)}  ${station.id}`,
        value: station.id,
      })),
      { name: "Back", value: "__back" },
    ],
    pageSize: 14,
  });

  if (selected !== "__back") {
    await inspectStation(connectionString, selected);
  }
}

async function inspectStation(connectionString: string, value: string) {
  while (true) {
    const station = await getStationInspection({ connectionString, value });
    if (!station) {
      writeLine(chalk.red(`Station not found: ${value}`));
      return;
    }

    writeLine("");
    writeLine(chalk.cyan(`Station ${station.name}`));
    writeLine(`${chalk.gray("id")}: ${station.id}`);
    writeLine(`${chalk.gray("type")}: ${station.stationType}`);
    writeLine(`${chalk.gray("address")}: ${station.address}`);
    writeLine(`${chalk.gray("capacity")}: ${station.totalBikes}/${station.totalCapacity} bikes`);
    writeLine(`${chalk.gray("returnSlots")}: ${station.returnSlotLimit}`);
    writeLine(`${chalk.gray("status")}: available ${station.availableBikes}, booked ${station.bookedBikes}, reserved ${station.reservedBikes}, broken ${station.brokenBikes}, maintained ${station.maintainedBikes}, unavailable ${station.unavailableBikes}`);
    writeLine(`${chalk.gray("updated")}: ${formatTimestamp(station.updatedAt)}`);
    writeLine(chalk.magenta("bikes in station"));
    if (station.bikes.length === 0) {
      writeLine(chalk.yellow("  No bikes in this station."));
    }
    else {
      for (const bike of station.bikes) {
        const activity = [
          bike.activeRentalId ? chalk.green("active-rental") : null,
          bike.pendingReservationId ? chalk.yellow("pending-reservation") : null,
        ].filter(Boolean).join(", ");
        writeLine(`  ${chalk.white(bike.bikeNumber.padEnd(8))} ${chalk.gray(bike.id)} ${bike.status.padEnd(11)} ${bike.chipId}${activity ? ` ${chalk.gray(`(${activity})`)}` : ""}`);
      }
    }

    writeLine(chalk.gray("Press r to refresh, i to inspect a bike, b/Enter/q to go back."));
    const action = await readDetailAction({ allowInspectBike: station.bikes.length > 0 });
    if (action === "refresh") {
      continue;
    }
    if (action === "inspect-bike") {
      const bikeId = await select<string>({
        message: "Select bike",
        choices: [
          ...station.bikes.map(bike => ({
            name: `${bike.bikeNumber} ${bike.status} ${bike.id}`,
            value: bike.id,
          })),
          { name: "Back", value: "__back" },
        ],
        pageSize: 14,
      });

      if (bikeId !== "__back") {
        await inspectBike(connectionString, bikeId);
      }
      continue;
    }

    return;
  }
}

async function inspectBike(connectionString: string, value: string) {
  while (true) {
    const bike = await getBikeInspection({ connectionString, value });
    if (!bike) {
      writeLine(chalk.red(`Bike not found: ${value}`));
      return;
    }

    writeLine("");
    writeLine(chalk.cyan(`Bike ${bike.bikeNumber}`));
    writeLine(`${chalk.gray("id")}: ${bike.id}`);
    writeLine(`${chalk.gray("chip")}: ${bike.chipId}`);
    writeLine(`${chalk.gray("status")}: ${bike.status}`);
    writeLine(`${chalk.gray("station")}: ${bike.stationName ?? "-"} ${bike.stationAddress ? `(${bike.stationAddress})` : ""}`);
    writeLine(`${chalk.gray("supplier")}: ${bike.supplierName ?? "-"}`);
    writeLine(`${chalk.gray("activeRental")}: ${bike.activeRentalId ?? "-"}`);
    writeLine(`${chalk.gray("pendingReservation")}: ${bike.pendingReservationId ?? "-"}`);
    writeLine(`${chalk.gray("created")}: ${formatTimestamp(bike.createdAt)}`);
    writeLine(`${chalk.gray("updated")}: ${formatTimestamp(bike.updatedAt)}`);
    writeLine(chalk.magenta("recent rentals"));
    if (bike.recentRentals.length === 0) {
      writeLine(chalk.yellow("  No rentals found."));
    }
    else {
      for (const rental of bike.recentRentals) {
        writeLine(`  ${chalk.white(rental.id)} ${rental.status.padEnd(10)} ${formatTimestamp(rental.startTime)} -> ${formatTimestamp(rental.endTime)} ${chalk.gray(rental.userEmail)}`);
      }
    }

    writeLine(chalk.gray("Press r to refresh, b/Enter/q to go back."));
    const action = await readDetailAction({ allowInspectBike: false });
    if (action === "refresh") {
      continue;
    }
    return;
  }
}

async function readDetailAction(args: { allowInspectBike: boolean }) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
    return "back" as const;
  }

  return new Promise<"refresh" | "back" | "inspect-bike">((resolve) => {
    const stdin = process.stdin;
    const previousRawMode = stdin.isRaw;
    emitKeypressEvents(stdin);
    stdin.setRawMode(true);
    stdin.resume();
    let cleanup = () => {};

    function onKeypress(_value: string, key: { ctrl?: boolean; name?: string }) {
      if (key.ctrl && key.name === "c") {
        cleanup();
        process.exit(130);
      }

      if (key.name === "r") {
        cleanup();
        resolve("refresh");
        return;
      }

      if (args.allowInspectBike && key.name === "i") {
        cleanup();
        resolve("inspect-bike");
        return;
      }

      if (key.name === "return" || key.name === "escape" || key.name === "b" || key.name === "q") {
        cleanup();
        resolve("back");
      }
    }

    cleanup = () => {
      stdin.off("keypress", onKeypress);
      stdin.setRawMode(Boolean(previousRawMode));
      stdin.pause();
    };

    stdin.on("keypress", onKeypress);
  });
}
