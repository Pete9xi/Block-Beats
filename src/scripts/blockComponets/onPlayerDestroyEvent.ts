import {  world, BlockComponentPlayerDestroyEvent} from "@minecraft/server";
import { debugEnabled } from "../debug/debug";
export class recordBoxBreak {
    constructor() {
        this.onPlayerDestroy = this.onPlayerDestroy.bind(this);
    }
    onPlayerDestroy(e: BlockComponentPlayerDestroyEvent) {
        const blockLocationAsString = e.block.x.toString() + e.block.y.toString() + e.block.z.toString()
        //use the blocks location as a key.
        const testforDynamicProp = world.getDynamicProperty("bb" + blockLocationAsString)
        if (testforDynamicProp === undefined) {
            // Dynamic property doesn't exist so no need to do anything
        } else{
            if(debugEnabled){
                console.log("Block Beats [DEBUG]: Deleting DynamicProperty " + "bb" + blockLocationAsString );
                console.log("Block Beats [DEBUG]: Deleting DynamicProperty " + "bbLength" + blockLocationAsString );
            }
            world.setDynamicProperty("bb" + blockLocationAsString, undefined);
            world.setDynamicProperty("bbLength" + blockLocationAsString, undefined);
        }
    }    
}

