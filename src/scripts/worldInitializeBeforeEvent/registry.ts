import { world } from "@minecraft/server";
import { recordBox } from "../blockComponets/onPlayerInteractEvent";
import { redstoneComp } from "../blockComponets/onTickEvent";
import { recordBoxBreak } from "../blockComponets/onPlayerDestroyEvent";
function registry() {
    world.beforeEvents.worldInitialize.subscribe((initEvent) => {
        initEvent.blockComponentRegistry.registerCustomComponent("rb:on_interact", new recordBox());
        initEvent.blockComponentRegistry.registerCustomComponent("rb:onTick", new redstoneComp());
        initEvent.blockComponentRegistry.registerCustomComponent("rb:onPlayerDestroy", new recordBoxBreak());
    });
}
export { registry };
