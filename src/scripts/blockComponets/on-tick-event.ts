import { world, BlockComponentTickEvent, Block } from "@minecraft/server";
import { debugEnabled } from "../debug/debug";

/**
 * Handles redstone-triggered sound components efficiently using persistent storage.
 */
export class RedstoneComp {
    constructor() {
        this.onTick = this.onTick.bind(this);
    }

    /**
     * Generates a unique numeric key for a block based on its coordinates.
     * Floats are truncated to integers to align with Minecraft block positioning.
     *
     * @param x - X coordinate of the block.
     * @param y - Y coordinate of the block.
     * @param z - Z coordinate of the block.
     * @returns A unique numeric key for the block.
     */
    private generateKey(x: number, y: number, z: number): number {
        const intX = Math.floor(x);
        const intY = Math.floor(y);
        const intZ = Math.floor(z);

        return intX * 1e8 + intY * 1e4 + intZ;
    }

    /**
     * Retrieves dynamic properties for a block based on its key.
     *
     * @param key - The unique key of the block.
     * @returns The dynamic properties of the block or `null` if properties are missing.
     */
    private getDynamicProperties(key: string): { fileName: string; trackLength: number; pitch: number; volume: number; isPlaying: boolean; startTime: number; isLooping: boolean; isBlockPulsed: boolean } | null {
        const bbData = world.getDynamicProperty(`bbData${key}`) as string; // Read redstone data from a specific key

        if (!bbData) return null;

        try {
            const data = JSON.parse(bbData);
            return data;
        } catch (error) {
            console.error("Error parsing bbData:", error);
            return null;
        }
    }

    /**
     * Saves dynamic properties for a block based on its key.
     *
     * @param key - The unique key of the block.
     * @param data - The data to save.
     */
    private setDynamicProperties(key: string, data: object): void {
        try {
            world.setDynamicProperty(`bbData${key}`, JSON.stringify(data));
        } catch (error) {
            console.error("Error saving bbData:", error);
        }
    }

    /**
     * Plays a sound at the specified block location.
     *
     * @param block - The block object.
     * @param fileName - The name of the sound file.
     * @param pitch - The pitch of the sound.
     * @param volume - The volume of the sound.
     */
    private playSound(block: Block, fileName: string, pitch: number, volume: number): void {
        block.dimension.playSound(fileName, block.location, { pitch, volume });

        if (debugEnabled) {
            console.log(`Block Beats [DEBUG]: Playing ${fileName} at ${block.location.x},${block.location.y},${block.location.z}`);
        }
    }

    /**
     * Stops the sound playing at the specified block location.
     *
     * @param block - The block object.
     * @param fileName - The name of the sound file to stop.
     */
    private stopSound(block: Block, fileName: string): void {
        block.dimension.runCommandAsync(`/stopsound @a ${fileName}`);

        if (debugEnabled) {
            console.log(`Block Beats [DEBUG]: Stopped sound at ${block.location.x},${block.location.y},${block.location.z}`);
        }
    }

    /**
     * Handles the tick event for redstone components.
     *
     * @param e - The BlockComponentTickEvent object.
     */
    onTick(e: BlockComponentTickEvent): void {
        const block = e.block;
        const key = this.generateKey(block.location.x, block.location.y, block.location.z).toString();
        const isPowered = block.getRedstonePower();
        const currentTime = Date.now();

        let blockState = this.getDynamicProperties(`${key}`);

        const elapsedTime = (currentTime - blockState.startTime) / 1000;

        if (isPowered > 0) {
            if (!blockState.isPlaying || (elapsedTime >= blockState.trackLength && blockState.isLooping)) {
                this.playSound(block, blockState.fileName, blockState.pitch, blockState.volume);
                blockState.isPlaying = true;
                blockState.startTime = currentTime;
                this.setDynamicProperties(key, blockState);
            }
        } else if (isPowered === 0) {
            if (blockState.isPlaying) {
                if (blockState.isBlockPulsed && elapsedTime < blockState.trackLength) {
                    return;
                }
                this.stopSound(block, blockState.fileName);
                blockState.isPlaying = false;
                this.setDynamicProperties(key, blockState);
            }
        }
    }
}
