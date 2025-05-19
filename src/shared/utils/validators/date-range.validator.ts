import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Custom validator to ensure the end date is after the start date.
 * @param startDateProperty - Name of the property containing the start date
 * @param validationOptions - Standard validation options
 */
export function IsAfterDate(
  startDateProperty: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isAfterDate',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [startDateProperty],
      options: validationOptions,
      validator: {
        validate(value: Date | null | undefined, args: ValidationArguments) {
          if (!value) return true;
          const relatedPropertyName = args.constraints[0] as string;
          const relatedValue = (args.object as Record<string, unknown>)[
            relatedPropertyName
          ] as Date | null | undefined;

          if (!relatedValue) return true;

          return value > relatedValue;
        },
        defaultMessage(args: ValidationArguments) {
          const relatedPropertyName = args.constraints[0] as string;
          return `${args.property} must be after ${relatedPropertyName}`;
        },
      },
    });
  };
}
