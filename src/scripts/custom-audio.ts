import { debugEnabled } from "./debug/debug.js";
import { registry } from "./worldInitializeBeforeEvent/registry.js";

// Conditionally log debug information before calling registry
debugEnabled && console.log("Block Beats [DEBUG]: Calling registry for blocks");

registry();
