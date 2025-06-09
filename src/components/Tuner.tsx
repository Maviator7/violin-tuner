import React, { useEffect, useRef, useState } from "react";
import { PitchDetector } from "pitchy";
import "./Tuner.css"; // CSSファイルをインポート

// 定数 (変更なし)
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

// ★★★ 新しい関数: セント差を針の角度に変換 ★★★
function centToDegrees(cent: number | null): number {
  if (cent === null) {
    return 0;
  }
  // -50centを-45度、+50centを+45度に対応させる (90度の範囲で動く)
  const degrees = (cent / 50) * 45;
  // 角度が振り切れないように制限する
  return Math.max(-45, Math.min(45, degrees));
}

const Tuner: React.FC = () => {
  const [pitch, setPitch] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [cent, setCent] = useState<number | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Pitch detection logic (元のコードと同じなので変更なし)
    let isMounted = true;
    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        if (!isMounted) return;

        const context = new AudioContext();
        audioContextRef.current = context;
        const source = context.createMediaStreamSource(stream);
        const analyser = context.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);

        const pitchDetector = PitchDetector.forFloat32Array(analyser.fftSize);
        const buffer = new Float32Array(analyser.fftSize);

        const detectPitch = () => {
          if (!isMounted) return;

          analyser.getFloatTimeDomainData(buffer);
          const [detectedPitch, clarity] = pitchDetector.findPitch(
            buffer,
            context.sampleRate
          );

          if (clarity > 0.92 && detectedPitch > 0) {
            const nearest = getNearestNote(detectedPitch);
            const centDiff = getCentDifference(detectedPitch, nearest.freq);
            setPitch(detectedPitch);
            setNote(nearest.note);
            setCent(centDiff);
          } else {
            setPitch(null);
            setNote(null);
            setCent(null);
          }
          animationFrameIdRef.current = requestAnimationFrame(detectPitch);
        };
        detectPitch();
      } catch (err) {
        console.error("マイクへのアクセスに失敗しました:", err);
      }
    };
    init();

    return () => {
      isMounted = false;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const rotation = centToDegrees(cent);
  const isTuned = cent !== null && Math.abs(cent) < 5; // ±5cent以内ならチューニング完了

  return (
    <>
      <div className="tuner-body">
        <div className="screen">
          <div
            className="note-display"
            style={{ color: isTuned ? "#4CAF50" : "#FF9800" }}
          >
            {note ?? "--"}
          </div>
          <div className="freq-display">
            {pitch ? `${pitch.toFixed(2)} Hz` : ""}
          </div>
        </div>

        <div className="meter">
          <div className="scale minus-50">-50</div>
          <div className="scale zero">0</div>
          <div className="scale plus-50">+50</div>
          <div
            className="needle"
            style={{ transform: `rotate(${rotation}deg)` }}
          />
          <div className="pivot" />
        </div>

        <div className="status-text">
          {note === null ? "マイク入力待ち..." : isTuned ? "OK" : "..."}
        </div>
      </div>
    </>
  );
};

export default Tuner;
