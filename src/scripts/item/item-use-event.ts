import { ItemComponentTypes, ItemUseBeforeEvent, system, world } from "@minecraft/server";

function playsound(eventData: ItemUseBeforeEvent) {
    const player = eventData.source;
    const item = eventData.itemStack;
    const nameTag = item?.nameTag; // DON'T default to ""
    const pos = player.location;

    const worldSoundOptions = {
        pitch: 1.0,
        volume: 16.0,
    };

    const dimension = player.dimension;

    if (player.getItemCooldown("goat_horn") > 0) {
        return;
    }
    if (item.typeId === "minecraft:goat_horn" && nameTag) {
        eventData.cancel = true;

        system.run(() => {
            dimension.playSound("record." + nameTag, pos, worldSoundOptions);

            const coolComp = item.getComponent(ItemComponentTypes.Cooldown);
            coolComp.startCooldown(player);
        });
    }
}

const itemUseBeforeEvent = () => {
    world.beforeEvents.itemUse.subscribe(playsound);
};

export { itemUseBeforeEvent };
