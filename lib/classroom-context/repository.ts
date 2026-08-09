import { z } from "zod";
import {
  ClassroomContextApplicationSchema,
  type ClassroomContextApplication,
} from "@/schemas/classroom-context";

export const ClassroomContextEnvelopeSchema = z.object({
  value: ClassroomContextApplicationSchema,
  revision: z.number().int().positive().nullable(),
  updatedAt: z.iso.datetime({ offset: true }).nullable(),
});

export type ClassroomContextEnvelope = z.infer<typeof ClassroomContextEnvelopeSchema>;

export class ClassroomContextRequestError extends Error {
  constructor(
    message: string,
    readonly code = "CLASSROOM_CONTEXT_REQUEST_FAILED",
    readonly status = 500,
    readonly remote?: ClassroomContextEnvelope
  ) {
    super(message);
    this.name = "ClassroomContextRequestError";
  }
}

const responseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.object({ code: z.string().optional(), message: z.string().optional(), remote: z.unknown().optional() }).optional(),
});

async function requireEnvelope(response: Response): Promise<ClassroomContextEnvelope> {
  const parsed = responseSchema.safeParse(await response.json().catch(() => null));
  if (!parsed.success) throw new ClassroomContextRequestError("The classroom settings service returned an invalid response.", "INVALID_CLASSROOM_CONTEXT_RESPONSE", 502);
  if (!response.ok || !parsed.data.success) {
    const error = parsed.data.error;
    throw new ClassroomContextRequestError(
      error?.message ?? "Classroom defaults are temporarily unavailable.",
      error?.code,
      response.status,
      error?.remote ? ClassroomContextEnvelopeSchema.parse(error.remote) : undefined
    );
  }
  return ClassroomContextEnvelopeSchema.parse(parsed.data.data);
}

export interface IClassroomContextRepository {
  get(): Promise<ClassroomContextEnvelope>;
  save(value: ClassroomContextApplication, expectedRevision: number | null): Promise<ClassroomContextEnvelope>;
}

export class RemoteClassroomContextRepository implements IClassroomContextRepository {
  async get(): Promise<ClassroomContextEnvelope> {
    return requireEnvelope(await fetch("/api/classroom-context", { cache: "no-store", credentials: "same-origin" }));
  }

  async save(value: ClassroomContextApplication, expectedRevision: number | null): Promise<ClassroomContextEnvelope> {
    return requireEnvelope(await fetch("/api/classroom-context", {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: ClassroomContextApplicationSchema.parse(value), expectedRevision }),
    }));
  }
}

export const defaultClassroomContextRepository: IClassroomContextRepository = new RemoteClassroomContextRepository();

