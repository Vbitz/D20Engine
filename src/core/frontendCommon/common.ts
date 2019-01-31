export type Bag<T> = {
  [s: string]: T
};

export function expect(): never {
  throw new Error('Expect Called');
}