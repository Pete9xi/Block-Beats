import { world, BlockComponentTickEvent } from "@minecraft/server";
import { debugEnabled } from "../debug/debug";
export class redstoneComp {
    blockStates: Map<string, { isPlaying: boolean; startTime: number; trackLength: number }>;

    constructor() {
        this.onTick = this.onTick.bind(this);
        this.blockStates = new Map();
    }

    // Utility function to parse track length from mm.ss format to total seconds
    private parseTrackLength(input: number): number {
        const parts = input.toString().split(".");
        const minutes = parseInt(parts[0] || "0", 10); // Default to 0 if there are no minutes
        const seconds = parts[1] ? parseInt(parts[1].padEnd(2, "0"), 10) : 0; // Pad to ensure two digits
        return minutes * 60 + seconds;
    }   

    onTick(e: BlockComponentTickEvent): void {
        const block = e.block;
        const pos = `${block.location.x},${block.location.y},${block.location.z}`;
        const blockLocationAsString = `${block.location.x}${block.location.y}${block.location.z}`;
        const isPowered = block.getRedstonePower();

        if (!this.blockStates.has(pos)) {
            this.blockStates.set(pos, { isPlaying: false, startTime: 0, trackLength: 0 });
        }

        const blockState = this.blockStates.get(pos)!;

        // Retrieve dynamic properties
        const fileNameProp = world.getDynamicProperty("cab" + blockLocationAsString);
        const trackLengthProp = world.getDynamicProperty("cabLength" + blockLocationAsString);

        if (!fileNameProp || !trackLengthProp) return; // Ensure properties exist

        const fileNameAsString = fileNameProp.toString();
        const trackLength = this.parseTrackLength(Number(trackLengthProp)); // Convert to total seconds

        const currentTime = Date.now();

        if (isPowered === 15) {
            if (!blockState.isPlaying) {
                const worldSoundOptions = {
                    pitch: 1.0,
                    volume: 1.0,
                };

                world.playSound(fileNameAsString, block.location, worldSoundOptions);
                blockState.isPlaying = true;
                blockState.startTime = currentTime;
                blockState.trackLength = trackLength;

                world.sendMessage(`Started playing ${fileNameAsString} at ${pos}`);
            } else {
                // Check if the track has completed
                const elapsedTime = (currentTime - blockState.startTime) / 1000; // Convert to seconds
                if(debugEnabled){
                console.log("[DEBUG]: elapsedTime: " + elapsedTime);
                console.log("[DEBUG]: currentTime: " + currentTime);
                console.log("[DEBUG]: trackLenght: " + trackLength);
                }
                if (elapsedTime >= blockState.trackLength) {
                    const worldSoundOptions = {
                        pitch: 1.0,
                        volume: 1.0,
                    };

                    world.playSound(fileNameAsString, block.location, worldSoundOptions);
                    blockState.startTime = currentTime; // Restart the track
                    if(debugEnabled) {
                        console.log("[DEBUG]: Looping " + fileNameAsString + " at " + pos);
                    }
                  
                }
            }
        } else if (isPowered === 0 && blockState.isPlaying) {
            const stopCommand = `/stopsound @a ${fileNameAsString}`;
            world.getDimension("overworld").runCommandAsync(stopCommand);

            blockState.isPlaying = false;

            world.sendMessage(`Stopped playing sound at ${pos}`);
        }
    }
}
