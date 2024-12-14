import { world, BlockComponentTickEvent, Block } from "@minecraft/server";
import { debugEnabled } from "../debug/debug";

export class RedstoneComp {
    private blockStates: Map<
        string,
        {
            isPlaying: boolean;
            startTime: number;
            trackLength: number;
            fileName?: string;
            pitch?: number;
            volume?: number;
        }
    >;
    private lastCleanup: number;

    constructor() {
        this.onTick = this.onTick.bind(this);
        this.blockStates = new Map();
        this.lastCleanup = Date.now();
    }

    // Utility function to parse track length from mm.ss format to total seconds
    private parseTrackLength(input: number): number {
        const [minutes = "0", seconds = "00"] = input.toString().split(".");
        return parseInt(minutes, 10) * 60 + parseInt(seconds.padEnd(2, "0"), 10); // Pad seconds for consistency
    }

    private getDynamicProperties(blockLocationAsString: string): {
        fileName: string | undefined;
        trackLength: number | undefined;
        pitch: number | undefined;
        volume: number | undefined;
    } {
        const fileNameProp = world.getDynamicProperty("bb" + blockLocationAsString);
        const trackLengthProp = world.getDynamicProperty("bbLength" + blockLocationAsString);
        const pitchProp = world.getDynamicProperty("bbPitch" + blockLocationAsString);
        const volumeProp = world.getDynamicProperty("bbVolume" + blockLocationAsString);

        if (!fileNameProp || !trackLengthProp || pitchProp === undefined || volumeProp === undefined) {
            return { fileName: undefined, trackLength: undefined, pitch: undefined, volume: undefined };
        }

        return {
            fileName: fileNameProp.toString(),
            trackLength: this.parseTrackLength(Number(trackLengthProp)),
            pitch: Number(pitchProp),
            volume: Number(volumeProp),
        };
    }

    private playSoundIfNeeded(blockState: { isPlaying: boolean; startTime: number; trackLength: number }, block: Block, fileName: string, trackLength: number, pitch: number, volume: number, currentTime: number): void {
        if (!blockState.isPlaying) {
            const soundOptions = { pitch, volume };
            world.playSound(fileName, block.location, soundOptions);
            blockState.isPlaying = true;
            blockState.startTime = currentTime;
            blockState.trackLength = trackLength;
            if (debugEnabled) {
                console.log(`Block Beats [DEBUG]: Started playing ${fileName} at ${block.location.x.toFixed(0)}, ${block.location.y.toFixed(0)}, ${block.location.z.toFixed(0)}`);
            }
        } else {
            const elapsedTime = (currentTime - blockState.startTime) / 1000; // Convert to seconds
            if (elapsedTime >= blockState.trackLength) {
                const soundOptions = { pitch, volume };
                world.playSound(fileName, block.location, soundOptions);
                blockState.startTime = currentTime; // Restart the track
                if (debugEnabled) {
                    console.log(`Block Beats [DEBUG]: Looping ${fileName} at ${block.location.x.toFixed(0)}, ${block.location.y.toFixed(0)}, ${block.location.z.toFixed(0)}`);
                }
            }
        }
    }

    private stopSoundIfNeeded(blockState: { isPlaying: boolean }, block: Block, fileName: string): void {
        if (blockState.isPlaying) {
            const stopCommand = `/stopsound @a ${fileName}`;
            world.getDimension("overworld").runCommandAsync(stopCommand);
            blockState.isPlaying = false;
            if (debugEnabled) {
                console.log(`Block Beats [DEBUG]: Stopped playing sound at ${block.location.x.toFixed(0)}, ${block.location.y.toFixed(0)}, ${block.location.z.toFixed(0)}`);
            }
        }
    }

    onTick(e: BlockComponentTickEvent): void {
        const block = e.block;
        const blockLocationAsString = `${block.location.x}${block.location.y}${block.location.z}`;
        const pos = `${block.location.x},${block.location.y},${block.location.z}`;
        const isPowered = block.getRedstonePower();
        const currentTime = Date.now();

        // Lazy cleanup every 60 seconds
        if (currentTime - this.lastCleanup > 60000) {
            this.blockStates.forEach((state, key) => {
                if (currentTime - state.startTime > 60000) {
                    // Cleanup if inactive for 60 seconds
                    this.blockStates.delete(key);
                }
            });
            this.lastCleanup = currentTime;
        }

        // Ensure the blockState exists
        let blockState = this.blockStates.get(pos);
        if (!blockState) {
            blockState = { isPlaying: false, startTime: 0, trackLength: 0 };
            this.blockStates.set(pos, blockState);
        }

        // Retrieve dynamic properties (cached or on-demand)
        if (!blockState.fileName || !blockState.trackLength || !blockState.pitch || !blockState.volume) {
            const dynamicProps = this.getDynamicProperties(blockLocationAsString);
            if (!dynamicProps.fileName || dynamicProps.trackLength === undefined || dynamicProps.pitch === undefined || dynamicProps.volume === undefined) {
                // If properties are missing, consider this block inactive and clean up
                this.blockStates.delete(pos);
                return;
            }
            Object.assign(blockState, dynamicProps); // Cache the properties
        }

        const { fileName, trackLength, pitch, volume } = blockState;

        if (isPowered === 15) {
            this.playSoundIfNeeded(blockState, block, fileName!, trackLength!, pitch!, volume!, currentTime);
        } else if (isPowered === 0) {
            this.stopSoundIfNeeded(blockState, block, fileName!);

            // Lazy cleanup: Remove block state if it's inactive and not powered
            if (!blockState.isPlaying) {
                this.blockStates.delete(pos);
            }
        }
    }
}
