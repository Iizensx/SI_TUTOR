import Image from "next/image";

import type { UserProfile } from "@/lib/auth-types";
import styles from "./account-avatar.module.css";

export const avatarOptions = ["blue", "violet", "green", "amber"] as const;
export type AvatarColor = (typeof avatarOptions)[number];

export function AccountAvatar({ user, color }: { user: Pick<UserProfile, "avatar">; color?: AvatarColor }) {
  const avatar = color ?? user.avatar ?? "blue";

  return (
    <span className={styles.avatar} data-color={avatar} aria-hidden="true">
      <Image src={"/account-avatars/" + avatar + ".png"} alt="" fill sizes="96px" />
    </span>
  );
}
