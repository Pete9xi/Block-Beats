import { system } from "@minecraft/server";
import { RecordBox } from "../blockComponets/on-player-interact-event";
import { RedstoneComp } from "../blockComponets/on-tick-event";
import { RecordBoxBreak } from "../blockComponets/on-player-destroy-event";

function registry() {
    system.beforeEvents.startup.subscribe((initEvent) => {
        // Register custom components efficiently with a single method call
        const { blockComponentRegistry } = initEvent;

        blockComponentRegistry.registerCustomComponent("rb:on_interact", new RecordBox());
        blockComponentRegistry.registerCustomComponent("rb:onTick", new RedstoneComp());
        blockComponentRegistry.registerCustomComponent("rb:onPlayerBreak", new RecordBoxBreak());
    });
}

export { registry };
