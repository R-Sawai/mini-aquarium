import { FishIcon, Music2Icon } from "lucide-react";
import { DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

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
      </div>
    </DialogContent>
  );
};
