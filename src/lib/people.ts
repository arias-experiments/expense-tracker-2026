export const PEOPLE = ["Noah", "Patrick", "Camila", "Jose A", "Fam Arias", "Vicky"] as const;

export type Person = (typeof PEOPLE)[number];

export function isValidPeople(value: unknown): value is Person[] {
  return (
    Array.isArray(value) &&
    value.every((person) => typeof person === "string" && PEOPLE.includes(person as Person))
  );
}
