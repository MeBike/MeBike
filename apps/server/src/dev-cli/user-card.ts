import { resolveUserCardTarget } from "./personas";
import { updateUserCardUid } from "./runtime";

export async function updateUserCardBinding(args: {
  connectionString: string;
  target: string;
  cardUid: string | null;
}) {
  const user = await resolveUserCardTarget(args.connectionString, args.target);
  if (!user) {
    throw new Error(`User not found: ${args.target}`);
  }

  const updated = await updateUserCardUid({
    userId: user.id,
    nfcCardUid: args.cardUid,
  });

  return {
    ...user,
    nfcCardUid: updated.nfcCardUid,
  };
}
