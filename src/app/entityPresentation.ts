import type { Entity } from "../sim/types";

export interface InspectRow {
  label: string;
  value: string;
}

export function entityColor(entity: Entity): string {
  if (entity.skeleton) return "#ffffff";
  if (entity.species.includes("zombie")) return "#e63946";
  if (entity.armed && entity.species === "human") return "#3a86ff";
  if (entity.species === "human") return "#2fbf71";
  if (entity.species === "dog") return "#d0a15f";
  return "#f1f4ea";
}

export function entityRingColor(entity: Entity, selected: boolean): string {
  if (entity.state === "shooting") return "#3a86ff";
  if (entity.state === "fleeing" || entity.state === "alerted") return "#f4d35e";
  if (entity.state === "infected" || entity.state === "turning") return "#ef476f";
  if (entity.state === "attacking" || entity.state === "feeding") return "#ff7a59";
  if (selected) return "#ffffff";
  return "#62b6cb";
}

export function stateLabel(entity: Entity): string {
  if (!entity.alive && entity.skeleton) return "skeleton";
  if (!entity.alive) return "downed";
  return entity.state;
}

export function getEntityInspectRows(entity: Entity): InspectRow[] {
  return [
    { label: "HP", value: `${entity.hp} / ${entity.maxHp}` },
    { label: "State", value: stateLabel(entity) },
    { label: "Weapon", value: entity.armed ? "armed" : "unarmed" },
    { label: "Ammo", value: entity.armed ? String(entity.ammo) : "none" },
    { label: "Control", value: entity.controlled ? "possessed" : "autonomous" },
    { label: "Meat", value: `${entity.meat} / ${entity.originalMeat}` },
    { label: "Zombie kills", value: String(entity.zombieKills) }
  ];
}
