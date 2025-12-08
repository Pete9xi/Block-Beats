/**

* Handles the removal of block configuration data when a player destroys a record box.
* Uses string-based keys for consistency with the rest of the Block Beats system.
  */
import { BlockComponentPlayerBreakEvent } from "@minecraft/server";
import debug from "../debug/debug";
import { blockBeatsDB } from "../event-listeners/world-initialize";

export class RecordBoxBreak {
    /**
     * Generates the string key for a block based on its coordinates.
     *
     * @param location - The block's x, y, and z coordinates.
     * @returns The string key for the database.
     * @example
     * const dbKey = RecordBoxBreak.getDatabaseKey({ x: 10, y: 64, z: 20 });
     * console.log(dbKey); // "bbData10|64|20"
     */
    private static getDatabaseKey(location: { x: number; y: number; z: number }): string {
        return `bbData${location.x}|${location.y}|${location.z}`;
    }

    /**
     * Deletes the block configuration data from the database.
     *
     * @param location - The block's x, y, and z coordinates.
     * @returns A promise that resolves once the block data has been removed.
     * @example
     * await RecordBoxBreak.deleteBlockData({ x: 10, y: 64, z: 20 });
     */
    private static async deleteBlockData(location: { x: number; y: number; z: number }): Promise<void> {
        const dbKey = RecordBoxBreak.getDatabaseKey(location);

        // Check if the block exists before deleting
        const exists = await blockBeatsDB.get(dbKey);
        if (!exists) return;

        await blockBeatsDB.delete(dbKey);

        if (debug.deleteBlockData) {
            console.log(`Block Beats [DEBUG]: Deleted block data ${dbKey}`);
        }
    }

    /**
     * Constructor for RecordBoxBreak.
     * Binds the `onPlayerBreak` method to the current instance.
     */
    constructor() {
        this.onPlayerBreak = this.onPlayerBreak.bind(this);
    }

    /**
     * Event handler triggered when a player destroys a block.
     * Deletes the associated block data from the database.
     *
     * @param event - The player break event object.
     * @returns A promise that resolves once deletion is complete.
     * @example
     * world.afterEvents.blockBreak.subscribe((e) => {
     *   recordBoxBreak.onPlayerBreak(e);
     * });
     */
    async onPlayerBreak(event: BlockComponentPlayerBreakEvent): Promise<void> {
        const { x, y, z } = event.block;
        await RecordBoxBreak.deleteBlockData({ x, y, z });
    }
}
