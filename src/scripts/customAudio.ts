import { debugEnabled } from "./debug/debug.js";
import { registry } from "./worldInitializeBeforeEvent/registry.js";
if(debugEnabled){
    console.log("Block Beats [DEBUG]: Calling registry for blocks");
}

registry();