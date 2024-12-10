<img src="Media\blockbeats.png" alt="Lets Go"> </img>

!> This documentation could change with any version. So be sure to check it once in a while.

## Audio Range
Currently, players cannot adjust the playback range of audio files through the Block Beats UI due to limitations in the Bedrock API. At present, only the Volume and Pitch settings can be modified.

The playback range is defined in the **sound_definitions.json** file. You can customize the range by editing the **max_distance** and **min_distance** values in the file.

For example:
>``` json
"max_distance": 30.0,
"min_distance": null,
>```

!> While editing this file your player base must download a fresh copy this can be forced by updating the Block Beats resource pack version number, or the players can delete the cached pack from their device.

## Seamless looping
Block Beats includes a looping feature for audio playback. However, the looping is not seamless, and there is no fade-in or fade-out due to restrictions in the Bedrock API.

Minecraft Bedrock does not natively support seamless looping of audio files. To enable looping in Block Beats:

- 1. Determine Track Length:
You need to know the exact duration of the audio file in mm.ss format. For example, a track lasting 2 minutes and 45 seconds would be entered as 2.45.

- 2. Configure in the Block Beats UI:
Enter the track length into the Block Beats UI.

- 3. State Management:
The block instance tracks its state. When the specified playback duration has elapsed, and the block is set to loop with redstone power still active, the audio file will replay automatically.

## Duplicate Instance Tracks

Block Beats allows you to play multiple audio tracks simultaneously, enabling rich soundscapes and layered audio experiences. However, the same file cannot be played more than once at the same time due to limitations in the Bedrock API.

When multiple tracks are played, Block Beats assigns a unique playback instance to each file. However, the system does not support creating multiple instances of the same file for simultaneous playback.

For example:

> You can play track1 and track2 simultaneously without issues.
> If you try to play track1 twice at the same time (e.g., on two different blocks), only one instance will be active, and the duplicate will not play.
> 

### Work around
?> To achieve overlapping effects with the same audio, consider creating variations of the file with different names (e.g., track1_a.ogg and track1_b.ogg).