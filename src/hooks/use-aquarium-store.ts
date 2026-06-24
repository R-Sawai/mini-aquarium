import { create } from "zustand";
import { AQUARIUM_MODES } from "@/consts/aquarium";

/** 水槽の状態管理用ストア */
interface AquariumState {
  /** 水槽の現在のモード */
  currentMode: keyof typeof AQUARIUM_MODES;

  /** 水槽のモードを切り替える関数 */
  setCurrentMode: (mode: keyof typeof AQUARIUM_MODES) => void;
}

/** Zustand を使った水槽の状態管理ストア */
export const useAquariumStore = create<AquariumState>((set) => ({
  /** 水槽の現在のモード */
  currentMode: "normal",
  /** 水槽のモードを切り替える関数 */
  setCurrentMode: (mode) => set({ currentMode: mode }),
}));
