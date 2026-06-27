import { blockBeatsVersion } from "./data/version.js";
import debug from "./debug/debug.js";
import { registry } from "./event-listeners/registry.js";
import { subscribeToWorldInitialize } from "./event-listeners/world-initialize.js";

// Conditionally log debug information before calling registry
debug.debugMode && debug.registerBlocks && console.log("Block Beats [DEBUG]: Calling registry for blocks");

registry();
subscribeToWorldInitialize();
console.log(`Block Beats: Initialized successfully. \n Debug mode is ${debug.debugMode ? "ON" : "OFF"}.\n Version: ${blockBeatsVersion}`);
