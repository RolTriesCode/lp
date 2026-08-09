import { z } from "zod";
import {
  ScheduleEntryInputSchema,
  ScheduleEntryListSchema,
  ScheduleEntrySchema,
  type ScheduleEntry,
  type ScheduleEntryInput,
  type ScheduleEntryKind,
  type ScheduleEntryStatus,
} from "@/schemas/schedule";

export type ScheduleQuery = {
  start: string;
  end: string;
  kind?: ScheduleEntryKind;
  status?: ScheduleEntryStatus;
};

export class ScheduleRequestError extends Error {
  constructor(
    message: string,
    readonly code = "SCHEDULE_REQUEST_FAILED",
    readonly status = 500,
    readonly remote?: ScheduleEntry
  ) {
    super(message);
    this.name = "ScheduleRequestError";
  }
}

const responseSchema = z.object({ success: z.boolean(), data: z.unknown().optional(), error: z.object({
  code: z.string().optional(),
  message: z.string().optional(),
  remote: z.unknown().optional(),
}).optional() });

async function requireData(response: Response): Promise<unknown> {
  const body = responseSchema.safeParse(await response.json().catch(() => null));
  if (!body.success) throw new ScheduleRequestError("The schedule service returned an invalid response.", "INVALID_SCHEDULE_RESPONSE", 502);
  if (!response.ok || !body.data.success) {
    const error = body.data.error;
    throw new ScheduleRequestError(
      error?.message ?? "The schedule is temporarily unavailable.",
      error?.code,
      response.status,
      error?.remote ? ScheduleEntrySchema.parse(error.remote) : undefined
    );
  }
  return body.data.data;
}

export interface IScheduleRepository {
  list(query: ScheduleQuery): Promise<ScheduleEntry[]>;
  create(input: ScheduleEntryInput): Promise<ScheduleEntry>;
  update(id: string, input: ScheduleEntryInput, expectedRevision: number): Promise<ScheduleEntry | null>;
  delete(id: string): Promise<void>;
}

export class RemoteScheduleRepository implements IScheduleRepository {
  async list(query: ScheduleQuery): Promise<ScheduleEntry[]> {
    const params = new URLSearchParams({ start: query.start, end: query.end });
    if (query.kind) params.set("kind", query.kind);
    if (query.status) params.set("status", query.status);
    const response = await fetch(`/api/schedule?${params}`, { cache: "no-store", credentials: "same-origin" });
    return ScheduleEntryListSchema.parse(await requireData(response));
  }

  async create(input: ScheduleEntryInput): Promise<ScheduleEntry> {
    const response = await fetch("/api/schedule", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ScheduleEntryInputSchema.parse(input)),
    });
    return ScheduleEntrySchema.parse(await requireData(response));
  }

  async update(id: string, input: ScheduleEntryInput, expectedRevision: number): Promise<ScheduleEntry | null> {
    const response = await fetch(`/api/schedule/${encodeURIComponent(id)}`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: ScheduleEntryInputSchema.parse(input), expectedRevision }),
    });
    const data = await requireData(response);
    return data === null ? null : ScheduleEntrySchema.parse(data);
  }

  async delete(id: string): Promise<void> {
    const response = await fetch(`/api/schedule/${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    if (response.status === 204) return;
    await requireData(response);
  }
}

export const defaultScheduleRepository: IScheduleRepository = new RemoteScheduleRepository();
