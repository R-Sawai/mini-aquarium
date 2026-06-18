import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";

// テーマごとに変化させることも可能な構造にしておく
const CHORD_DATA = {
  day: [
    ["F3", "A3", "C4", "E4"], // Fmaj7 (明るく透き通るコード)
    ["Bb3", "D4", "F4", "A4"], // Bbmaj7
    ["D3", "F3", "A3", "C4"], // Dm7
    ["C3", "E3", "G3", "A3"], // C6
  ],
};

const PLAYABLE_NOTES = {
  day: ["C4", "D4", "E4", "G4", "A4", "C5", "D5", "E5"],
};

export const useBgm = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(-12); // デシベル単位 (-40 〜 0)

  // Tone.jsのオブジェクトやエフェクターを保持するRef
  const synthRef = useRef<Tone.PolySynth>(null);
  const melodySynthRef = useRef<Tone.MonoSynth>(null);
  const delayRef = useRef<Tone.FeedbackDelay>(null);
  const reverbRef = useRef<Tone.Reverb>(null);
  const analyserRef = useRef<Tone.Analyser>(null);
  const volumeNodeRef = useRef<Tone.Volume>(null);
  const chordLoopRef = useRef<Tone.Loop>(null);
  const melodyLoopRef = useRef<Tone.Loop>(null);
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const volumeRef = useRef(volume);

  // volume 変更を音量ノードにリアルタイム反映
  useEffect(() => {
    volumeRef.current = volume;
    volumeNodeRef.current?.volume.rampTo(volume, 0.1);
  }, [volume]);

  // 音響システムの構築
  const initAudio = async () => {
    await Tone.start();

    // マスター音量調整ノード
    volumeNodeRef.current = new Tone.Volume(volumeRef.current).toDestination();

    // エフェクター：空間の広がり（リバーブ）
    reverbRef.current = new Tone.Reverb({
      decay: 4.0, // 長めの残響
      wet: 0.55,
    }).connect(volumeNodeRef.current);
    await reverbRef.current.ready;

    // エフェクター：エコー（フィードバックディレイ）
    delayRef.current = new Tone.FeedbackDelay({
      delayTime: "0.45",
      feedback: 0.4,
      wet: 0.35,
    }).connect(reverbRef.current);

    // ビジュアライザー用のアナライザー
    analyserRef.current = new Tone.Analyser("fft", 256);
    volumeNodeRef.current.connect(analyserRef.current);

    // コード（和音）伴奏用シンセサイザー
    synthRef.current = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" }, // 柔らかい丸みのある波形
      envelope: {
        attack: 1.5, // ふわっと入る
        decay: 2.0,
        sustain: 0.8,
        release: 2.5, // 余韻を長く
      },
    }).connect(reverbRef.current);

    // 自動メロディ用シンセサイザー
    melodySynthRef.current = new Tone.MonoSynth({
      oscillator: { type: "sine" }, // 純粋で透き通る音
      filter: { Q: 1, type: "lowpass", frequency: 1200 },
      envelope: {
        attack: 0.1, // 水滴のようなアタック感
        decay: 0.4,
        sustain: 0.1,
        release: 1.2,
      },
    }).connect(delayRef.current);

    // 定期的な和音（コード）進行の構築（6秒サイクル）
    let chordIndex = 0;
    chordLoopRef.current = new Tone.Loop((time) => {
      const chord = CHORD_DATA.day[chordIndex];
      synthRef.current?.triggerAttackRelease(chord, "5.5", time);
      chordIndex = (chordIndex + 1) % CHORD_DATA.day.length;
    }, "6").start(0);

    // 水滴のようにランダムにきらめく自動メロディ（1.5秒〜4秒のランダム間隔）
    melodyLoopRef.current = new Tone.Loop((time) => {
      // 70%の確率で音を鳴らす
      if (Math.random() > 0.3) {
        const notes = PLAYABLE_NOTES.day;
        const note = notes[Math.floor(Math.random() * notes.length)];
        // 1〜2オクターブ上げて高いきらめきを表現
        const octave = Math.random() > 0.5 ? "5" : "6";
        melodySynthRef.current?.triggerAttackRelease(
          note.replace(/[0-9]/g, "") + octave,
          "16n",
          time,
        );
      }
    }, "2n").start(0.5); // 2拍（約1.5秒）ごとに抽選

    // テンポの初期設定
    Tone.getTransport().bpm.value = 80;
  };

  // オーディオリソースの破棄
  const cleanupAudio = () => {
    clearTimeout(stopTimeoutRef.current ?? undefined);
    try {
      chordLoopRef.current?.dispose();
      melodyLoopRef.current?.dispose();
      synthRef.current?.dispose();
      melodySynthRef.current?.dispose();
      delayRef.current?.dispose();
      reverbRef.current?.dispose();
      volumeNodeRef.current?.dispose();
      analyserRef.current?.dispose();
      Tone.getTransport().stop();
      Tone.getTransport().cancel();
    } catch (e) {
      console.warn("Audio cleanup error:", e);
    }
  };

  // 演奏の再生・停止
  const handlePlayToggle = async () => {
    if (!isPlaying) {
      if (!synthRef.current) {
        await initAudio();
      }
      Tone.getTransport().start();
      volumeNodeRef.current?.volume.rampTo(volumeRef.current, 0.5);
      setIsPlaying(true);
    } else {
      volumeNodeRef.current?.volume.rampTo(-Infinity, 0.5);
      stopTimeoutRef.current = setTimeout(() => {
        Tone.getTransport().stop();
        setIsPlaying(false);
      }, 500);
    }
  };

  useEffect(() => {
    return cleanupAudio;
  }, []);

  return {
    isPlaying,
    volume,
    setVolume,
    handlePlayToggle,
  };
};
