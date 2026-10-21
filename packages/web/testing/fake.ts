// A value may be given in part at any level, or whole (a real Request, say); a literal type accepts any string.
type DeepPartial<T> = T extends string ? string : T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } | T : T;

export function fake<T>(value: DeepPartial<T>): T {
  return value as unknown as T;
}
