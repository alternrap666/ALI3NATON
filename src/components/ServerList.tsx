/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Search, Compass, RefreshCw, Layers, Wifi, Copy, Check, QrCode, Trash2, PlusCircle, AlertCircle, X } from "lucide-react";
import { VpnServer } from "../types";

interface ServerListProps {
  servers: VpnServer[];
  selectedServer: VpnServer | null;
  onSelectServer: (server: VpnServer) => void;
  onRefreshScraper: () => void;
  onDeleteServer: (id: string) => void;
  scraping: boolean;
  onBulkPing: () => void;
  pinging: boolean;
}

export default function ServerList({
  servers,
  selectedServer,
  onSelectServer,
  onRefreshScraper,
  onDeleteServer,
  scraping,
  onBulkPing,
  pinging
}: ServerListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [protocolFilter, setProtocolFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrServer, setQrServer] = useState<VpnServer | null>(null);

  const getCountryEmoji = (code: string) => {
    const flags: Record<string, string> = {
      RU: "🇷🇺", US: "🇺🇸", DE: "🇩🇪", SE: "🇸🇪", FI: "🇫🇮",
      NL: "🇳🇱", FR: "🇫🇷", TR: "🇹🇷", GB: "🇬🇧", IR: "🇮🇷",
      SG: "🇸🇬", JP: "🇯🇵"
    };
    return flags[code.toUpperCase()] || "🌍";
  };

  const getCountryName = (code: string) => {
    const names: Record<string, string> = {
      RU: "Россия", US: "США", DE: "Германия", SE: "Швеция", FI: "Финляндия",
      NL: "Нидерланды", FR: "Франция", TR: "Турция", GB: "Великобритания",
      IR: "Иран", SG: "Сингапур", JP: "Япония"
    };
    return names[code.toUpperCase()] || "Неизвестно";
  };

  const filteredServers = servers.filter(srv => {
    const matchesSearch = srv.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          srv.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProto = protocolFilter === "all" ? true : srv.protocol === protocolFilter;
    return matchesSearch && matchesProto;
  });

  const handleCopyLink = (srv: VpnServer) => {
    navigator.clipboard.writeText(srv.originalUri);
    setCopiedId(srv.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="bg-white dark:bg-[#0d0d0f] border border-gray-150 dark:border-zinc-800/60 rounded-2xl p-5 shadow-sm flex flex-col h-full" id="ali3n-server-manager">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-zinc-800/60">
        <div>
          <h2 className="text-md font-bold font-display text-gray-900 dark:text-zinc-100 flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-500" />
            Доступные узлы обхода (VLESS/TLS)
          </h2>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
            Синхронизировано из открытых баз GitHub и Premium-каналов.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={onBulkPing}
            disabled={pinging || scraping}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-[#0a0a0b] hover:bg-gray-200 dark:hover:bg-zinc-900 border border-transparent dark:border-zinc-800 text-gray-700 dark:text-zinc-300 rounded-lg text-xs font-semibold transition-all select-none"
          >
            <Wifi className={`w-3.5 h-3.5 ${pinging ? "animate-pulse" : ""}`} />
            <span>{pinging ? "Тест пинга..." : "Проверить Пинг"}</span>
          </button>

          <button
            onClick={onRefreshScraper}
            disabled={scraping || pinging}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-550 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 shadow-md shadow-indigo-600/15"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scraping ? "animate-spin" : ""}`} />
            <span>{scraping ? "Поиск конфигов..." : "Обновить Базу"}</span>
          </button>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 my-4">
        <div className="relative sm:col-span-3">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Поиск по названию или IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 dark:bg-[#0a0a0b] text-gray-800 dark:text-zinc-200 pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-zinc-850 rounded-xl focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="sm:col-span-2">
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs text-gray-400 dark:text-zinc-500 flex items-center gap-1 font-semibold uppercase">
              <Layers className="w-3.5 h-3.5" />
            </span>
            <select
              value={protocolFilter}
              onChange={(e) => setProtocolFilter(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#0a0a0b] text-gray-800 dark:text-zinc-200 pl-14 pr-4 py-2 text-sm border border-gray-200 dark:border-zinc-855 rounded-xl focus:outline-none focus:border-indigo-500 appearance-none font-medium"
            >
              <option value="all">Все протоколы</option>
              <option value="vless">VLESS (+Reality)</option>
              <option value="vmess">VMESS</option>
              <option value="trojan">Trojan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Connection Pool List */}
      <div className="grow overflow-y-auto max-h-[350px] pr-1 space-y-2">
        {filteredServers.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-zinc-500">
            <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3 animate-pulse" />
            <p className="text-sm">Нет серверов по выбранным фильтрам</p>
            <p className="text-xs text-gray-400 mt-1">Очистите поиск или обновите базу заново</p>
          </div>
        ) : (
          filteredServers.map((srv) => {
            const isSelected = selectedServer?.id === srv.id;
            return (
              <div
                key={srv.id}
                className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                  isSelected 
                    ? "border-indigo-500/50 bg-indigo-500/5 dark:bg-indigo-600/5 border-l-2 border-l-indigo-550" 
                    : "border-gray-100 dark:border-zinc-800/40 bg-white dark:bg-[#0d0d0f] hover:bg-gray-50/70 dark:hover:bg-zinc-900/30"
                }`}
              >
                {/* Node Details */}
                <div 
                  onClick={() => onSelectServer(srv)}
                  className="flex items-center gap-3 cursor-pointer grow mr-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-lg shadow-inner">
                    {getCountryEmoji(srv.countryCode)}
                  </div>

                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800 dark:text-zinc-100 truncate max-w-[200px] sm:max-w-xs">{srv.name}</span>
                      <span className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                        srv.protocol === 'vless' 
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                          : srv.protocol === 'vmess'
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      }`}>
                        {srv.protocol}{srv.reality ? "+Reality" : ""}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-zinc-500 mt-0.5 font-mono">
                      <span>{srv.address}:{srv.port}</span>
                      <span>•</span>
                      <span>{getCountryName(srv.countryCode)}</span>
                    </div>
                  </div>
                </div>

                {/* Node utilities */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Ping status */}
                  <span className={`text-xs font-mono font-bold mr-1.5 ${
                    srv.ping === null 
                      ? "text-gray-400" 
                      : srv.ping < 40 
                      ? "text-emerald-500" 
                      : srv.ping < 100 
                      ? "text-yellow-500" 
                      : "text-rose-400"
                  }`}>
                    {srv.ping ? `${srv.ping} ms` : "---"}
                  </span>

                  <button
                    onClick={() => handleCopyLink(srv)}
                    title="Копировать URI подключения"
                    className="p-1.5 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    {copiedId === srv.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => setQrServer(srv)}
                    title="Показать QR-код"
                    className="p-1.5 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>

                  {srv.isCustom && (
                    <button
                      onClick={() => onDeleteServer(srv.id)}
                      title="Удалить узел"
                      className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* QR code model modal popup if active */}
      {qrServer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-6 relative shadow-lg">
            <button
              onClick={() => setQrServer(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-300"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <h3 className="text-md font-bold font-display text-gray-800 dark:text-zinc-100">QR-Код Конфигурации</h3>
              <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1 truncate px-2">{qrServer.name}</p>

              <div className="my-6 flex items-center justify-center bg-white p-3 rounded-xl border border-gray-100 mx-auto w-fit">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(qrServer.originalUri)}`}
                  alt="VLESS Config QR Code"
                  referrerPolicy="no-referrer"
                  className="w-48 h-48 block"
                />
              </div>

              <div className="bg-gray-50 dark:bg-zinc-950 p-3 rounded-lg text-xs font-mono break-all line-clamp-3 text-gray-500 dark:text-zinc-400 border border-gray-100 dark:border-zinc-800/50">
                {qrServer.originalUri}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-5">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(qrServer.originalUri);
                    alert("Конфигурация скопирована!");
                  }}
                  className="w-full py-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 font-bold rounded-xl text-xs transition-colors"
                >
                  Копировать Ссылку
                </button>
                <button
                  onClick={() => setQrServer(null)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  Готово
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
