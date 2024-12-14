import { world, BlockComponentTickEvent, Block } from "@minecraft/server";
import { debugEnabled } from "../debug/debug";

/**
 * Handles redstone-triggered sound components efficiently.
 */
export class RedstoneComp {
    /**
     * Map of block states indexed by unique numeric keys for efficient access.
     */
    private blockStates: Map<
        number,
        {
            isPlaying: boolean;
            startTime: number;
            trackLength: number;
            fileName?: string;
            pitch?: number;
            volume?: number;
        }
    >;

    /**
     * Tracks active blocks separately for faster iteration.
     */
    private activeBlocks: Set<number>;

    /**
     * Timestamp of the last cleanup operation.
     */
    private lastCleanup: number;

    constructor() {
        this.onTick = this.onTick.bind(this);
        this.blockStates = new Map();
        this.activeBlocks = new Set();
        this.lastCleanup = Date.now();
    }

    /**
     * Generates a unique numeric key for a block based on its coordinates.
     * Floats are truncated to integers to align with Minecraft block positioning.
     *
     * @param x - X coordinate of the block.
     * @param y - Y coordinate of the block.
     * @param z - Z coordinate of the block.
     * @returns A unique numeric key for the block.
     * @example
     * ```typescript
     * const key = generateKey(10.4, 64.0, 20.1); // Returns 100640200
     * ```
     */
    private generateKey(x: number, y: number, z: number): number {
        const intX = Math.floor(x);
        const intY = Math.floor(y);
        const intZ = Math.floor(z);

        return intX * 1e8 + intY * 1e4 + intZ;
    }

    /**
     * Parses a track length string in `mm.ss` format to total seconds.
     *
     * @param input - Track length as a number (e.g., 3.45 for 3 minutes, 45 seconds).
     * @returns Total track length in seconds.
     * @example
     * ```typescript
     * const length = parseTrackLength(3.45); // Returns 225
     * ```
     */
    private parseTrackLength(input: number): number {
        const [minutes = "0", seconds = "00"] = input.toString().split(".");
        return parseInt(minutes, 10) * 60 + parseInt(seconds.padEnd(2, "0"), 10);
    }

    /**
     * Retrieves dynamic properties for a block based on its key.
     * Now retrieves all data from a single `bbData` property.
     *
     * @param key - The unique key of the block.
     * @returns The dynamic properties of the block or `null` if properties are missing.
     * @example
     * ```typescript
     * const props = getDynamicProperties("123456789");
     * if (props) {
     *     console.log(props.fileName); // Logs the file name of the sound.
     * }
     * ```
     */
    private getDynamicProperties(key: string): { fileName: string; trackLength: number; pitch: number; volume: number } | null {
        const bbData = world.getDynamicProperty(`bbData${key}`);

        if (!bbData) return null;

        try {
            const { fileName, trackLength, pitch, volume } = JSON.parse(bbData.toString());
            return {
                fileName,
                trackLength: this.parseTrackLength(trackLength),
                pitch,
                volume,
            };
        } catch (error) {
            console.error("Error parsing bbData:", error);
            return null;
        }
    }

    /**
     * Plays a sound at the specified block location.
     *
     * @param blockState - The state of the block.
     * @param block - The block object.
     * @param fileName - The name of the sound file.
     * @param pitch - The pitch of the sound.
     * @param volume - The volume of the sound.
     * @param currentTime - The current timestamp.
     */
    private playSound(blockState: any, block: Block, fileName: string, pitch: number, volume: number, currentTime: number): void {
        block.dimension.playSound(fileName, block.location, { pitch, volume });
        blockState.isPlaying = true;
        blockState.startTime = currentTime;

        if (debugEnabled) {
            console.log(`Block Beats [DEBUG]: Playing ${fileName} at ${block.location.x},${block.location.y},${block.location.z}`);
        }
    }

    /**
     * Stops the sound playing at the specified block location.
     *
     * @param blockState - The state of the block.
     * @param block - The block object.
     * @param fileName - The name of the sound file to stop.
     */
    private stopSound(blockState: any, block: Block, fileName: string): void {
        block.dimension.runCommandAsync(`/stopsound @a ${fileName}`);
        blockState.isPlaying = false;

        if (debugEnabled) {
            console.log(`Block Beats [DEBUG]: Stopped sound at ${block.location.x},${block.location.y},${block.location.z}`);
        }
    }

    /**
     * Cleans up expired block states and active block references.
     *
     * @param currentTime - The current timestamp.
     */
    private cleanupStates(currentTime: number): void {
        if (currentTime - this.lastCleanup > 60000) {
            for (const key of this.blockStates.keys()) {
                const state = this.blockStates.get(key)!;
                if (currentTime - state.startTime > 60000) {
                    this.blockStates.delete(key);
                    this.activeBlocks.delete(key);
                }
            }
            this.lastCleanup = currentTime;
        }
    }

    /**
     * Handles the tick event for redstone components.
     *
     * @param e - The BlockComponentTickEvent object.
     */
    onTick(e: BlockComponentTickEvent): void {
        const block = e.block;
        const key = this.generateKey(block.location.x, block.location.y, block.location.z);
        const isPowered = block.getRedstonePower();
        const currentTime = Date.now();

        // Cleanup states periodically
        if (currentTime - this.lastCleanup > 60000) this.cleanupStates(currentTime);

        let blockState = this.blockStates.get(key);
        if (!blockState) {
            blockState = { isPlaying: false, startTime: 0, trackLength: 0 };
            this.blockStates.set(key, blockState);
        }

        if (!blockState.fileName) {
            const props = this.getDynamicProperties(key.toString());
            if (!props) {
                this.blockStates.delete(key);
                this.activeBlocks.delete(key);
                return;
            }
            Object.assign(blockState, props);
        }

        const { fileName, trackLength, pitch, volume } = blockState;

        if (isPowered === 15) {
            if (!blockState.isPlaying || (currentTime - blockState.startTime) / 1000 >= trackLength) {
                this.playSound(blockState, block, fileName, pitch, volume, currentTime);
                this.activeBlocks.add(key);
            }
        } else if (isPowered === 0 && blockState.isPlaying) {
            this.stopSound(blockState, block, fileName);
            this.activeBlocks.delete(key);
        }
    }
}
