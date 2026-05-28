export class InvitationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "InvitationError";
  }
}

export class InvitationAlreadyExistsError extends InvitationError {
  constructor() {
    super("Convite PENDING já existe para este email", "ALREADY_EXISTS");
  }
}

export class InvitationNotFoundError extends InvitationError {
  constructor() {
    super("Convite não encontrado", "NOT_FOUND");
  }
}

export class InvitationAlreadyProcessedError extends InvitationError {
  constructor() {
    super("Este convite já foi processado", "ALREADY_PROCESSED");
  }
}

export class InvitationExpiredError extends InvitationError {
  constructor() {
    super("Este convite expirou", "EXPIRED");
  }
}

export class InvitationNotRevocableError extends InvitationError {
  constructor() {
    super("Apenas convites PENDING podem ser revogados", "NOT_REVOCABLE");
  }
}

export class InvitationPasswordRequiredError extends InvitationError {
  constructor() {
    super("Senha obrigatória para criar uma conta", "PASSWORD_REQUIRED");
  }
}

export class InvitationPasswordTooShortError extends InvitationError {
  constructor() {
    super("A senha deve ter pelo menos 8 caracteres", "PASSWORD_TOO_SHORT");
  }
}
