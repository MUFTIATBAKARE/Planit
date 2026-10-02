import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth } from "./firebase";

/** Registers a new user and stores the optional display name on the profile. */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<User> {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password,
  );

  const name = displayName.trim();
  if (name) {
    await updateProfile(credential.user, { displayName: name });
  }

  return credential.user;
}

/** Signs an existing user in with email + password. */
export async function signInWithEmail(
  email: string,
  password: string,
): Promise<User> {
  const credential = await signInWithEmailAndPassword(
    auth,
    email.trim(),
    password,
  );
  return credential.user;
}

/** Terminates the current session and clears Firebase's local persistence. */
export async function logOut(): Promise<void> {
  await signOut(auth);
}
