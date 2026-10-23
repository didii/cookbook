/** The value without its undefined properties, as it would be after a JSON round trip: `{ a: undefined }` becomes `{}`. */
export const defined = <T>(value: T): T => JSON.parse(JSON.stringify(value));
