/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Shield, ShieldAlert, CircleDot, Activity, Settings, Check, RefreshCw, Sparkles, Sliders } from "lucide-react";
import { AdBlockLog } from "../types";

interface AdBlockerProps {
  logs: AdBlockLog[];
  enabled: boolean;
  onToggleEnabled: () => void;
  blockedCount: number;
}

export default function AdBlocker({ logs, enabled, onToggleEnabled, blockedCount }: AdBlockerProps) {
  const [filterEasyList, setFilterEasyList] = useState(true);
  const [filterPrivacy, setFilterPrivacy] = useState(true);
  const [filterTrackers, setFilterTrackers] = useState(false);
  const [dnsQueriesCount, setDnsQueriesCount] = useState(1354);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (enabled) {
      interval = setInterval(() => {
        setDnsQueriesCount(prev => prev + Math.floor(Math.random() * 3) + 1);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [enabled]);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col h-full" id="ali3n-adblocker">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold font-display text-gray-900 dark:text-zinc-100 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-500" />
            Встроенный Блокировщик Рекламы (AdBlock)
          </h2>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
            Локальная фильтрация DNS и блокировка вредоносного JS перед рендерингом страниц.
          </p>
        </div>

        {/* Global toggler */}
        <button
          onClick={onToggleEnabled}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
            enabled 
              ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20" 
              : "bg-gray-100 dark:bg-zinc-800 text-gray-400 hover:text-gray-600"
          }`}
        >
          {enabled ? "ВКЛЮЧЕН" : "ОТКЛЮЧЕН"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4 shrink-0">
        {/* Statistics panels */}
        <div className="bg-emerald-50/20 dark:bg-emerald-950/10 p-3.5 rounded-xl border border-emerald-100/50 dark:border-emerald-900/10 text-center">
          <span className="text-xs text-gray-400 dark:text-zinc-500 font-medium">Рекламы заблокировано</span>
          <p className="text-2xl font-black text-emerald-500 font-display mt-1">{enabled ? blockedCount : 0}</p>
        </div>

        <div className="bg-gray-50 dark:bg-zinc-950 p-3.5 rounded-xl border border-gray-100 dark:border-zinc-800 text-center">
          <span className="text-xs text-gray-400 dark:text-zinc-500 font-medium">DNS Запросов прошло</span>
          <p className="text-2xl font-black text-gray-800 dark:text-zinc-200 font-mono mt-1">{enabled ? dnsQueriesCount : 0}</p>
        </div>

        <div className="bg-indigo-50/20 dark:bg-indigo-950/10 p-3.5 rounded-xl border border-indigo-100/30 dark:border-indigo-900/10 text-center">
          <span className="text-xs text-gray-400 dark:text-zinc-500 font-medium">Очищено трафика</span>
          <p className="text-2xl font-black text-indigo-500 font-display mt-1">{enabled ? (blockedCount * 0.14).toFixed(1) : "0.0"} Mb</p>
        </div>
      </div>

      {/* Filter configurations */}
      <div className="border border-gray-100 dark:border-zinc-800 rounded-xl p-3.5 mb-4 shrink-0 bg-gray-50/50 dark:bg-zinc-900/30">
        <h3 className="text-xs font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5" /> Активные листы фильтрации
        </h3>
        
        <div className="space-y-2.5">
          <label className="flex items-center justify-between text-xs cursor-pointer select-none">
            <span className="text-gray-700 dark:text-zinc-300">
              EasyList Standard <span className="text-[10px] text-gray-400 font-mono">(Реклама, баннеры, всплывающие окна)</span>
            </span>
            <input
              type="checkbox"
              disabled={!enabled}
              checked={filterEasyList}
              onChange={() => setFilterEasyList(!filterEasyList)}
              className="accent-emerald-500"
            />
          </label>

          <label className="flex items-center justify-between text-xs cursor-pointer select-none">
            <span className="text-gray-700 dark:text-zinc-300">
              EasyPrivacy Extra <span className="text-[10px] text-gray-400 font-mono">(Трекеры, куки-согласия, аналитика)</span>
            </span>
            <input
              type="checkbox"
              disabled={!enabled}
              checked={filterPrivacy}
              onChange={() => setFilterPrivacy(!filterPrivacy)}
              className="accent-emerald-500"
            />
          </label>

          <label className="flex items-center justify-between text-xs cursor-pointer select-none">
            <span className="text-gray-700 dark:text-zinc-300">
              Peter Lowe's List <span className="text-[10px] text-gray-400 font-mono">(Защита от фишинга и криптомайнеров)</span>
            </span>
            <input
              type="checkbox"
              disabled={!enabled}
              checked={filterTrackers}
              onChange={() => setFilterTrackers(!filterTrackers)}
              className="accent-emerald-500"
            />
          </label>
        </div>
      </div>

      {/* Simulated DNS block line logs terminal */}
      <div className="grow flex flex-col min-h-0">
        <h3 className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2 flex items-center justify-between font-display">
          <span>Монитор DNS Трафика (Живые события)</span>
          <Activity className="w-3.5 h-3.5 text-gray-400 animate-pulse" />
        </h3>

        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-3 font-mono text-[11px] grow overflow-y-auto max-h-[140px] text-zinc-400 space-y-1 scrollbar-thin scrollbar-thumb-zinc-800">
          {!enabled ? (
            <div className="text-center py-6 text-zinc-600">
              <span>[!] Модуль фильтрации выключен. Логирование не ведется.</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-6 text-zinc-600">
              <span>Ожидание сетевой активности...</span>
            </div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="flex justify-between hover:bg-zinc-900/30 py-0.5 rounded px-1">
                <span>
                  <span className="text-zinc-600">[{log.timestamp}]</span>{" "}
                  <span className="text-red-400">[BLOCKED]</span> {log.domain}
                </span>
                <span className="text-zinc-500 font-bold uppercase text-[9px] bg-red-950/40 text-red-400 border border-red-900/50 px-1 rounded">
                  {log.rule}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
