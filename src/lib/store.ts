import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { APPLICATION_STATUSES, type Application, type ApplicationInput, type Role } from "./types";
import { getServerSupabase, supabaseBackendLabel } from "./supabase";
import { resolveApplicationRoleId, type RoleRef } from "./link-role";
import { normalizeUrl } from "./url";

const LOCAL_STORE_PATH = path.join(process.cwd(), ".data", "store.json");

type LocalStoreFile = {
  roles: Role[];
  applications: Application[];
};

function assertStatus(status: string): asserts status is Application["status"] {
  if (!(APPLICATION_STATUSES as readonly string[]).includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === "string" && value) return [value];
  return [];
}

function mapRoleRow(row: Record<string, unknown>): Role {
  return {
    id: String(row.id),
    source: String(row.source ?? ""),
    company: String(row.company ?? ""),
    title: String(row.title ?? ""),
    url: String(row.url ?? ""),
    category: (row.category as string | null) ?? null,
    locations: asStringArray(row.locations),
    skills: asStringArray(row.skills),
    posted_at: (row.posted_at as string | null) ?? null,
    terms: (row.terms as string | null) ?? null,
    raw: row.raw ?? null,
    first_seen_at: String(row.first_seen_at),
    last_seen_at: String(row.last_seen_at),
    fit_tag: (row.fit_tag as Role["fit_tag"]) ?? null,
    rank_score: row.rank_score == null ? null : Number(row.rank_score),
  };
}

function mapApplicationRow(row: Record<string, unknown>): Application {
  return {
    id: String(row.id),
    role_id: (row.role_id as string | null) ?? null,
    url: String(row.url ?? ""),
    company: (row.company as string | null) ?? null,
    title: (row.title as string | null) ?? null,
    status: row.status as Application["status"],
    notes: String(row.notes ?? ""),
    applied_at: (row.applied_at as string | null) ?? null,
    updated_at: String(row.updated_at),
  };
}

async function readLocal(): Promise<LocalStoreFile> {
  try {
    const raw = await readFile(LOCAL_STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as LocalStoreFile;
    return {
      roles: parsed.roles ?? [],
      applications: parsed.applications ?? [],
    };
  } catch {
    return { roles: [], applications: [] };
  }
}

async function writeLocal(store: LocalStoreFile): Promise<void> {
  await mkdir(path.dirname(LOCAL_STORE_PATH), { recursive: true });
  await writeFile(LOCAL_STORE_PATH, JSON.stringify(store, null, 2));
}

export async function listRoles(): Promise<Role[]> {
  const supabase = getServerSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("roles")
      .select("*")
      .order("rank_score", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => mapRoleRow(row as Record<string, unknown>));
  }
  const local = await readLocal();
  return [...local.roles].sort((a, b) => (b.rank_score ?? 0) - (a.rank_score ?? 0));
}

export async function listApplications(): Promise<Application[]> {
  const supabase = getServerSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => mapApplicationRow(row as Record<string, unknown>));
  }
  const local = await readLocal();
  return [...local.applications].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function upsertRoles(incoming: Role[]): Promise<number> {
  if (incoming.length === 0) return 0;
  const supabase = getServerSupabase();
  const now = new Date().toISOString();

  if (supabase) {
    const ids = incoming.map((role) => role.id);
    const existing = new Map<string, string>();
    for (let i = 0; i < ids.length; i += 200) {
      const chunk = ids.slice(i, i + 200);
      const { data, error } = await supabase
        .from("roles")
        .select("id, first_seen_at")
        .in("id", chunk);
      if (error) throw new Error(error.message);
      for (const row of data ?? []) {
        existing.set(row.id as string, row.first_seen_at as string);
      }
    }

    const rows = incoming.map((role) => ({
      ...role,
      first_seen_at: existing.get(role.id) ?? role.first_seen_at ?? now,
      last_seen_at: now,
    }));

    for (let i = 0; i < rows.length; i += 200) {
      const chunk = rows.slice(i, i + 200);
      const { error } = await supabase.from("roles").upsert(chunk, { onConflict: "id" });
      if (error) throw new Error(error.message);
    }
    const incomingIds = new Set(incoming.map((role) => role.id));
    const { data: catalog, error: catalogError } = await supabase.from("roles").select("id");
    if (catalogError) throw new Error(catalogError.message);
    const staleIds = (catalog ?? [])
      .map((row) => row.id as string)
      .filter((id) => !incomingIds.has(id));
    for (let i = 0; i < staleIds.length; i += 200) {
      const chunk = staleIds.slice(i, i + 200);
      const { error } = await supabase.from("roles").delete().in("id", chunk);
      if (error) throw new Error(error.message);
    }
    return rows.length;
  }

  if (process.env.VERCEL) {
    throw new Error("Supabase env vars are required on Vercel.");
  }

  const local = await readLocal();
  const byId = new Map(local.roles.map((role) => [role.id, role]));
  local.roles = incoming.map((role) => {
    const prev = byId.get(role.id);
    return {
      ...role,
      first_seen_at: prev?.first_seen_at ?? role.first_seen_at ?? now,
      last_seen_at: now,
    };
  });
  await writeLocal(local);
  return incoming.length;
}

export async function listRoleRefs(): Promise<RoleRef[]> {
  const supabase = getServerSupabase();
  if (supabase) {
    const { data, error } = await supabase.from("roles").select("id, url");
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({
      id: String(row.id),
      url: String(row.url ?? ""),
    }));
  }
  const local = await readLocal();
  return local.roles.map((role) => ({ id: role.id, url: role.url }));
}

export async function upsertApplications(inputs: ApplicationInput[]): Promise<Application[]> {
  const knownRoles = await listRoleRefs();
  const applications: Application[] = [];
  for (const input of inputs) {
    applications.push(await upsertApplication(input, knownRoles));
  }
  return applications;
}

export async function upsertApplication(
  input: ApplicationInput,
  knownRoles?: RoleRef[],
): Promise<Application> {
  assertStatus(input.status);
  const url = normalizeUrl(input.url);
  if (!url) throw new Error("A job URL is required.");
  const now = new Date().toISOString();
  const applied_at =
    input.applied_at ??
    (input.status === "applied" || input.status === "interviewing" || input.status === "oa"
      ? now
      : null);
  const refs = knownRoles ?? (await listRoleRefs());

  const supabase = getServerSupabase();
  if (supabase) {
    const { data: existing } = await supabase
      .from("applications")
      .select("*")
      .eq("url", url)
      .maybeSingle();

    const role_id = resolveApplicationRoleId(
      { role_id: input.role_id ?? (existing?.role_id as string | null) ?? null, url },
      refs,
    );

    const payload = {
      id: existing?.id ?? input.id ?? randomUUID(),
      role_id,
      url,
      company: input.company ?? existing?.company ?? null,
      title: input.title ?? existing?.title ?? null,
      status: input.status,
      notes: input.notes ?? existing?.notes ?? "",
      applied_at: existing?.applied_at ?? applied_at,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from("applications")
      .upsert(payload, { onConflict: "url" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapApplicationRow(data as Record<string, unknown>);
  }

  if (process.env.VERCEL) {
    throw new Error("Supabase env vars are required on Vercel.");
  }

  const local = await readLocal();
  const existing = local.applications.find((app) => app.url === url);
  const role_id = resolveApplicationRoleId(
    { role_id: input.role_id ?? existing?.role_id ?? null, url },
    refs,
  );
  const next: Application = {
    id: existing?.id ?? input.id ?? randomUUID(),
    role_id,
    url,
    company: input.company ?? existing?.company ?? null,
    title: input.title ?? existing?.title ?? null,
    status: input.status,
    notes: input.notes ?? existing?.notes ?? "",
    applied_at: existing?.applied_at ?? applied_at,
    updated_at: now,
  };
  local.applications = [next, ...local.applications.filter((app) => app.url !== url)];
  await writeLocal(local);
  return next;
}

export async function updateApplication(
  id: string,
  patch: Partial<Pick<Application, "status" | "notes" | "applied_at">>,
): Promise<Application> {
  if (patch.status) assertStatus(patch.status);
  const now = new Date().toISOString();
  const supabase = getServerSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("applications")
      .update({ ...patch, updated_at: now })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapApplicationRow(data as Record<string, unknown>);
  }

  const local = await readLocal();
  const index = local.applications.findIndex((app) => app.id === id);
  if (index < 0) throw new Error("Application not found.");
  const next = { ...local.applications[index], ...patch, updated_at: now };
  local.applications[index] = next;
  await writeLocal(local);
  return next;
}

export async function lastIngestAt(): Promise<string | null> {
  const roles = await listRoles();
  if (roles.length === 0) return null;
  return roles.reduce((latest, role) => {
    return role.last_seen_at > latest ? role.last_seen_at : latest;
  }, roles[0].last_seen_at);
}

export function currentBackend(): "supabase" | "local" {
  return supabaseBackendLabel();
}
