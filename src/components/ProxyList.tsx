/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Send, Check, Copy, RefreshCw, AlertCircle, TrendingUp, ShieldCheck } from "lucide-react";
import { TelegramProxy } from "../types";

interface ProxyListProps {
  proxies: TelegramProxy[];
  loading: boolean;
  onRefreshProxies: () => void;
}

export default function ProxyList({ proxies, loading, onRefreshProxies }: ProxyListProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyLink = (url: string, index: number) => {
    navigator.clipboard.writeText(url);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div className="bg-white dark:bg-[#0d0d0f] border border-gray-150 dark:border-zinc-800/60 rounded-2xl p-5 shadow-sm flex flex-col h-full" id="ali3n-telegram-proxies">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-zinc-800/60">
        <div>
          <h2 className="text-md font-bold font-display text-gray-900 dark:text-zinc-100 flex items-center gap-2">
            <Send className="w-5 h-5 text-sky-500 animate-pulse" />
            Рабочие прокси для Telegram (MTProto)
          </h2>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
            Маскируйте трафик мессенджера под защищенные каналы с автоматическим обходом замедлений.
          </p>
        </div>

        <button
          onClick={onRefreshProxies}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 dark:bg-sky-950/20 hover:bg-sky-100 dark:hover:bg-sky-900/30 text-sky-600 dark:text-sky-400 border border-transparent dark:border-sky-500/15 rounded-lg text-xs font-bold transition-all disabled:opacity-50 shrink-0 select-none cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>{loading ? "Поиск прокси..." : "Парсить Telegram"}</span>
        </button>
      </div>

      <div className="my-4 grow overflow-y-auto max-h-[300px] pr-1 space-y-2">
        {proxies.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-zinc-500">
            <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm">Нет доступных Telegram-прокси</p>
            <p className="text-xs text-gray-400 mt-1">Нажмите "Парсить Telegram" для поиска</p>
          </div>
        ) : (
          proxies.map((proxy, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl border border-gray-100 dark:border-zinc-800/40 bg-white dark:bg-[#0d0d0f]/60 hover:bg-gray-50/50 dark:hover:bg-zinc-900/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono"
            >
              {/* Proxy server structure */}
              <div className="truncate flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-sky-100/50 dark:bg-sky-950/20 flex items-center justify-center shrink-0 border border-transparent dark:border-sky-500/10">
                  <Send className="w-4 h-4 text-sky-500" />
                </div>

                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800 dark:text-zinc-200 truncate">{proxy.server}</span>
                    <span className="text-xs text-gray-400 bg-gray-105 dark:bg-[#0a0a0b] px-1.5 py-0.5 rounded border border-transparent dark:border-zinc-800/60 font-semibold text-[11px]">
                      Port: {proxy.port}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-zinc-500 mt-1 uppercase tracking-wider font-sans font-semibold">
                    <ShieldCheck className="w-3 h-3 text-emerald-500 inline" />
                    <span>Спонсор: {proxy.sponsor || "Без рекламы"}</span>
                  </div>
                </div>
              </div>

              {/* Utility operations */}
              <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-gray-100 dark:border-zinc-800/50 pt-2.5 sm:pt-0 shrink-0">
                <div className="text-xs flex items-center gap-1 font-sans">
                  <TrendingUp className="w-3.5 h-3.5 text-sky-450" />
                  <span className={proxy.ping < 30 ? "text-emerald-500 font-bold" : "text-yellow-500"}>
                    {proxy.ping} ms
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyLink(proxy.originalUrl, idx)}
                    className="p-1.5 text-gray-400 hover:text-sky-550 dark:hover:text-sky-400 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-lg transition-all"
                    title="Копировать MTProto URL для TG"
                  >
                    {copiedIndex === idx ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>

                  <a
                    href={proxy.originalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-bold font-sans transition-colors flex items-center gap-1 hover:shadow-md cursor-pointer select-none"
                  >
                    Подключить в TG
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-sky-50/20 dark:bg-sky-950/10 border border-sky-100/50 dark:border-sky-900/30 rounded-xl p-3.5 text-xs text-sky-700 dark:text-sky-300 flex items-start gap-2.5 mt-auto">
        <Send className="w-4 h-4 shrink-0 mt-0.5 text-sky-500" />
        <div>
          <strong className="font-semibold block mb-0.5">Как использовать MTProto прокси?</strong>
          <span>Кликните по кнопке "Подключить в TG" — официальное приложение Telegram автоматически загрузит настройки и применит туннель для обхода блокировки. Рекомендуется для стабильной переписки вне основного VPN туннеля.</span>
        </div>
      </div>
    </div>
  );
}
