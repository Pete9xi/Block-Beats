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
     * Displays a configuration UI for the block.
     *
     * @param player - The player interacting with the block.
     * @param blockLocationKey - Unique key for the block location.
     * @param defaultValues - Default values for the configuration form.
     * @returns A promise resolving after the UI interaction.
     */
    private static async showConfigUI(player: Player, blockLocationKey: number, defaultValues: any = {}): Promise<void> {
        const { fileName = "", trackLength = "", isLooping = false, pitch = 1.0, volume = 1.0 } = defaultValues;

        const configUI = new ModalFormData()
            .title("§9Block Beats - Block Config")
            .textField("FileName", fileName, fileName)
            .textField("Track Length", trackLength, trackLength)
            .toggle("Loop?", isLooping)
            .slider("Pitch", 0.1, 2.0, 0.1, pitch)
            .slider("Volume", 0.01, 1.0, 0.01, volume);

        try {
            const formData: ModalFormResponse = await configUI.show(player);
            if (formData.cancelationReason === "UserClosed") return;
            const [newFileName, newTrackLength, newIsLooping, newPitch, newVolume] = formData.formValues;

            // Create the block data object
            const blockData = {
                fileName: newFileName.toString(),
                trackLength: newTrackLength.toString(),
                isLooping: newIsLooping,
                pitch: newPitch,
                volume: newVolume,
            };

            // Store the entire block data object as a serialized JSON string
            world.setDynamicProperty(`bbData${blockLocationKey}`, JSON.stringify(blockData));

            if (debugEnabled) {
                console.log(`Block Beats [DEBUG]: ${JSON.stringify(blockData)}`);
            }
        } catch (error) {
            console.log("Failed to show form:", error);
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
        const blockDataString = world.getDynamicProperty(`bbData${blockLocationKey}`);

        if (blockDataString === undefined) {
            // No data found, open configuration UI
            await RecordBox.showConfigUI(player, blockLocationKey);
        } else {
            // Deserialize the block data object
            const blockData = JSON.parse(blockDataString as string);

            const lockProp = world.getDynamicProperty(`bbLock${blockLocationKey}`);

            if (mainHandItem.typeId === "minecraft:stick") {
                if (lockProp === undefined) {
                    // Lock the block
                    world.setDynamicProperty(`bbLock${blockLocationKey}`, "locked");
                } else {
                    // Unlock the block
                    world.setDynamicProperty(`bbLock${blockLocationKey}`, undefined);
                    player.sendMessage(`§9Block Beats:§r This block has been unlocked.`);
                }
                return;
            }

            if (lockProp === "locked") {
                player.sendMessage(`§9Block Beats:§r This block is currently locked.`);
                return;
            }

            // Show the configuration UI with existing block data
            await RecordBox.showConfigUI(player, blockLocationKey, {
                fileName: blockData.fileName,
                trackLength: blockData.trackLength,
                isLooping: blockData.isLooping,
                pitch: blockData.pitch,
                volume: blockData.volume,
            });
        }
    }
}
