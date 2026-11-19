import type { Metadata } from "next";
import { AccountSettings } from "./account-settings";

export const metadata: Metadata = { title: "My Account | SI Tutor" };

export default function AccountPage() {
  return <AccountSettings />;
}
