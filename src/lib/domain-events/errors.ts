export class DomainEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainEventError";
  }
}

export class IdempotencyConflictError extends DomainEventError {
  constructor(public idempotencyKey: string, public reason: string) {
    super(`Idempotency conflict for key "${idempotencyKey}": ${reason}`);
    this.name = "IdempotencyConflictError";
  }
}

export class HandlerExecutionError extends DomainEventError {
  constructor(public eventId: string, public handlerName: string, public cause: unknown) {
    super(
      `Handler "${handlerName}" for event ${eventId} failed: ${
        cause instanceof Error ? cause.message : String(cause)
      }`,
    );
    this.name = "HandlerExecutionError";
  }
}
