type StackFrame = Record<string, unknown>;

type SentryEventLike = {
  breadcrumbs?: unknown;
  contexts?: Record<string, Record<string, unknown> | undefined>;
  debug_meta?: unknown;
  dist?: string;
  environment?: string;
  event_id?: string;
  exception?: {
    values?: Array<{
      mechanism?: Record<string, unknown>;
      stacktrace?: { frames?: StackFrame[] };
      type?: string;
      value?: string;
    }>;
  };
  extra?: unknown;
  level?: string;
  logger?: string;
  message?: string;
  modules?: Record<string, string>;
  platform?: string;
  release?: string;
  request?: Record<string, unknown>;
  sdk?: unknown;
  tags?: Record<string, string | number | boolean | bigint | null | undefined>;
  timestamp?: number;
  transaction?: string;
  user?: unknown;
};

const DYNAMIC_SEGMENT_PATTERNS = [
  [/^\/lesson\/[^/]+(?=\/|$)/, "/lesson/[id]"],
  [/^\/api\/persistence\/[^/]+\/[^/]+(?=\/|$)/, "/api/persistence/[entity]/[id]"],
  [/^\/api\/schedule\/[^/]+(?=\/|$)/, "/api/schedule/[id]"],
] as const;

export function sanitizeRoute(value: string | undefined): string | undefined {
  if (!value) return undefined;

  try {
    const pathname = new URL(value, "https://monitoring.invalid").pathname;
    return DYNAMIC_SEGMENT_PATTERNS.reduce(
      (current, [pattern, replacement]) => current.replace(pattern, replacement),
      pathname,
    ).slice(0, 240);
  } catch {
    return undefined;
  }
}

function sanitizeFrame(frame: StackFrame): StackFrame {
  return {
    abs_path: sanitizeRoute(typeof frame.abs_path === "string" ? frame.abs_path : undefined) ?? frame.abs_path,
    colno: frame.colno,
    filename: frame.filename,
    function: frame.function,
    in_app: frame.in_app,
    instruction_addr: frame.instruction_addr,
    lineno: frame.lineno,
    module: frame.module,
    package: frame.package,
    platform: frame.platform,
  };
}

function sanitizeException(event: SentryEventLike): SentryEventLike["exception"] {
  const allowedTypes = new Set(["AbortError", "Error", "EvalError", "RangeError", "ReferenceError", "SyntaxError", "TypeError", "URIError"]);
  const values = event.exception?.values?.map((value) => ({
    mechanism: value.mechanism ? {
      handled: value.mechanism.handled,
      type: value.mechanism.type,
    } : undefined,
    stacktrace: value.stacktrace?.frames
      ? { frames: value.stacktrace.frames.map(sanitizeFrame) }
      : undefined,
    type: typeof value.type === "string" && allowedTypes.has(value.type)
      ? value.type
      : "Error",
    value: "Application error (details redacted)",
  }));

  return values?.length ? { values } : undefined;
}

function sanitizeTags(tags: SentryEventLike["tags"]): SentryEventLike["tags"] {
  if (!tags) return undefined;
  const allowedValues: Record<string, Set<string>> = {
    area: new Set(["application", "lesson", "lesson_export", "lesson_generation", "presentation_export"]),
    category: new Set(["INVALID_REQUEST", "MISSING_API_KEY", "NETWORK_ERROR", "RATE_LIMIT", "SAFETY_REJECTION", "TIMEOUT", "UPSTREAM_FAILURE", "VALIDATION_ERROR"]),
    framework: new Set(["nextjs"]),
    recovery_boundary: new Set(["application_route", "lesson_route", "root_layout"]),
    runtime: new Set(["browser", "edge", "server"]),
  };
  return Object.fromEntries(
    Object.keys(allowedValues).flatMap((key) => {
      const value = tags[key];
      return typeof value === "string" && allowedValues[key].has(value)
        ? [[key, value]]
        : [];
    }),
  );
}

function sanitizeContexts(contexts: SentryEventLike["contexts"]): SentryEventLike["contexts"] {
  if (!contexts) return undefined;
  const next = contexts.nextjs;
  const trace = contexts.trace;
  const sanitized: NonNullable<SentryEventLike["contexts"]> = {};

  if (next) {
    sanitized.nextjs = {
      request_path: sanitizeRoute(typeof next.request_path === "string" ? next.request_path : undefined),
      router_kind: typeof next.router_kind === "string" ? next.router_kind.slice(0, 40) : undefined,
      router_path: sanitizeRoute(typeof next.router_path === "string" ? next.router_path : undefined),
      route_type: typeof next.route_type === "string" ? next.route_type.slice(0, 40) : undefined,
    };
  }
  if (trace) {
    sanitized.trace = {
      op: typeof trace.op === "string" ? trace.op.slice(0, 80) : undefined,
      origin: typeof trace.origin === "string" ? trace.origin.slice(0, 80) : undefined,
      parent_span_id: trace.parent_span_id,
      span_id: trace.span_id,
      status: trace.status,
      trace_id: trace.trace_id,
    };
  }

  return Object.keys(sanitized).length ? sanitized : undefined;
}

/**
 * Rebuilds a Sentry event from a strict allowlist. Request bodies, headers,
 * cookies, query parameters, user data, extras, breadcrumbs, local variables,
 * and exception messages never cross the monitoring boundary.
 */
export function sanitizeSentryEvent<T>(event: T): T {
  const source = event as SentryEventLike;
  const sanitized: SentryEventLike = {
    contexts: sanitizeContexts(source.contexts),
    debug_meta: source.debug_meta,
    dist: source.dist,
    environment: source.environment,
    event_id: source.event_id,
    exception: sanitizeException(source),
    level: source.level,
    logger: source.logger,
    message: source.message ? "Application monitoring event (details redacted)" : undefined,
    modules: source.modules,
    platform: source.platform,
    release: source.release,
    request: source.request ? {
      method: typeof source.request.method === "string" ? source.request.method.slice(0, 12) : undefined,
      url: sanitizeRoute(typeof source.request.url === "string" ? source.request.url : undefined),
    } : undefined,
    sdk: source.sdk,
    tags: sanitizeTags(source.tags),
    timestamp: source.timestamp,
    transaction: sanitizeRoute(source.transaction),
  };

  return sanitized as T;
}

export type CoarsePageEvent = {
  type: "event" | "pageview" | "vital";
  url: string;
  route?: string;
};

export function sanitizeCoarsePageEvent<T extends CoarsePageEvent>(event: T): T | null {
  const url = sanitizeRoute(event.url);
  if (!url || url.startsWith("/auth/") || url.startsWith("/api/")) return null;
  return {
    ...event,
    url,
    ...(event.route ? { route: sanitizeRoute(event.route) } : {}),
  };
}
