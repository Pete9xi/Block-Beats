import { BlockComponentPlayerInteractEvent, EntityEquippableComponent, EquipmentSlot, ItemStack, Player, world } from "@minecraft/server";
import { ModalFormData, ModalFormResponse } from "@minecraft/server-ui";
import { debugEnabled } from "../debug/debug";

export class RecordBox {
    private static getBlockLocationKey(x: number, y: number, z: number): string {
        return `${x}${y}${z}`;
    }

    private static async showConfigUI(player: Player, blockLocationKey: string, defaultValues: any = {}): Promise<void> {
        const { fileName = "", trackLength = "", isLooping = false, pitch = 1.0, volume = 1.0 } = defaultValues;

        const configUI = new ModalFormData()
            .title("§9Block Beats - Block Config")
            .textField("FileName", fileName)
            .textField("Track Length", trackLength)
            .toggle("Loop?", isLooping)
            .slider("Pitch", 0.1, 2.0, 0.1, pitch)
            .slider("Volume", 0.01, 1.0, 0.01, volume);

        try {
            const formData: ModalFormResponse = await configUI.show(player);
            if (formData.cancelationReason === "UserClosed") return;
            const [newFileName, newTrackLength, newIsLooping, newPitch, newVolume] = formData.formValues;

            if (newIsLooping) {
                world.setDynamicProperty(`bbLength${blockLocationKey}`, newTrackLength.toString());
            }
            world.setDynamicProperty(`bb${blockLocationKey}`, newFileName.toString());
            world.setDynamicProperty(`bbPitch${blockLocationKey}`, newPitch);
            world.setDynamicProperty(`bbVolume${blockLocationKey}`, newVolume);

            if (debugEnabled) {
                console.log(`Block Beats [DEBUG]: fileName: ${newFileName}`);
                console.log(`Block Beats [DEBUG]: trackLength: ${newTrackLength}`);
                console.log(`Block Beats [DEBUG]: pitch: ${newPitch}`);
                console.log(`Block Beats [DEBUG]: volume: ${newVolume}`);
            }
        } catch (error) {
            console.log("Failed to show form:", error);
        }
    }

    constructor() {
        this.onPlayerInteract = this.onPlayerInteract.bind(this);
    }

    async onPlayerInteract(e: BlockComponentPlayerInteractEvent): Promise<void> {
        const { player, block } = e;
        const blockLocationKey = RecordBox.getBlockLocationKey(block.x, block.y, block.z);
        const playerEquipComp = player.getComponent("minecraft:equippable") as EntityEquippableComponent;
        const mainHandItem: ItemStack = playerEquipComp.getEquipment("Mainhand" as EquipmentSlot);

        // Attempt to fetch existing dynamic properties
        const dynamicProp = world.getDynamicProperty(`bb${blockLocationKey}`);

        if (dynamicProp === undefined) {
            // Try to reinstate block state if previous properties exist
            const fileName = world.getDynamicProperty(`bb${blockLocationKey}`);
            const trackLength = world.getDynamicProperty(`bbLength${blockLocationKey}`);
            const pitch = world.getDynamicProperty(`bbPitch${blockLocationKey}`);
            const volume = world.getDynamicProperty(`bbVolume${blockLocationKey}`);

            if (fileName && trackLength && pitch !== undefined && volume !== undefined) {
                // Rebuild the block configuration from properties
                await RecordBox.showConfigUI(player, blockLocationKey, {
                    fileName: fileName.toString(),
                    trackLength: trackLength.toString(),
                    pitch: Number(pitch),
                    volume: Number(volume),
                });
            } else {
                // Properties not found, open configuration UI
                await RecordBox.showConfigUI(player, blockLocationKey);
            }
        } else {
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

            // Show UI for editing the block's configuration
            const trackLength = world.getDynamicProperty(`bbLength${blockLocationKey}`) || "";
            const pitch = world.getDynamicProperty(`bbPitch${blockLocationKey}`) || 1.0;
            const volume = world.getDynamicProperty(`bbVolume${blockLocationKey}`) || 1.0;
            const isLooping = trackLength !== "" ? true : false;

            await RecordBox.showConfigUI(player, blockLocationKey, {
                fileName: dynamicProp.toString(),
                trackLength: trackLength.toString(),
                isLooping,
                pitch,
                volume,
            });
        }
    }
}
