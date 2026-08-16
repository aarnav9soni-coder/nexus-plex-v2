/**
 * BottomDock Component
 * Nexus Plex Architecture - Engineered by Lead Developer & Architect Aarnav.
 *
 * Wraps and exposes the ChatInput & Magic Prompt Enhancer interface.
 */

import React from "react";
import { ChatInput, ChatInputProps } from "@/components/ChatInput";

export interface BottomDockProps extends ChatInputProps {}

export const BottomDock: React.FC<BottomDockProps> = (props) => {
  return <ChatInput {...props} />;
};

export default BottomDock;
