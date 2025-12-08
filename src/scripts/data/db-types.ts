/**
 * Schema for storing Block Beats audio block data in the persistent database.
 *
 * Each key in the schema is a unique numeric string representing a block's
 * coordinate-based ID (generated from X/Y/Z positions). The value contains
 * all metadata required to play, stop, and manage audio triggered by that block.
 *
 * @example
 * const db: OptimizedDatabase<BlockBeatsDBSchema>;
 * const key = "123400560007"; // generated from block coordinates
 *
 * await db.set(key, {
 *   fileName: "song1.ogg",
 *   trackLength: 12.5,
 *   pitch: 1.0,
 *   volume: 0.8,
 *   isPlaying: false,
 *   startTime: 0,
 *   isLooping: false,
 *   isBlockPulsed: false
 * });
 */
export type BlockBeatsDBSchema = {
    /**
     * A unique string key representing the numeric block ID.
     *
     * Generated using a deterministic formula based on the block's coordinates:
     * `(x * 1e8) + (y * 1e4) + z`
     *
     * This ensures each block position maps to one database entry.
     */
    [numericKey: string]: {
        /**
         * Name of the OGG sound file associated with this block.
         * Must correspond to a valid sound event in the resource pack.
         */
        fileName: string;

        /**
         * Length of the audio track in seconds.
         * Used to determine when to stop playback or loop the sound.
         */
        trackLength: number;

        /**
         * The pitch at which the sound should be played.
         *
         * @default 1.0
         */
        pitch: number;

        /**
         * The volume multiplier for the sound.
         *
         * @default 1.0
         */
        volume: number;

        /**
         * Indicates whether the block is currently playing its sound.
         * The Redstone tick handler updates this automatically.
         */
        isPlaying: boolean;

        /**
         * Timestamp (in milliseconds since epoch) of when the track began playing.
         * Used to measure elapsed playback time.
         */
        startTime: number;

        /**
         * Whether the track should automatically restart when it finishes.
         */
        isLooping: boolean;

        /**
         * Whether the block was triggered by a temporary "pulse" input.
         * If true, playback will not be stopped until the track finishes.
         */
        isBlockPulsed: boolean;
        /**
         * Whether the block is locked to prevent the configuration UI from opening.
         * If true, the UI will not be shown, the block configuration can not be changed. and the sound is triggered.
         */
        isLocked?: boolean;
    };
};
