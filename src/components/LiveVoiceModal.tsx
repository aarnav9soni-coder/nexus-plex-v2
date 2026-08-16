import React from "react";
import { VoiceMode } from "@/components/VoiceMode";

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel?: string;
  userEmail?: string;
}

export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({
  isOpen,
  onClose,
  selectedModel = "gemini-3.7-flash",
  userEmail = "",
}) => {
  return (
    <VoiceMode
      isOpen={isOpen}
      onClose={onClose}
      selectedModel={selectedModel}
      userEmail={userEmail}
    />
  );
};

