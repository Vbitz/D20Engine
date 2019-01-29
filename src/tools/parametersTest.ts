import 'reflect-metadata';

export enum PublicFieldType {
  String,
  Boolean,
  Number
}

export interface PublicFieldDescription {
  type: PublicFieldType;
}

interface ComponentFields {
  __publicFields?: Map<string, PublicFieldDescription>;
}

class ComponentParameters {
  getPublicFields() {
    const fieldsObject = (this.constructor as ComponentFields);

    if (fieldsObject.__publicFields !== undefined) {
      return [...fieldsObject.__publicFields.entries()];
    } else {
      return [];
    }
  }

  static publicField<T extends ComponentParameters>(
      target: T, propertyKey: string) {
    // target is a lie and doesn't really exist.
    const type = ComponentParameters.getTypeFromConstructor(
        Reflect.getMetadata('design:type', target, propertyKey));

    const fieldsObject = (target.constructor as ComponentFields);

    if (fieldsObject.__publicFields === undefined) {
      fieldsObject.__publicFields = new Map();
    }

    fieldsObject.__publicFields.set(propertyKey, {type});
  }

  private static getTypeFromConstructor(
      type: NumberConstructor|StringConstructor|BooleanConstructor) {
    if (type === Number) {
      return PublicFieldType.Number;
    } else if (type === String) {
      return PublicFieldType.String;
    } else if (type === Boolean) {
      return PublicFieldType.Boolean;
    } else {
      throw new Error('Unknown publicField type');
    }
  }
}

class Testing extends ComponentParameters {
  // This is an interesting hack that is needed because TypeScript refuses to
  // support inferred types for decorator metadata.
  @ComponentParameters.publicField test: number;
  @ComponentParameters.publicField value: string;

  constructor() {
    super();

    this.test = 2;
    this.value = 'hello';
  }
}

const hello = new Testing();
console.log(hello.getPublicFields());