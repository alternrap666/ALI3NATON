/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Shield, ShieldAlert, Power, Activity, HardDrive, RefreshCw, AlertCircle, CheckCircle, Gamepad2 } from "lucide-react";
import { VpnServer } from "../types";

interface VpnDashboardProps {
  connected: boolean;
  connecting: boolean;
  autoSwitch: boolean;
  selectedServer: VpnServer | null;
  onToggleConnect: () => void;
  onToggleAutoSwitch: () => void;
  adBlockCount: number;
  gamingMode: boolean;
  onToggleGamingMode: () => void;
}

export default function VpnDashboard({
  connected,
  connecting,
  autoSwitch,
  selectedServer,
  onToggleConnect,
  onToggleAutoSwitch,
  adBlockCount,
  gamingMode,
  onToggleGamingMode
}: VpnDashboardProps) {
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [totalTraffic, setTotalTraffic] = useState(132.4); // GB
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const speedHistoryRef = useRef<{ down: number[]; up: number[] }>({ down: [], up: [] });

  // Generate simulated traffic logs and update canvas
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (connected) {
      interval = setInterval(() => {
        // Generate random traffic speeds based on connection (realistic values in MB/s)
        const baseDown = selectedServer ? (selectedServer.ping ? Math.max(1.5, 45 - (selectedServer.ping / 5)) : 12) : 10;
        const down = Number((Math.random() * (baseDown * 0.4) + (baseDown * 0.8)).toFixed(1));
        const up = Number((Math.random() * (down * 0.15) + (down * 0.05)).toFixed(1));
        
        setDownloadSpeed(down);
        setUploadSpeed(up);
        setTotalTraffic(prev => Number((prev + (down + up) / 1024).toFixed(4)));

        // Keep last 30 speed values for the wave chart
        const history = speedHistoryRef.current;
        history.down.push(down);
        history.up.push(up);
        if (history.down.length > 30) {
          history.down.shift();
          history.up.shift();
        }
      }, 1000);
    } else {
      setDownloadSpeed(0);
      setUploadSpeed(0);
    }
    return () => clearInterval(interval);
  }, [connected, selectedServer]);

  // Handle canvas graphing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;
    let offset = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      
      const history = speedHistoryRef.current;
      const maxPoints = 30;
      
      // Draw grid lines
      ctx.strokeStyle = "rgba(156, 163, 175, 0.1)";
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let i = 0; i < height; i += 30) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
      }

      if (connected && history.down.length > 0) {
        // Draw download wave (green/cyan)
        ctx.beginPath();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#10b981"; // emerald-500
        
        // Dynamic gradient for wave fill
        const downGradient = ctx.createLinearGradient(0, 0, 0, height);
        downGradient.addColorStop(0, "rgba(16, 185, 129, 0.25)");
        downGradient.addColorStop(1, "rgba(16, 185, 129, 0.0)");

        const dx = width / (maxPoints - 1);
        ctx.moveTo(0, height);

        for (let i = 0; i < history.down.length; i++) {
          const val = history.down[i];
          const maxVal = Math.max(...history.down, 10);
          const y = height - (val / maxVal) * (height * 0.7) - 10;
          const x = i * dx;
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            const prevY = height - (history.down[i - 1] / maxVal) * (height * 0.7) - 10;
            const prevX = (i - 1) * dx;
            const cx1 = prevX + dx / 2;
            const cy1 = prevY;
            const cx2 = prevX + dx / 2;
            const cy2 = y;
            ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x, y);
          }
        }
        
        // Stroke line
        ctx.stroke();
        
        // Complete fill shape
        ctx.lineTo(dx * (history.down.length - 1), height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fillStyle = downGradient;
        ctx.fill();

        // Draw upload wave (purple)
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#a855f7"; // purple-500
        
        const upGradient = ctx.createLinearGradient(0, 0, 0, height);
        upGradient.addColorStop(0, "rgba(168, 85, 247, 0.15)");
        upGradient.addColorStop(1, "rgba(168, 85, 247, 0.0)");

        ctx.moveTo(0, height);
        for (let i = 0; i < history.up.length; i++) {
          const val = history.up[i];
          const maxVal = Math.max(...history.up, 3);
          const y = height - (val / maxVal) * (height * 0.4) - 5;
          const x = i * dx;
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            const prevY = height - (history.up[i - 1] / maxVal) * (height * 0.4) - 5;
            const prevX = (i - 1) * dx;
            const cx1 = prevX + dx / 2;
            const cy1 = prevY;
            const cx2 = prevX + dx / 2;
            const cy2 = y;
            ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x, y);
          }
        }
        ctx.stroke();
        ctx.lineTo(dx * (history.up.length - 1), height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fillStyle = upGradient;
        ctx.fill();
      } else {
        // Draw a sleeping flatline
        ctx.beginPath();
        ctx.strokeStyle = "rgba(156, 163, 175, 0.2)";
        ctx.lineWidth = 2;
        ctx.moveTo(0, height / 2);
        
        for (let i = 0; i < width; i += 10) {
          const y = height / 2 + Math.sin(i * 0.05 + offset) * 1.5;
          ctx.lineTo(i, y);
        }
        ctx.stroke();
        offset += 0.05;
      }

      animFrame = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animFrame);
  }, [connected]);

  return (
    <div className="rounded-2xl border border-gray-150 dark:border-zinc-800/50 bg-white dark:bg-[#0c0c0e] p-6 shadow-sm flex flex-col h-full justify-between" id="ali3n-dashboard-panel">
      {/* Upper Status Bar */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              {connected ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </>
              ) : connecting ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-505"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-zinc-500"></span>
              )}
            </span>
            <span className="text-[10px] font-bold tracking-widest uppercase font-display text-gray-500 dark:text-zinc-500">
              {connected ? "Байпас Активен" : connecting ? "Подключение..." : "Не Защищено"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 dark:bg-zinc-900/60 text-gray-700 dark:text-zinc-450 rounded-full text-xs font-semibold border border-transparent dark:border-zinc-800/40">
            <Shield className="w-3 h-3 text-emerald-500" />
            <span>AdBlock: {adBlockCount > 0 ? `Активен (${adBlockCount})` : "Активация"}</span>
          </div>
        </div>

        {/* Central visual connection node */}
        <div className="flex flex-col items-center justify-center py-6">
          <button
            onClick={onToggleConnect}
            disabled={connecting && !connected}
            id="ali3n-connect-btn"
            className={`relative flex items-center justify-center w-36 h-36 rounded-full cursor-pointer transition-all duration-300 outline-none select-none active:scale-95 border-2 ${
              connected 
                ? "bg-emerald-500/5 text-emerald-400 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.06)]" 
                : connecting
                ? "bg-indigo-500/5 text-indigo-400 border-indigo-500 border-t-transparent animate-spin-slow"
                : "bg-zinc-100 dark:bg-[#111114] hover:bg-zinc-200 dark:hover:bg-[#15151b] text-gray-850 dark:text-zinc-300 border-gray-200 dark:border-zinc-850"
            }`}
          >
            <div className="flex flex-col items-center justify-center">
              <Power className="w-10 h-10 stroke-[2.2]" />
              <span className="font-display font-semibold text-[10px] uppercase mt-2 tracking-widest">
                {connected ? "В СЕТИ" : connecting ? "ЖДИТЕ" : "ПУСК"}
              </span>
            </div>
          </button>

          {selectedServer ? (
            <div className="mt-6 text-center">
              <p className="text-[10px] text-gray-400 dark:text-zinc-600 uppercase tracking-widest font-display font-bold">Текущий сервер</p>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-zinc-300 mt-1 flex items-center justify-center gap-2">
                {selectedServer.name}
              </h3>
              <div className="flex items-center justify-center gap-2 mt-2 text-xs font-mono text-gray-500">
                <span className="bg-gray-100 dark:bg-zinc-900/40 border border-transparent dark:border-zinc-800/40 px-2 py-0.5 rounded text-gray-600 dark:text-zinc-400">
                  {selectedServer.protocol.toUpperCase()}
                </span>
                <span>•</span>
                <span>Port: {selectedServer.port}</span>
                <span>•</span>
                <span className={selectedServer.ping !== null && selectedServer.ping < 50 ? "text-emerald-500 font-bold" : "text-yellow-600"}>
                  {selectedServer.ping ? `${selectedServer.ping} ms` : "---"}
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-6 text-center text-gray-400 dark:text-zinc-600 flex items-center gap-1.5 text-xs">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500/80" />
              <span>Выберите сервер для туннелирования</span>
            </div>
          )}
        </div>
      </div>

      {/* Traffic Monitoring Graph */}
      <div className="mt-4 grow flex flex-col justify-end">
        <div className="flex items-center justify-between mb-2 text-[10px] font-mono text-gray-400 dark:text-zinc-600">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span>
            <span>Download: <strong className="text-gray-700 dark:text-zinc-400">{downloadSpeed} MB/s</strong></span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full inline-block"></span>
            <span>Upload: <strong className="text-gray-700 dark:text-zinc-400">{uploadSpeed} MB/s</strong></span>
          </span>
        </div>

        <div className="relative rounded-xl border border-gray-150 dark:border-zinc-800/40 bg-gray-50 dark:bg-[#070709] p-2 overflow-hidden h-28 flex items-center justify-center">
          <canvas ref={canvasRef} width={420} height={100} className="w-full h-full block opacity-75" />
        </div>
        
        <div className="flex flex-col gap-2.5 mt-3 text-xs text-gray-500 dark:text-zinc-500 border-t border-gray-100 dark:border-zinc-800 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 font-mono text-[11px]">
              <HardDrive className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-650" />
              <span>Всего трафика: <strong className="text-gray-850 dark:text-zinc-400 font-semibold">{totalTraffic.toFixed(2)} GB</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onToggleAutoSwitch}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-display font-bold cursor-pointer border transition-all ${
                autoSwitch 
                  ? "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700" 
                  : "bg-transparent text-gray-400 dark:text-zinc-500 border-gray-200 dark:border-zinc-850 hover:text-zinc-350 hover:bg-gray-100 dark:hover:bg-zinc-900/50"
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${autoSwitch && connected ? "animate-spin" : ""}`} />
              <span>Авто-переключение</span>
            </button>

            <button
              onClick={onToggleGamingMode}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-display font-bold cursor-pointer border transition-all ${
                gamingMode 
                  ? "bg-zinc-100 dark:bg-zinc-800/80 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" 
                  : "bg-transparent text-gray-400 dark:text-zinc-500 border-gray-200 dark:border-zinc-850 hover:text-zinc-350 hover:bg-gray-100 dark:hover:bg-zinc-900/50"
              }`}
            >
              <Gamepad2 className="w-3 h-3" />
              <span>Обход игр: {gamingMode ? "АКТИВЕН" : "ОТКЛ"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
