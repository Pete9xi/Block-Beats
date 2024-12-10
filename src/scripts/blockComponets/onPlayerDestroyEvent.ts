import {  world, BlockComponentPlayerDestroyEvent} from "@minecraft/server";
import { debugEnabled } from "../debug/debug";
export class recordBoxBreak {
    constructor() {
        this.onPlayerDestroy = this.onPlayerDestroy.bind(this);
    }
    onPlayerDestroy(e: BlockComponentPlayerDestroyEvent) {
        const blockLocationAsString = e.block.x.toString() + e.block.y.toString() + e.block.z.toString()
        //use the blocks location as a key.
        const testforDynamicProp = world.getDynamicProperty("cab" + blockLocationAsString)
        if (testforDynamicProp === undefined) {
            // Dynamic property doesn't exist so no need to do anything
        } else{
            if(debugEnabled){
                console.log("[DEBUG]: Deleting DynamicProperty " + "cab" + blockLocationAsString );
                console.log("[DEBUG]: Deleting DynamicProperty " + "cabLength" + blockLocationAsString );
            }
            world.setDynamicProperty("cab" + blockLocationAsString, undefined);
            world.setDynamicProperty("cabLength" + blockLocationAsString, undefined);
        }
    }    
}

