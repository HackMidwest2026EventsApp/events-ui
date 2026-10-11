import { Avatar } from "@mantine/core";
import { IconUser } from "@tabler/icons-react";

/** Mantine's palette, minus the ones that read as a status rather than a
 *  person. Picked by email so an account keeps the same circle every visit. */
const COLORS = [
  "blue",
  "violet",
  "grape",
  "indigo",
  "teal",
  "cyan",
  "pink",
  "orange",
] as const;

const colorFor = (email: string) => {
  let hash = 0;
  for (const char of email) hash = (hash * 31 + char.codePointAt(0)!) | 0;
  return COLORS[Math.abs(hash) % COLORS.length];
};

/** "ada.lovelace@example.com" -> "AL", "guest@example.com" -> "GU". */
const initialsFor = (email: string) => {
  const local = email.split("@")[0] ?? "";
  const words = local.split(/[._+-]+/).filter(Boolean);
  const letters =
    words.length > 1 ? words[0][0] + words[1][0] : local.slice(0, 2);
  return letters.toUpperCase() || "?";
};

interface Props {
  /** Undefined while signed out: the circle falls back to a generic figure. */
  email?: string;
  size?: number;
}

export const UserAvatar = ({ email, size = 38 }: Props) => (
  <Avatar
    // radius="xl" on a square box is Mantine's circle.
    radius="xl"
    size={size}
    variant="filled"
    color={email ? colorFor(email) : "gray"}
    alt={email ?? "Not signed in"}
  >
    {email ? initialsFor(email) : <IconUser size={size * 0.55} />}
  </Avatar>
);
