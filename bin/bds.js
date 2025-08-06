import fs from "fs";
import https from "https";
import readline from "readline";
import path from "path";
import AdmZip from "adm-zip";
import os from "os";

/**
 * Retrieves the latest version of the Bedrock Dedicated Server (BDS) from a remote API.
 *
 * @returns {Promise<string>} - The latest version of BDS.
 */
function getLatestVersion() {
    const apiURL = "https://osh01.oshosting.co.uk:3100/latest";
    return new Promise((resolve, reject) => {
        https
            .get(apiURL, (res) => {
                let data = "";
                res.on("data", (chunk) => {
                    data += chunk;
                });
                res.on("end", () => {
                    const versionMatches = data.match(/bedrock-server-[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/g);
                    if (versionMatches && versionMatches.length > 0) {
                        const latestVersion = versionMatches.map((version) => version.split("-").pop()).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))[0];
                        resolve(latestVersion);
                    } else {
                        reject("Failed to retrieve the latest version.");
                    }
                });
            })
            .on("error", (error) => {
                reject(error);
            });
    });
}

/**
 * Downloads the specified version of the BDS server for the current operating system.
 *
 * @param {string} version - The version of the BDS server to download.
 * @returns {Promise<string>} - The location where the BDS zip file was saved.
 */
function downloadBDS(version) {
    const osType = os.platform();
    let downloadURL;

    if (osType === "linux") {
        downloadURL = `https://www.minecraft.net/bedrockdedicatedserver/bin-linux/bedrock-server-${version}.zip`;
    } else if (osType === "win32") {
        downloadURL = `https://www.minecraft.net/bedrockdedicatedserver/bin-win/bedrock-server-${version}.zip`;
    } else {
        return Promise.reject("> Unsupported operating system: " + osType);
    }

    const downloadLocation = `bedrock-server-${version}.zip`;

    return new Promise((resolve, reject) => {
        console.log(`> Downloading Minecraft BDS version ${version} for ${osType}...`);

        const file = fs.createWriteStream(downloadLocation);

        const request = https.get(downloadURL, (response) => {
            if (response.statusCode !== 200) {
                file.close();
                fs.unlinkSync(downloadLocation); // Remove the incomplete file
                reject(`   - Failed to download. HTTP status code: ${response.statusCode}\n`);
                return;
            }

            response.pipe(file);

            response.on("end", () => {
                file.end(() => {
                    console.log("   - Download complete.\n");
                    resolve(downloadLocation);
                });
            });
        });

        request.on("error", (error) => {
            fs.unlink(downloadLocation, () => {
                reject(`   - Failed to download: ${error.message}\n`);
            });
        });
    });
}

/**
 * Extracts the downloaded BDS server zip file.
 *
 * @param {string} version - The version of the BDS server to extract.
 * @returns {Promise<void>} - Resolves when extraction is complete.
 */
async function extractBDS(version) {
    const zipFile = `bedrock-server-${version}.zip`;
    const extractionDir = `bedrock-server-${version}`;

    console.log(`> Extracting Minecraft BDS version ${version}...`);

    return new Promise((resolve, reject) => {
        try {
            const zip = new AdmZip(zipFile);
            zip.extractAllTo(extractionDir, true);

            console.log("   - Extraction complete.\n");
            resolve();
        } catch (error) {
            console.error(`   - Extraction error: ${error.message}\n`);
            reject(error);
        }
    });
}

/**
 * Main script to manage the BDS server download, extraction, and folder copying.
 */
async function main() {
    try {
        const latestVersion = await getLatestVersion();
        const oldVersionDir = getLatestOldVersion();
        const newVersionDir = `bedrock-server-${latestVersion}`;

        if (oldVersionDir) {
            console.log(`> Found old version directory: ${oldVersionDir}\n`);
            const oldVersion = oldVersionDir.replace("bedrock-server-", "");

            if (oldVersion === latestVersion) {
                console.log("> Old version and new version are the same. Aborting.");
                return;
            }
        }

        const downloadLocation = await downloadBDS(latestVersion);

        // Proceed with extraction
        await extractBDS(latestVersion);

        // Delete the zip archive after extraction is complete
        deleteZipArchive(downloadLocation);

        copyFolders(oldVersionDir, newVersionDir);
        updateServerProperties(oldVersionDir, newVersionDir);
    } catch (error) {
        console.error(error);
    }
}

/**
 * Deletes the downloaded zip archive after extraction.
 *
 * @param {string} zipFile - The path to the zip file to be deleted.
 */
function deleteZipArchive(zipFile) {
    console.log(`> Deleting zip archive: ${zipFile}`);
    fs.unlink(zipFile, (err) => {
        if (err) {
            console.error(`   - Error deleting zip archive: ${err.message}`);
        } else {
            console.log("   - Zip archive deleted.");
        }
    });
}

/**
 * Retrieves the directory of the latest installed BDS version.
 *
 * @returns {string | null} - The directory of the latest version, or null if no previous version is found.
 */
function getLatestOldVersion() {
    const dirs = fs.readdirSync(process.cwd()).filter((file) => fs.lstatSync(file).isDirectory() && file.startsWith("bedrock-server-"));
    if (dirs.length === 0) {
        return null;
    }

    return dirs.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })).pop();
}

/**
 * Copies important folders from the old version of the BDS server to the new version.
 *
 * @param {string} oldVersionDir - The directory of the old BDS version.
 * @param {string} newVersionDir - The directory of the new BDS version.
 */
function copyFolders(oldVersionDir, newVersionDir) {
    console.log("> Copying worlds and development packs folders...");

    const oldWorldsDir = `${oldVersionDir}/worlds`;
    const newWorldsDir = `${newVersionDir}/worlds`;

    const oldDevBehavPacksDir = `${oldVersionDir}/development_behavior_packs`;
    const newDevBehavPacksDir = `${newVersionDir}/development_behavior_packs`;

    const oldDevResPacksDir = `${oldVersionDir}/development_resource_packs`;
    const newDevResPacksDir = `${newVersionDir}/development_resource_packs`;

    const newWorldBetaApiDir = "new-world-beta-api";

    let copied = false; // Flag to track if anything was copied

    // Ensure that the destination directories are created before copying
    if (!fs.existsSync(newWorldsDir)) {
        fs.mkdirSync(newWorldsDir, { recursive: true });
    }
    if (!fs.existsSync(newDevBehavPacksDir)) {
        fs.mkdirSync(newDevBehavPacksDir, { recursive: true });
    }
    if (!fs.existsSync(newDevResPacksDir)) {
        fs.mkdirSync(newDevResPacksDir, { recursive: true });
    }

    if (fs.existsSync(oldWorldsDir) && fs.existsSync(newWorldsDir)) {
        copyDirectory(oldWorldsDir, newWorldsDir);
        console.log("   - Worlds copied.");
        copied = true;
    } else if (fs.existsSync(newWorldBetaApiDir)) {
        // Copy the 'new-world-beta-api' folder to a subfolder within 'worlds' if 'worlds' is empty
        console.log("   - Copying 'new-world-beta-api' folder.");
        const subfolderName = "Bedrock level"; // Specify the subfolder name
        const subfolderPath = path.join(newWorldsDir, subfolderName); // Use path.join for correct path concatenation
        if (!fs.existsSync(newWorldsDir)) {
            fs.mkdirSync(newWorldsDir, { recursive: true }); // Create the "worlds" directory if it doesn't exist
        }
        if (!fs.existsSync(subfolderPath)) {
            fs.mkdirSync(subfolderPath, { recursive: true }); // Create the subfolder within 'worlds'
        }
        copyDirectory(newWorldBetaApiDir, subfolderPath); // Copy 'new-world-beta-api' contents to the subfolder
        console.log(`   - '${newWorldBetaApiDir}' folder copied to '${subfolderName}' within 'worlds'.`);
    }

    if (fs.existsSync(oldDevBehavPacksDir) && fs.existsSync(newDevBehavPacksDir)) {
        copyDirectory(oldDevBehavPacksDir, newDevBehavPacksDir);
        console.log("   - Development behavior packs copied.");
        copied = true;
    }

    if (fs.existsSync(oldDevResPacksDir) && fs.existsSync(newDevResPacksDir)) {
        copyDirectory(oldDevResPacksDir, newDevResPacksDir);
        console.log("   - Development resource packs copied.");
        copied = true;
    }

    if (!copied) {
        console.log("   - No additional folders to copy.\n");
    } else {
        console.log("\n");
    }
}

/**
 * Recursively copies a directory and its contents to a new location.
 *
 * @param {string} source - The source directory to copy.
 * @param {string} destination - The destination directory.
 */
function copyDirectory(source, destination) {
    if (!fs.existsSync(destination)) {
        fs.mkdirSync(destination, { recursive: true });
    }

    const files = fs.readdirSync(source);
    for (const file of files) {
        const sourcePath = `${source}/${file}`;
        const destPath = `${destination}/${file}`;

        if (fs.lstatSync(sourcePath).isDirectory()) {
            copyDirectory(sourcePath, destPath);
        } else {
            fs.copyFileSync(sourcePath, destPath);
        }
    }
}

/**
 * Compares and updates the server.properties file between the old and new BDS versions.
 *
 * @param {string} oldVersionDir - The directory of the old BDS version.
 * @param {string} newVersionDir - The directory of the new BDS version.
 */
async function updateServerProperties(oldVersionDir, newVersionDir) {
    const oldPropertiesFile = `${oldVersionDir}/server.properties`;
    const newPropertiesFile = `${newVersionDir}/server.properties`;

    console.log("> Comparing server.properties...");

    if (fs.existsSync(oldPropertiesFile) && fs.existsSync(newPropertiesFile)) {
        const oldProperties = readPropertiesFile(oldPropertiesFile);
        const newProperties = readPropertiesFile(newPropertiesFile);

        const updatedProperties = { ...oldProperties }; // Copy old properties

        for (const key in oldProperties) {
            if (newProperties[key] !== oldProperties[key]) {
                console.log("\nDifference found:");
                console.log(`   - Old: ${key}=${oldProperties[key]}`);
                console.log(`   - New: ${key}=${newProperties[key]}`);

                const validResponses = ["y", "yes"];
                const choice = await askQuestion("Apply this change? (y/n): ");

                if (validResponses.includes(choice.toLowerCase())) {
                    updatedProperties[key] = newProperties[key];
                    console.log(`   - Updated: ${key}=${newProperties[key]}`);
                }
            }
        }

        writePropertiesFile(newPropertiesFile, updatedProperties);
        console.log("\n   - server.properties updated.\n");
    }
}

/**
 * Reads the contents of a properties file and returns it as an object.
 *
 * @param {string} filePath - The path to the properties file.
 * @returns {Object} - The key-value pairs from the properties file.
 */
function readPropertiesFile(filePath) {
    const properties = {};
    const fileContents = fs.readFileSync(filePath, "utf8").split("\n");

    fileContents.forEach((line) => {
        const match = line.match(/^\s*(\S+)\s*=\s*(\S+)\s*$/);
        if (match) {
            properties[match[1]] = match[2];
        }
    });

    return properties;
}

/**
 * Writes an updated properties object to a file.
 *
 * @param {string} filePath - The path to the properties file.
 * @param {Object} properties - The updated properties to write to the file.
 */
function writePropertiesFile(filePath, properties) {
    const fileContents = Object.entries(properties)
        .map(([key, value]) => `${key}=${value}`)
        .join("\n");

    fs.writeFileSync(filePath, fileContents, "utf8");
}

/**
 * Asks a question in the console and returns the user's response.
 *
 * @param {string} query - The question to ask.
 * @returns {Promise<string>} - The user's response.
 */
function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(query, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

// Execute the main function
main().catch((error) => console.error("Error:", error));
