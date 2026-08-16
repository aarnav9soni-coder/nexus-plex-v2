import React from "react";
import { Button } from "@/components/ui/button";

interface ActionPill {
  id: string;
  label: string;
  command: string;
}

interface ActionPillsProps {
  pills: ActionPill[];
  onPillClick: (command: string) => void;
}

export function ActionPills({ pills, onPillClick }: ActionPillsProps) {
  return (
    <div className="flex items-center gap-2 mt-2">
      {pills.map((pill) => (
        <Button
          key={pill.id}
          size="sm"
          onClick={() => onPillClick(pill.command)}
          className="text-sm px-3 py-2.5 rounded-lg font-medium min-w-12 h-11 bg-slate-800 hover:bg-slate-700 text-slate-300"
        >
          {pill.label}
        </Button>
      ))}
    </div>
  );
}