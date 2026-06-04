export type LocalUser = { id: string; name: string; email: string };

const KEY = "ths_user";

export function getLocalUser(): LocalUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LocalUser) : null;
  } catch {
    return null;
  }
}

export function setLocalUser(u: LocalUser) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(u));
  window.localStorage.setItem("userId", u.id);
  window.localStorage.setItem("userEmail", u.email);
}

export function clearLocalUser() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.localStorage.removeItem("userId");
  window.localStorage.removeItem("userEmail");
}

export type AdminAuth = { token: string; userId: string };

const ADMIN_AUTH_KEY = "ths_admin_auth";
export function getAdminAuth(): AdminAuth | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ADMIN_AUTH_KEY);
    return raw ? (JSON.parse(raw) as AdminAuth) : null;
  } catch {
    return null;
  }
}
export function setAdminAuth(auth: AdminAuth) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify(auth));
}
export function clearAdminAuth() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ADMIN_AUTH_KEY);
}
