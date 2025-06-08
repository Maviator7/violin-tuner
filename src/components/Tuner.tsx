import React, { useEffect, useRef, useState } from "react";
import { PitchDetector } from "pitchy";

const NOTES = [
  { note: "C3", freq: 130.81 },
  { note: "C#3", freq: 138.59 },
  { note: "D3", freq: 146.83 },
  { note: "D#3", freq: 155.56 },
  { note: "E3", freq: 164.81 },
  { note: "F3", freq: 174.61 },
  { note: "F#3", freq: 185.0 },
  { note: "G3", freq: 196.0 },
  { note: "G#3", freq: 207.65 },
  { note: "A3", freq: 220.0 },
  { note: "A#3", freq: 233.08 },
  { note: "B3", freq: 246.94 },
  { note: "C4", freq: 261.63 },
  { note: "C#4", freq: 277.18 },
  { note: "D4", freq: 293.66 },
  { note: "D#4", freq: 311.13 },
  { note: "E4", freq: 329.63 },
  { note: "F4", freq: 349.23 },
  { note: "F#4", freq: 369.99 },
  { note: "G4", freq: 392.0 },
  { note: "G#4", freq: 415.3 },
  { note: "A4", freq: 440.0 },
  { note: "A#4", freq: 466.16 },
  { note: "B4", freq: 493.88 },
  { note: "C5", freq: 523.25 },
  { note: "C#5", freq: 554.37 },
  { note: "D5", freq: 587.33 },
  { note: "D#5", freq: 622.25 },
  { note: "E5", freq: 659.25 },
  { note: "F5", freq: 698.46 },
  { note: "F#5", freq: 739.99 },
  { note: "G5", freq: 783.99 },
  { note: "G#5", freq: 830.61 },
  { note: "A5", freq: 880.0 },
  { note: "A#5", freq: 932.33 },
  { note: "B5", freq: 987.77 },
];

function getNearestNote(freq: number) {
  let closest = NOTES[0];
  let minDiff = Math.abs(freq - closest.freq);
  for (const note of NOTES) {
    const diff = Math.abs(freq - note.freq);
    if (diff < minDiff) {
      minDiff = diff;
      closest = note;
    }
  }
  return closest;
}

function getCentDifference(pitch: number, targetFreq: number): number {
  return 1200 * Math.log2(pitch / targetFreq);
}

function centDiffToPercent(cent: number): number {
  const maxCent = 50;
  const percent = ((cent + maxCent) / (maxCent * 2)) * 100;
  return Math.min(100, Math.max(0, percent)); // 0～100%に制限
}

const Tuner: React.FC = () => {
  const [pitch, setPitch] = useState<number | null>(null);
  const [clarity, setClarity] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [cent, setCent] = useState<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const init = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      const buffer = new Float32Array(analyser.fftSize);
      const pitchDetector = PitchDetector.forFloat32Array(analyser.fftSize);

      const detectPitch = () => {
        analyser.getFloatTimeDomainData(buffer);
        const [detectedPitch, clarity] = pitchDetector.findPitch(
          buffer,
          audioContext.sampleRate
        );

        if (clarity > 0.95) {
          const nearest = getNearestNote(detectedPitch);
          const centDiff = getCentDifference(detectedPitch, nearest.freq);

          setPitch(detectedPitch);
          setClarity(clarity);
          setNote(nearest.note);
          setCent(centDiff);
        }

        requestAnimationFrame(detectPitch);
      };

      detectPitch();
    };

    init();
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>🎻 バイオリン チューナー</h1>
      {pitch ? (
        <div>
          <p>検出周波数: {pitch.toFixed(2)} Hz</p>
          <p>近い音: {note}</p>
          <p>音の一致度: {(clarity! * 100).toFixed(1)}%</p>
          <p>セント差: {cent?.toFixed(2)} cent</p>

          {/* メーター */}
          <div className="w-64 bg-gray-300 h-4 rounded-full mx-auto mt-4 relative">
            <div
              className="absolute top-0 h-4 bg-green-500 rounded-full"
              style={{
                left: `${centDiffToPercent(cent ?? 0)}%`,
                width: "4px",
                transform: "translateX(-50%)",
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 w-64 mx-auto mt-1">
            <span>-50¢</span>
            <span>0¢</span>
            <span>+50¢</span>
          </div>
        </div>
      ) : (
        <p>マイクからの入力待ち...</p>
      )}
    </div>
  );
};

export default Tuner;
