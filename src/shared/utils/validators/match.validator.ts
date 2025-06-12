import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

interface ValidatableObject {
  [key: string]: unknown;
}

/**
 * Creates a validator to check if a field matches another field.
 * @param property The property to compare with
 * @param validationOptions Additional validation options
 */
export function Match(property: string, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'match',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions || {
        message: `${propertyName} must match ${property}`,
      },
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints as string[];
          const relatedObject = args.object as ValidatableObject;
          const relatedValue = relatedObject[relatedPropertyName];
          return value === relatedValue;
        },
      },
    });
  };
}
