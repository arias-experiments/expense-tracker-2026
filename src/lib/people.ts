export const PEOPLE = [
  "Camila",
  "Noah",
  "Patrick",
  "Vicky",
  "Jose",
  "Sandy",
  "CR",
  "CA",
  "Tati",
  "Marissa",
] as const;

export type Person = (typeof PEOPLE)[number];

export function isValidPeople(value: unknown): value is Person[] {
  return (
    Array.isArray(value) &&
    value.every((person) => typeof person === "string" && PEOPLE.includes(person as Person))
  );
}
