import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { showSuccess } from "@/utils/toast";
import { renderFormattedContent } from "@/components/nexus/ChatTab";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp?: string;
}

interface ChatMessagesProps {
  messages: Message[];
  onCopyMessage: (id: string) => void;
  onClearChat: () => void;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  onCopyMessage,
  onClearChat,
}) => {
  return (
    <div className="flex-1 overflow-y-auto space-y-4 pr-2">
      {messages.map((msg) => (
        <div key={msg.id} className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
          {msg.sender === "ai" && (
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0 text-indigo-400 mt-1">
              <Bot className="w-4 h-4" />
            </div>
          )}
          <div
            className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
              msg.sender === "user"
                ? "bg-indigo-600 text-white font-medium rounded-tr-none shadow-md shadow-indigo-600/20"
                : "bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none"
            }`}
          >
            {renderFormattedContent(msg.text)}
            <div className="mt-2 flex items-center justify-between text-[10px] opacity-60 pt-1 border-t border-slate-800/40">
              <span>{msg.timestamp || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(msg.text);
                  showSuccess("Copied message!");
                  onCopyMessage(msg.id);
                }}
                className="hover:text-white ml-2 flex items-center gap-1"
              >
                {onCopyMessage === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>
      ))}
      <div className="h-16"></div>
    </div>
  );
};