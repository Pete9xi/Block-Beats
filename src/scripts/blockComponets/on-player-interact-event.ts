import { BlockComponentPlayerInteractEvent, EntityEquippableComponent, EquipmentSlot, ItemStack, Player, world } from "@minecraft/server";
import { ModalFormData, ModalFormResponse } from "@minecraft/server-ui";
import { debugEnabled } from "../debug/debug";

/**
 * Manages Block Beats configuration and interaction events.
 */
export class RecordBox {
    /**
     * Generates a unique key for a block based on its coordinates.
     *
     * @param x - X coordinate of the block.
     * @param y - Y coordinate of the block.
     * @param z - Z coordinate of the block.
     * @returns A unique numeric key for the block location.
     * @example
     * ```typescript
     * const key = RecordBox.getBlockLocationKey(10, 64, 20); // 10000640020
     * ```
     */
    private static getBlockLocationKey(x: number, y: number, z: number): number {
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
     */
    private static parseTrackLength(input: number): number {
        const [minutes = "0", seconds = "00"] = input.toString().split(".");
        return parseInt(minutes, 10) * 60 + parseInt(seconds.padEnd(2, "0"), 10);
    }

    /**
     * Converts a track length in seconds back to the `mm.ss` format.
     *
     * @param seconds - The track length in seconds.
     * @returns The track length in `mm.ss` format.
     */
    private static reverseParseTrackLength(seconds: number): string {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);

        // If there are no remaining seconds, return only the minutes as a whole number.
        if (remainingSeconds === 0) {
            return `${minutes}.00`;
        }

        // Otherwise, return in mm.ss format
        return `${minutes}.${remainingSeconds.toString().padStart(2, "0")}`;
    }

    /**
     * Displays a configuration UI for the block.
     *
     * @param player - The player interacting with the block.
     * @param blockLocationKey - Unique key for the block location.
     * @param defaultValues - Default values for the configuration form.
     * @returns A promise resolving after the UI interaction.
     */
    private static async showConfigUI(player: Player, blockLocationKey: number, defaultValues: any = {}): Promise<void> {
        const { fileName = "", trackLength = "", isLooping = false, pitch = 1.0, volume = 50.0, isBlockPulsed = false } = defaultValues;

        const configUI = new ModalFormData()
            .title("§9Block Beats - Block Config")
            .textField("FileName", fileName, fileName)
            .textField("Track Length", RecordBox.reverseParseTrackLength(trackLength), RecordBox.reverseParseTrackLength(trackLength))
            .toggle("Loop?", isLooping)
            .slider("Pitch", 0.1, 2.0, 0.1, pitch)
            .slider("Audio Load Distance", 0.01, 100.0, 50.0, volume)
            .toggle("Enable Play when Pulsed?", isBlockPulsed);

        try {
            const formData: ModalFormResponse = await configUI.show(player);
            if (formData.cancelationReason === "UserClosed") return;
            const [newFileName, newTrackLength, newIsLooping, newPitch, newVolume, newisBlockPulsed] = formData.formValues;

            // Ensure the trackLength is properly parsed back into seconds before storing
            const trackLengthInSeconds = RecordBox.parseTrackLength(parseFloat(newTrackLength as string));

            // Create the block data object for configuration
            const blockData = {
                fileName: newFileName,
                trackLength: trackLengthInSeconds,
                isLooping: newIsLooping,
                pitch: newPitch,
                volume: newVolume,
                isPlaying: false,
                startTime: 0,
                isBlockPulsed: newisBlockPulsed,
            };

            // Store the entire block data object as a serialized JSON string under a different key
            world.setDynamicProperty(`bbData${blockLocationKey}`, JSON.stringify(blockData));

            if (debugEnabled) {
                console.log(`Block Beats [DEBUG]: ${JSON.stringify(blockData)}`);
            }
        } catch (error) {
            console.error("Block Beats Unhandled Rejection: ", error);
            // Extract stack trace information
            if (error instanceof Error) {
                const stackLines = error.stack.split("\n");
                if (stackLines.length > 1) {
                    const sourceInfo = stackLines;
                    console.error("Error originated from:", sourceInfo[0]);
                }
            }
        }
    }

    constructor() {
        this.onPlayerInteract = this.onPlayerInteract.bind(this);
    }

    /**
     * Handles player interaction events with the block.
     *
     * @param e - The interaction event object.
     */
    async onPlayerInteract(e: BlockComponentPlayerInteractEvent): Promise<void> {
        const { player, block } = e;
        const blockLocationKey = RecordBox.getBlockLocationKey(block.x, block.y, block.z);
        const playerEquipComp = player.getComponent("minecraft:equippable") as EntityEquippableComponent;
        const mainHandItem: ItemStack = playerEquipComp.getEquipment("Mainhand" as EquipmentSlot);

        // Fetch the serialized block data object
        const blockDataString = world.getDynamicProperty(`bbData${blockLocationKey}`); // Fetch config data from a separate key

        if (blockDataString === undefined) {
            // No config data found, open configuration UI
            await RecordBox.showConfigUI(player, blockLocationKey);
        } else {
            // Deserialize the configuration block data object
            const blockData = JSON.parse(blockDataString as string);

            const lockProp = world.getDynamicProperty(`bbLock${blockLocationKey}`);

            if (mainHandItem && mainHandItem.typeId === "minecraft:stick") {
                if (lockProp === undefined) {
                    // Lock the block
                    world.setDynamicProperty(`bbLock${blockLocationKey}`, "locked");
                    player.sendMessage(`§9Block Beats:§r This block has been locked.`);
                } else {
                    // Unlock the block
                    world.setDynamicProperty(`bbLock${blockLocationKey}`, undefined);
                    player.sendMessage(`§9Block Beats:§r This block has been unlocked.`);
                }
                return;
            }

            if (lockProp === "locked") {
                player.sendMessage(`§9Block Beats:§r This block is currently locked.`);
                //block is locked so we can play the sound if the player has clicked on the block
                block.dimension.playSound(blockData.fileName, block.location, { pitch: blockData.pitch, volume: blockData.volume });
                return;
            }

            // Show the configuration UI with existing block data
            await RecordBox.showConfigUI(player, blockLocationKey, {
                fileName: blockData.fileName,
                trackLength: blockData.trackLength,
                isLooping: blockData.isLooping,
                pitch: blockData.pitch,
                volume: blockData.volume,
                isBlockPulsed: blockData.isBlockPulsed,
            }).catch((error) => {
                console.error("Block Beats Unhandled Rejection: ", error);
                // Extract stack trace information
                if (error instanceof Error) {
                    const stackLines = error.stack.split("\n");
                    if (stackLines.length > 1) {
                        const sourceInfo = stackLines;
                        console.error("Error originated from:", sourceInfo[0]);
                    }
                }
            });
        }
    }
}
