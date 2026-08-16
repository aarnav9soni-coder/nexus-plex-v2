import React from "react";
import { User, LogOut, Bell, Sparkles, Key, ShieldCheck, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { UserProfile } from "@/types/auth";
import { showSuccess } from "@/utils/toast";

interface UserProfileMenuProps {
  user: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onToggleNotifications: (enabled: boolean) => void;
  onOpenWhatsNew: () => void;
  onOpenAdvancedKeys: () => void;
}

export function UserProfileMenu({
  user,
  onOpenAuth,
  onLogout,
  onToggleNotifications,
  onOpenWhatsNew,
  onOpenAdvancedKeys,
}: UserProfileMenuProps) {
  if (!user) {
    return (
      <Button
        onClick={onOpenAuth}
        className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold h-8 px-3.5 shadow-md shadow-indigo-600/20"
      >
        Sign In / Sign Up
      </Button>
    );
  }

  const handleNotificationToggle = () => {
    const nextState = !user.notificationsEnabled;
    if (nextState && "Notification" in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          showSuccess("Web Notifications enabled!");
        }
      });
    }
    onToggleNotifications(nextState);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors">
          <img
            src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`}
            alt={user.name}
            className="w-7 h-7 rounded-lg object-cover bg-slate-950"
          />
          <span className="text-xs font-bold text-slate-200 hidden md:inline-block max-w-[100px] truncate">
            {user.name}
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 bg-slate-950 border-slate-800 text-slate-200 rounded-2xl p-2 shadow-2xl">
        <DropdownMenuLabel className="font-normal p-2">
          <div className="flex flex-col space-y-1">
            <p className="text-xs font-bold text-slate-100 leading-none">{user.name}</p>
            <p className="text-[10px] text-slate-400 truncate leading-none">{user.email}</p>
            <div className="pt-1.5 flex items-center gap-1 text-[10px] text-indigo-400 font-mono">
              <ShieldCheck className="w-3 h-3 text-cyan-400" />
              <span>Created by Aarnav</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-800/80" />

        <DropdownMenuItem onClick={handleNotificationToggle} className="cursor-pointer text-xs rounded-xl p-2 focus:bg-slate-900">
          <Bell className="w-3.5 h-3.5 mr-2 text-indigo-400" />
          <span className="flex-1">Push Notifications</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${user.notificationsEnabled ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-500"}`}>
            {user.notificationsEnabled ? "ON" : "OFF"}
          </span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onOpenWhatsNew} className="cursor-pointer text-xs rounded-xl p-2 focus:bg-slate-900">
          <Sparkles className="w-3.5 h-3.5 mr-2 text-indigo-400" />
          <span>What's New (Release Notes)</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onOpenAdvancedKeys} className="cursor-pointer text-xs rounded-xl p-2 focus:bg-slate-900">
          <Key className="w-3.5 h-3.5 mr-2 text-indigo-400" />
          <span>Advanced API Key Settings</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-slate-800/80" />

        <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-xs rounded-xl p-2 text-rose-400 focus:bg-rose-950/30 focus:text-rose-300">
          <LogOut className="w-3.5 h-3.5 mr-2" />
          <span>Log Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}