export function parse(input: string): any;
export class SyntaxError extends Error {
  name: 'SyntaxError';
  expected: string;
  found: string;
  location: any;
}