import { world, BlockComponentPlayerDestroyEvent } from "@minecraft/server";
import { debugEnabled } from "../debug/debug";

export class RecordBoxBreak {
    private static getDynamicPropertyKey(location: { x: number; y: number; z: number }): string {
        return `bb${location.x}${location.y}${location.z}`;
    }

    private static deleteDynamicProperties(location: { x: number; y: number; z: number }): void {
        const locationKey = RecordBoxBreak.getDynamicPropertyKey(location);

        if (debugEnabled) {
            console.log(`Block Beats [DEBUG]: Deleting DynamicProperty ${locationKey}`);
            console.log(`Block Beats [DEBUG]: Deleting DynamicProperty bbLength${locationKey}`);
            console.log(`Block Beats [DEBUG]: Deleting DynamicProperty bbPitch${locationKey}`);
            console.log(`Block Beats [DEBUG]: Deleting DynamicProperty bbVolume${locationKey}`);
        }

        world.setDynamicProperty(locationKey, undefined);
        world.setDynamicProperty(`bbLength${locationKey}`, undefined);
        world.setDynamicProperty(`bbPitch${locationKey}`, undefined);
        world.setDynamicProperty(`bbVolume${locationKey}`, undefined);
    }

    constructor() {
        this.onPlayerDestroy = this.onPlayerDestroy.bind(this);
    }

    onPlayerDestroy(event: BlockComponentPlayerDestroyEvent): void {
        const { x, y, z } = event.block;
        const locationKey = RecordBoxBreak.getDynamicPropertyKey({ x, y, z });

        if (world.getDynamicProperty(locationKey) !== undefined) {
            RecordBoxBreak.deleteDynamicProperties({ x, y, z });
        }
    }
}
