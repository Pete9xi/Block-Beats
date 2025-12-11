/**

* Handles redstone-triggered sound components using persistent storage.
* Uses block string keys for DB lookup instead of numeric keys.
  */
import { BlockComponentTickEvent, Block } from "@minecraft/server";
import { blockBeatsDB } from "../event-listeners/world-initialize";
import debug from "../debug/debug";

export class RedstoneComp {
    constructor() {
        this.onTick = this.onTick.bind(this);
    }

    /**
     * Generates a unique string key for a block based on its coordinates.
     *
     * @param x - X coordinate.
     * @param y - Y coordinate.
     * @param z - Z coordinate.
     * @returns String key for database lookup.
     */
    private getBlockKey(x: number, y: number, z: number): string {
        return `bbData${x}|${y}|${z}`;
    }

    private async getBlockState(key: string) {
        try {
            const state = await blockBeatsDB.get(key);
            if (debug.debugMode && debug.getBlockState) console.log(`[DEBUG] Retrieved block state for key ${key}:`, state);
            return state ?? null;
        } catch (err) {
            console.error(`[ERROR] Failed to get block state for key ${key}:`, err);
            return null;
        }
    }

    private async setBlockState(key: string, data: any) {
        try {
            await blockBeatsDB.set(key, data);
            if (debug.debugMode && debug.setBlockState) console.log(`[DEBUG] Saved block state for key ${key}:`, data);
        } catch (err) {
            console.error(`[ERROR] Failed to set block state for key ${key}:`, err);
        }
    }

    private playSound(block: Block, fileName: string, pitch: number, volume: number) {
        block.dimension.playSound(fileName, block.location, { pitch, volume });
        if (debug.debugMode && debug.playSound) console.log(`[DEBUG] Playing '${fileName}' at ${block.location.x},${block.location.y},${block.location.z}`);
    }

    private stopSound(block: Block, fileName: string) {
        block.dimension.runCommand(`/stopsound @a ${fileName}`);
        if (debug.debugMode && debug.stopSound) console.log(`[DEBUG] Stopped '${fileName}' at ${block.location.x},${block.location.y},${block.location.z}`);
    }

    /**
     * Handles the redstone tick for a block.
     *
     * @param e - The tick event.
     */
    async onTick(e: BlockComponentTickEvent): Promise<void> {
        const block = e.block;
        const key = this.getBlockKey(block.location.x, block.location.y, block.location.z);
        const isPowered = block.getRedstonePower();
        const currentTime = Date.now();

        if (debug.debugMode && debug.tickKey) console.log(`[DEBUG] Tick for key ${key} - Power: ${isPowered}`);

        const blockState = await this.getBlockState(key);
        if (!blockState) {
            if (debug.debugMode && debug.currentBlockState) console.log(`[DEBUG] No block state for key ${key}, skipping tick.`);
            return;
        }

        const elapsedTime = (currentTime - blockState.startTime) / 1000;
        if (isPowered > 0) {
            if (!blockState.isPlaying || (elapsedTime >= blockState.trackLength && blockState.isLooping)) {
                this.playSound(block, blockState.fileName, blockState.pitch, blockState.volume);
                blockState.isPlaying = true;
                blockState.startTime = currentTime;
                await this.setBlockState(key, blockState);
            }
        } else if (isPowered === 0) {
            if (blockState.isPlaying) {
                if (blockState.isBlockPulsed && elapsedTime < blockState.trackLength) return;
                this.stopSound(block, blockState.fileName);
                blockState.isPlaying = false;
                await this.setBlockState(key, blockState);
            }
        }
    }
}
