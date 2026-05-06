import { Random } from "./random";

const humanNames = [
  "Mara", "Luis", "Tasha", "Glen", "Nina", "Owen", "Iris", "Cal", "June", "Vic",
  "Avery", "Blair", "Casey", "Devon", "Elliot", "Finley", "Harper", "Jordan", "Kai", "Logan",
  "Morgan", "Noel", "Parker", "Quinn", "Reese", "Riley", "Rowan", "Sage", "Sawyer", "Skyler",
  "Taylor", "Wren", "Amara", "Ben", "Cora", "Dante", "Elena", "Felix", "Gia", "Hugo",
  "Jules", "Keira", "Mateo", "Priya", "Sam", "Theo", "Vera", "Zane"
];
const dogNames = ["Biscuit", "Radar", "Pickles", "Tank", "Mabel", "Ruckus"];
const adjectives = ["Last", "Nervous", "Canned", "Brave", "Suspicious", "Lucky"];
const nouns = ["Porchlights", "Cul-de-sac Saints", "Bean Brigade", "Lawnchair Guild", "Mailbox Watch"];
const streets = ["Maple", "Juniper", "Ash", "Clover", "Sycamore"];

export function humanName(index: number): string {
  return humanNames[index % humanNames.length] + (index >= humanNames.length ? ` ${Math.floor(index / humanNames.length) + 1}` : "");
}

export function uniqueHumanName(index: number, usedNames: ReadonlySet<string>): string {
  const base = humanNames[index % humanNames.length];
  if (!usedNames.has(base)) return base;
  let suffix = Math.floor(index / humanNames.length) + 2;
  let candidate = `${base} ${suffix}`;
  while (usedNames.has(candidate)) {
    suffix += 1;
    candidate = `${base} ${suffix}`;
  }
  return candidate;
}

export function dogName(index: number): string {
  return dogNames[index % dogNames.length] + (index >= dogNames.length ? ` ${Math.floor(index / dogNames.length) + 1}` : "");
}

export function groupName(random: Random): string {
  const style = random.int(3);
  if (style === 0) return `The ${random.pick(adjectives)} ${random.pick(nouns)}`;
  if (style === 1) return `${random.pick(streets)} Watch`;
  return `The Last ${random.pick(nouns)}`;
}
