export class DomainEventError extends Error {
  readonly code: string = "domain_events.error";
  constructor(message: string) {
    super(message);
    this.name = "DomainEventError";
  }
}

export class IdempotencyConflictError extends DomainEventError {
  readonly code = "domain_events.idempotency_conflict" as const;
  constructor(public idempotencyKey: string, public reason: string) {
    super(`Idempotency conflict for key "${idempotencyKey}": ${reason}`);
    this.name = "IdempotencyConflictError";
  }
}

export class HandlerExecutionError extends DomainEventError {
  readonly code = "domain_events.handler_execution" as const;
  constructor(public eventId: string, public handlerName: string, public cause: unknown) {
    super(
      `Handler "${handlerName}" for event ${eventId} failed: ${
        cause instanceof Error ? cause.message : String(cause)
      }`,
    );
    this.name = "HandlerExecutionError";
  }
}
