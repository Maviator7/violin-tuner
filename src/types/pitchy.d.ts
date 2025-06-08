declare module 'pitchy' {
    export class PitchDetector {
        static forFloat32Array(size: number): PitchDetector;
        findPitch(buffer: Float32Array, sampleRate: number): [number, number]; // [pitch, clarity]
    }
}