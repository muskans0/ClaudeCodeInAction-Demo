type LogLevel = "info" | "warn" | "error";

interface LogFields {
  [key: string]: unknown;
}

function emit(level: LogLevel, message: string, fields: LogFields) {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...fields,
  });

  if (level === "error") {
    console.error(entry);
  } else if (level === "warn") {
    console.warn(entry);
  } else {
    console.log(entry);
  }
}

export function generateRequestId(): string {
  return crypto.randomUUID();
}

/**
 * Creates a logger scoped to a single request so every entry carries the
 * same requestId, letting logs for one request be traced together.
 */
export function createRequestLogger(
  requestId: string = generateRequestId(),
  baseFields: LogFields = {}
) {
  const context = { requestId, ...baseFields };

  return {
    requestId,
    info: (message: string, fields: LogFields = {}) =>
      emit("info", message, { ...context, ...fields }),
    warn: (message: string, fields: LogFields = {}) =>
      emit("warn", message, { ...context, ...fields }),
    error: (message: string, fields: LogFields = {}) =>
      emit("error", message, { ...context, ...fields }),
  };
}

export type RequestLogger = ReturnType<typeof createRequestLogger>;
