export class DomainException extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, any>,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class BusinessRuleViolationException extends DomainException {
  constructor(rule: string, details?: Record<string, any>) {
    super(
      `Business rule violation: ${rule}`,
      'BUSINESS_RULE_VIOLATION',
      details,
    );
  }
}

export class EntityNotFoundException extends DomainException {
  constructor(entityName: string, identifier: string) {
    super(
      `${entityName} with identifier '${identifier}' not found`,
      'ENTITY_NOT_FOUND',
      { entityName, identifier },
    );
  }
}

export class InvalidEntityStateException extends DomainException {
  constructor(entityName: string, currentState: string, expectedState: string) {
    super(
      `${entityName} is in '${currentState}' state but expected '${expectedState}'`,
      'INVALID_ENTITY_STATE',
      { entityName, currentState, expectedState },
    );
  }
}

export class DuplicateEntityException extends DomainException {
  constructor(entityName: string, field: string, value: string) {
    super(
      `${entityName} with ${field} '${value}' already exists`,
      'DUPLICATE_ENTITY',
      { entityName, field, value },
    );
  }
}
