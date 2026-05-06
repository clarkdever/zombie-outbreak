import { describe, expect, it } from "vitest";
import { createInitialWorld } from "../../src/sim/entities";
import { handleOwnerDeath, mergeGroups, warnNearbyHumans } from "../../src/sim/groups";

describe("groups and dogs", () => {
  it("lets warned humans share zombie knowledge", () => {
    const world = createInitialWorld({ humans: 3, dogs: 0, zombies: 0, armedPercent: 0, seed: 1 });
    world.entities[0].seenZombie = true;
    world.entities[0].tile = { x: 5, y: 5 };
    world.entities[1].tile = { x: 6, y: 5 };
    const alerted = warnNearbyHumans(world.entities[0], world.entities, 2);
    expect(alerted).toBe(1);
    expect(world.entities[1].seenZombie).toBe(true);
    expect(world.entities[0].humansAlerted).toBe(1);
  });

  it("uses larger armed group leader when groups merge", () => {
    const world = createInitialWorld({ humans: 5, dogs: 0, zombies: 0, armedPercent: 100, seed: 2 });
    world.groups.push({ id: "group-2", name: "Maple Watch", color: "#fff", memberIds: [world.entities[4].id], leaderId: world.entities[4].id });
    world.entities[4].groupId = "group-2";
    world.groups[0].memberIds = world.entities.slice(0, 4).map((entity) => entity.id);
    world.groups[0].leaderId = world.entities[0].id;
    const merged = mergeGroups(world.groups[0], world.groups[1], world.entities);
    expect(merged.leaderId).toBe(world.entities[0].id);
    expect(merged.memberIds).toHaveLength(5);
  });

  it("reattaches dog to next living human after owner death", () => {
    const world = createInitialWorld({ humans: 2, dogs: 1, zombies: 0, armedPercent: 0, seed: 3 });
    const dog = world.entities.find((entity) => entity.species === "dog");
    const oldOwner = world.entities.find((entity) => entity.id === dog?.ownerId);
    if (oldOwner) oldOwner.alive = false;
    handleOwnerDeath(dog!, world.entities);
    expect(dog?.ownerId).not.toBe(oldOwner?.id);
  });
});
