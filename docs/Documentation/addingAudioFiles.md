<img src="Media\blockbeats.png" alt="Lets Go"> </img>

!> This documentation could change with any version. So be sure to check it once in a while.

## File Format.
Block Beats enables you to add custom audio files to your world, realm, or server through the resource pack. However, Minecraft Bedrock Edition supports only one audio format: .ogg.

There are numerous online tools available to convert your audio files to the .ogg format easily.

!> Important: If your audio file is not in the .ogg format, it will not work!

## Where to Add Custom Audio Files
To add your custom audio files, place them in the resource pack for Block Beats. The correct directory is:
```resource_packs/BlockBeats_RP/sounds```
Simply drop your .ogg files into this folder.

## Registring the new audio files
In order for the new audio files to be accessible, we need to add the file path to the **sound_definitions.json** file. This is a directory of all the custom audio files that Block Beats will be able to play, Each player is given a copy of the resource pack when they join the world without it they cannot hear the custom audio.

### How-To Guide: Adding a New Audio File
In this guide, we'll walk through the process of adding a new audio file named `blowtorch.ogg` to Block Beats.

- Step 1: Add Your Audio File
Place the file in the following directory:
`resource_packs/BlockBeats_RP/sounds`

- Step 2: Register the Audio File

Next, you need to register `blowtorch.ogg` in the `sound_definitions.json` file, located in the same directory. Open the file and add an entry for your audio file.

Here’s an example:

> ```json
{
	"format_version": "1.14.0",
	"sound_definitions": {
		"record.blowtorch": {
			"__use_legacy_max_distance": true,
			"category": "record",
			"max_distance": 30.0,
			"min_distance": null,
			"sounds": [
				{
					"load_on_low_memory": true,
					"name": "sounds/record.",
					"stream": true,
					"volume": 0.50
				}
			]
		}
	}
}
> ```

In this example the sound name that a player would use in the BlockBeats UI is ```record.blowtorch``` which is this line
`"record.blowtorch": {`

we define our file path on this line note we don't add the file extension ```"name": "sounds/record.",```

- Step 3: Upload Changes
### Updating an Existing Pack
If you are updating a pack that players have already downloaded:

- Update manifest.json:
Increment the version number to ensure the new resource pack is downloaded. `[1,0,2]`

- Update world_resource_packs.json:
On Bedrock Dedicated Servers (BDS), this file is located in the following directory:
```/worlds/Bedrock level```

!> Important: Failure to update the version will prevent players from receiving the updated pack and they wont be able to hear your new audio files!