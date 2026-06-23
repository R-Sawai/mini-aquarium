import { FishIcon, Music2Icon, SpotlightIcon } from "lucide-react";
import { DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { AQUARIUM_MODES } from "@/consts/aquarium";
import { useAquariumStore } from "@/hooks/use-aquarium-store";

type Props = {
  volume: number;
  setVolume: (v: number) => void;
  fishCount: number;
  setFishCount: (n: number) => void;
};

const SettingRow = ({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center gap-2 text-sm font-medium">
      {icon}
      {label}
    </div>
    {children}
  </div>
);

export const AquariumSettings = ({
  volume,
  setVolume,
  fishCount,
  setFishCount,
}: Props) => {
  const { currentMode, setCurrentMode } = useAquariumStore((state) => state);

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>水槽の設定</DialogTitle>
      </DialogHeader>

      <div className="flex flex-col gap-5 py-1">
        <SettingRow icon={<Music2Icon className="size-4" />} label="BGM音量">
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={-40}
              max={0}
              step={1}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="accent-primary flex-1"
            />
            <span className="text-muted-foreground w-14 text-right text-xs tabular-nums">
              {volume} dB
            </span>
          </div>
        </SettingRow>

        <SettingRow icon={<FishIcon className="size-4" />} label="魚の数">
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={30}
              step={1}
              value={fishCount}
              onChange={(e) => setFishCount(Number(e.target.value))}
              className="accent-primary flex-1"
            />
            <span className="text-muted-foreground w-14 text-right text-xs tabular-nums">
              {fishCount} 匹
            </span>
          </div>
        </SettingRow>

        <SettingRow icon={<SpotlightIcon className="size-4" />} label="モード">
          <div className="flex items-center gap-3">
            <select
              value={currentMode}
              onChange={(e) => {
                const selectedMode = e.target.value;
                if (selectedMode in AQUARIUM_MODES) {
                  setCurrentMode(selectedMode as keyof typeof AQUARIUM_MODES);
                }
              }}
              className="accent-primary border-input bg-background flex-1 rounded border px-2 py-1 text-sm"
            >
              {Object.entries(AQUARIUM_MODES).map(([modeKey, modeName]) => (
                <option key={modeKey} value={modeKey}>
                  {modeName}
                </option>
              ))}
            </select>
          </div>
        </SettingRow>
      </div>
    </DialogContent>
  );
};
