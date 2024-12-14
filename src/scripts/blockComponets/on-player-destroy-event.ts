import { world, BlockComponentPlayerDestroyEvent } from "@minecraft/server";
import { debugEnabled } from "../debug/debug";

/**
 * Handles the removal of dynamic properties associated with a record box when destroyed by a player.
 */
export class RecordBoxBreak {
    /**
     * Generates a unique numeric key for the block's location using its coordinates.
     * The logic truncates coordinates to integers to ensure consistent key generation.
     *
     * @param location - The x, y, and z coordinates of the block.
     * @returns A unique numeric key for the block.
     * @example
     * ```typescript
     * const locationKey = RecordBoxBreak.generateKey({ x: 10, y: 64, z: 20 });
     * console.log(locationKey); // 100640200
     * ```
     */
    private static generateKey(location: { x: number; y: number; z: number }): number {
        // Truncate the coordinates to integers to generate a consistent key
        const intX = Math.floor(location.x);
        const intY = Math.floor(location.y);
        const intZ = Math.floor(location.z);

        return intX * 1e8 + intY * 1e4 + intZ;
    }

    /**
     * Generates a unique key for dynamic property retrieval based on the block's location.
     * This key is used to associate dynamic properties with the block in the Minecraft world.
     *
     * @param location - The x, y, and z coordinates of the block.
     * @returns A string representing the unique key for the block's dynamic properties.
     * @example
     * ```typescript
     * const locationKey = RecordBoxBreak.getDynamicPropertyKey({ x: 10, y: 64, z: 20 });
     * console.log(locationKey); // "100640200"
     * ```
     */
    private static getDynamicPropertyKey(location: { x: number; y: number; z: number }): string {
        const key = RecordBoxBreak.generateKey(location);
        return key.toString(); // Return the key as a string for property access
    }

    /**
     * Deletes the dynamic properties associated with the block at the given location.
     *
     * @param location - The x, y, and z coordinates of the block.
     * @example
     * ```typescript
     * RecordBoxBreak.deleteDynamicProperties({ x: 10, y: 64, z: 20 });
     * ```
     */
    private static deleteDynamicProperties(location: { x: number; y: number; z: number }): void {
        const locationKey = RecordBoxBreak.getDynamicPropertyKey(location);

        if (debugEnabled) {
            console.log(`Block Beats [DEBUG]: Deleting DynamicProperty bbData${locationKey}`);
            console.log(`Block Beats [DEBUG]: Deleting DynamicProperty bbLock${locationKey}`);
        }

        // Remove the serialized data and lock properties
        world.setDynamicProperty(`bbData${locationKey}`, undefined);
        world.setDynamicProperty(`bbLock${locationKey}`, undefined);
    }

    constructor() {
        this.onPlayerDestroy = this.onPlayerDestroy.bind(this);
    }

    /**
     * Event handler triggered when a player destroys a block (e.g., a record box).
     * This method will remove the dynamic properties associated with the destroyed block.
     *
     * @param event - The event triggered when a block is destroyed by a player.
     * @example
     * ```typescript
     * const event = // Example event from a player destroying a block
     * recordBoxBreak.onPlayerDestroy(event);
     * ```
     */
    onPlayerDestroy(event: BlockComponentPlayerDestroyEvent): void {
        const { x, y, z } = event.block;
        const locationKey = RecordBoxBreak.getDynamicPropertyKey({ x, y, z });

        // Check if the block data exists before attempting to delete it
        if (world.getDynamicProperty(`bbData${locationKey}`) !== undefined || world.getDynamicProperty(`bbLock${locationKey}`) !== undefined) {
            RecordBoxBreak.deleteDynamicProperties({ x, y, z });
        }
    }
}
