import { world } from "@minecraft/server";
import { recordBox } from "../blockComponets/on-player-interact-event";
import { redstoneComp } from "../blockComponets/on-tick-event";
import { recordBoxBreak } from "../blockComponets/on-player-destroy-event";
function registry() {
    world.beforeEvents.worldInitialize.subscribe((initEvent) => {
        initEvent.blockComponentRegistry.registerCustomComponent("rb:on_interact", new recordBox());
        initEvent.blockComponentRegistry.registerCustomComponent("rb:onTick", new redstoneComp());
        initEvent.blockComponentRegistry.registerCustomComponent("rb:onPlayerDestroy", new recordBoxBreak());
    });
}
export { registry };
