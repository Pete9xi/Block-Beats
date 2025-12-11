/**

* Manages Block Beats configuration and interaction events.
  */
import { BlockComponentPlayerInteractEvent, EntityEquippableComponent, EquipmentSlot, ItemStack, Player } from "@minecraft/server";
import { ModalFormData, ModalFormResponse } from "@minecraft/server-ui";
import debug from "../debug/debug";
import { blockBeatsDB } from "../event-listeners/world-initialize";

export class RecordBox {
    /**
     * Generates a unique string key for a block based on its coordinates.
     *
     * @param x - X coordinate of the block.
     * @param y - Y coordinate of the block.
     * @param z - Z coordinate of the block.
     * @returns A unique string key for the block location.
     * @example
     * const key = RecordBox.getBlockKey(-2, 64, 4); // "bbData-2|64|4"
     */
    private static getBlockKey(x: number, y: number, z: number): string {
        return `bbData${x}|${y}|${z}`;
    }

    private static parseTrackLength(input: number): number {
        const [minutes = "0", seconds = "00"] = input.toString().split(".");
        return parseInt(minutes, 10) * 60 + parseInt(seconds.padEnd(2, "0"), 10);
    }

    private static reverseParseTrackLength(seconds: number): string {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return remainingSeconds === 0 ? `${minutes}.00` : `${minutes}.${remainingSeconds.toString().padStart(2, "0")}`;
    }

    /**
     * Displays a configuration UI for a block.
     *
     * @param player - The player interacting with the block.
     * @param blockKey - Unique string key for the block.
     * @param defaultValues - Default values to populate the form.
     */
    private static async showConfigUI(player: Player, blockKey: string, defaultValues: any = {}): Promise<void> {
        const { fileName = "", trackLength = "", isLooping = false, pitch = 1.0, volume = 50.0, isBlockPulsed = false } = defaultValues;

        const configUI = new ModalFormData()
            .title("§9Block Beats - Block Config")
            .textField("FileName", fileName, { defaultValue: fileName })
            .textField("Track Length", RecordBox.reverseParseTrackLength(trackLength), { defaultValue: RecordBox.reverseParseTrackLength(trackLength) })
            .toggle("Loop?", { defaultValue: isLooping })
            .slider("Pitch", 0.1, 2.0, { valueStep: 0.1, defaultValue: pitch })
            .slider("Audio Load Distance", 0.01, 100.0, { valueStep: 50.0, defaultValue: volume })
            .toggle("Enable Play when Pulsed?", { defaultValue: isBlockPulsed });

        try {
            const formData: ModalFormResponse = await configUI.show(player);
            if (formData.cancelationReason === "UserClosed") return;
            const [newFileName, newTrackLength, newIsLooping, newPitch, newVolume, newisBlockPulsed] = formData.formValues;

            const trackLengthInSeconds = RecordBox.parseTrackLength(parseFloat(newTrackLength as string));

            const blockData = {
                fileName: String(newFileName),
                trackLength: trackLengthInSeconds,
                isLooping: Boolean(newIsLooping),
                pitch: Number(newPitch),
                volume: Number(newVolume),
                isPlaying: false,
                startTime: 0,
                isBlockPulsed: Boolean(newisBlockPulsed),
            };

            await blockBeatsDB.set(blockKey, blockData);

            if (debug.debugMode && debug.saveConfig) console.log(`Block Beats [DEBUG]: Saved config for key ${blockKey}:`, blockData);
        } catch (error) {
            console.error("Block Beats Unhandled Rejection: ", error);
        }
    }

    constructor() {
        this.onPlayerInteract = this.onPlayerInteract.bind(this);
    }

    /**
     * Handles player interaction events with a block.
     *
     * @param e - The player interaction event.
     */
    async onPlayerInteract(e: BlockComponentPlayerInteractEvent): Promise<void> {
        const { player, block } = e;
        const blockKey = RecordBox.getBlockKey(block.x, block.y, block.z);
        const equipComp = player.getComponent("minecraft:equippable") as EntityEquippableComponent;
        const mainHandItem: ItemStack = equipComp.getEquipment("Mainhand" as EquipmentSlot);

        let blockData = await blockBeatsDB.get(blockKey);

        if (!blockData) {
            await RecordBox.showConfigUI(player, blockKey);
            return;
        }

        const lockState = blockData.isLocked === true;

        if (mainHandItem?.typeId === "minecraft:stick") {
            blockData = { ...blockData, isLocked: !lockState };
            await blockBeatsDB.set(blockKey, blockData);
            player.sendMessage(lockState ? "§9Block Beats:§r This block has been unlocked." : "§9Block Beats:§r This block has been locked.");
            return;
        }

        if (lockState) {
            player.sendMessage("§9Block Beats:§r This block is currently locked.");
            block.dimension.playSound(blockData.fileName, block.location, { pitch: blockData.pitch, volume: blockData.volume });
            return;
        }

        await RecordBox.showConfigUI(player, blockKey, blockData);
    }
}
