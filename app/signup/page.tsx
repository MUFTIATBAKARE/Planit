import { redirect } from "next/navigation";

/**
 * Sign-up is a tab on the single-screen auth page, so this route simply keeps
 * `/signup` working for bookmarks, ads and external links.
 */
export default function SignUpPage(): never {
  redirect("/login");
}
