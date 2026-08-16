import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Users,
  Activity,
  Server,
  Zap,
  HardDrive,
  Cpu,
  ArrowLeft,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Sliders,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { showSuccess } from "@/utils/toast";

export default function Admin() {
  const [searchUser, setSearchUser] = useState("");
  const [autoFallback, setAutoFallback] = useState(true);

  const mockUsers = [
    { id: "usr-1", name: "Alex Vance", email: "alex.vance@gmail.com", role: "Free Member", queries: 142, status: "Active", joined: "Today" },
    { id: "usr-2", name: "Sarah Connor", email: "sarah.c@cyberdyne.io", role: "Pro Member", queries: 520, status: "Active", joined: "Yesterday" },
    { id: "usr-3", name: "Dev User", email: "user@nexusflow.ai", role: "Free Member", queries: 89, status: "Active", joined: "3 days ago" },
    { id: "usr-4", name: "Marcus Wright", email: "marcus@resistance.org", role: "Free Member", queries: 12, status: "Idle", joined: "1 week ago" },
  ];

  const filteredUsers = mockUsers.filter(
    (u) => u.name.toLowerCase().includes(searchUser.toLowerCase()) || u.email.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button size="icon" variant="outline" className="border-slate-800 text-slate-400 hover:text-white rounded-xl">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">Nexus Plex Admin Panel</h1>
              <p className="text-xs text-slate-400">System diagnostics, AI route health & user telemetry</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs px-3 py-1 rounded-full font-mono">
            System Operational
          </Badge>
          <Button
            size="sm"
            onClick={() => showSuccess("Refreshed server telemetry!")}
            className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs rounded-xl text-slate-300"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Sync Metrics
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/60 border-slate-800 rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Active Users</p>
              <h3 className="text-2xl font-black text-slate-100 mt-1">1,482</h3>
              <p className="text-[10px] text-emerald-400 mt-1">↑ +18% this week</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800 rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">24h AI Queries</p>
              <h3 className="text-2xl font-black text-slate-100 mt-1">18,940</h3>
              <p className="text-[10px] text-cyan-400 mt-1">100% Free Gateway</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Zap className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800 rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Avg Completion Latency</p>
              <h3 className="text-2xl font-black text-slate-100 mt-1">320ms</h3>
              <p className="text-[10px] text-emerald-400 mt-1">High Speed Route</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800 rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Server Health</p>
              <h3 className="text-2xl font-black text-emerald-400 mt-1">99.98%</h3>
              <p className="text-[10px] text-slate-400 mt-1">0 Failures Detected</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Server className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Model Route Status */}
      <Card className="bg-slate-900/60 border-slate-800 rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-extrabold text-slate-200">AI Engine Gateway Health</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Smart Route Fallback:</span>
            <button
              onClick={() => {
                setAutoFallback(!autoFallback);
                showSuccess(`Smart Fallback toggled ${!autoFallback ? "ON" : "OFF"}`);
              }}
              className={`text-xs px-2.5 py-1 rounded-lg font-bold ${
                autoFallback ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-400"
              }`}
            >
              {autoFallback ? "ENABLED" : "DISABLED"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300">♊ Gemini 1.5 Flash</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                Primary Route
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Keyless Server Gateway</p>
            <div className="flex items-center justify-between text-[11px] pt-1 font-mono text-slate-500">
              <span>Latency: 280ms</span>
              <span>Uptime: 100%</span>
            </div>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300">🧠 DeepSeek R1</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                Reasoning Route
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Chain-of-Thought Engine</p>
            <div className="flex items-center justify-between text-[11px] pt-1 font-mono text-slate-500">
              <span>Latency: 410ms</span>
              <span>Uptime: 99.9%</span>
            </div>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-300">🦙 Llama 3.3 70B</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-bold">
                Fallback Route
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Open-Source General AI</p>
            <div className="flex items-center justify-between text-[11px] pt-1 font-mono text-slate-500">
              <span>Latency: 350ms</span>
              <span>Uptime: 100%</span>
            </div>
          </div>
        </div>
      </Card>

      {/* User Session Monitoring */}
      <Card className="bg-slate-900/60 border-slate-800 rounded-3xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-extrabold text-slate-200">Registered Workspace Members</h2>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <Input
              placeholder="Search user email or name..."
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              className="bg-slate-950 border-slate-800 text-xs pl-8 h-8 rounded-xl w-full sm:w-56"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3 rounded-l-xl">User</th>
                <th className="p-3">Role</th>
                <th className="p-3">Queries Run</th>
                <th className="p-3">Joined</th>
                <th className="p-3 rounded-r-xl">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.map((usr) => (
                <tr key={usr.id} className="hover:bg-slate-950/40 transition-colors">
                  <td className="p-3 font-semibold text-slate-100">
                    <div>{usr.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{usr.email}</div>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold">
                      {usr.role}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-cyan-300">{usr.queries}</td>
                  <td className="p-3 text-slate-400">{usr.joined}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {usr.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}