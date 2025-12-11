import { world } from "@minecraft/server";
import { OptimizedDatabase } from "../data/data-hive";
import { BlockBeatsDBSchema } from "../data/db-types";
let blockBeatsDB: OptimizedDatabase<BlockBeatsDBSchema>;

async function initializeSystems() {
    // Instantiate Databases
    blockBeatsDB = new OptimizedDatabase("blockBeatsDB");
}

export function subscribeToWorldInitialize() {
    world.afterEvents.worldLoad.subscribe(async () => {
        await initializeSystems();
    });
}

export { blockBeatsDB };
