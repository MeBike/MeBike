export function requiredAvailableBikesForReservation(totalCapacity: number): number {
  return Math.floor(totalCapacity / 2) + 1;
}

export function stationCanAcceptReservation(args: {
  totalCapacity: number;
  availableBikes: number;
}): boolean {
  return args.availableBikes >= requiredAvailableBikesForReservation(args.totalCapacity);
}
