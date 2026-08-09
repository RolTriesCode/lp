import { z } from "zod";
import type {
  IPersistentEntityRepository,
  PersistedEntity,
  RepositoryListQuery,
  RevisionedCreate,
  RevisionedUpdate,
} from "@/lib/persistence/types";
import {
  PersistenceConflictError,
  PersistenceRequestError,
} from "@/lib/persistence/types";

export type RemoteEntityName =
  | "lesson-plans"
  | "presentations"
  | "assessments"
  | "worksheets"
  | "templates"
  | "uploaded-resources";

const persistedMetadataSchema = z.object({
  id: z.string().uuid(),
  value: z.unknown(),
  revision: z.number().int().positive(),
  status: z.enum(["draft", "ready", "archived", "error"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

type ErrorPayload = {
  success?: false;
  error?: {
    code?: string;
    message?: string;
    remote?: unknown;
  };
};

function parsePersisted<TEntity>(
  input: unknown,
  schema: z.ZodType<TEntity>
): PersistedEntity<TEntity> {
  const envelope = persistedMetadataSchema.parse(input);
  return {
    ...envelope,
    value: schema.parse(envelope.value),
  };
}

async function readJson(response: Response): Promise<unknown> {
  return await response.json().catch(() => null);
}

export class RemoteEntityRepository<TEntity>
  implements
    IPersistentEntityRepository<
      PersistedEntity<TEntity>,
      RevisionedCreate<TEntity>,
      RevisionedUpdate<TEntity>
    >
{
  constructor(
    private readonly entity: RemoteEntityName,
    private readonly schema: z.ZodType<TEntity>
  ) {}

  private endpoint(path: string = ""): string {
    return `/api/persistence/${this.entity}${path}`;
  }

  private async requireSuccess(
    response: Response,
    schema: z.ZodType<TEntity> = this.schema
  ): Promise<unknown> {
    const body = await readJson(response);
    const errorBody = body as ErrorPayload | null;
    if (
      response.status === 404 &&
      body &&
      typeof body === "object" &&
      "success" in body &&
      (body as { data?: unknown }).data === null
    ) {
      return null;
    }
    if (response.status === 409 && errorBody?.error?.remote) {
      throw new PersistenceConflictError(
        errorBody.error.message ?? "A newer version is already saved.",
        parsePersisted(errorBody.error.remote, schema)
      );
    }
    if (!response.ok) {
      throw new PersistenceRequestError(
        errorBody?.error?.message ?? "Saved content is temporarily unavailable.",
        errorBody?.error?.code ?? "PERSISTENCE_REQUEST_FAILED",
        response.status
      );
    }
    if (!body || typeof body !== "object" || !("success" in body)) {
      throw new PersistenceRequestError(
        "The persistence service returned an invalid response.",
        "INVALID_PERSISTENCE_RESPONSE",
        502
      );
    }
    return (body as { data?: unknown }).data;
  }

  async get(id: string): Promise<PersistedEntity<TEntity> | null> {
    const response = await fetch(this.endpoint(`/${encodeURIComponent(id)}`), {
      cache: "no-store",
      credentials: "same-origin",
    });
    const data = await this.requireSuccess(response);
    return data === null ? null : parsePersisted(data, this.schema);
  }

  async list(query: RepositoryListQuery = {}): Promise<PersistedEntity<TEntity>[]> {
    const params = new URLSearchParams();
    if (query.status) params.set("status", query.status);
    if (query.lessonPlanId) params.set("lessonPlanId", query.lessonPlanId);
    if (query.limit !== undefined) params.set("limit", String(query.limit));
    if (query.offset !== undefined) params.set("offset", String(query.offset));
    const suffix = params.size > 0 ? `?${params.toString()}` : "";
    const response = await fetch(this.endpoint(suffix), {
      cache: "no-store",
      credentials: "same-origin",
    });
    const data = await this.requireSuccess(response);
    return z.array(z.unknown()).parse(data).map((item) => parsePersisted(item, this.schema));
  }

  async create(input: RevisionedCreate<TEntity>): Promise<PersistedEntity<TEntity>> {
    const value = this.schema.parse(input.value);
    const response = await fetch(this.endpoint(), {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value, status: input.status }),
    });
    return parsePersisted(await this.requireSuccess(response), this.schema);
  }

  async update(
    id: string,
    input: RevisionedUpdate<TEntity>
  ): Promise<PersistedEntity<TEntity> | null> {
    const value = this.schema.parse(input.value);
    const response = await fetch(this.endpoint(`/${encodeURIComponent(id)}`), {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        value,
        expectedRevision: input.expectedRevision,
        status: input.status,
      }),
    });
    const data = await this.requireSuccess(response);
    return data === null ? null : parsePersisted(data, this.schema);
  }

  async duplicate(id: string): Promise<PersistedEntity<TEntity> | null> {
    const response = await fetch(
      this.endpoint(`/${encodeURIComponent(id)}/duplicate`),
      { method: "POST", credentials: "same-origin" }
    );
    const data = await this.requireSuccess(response);
    return data === null ? null : parsePersisted(data, this.schema);
  }

  async delete(id: string): Promise<void> {
    const response = await fetch(this.endpoint(`/${encodeURIComponent(id)}`), {
      method: "DELETE",
      credentials: "same-origin",
    });
    if (response.status === 204) return;
    await this.requireSuccess(response);
  }
}
