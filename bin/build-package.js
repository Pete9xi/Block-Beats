import path from "path";
import fs from "fs-extra";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

// Constants
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Function to run a command and handle errors
function runCommand(command, args) {
    const result = spawnSync(command, args, { stdio: "inherit" });

    if (result.status !== 0) {
        console.error(`${command} failed with code ${result.status}:`);
        if (result.stderr && result.stderr.length > 0) {
            console.error(result.stderr.toString());
        } else if (result.stdout && result.stdout.length > 0) {
            console.error(result.stdout.toString());
        }
        process.exit(1); // Exit immediately if the command fails
    }
    return result;
}

// Read package.json to get the version
const packageJson = fs.readJsonSync("package.json");
const packageVersion = packageJson.version;

// Clean build directory
console.log("Cleaning build directory");
fs.removeSync("build");

// Create necessary directories
console.log("Creating build directory");
fs.mkdirSync("build", { recursive: true });

// Copy assets
console.log("Copying assets");
const assets = ["CHANGELOG.md", "LICENSE", "manifest.json", "pack_icon.png", "README.md"];
assets.forEach((asset) => {
    fs.copyFileSync(asset, path.join("build", asset));
});

// Build project using TypeScript
console.log("Building the project");
const tsConfigPath = path.resolve("./tsconfig.json");
runCommand("node", ["./node_modules/typescript/bin/tsc", "-p", tsConfigPath]);
fs.copySync("src/blocks", path.join("build", "blocks"));

// Check if --server parameter is present
const isServerMode = process.argv.includes("--server");

if (!isServerMode) {
    console.log("Creating distribution archive file");

    const outputFileName = `BeatBox-v${packageVersion}.${process.argv.includes("--mcpack") ? "mcaddon" : "zip"}`;
    const outputFilePath = path.resolve("build/build", outputFileName);

    // Delete existing archive if it exists
    if (fs.existsSync(outputFilePath)) {
        console.log(`Removing existing archive: ${outputFilePath}`);
        fs.unlinkSync(outputFilePath);
    }

    // Explicitly specify the archive format
    console.log("Creating .mcaddon archive...");

    // Create a folder structure for the .mcaddon file
    const addonDir = path.join("build", "addon");
    fs.mkdirSync(addonDir, { recursive: true });

    // Copy resource and behavior packs
    fs.copySync("BlockBeats_RP", path.join(addonDir, "resource_packs"));
    fs.copySync("build/scripts", path.join(addonDir, "behavior_packs"));
    fs.copySync("build/blocks", path.join(addonDir, "behavior_packs"));

    // Create the .mcaddon file by zipping the folder structure
    runCommand("7z", ["a", `-tzip`, outputFilePath, "build/addon/resource_packs", "build/addon/behavior_packs"], { cwd: addonDir });

    console.log(`.mcaddon file created successfully: ${outputFilePath}`);

    // Clean up the addon directory after the build is complete
    console.log("Cleaning up addon directory...");
    fs.removeSync(addonDir);  // Remove the addon directory
    console.log("Addon directory cleaned up.");
}

console.log("Build process completed successfully.");
