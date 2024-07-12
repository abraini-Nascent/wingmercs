const serializationMetadata = new Map<string, Map<string, ((value: unknown) => unknown) | true>>();

export function SerializableType(typeName: string) {
  serializationMetadata.set(typeName, new Map<string, ((value: unknown) => unknown) | true>());
}

export function SerializeAs(typeName: string, property: string, transform: ((value: unknown) => unknown) | true = true) {
  const metadata = serializationMetadata.get(typeName) || new Map<string, ((value: unknown) => unknown) | true>();
  metadata.set(property, transform);
  serializationMetadata.set(typeName, metadata);
}

export function serialize<T extends Object>(typeName: string, instance: T): any {
  const serializedData: any = {};
  const metadata = serializationMetadata.get(typeName);

  if (!metadata) {
    throw new Error(`No serialization metadata found for type: ${typeName}`);
  }

  for (const [property, transform] of metadata.entries()) {
    if (property in instance) {
      if (transform === true) {
        serializedData[property] = (instance as any)[property];
      } else {
        serializedData[property] = transform((instance as any)[property]);
      }
    }
  }

  return serializedData;
}