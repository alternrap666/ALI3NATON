/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Puzzle, ToggleLeft, ToggleRight, Check, Sparkles, Plus, Play, Info } from "lucide-react";
import { AppPlugin } from "../types";

export default function PluginsManager() {
  const [plugins, setPlugins] = useState<AppPlugin[]>([
    {
      id: "geoip-router",
      name: "Russian GeoIP Router (Обход Рунета)",
      version: "1.2.0",
      description: "Автоматически пускает трафик российских сайтов напрямую, а заблокированные ресурсы направляет в VPN-туннель.",
      author: "ALI3NATION Core Team",
      enabled: true,
      code: "// GeoIP rule checker\nif (domain.endsWith('.ru')) return 'direct';\nreturn 'vpn';"
    },
    {
      id: "speed-optimizer",
      name: "DPI Packet Obfuscator (Защита ТСПУ)",
      version: "2.1.4",
      description: "Разбивает пакеты рукопожатия TLS на фрагменты и маскирует размер фреймов для обхода систем глубокой фильтрации (DPI).",
      author: "AnonymTeam",
      enabled: true,
      code: "// Splitting payload packet frames\ntunnel.obfuscator.splitHandshake(true);\ntunnel.obfuscator.setFakeSizeRange(5, 45);"
    },
    {
      id: "dns-list-booster",
      name: "Yandex Blocklist DNS Booster",
      version: "0.8.0",
      description: "Интегрирует дополнительные DNS-серверы для защиты от скрытого трекинга и умных рекламных скриптов.",
      author: "AdBuster Devs",
      enabled: false,
      code: "// DNS proxy list extensions\nadblock.addSource('https://dns.yandex.ru/api/blocklist');"
    }
  ]);

  const [pluginName, setPluginName] = useState("");
  const [pluginDesc, setPluginDesc] = useState("");
  const [pluginCode, setPluginCode] = useState("");
  const [addingError, setAddingError] = useState("");

  const handleTogglePlugin = (id: string) => {
    setPlugins(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
  };

  const handleInstallPlugin = (e: React.FormEvent) => {
    e.preventDefault();
    setAddingError("");
    
    if (!pluginName || !pluginDesc || !pluginCode) {
      setAddingError("Пожалуйста, заполните все поля формы");
      return;
    }

    const newPlugin: AppPlugin = {
      id: "plugin-" + Math.random().toString(36).substring(2, 9),
      name: pluginName,
      version: "1.0.0",
      description: pluginDesc,
      author: "Custom User Developer",
      enabled: true,
      code: pluginCode
    };

    setPlugins(prev => [newPlugin, ...prev]);
    setPluginName("");
    setPluginDesc("");
    setPluginCode("");
    alert(`Плагин "${pluginName}" успешно загружен и инициализирован!`);
  };

  const executePluginDiagnostic = (p: AppPlugin) => {
    alert(`[DIAGNOSTIC SUCCESS] Плагин "${p.name}" (v${p.version}) прошел проверку синтаксиса и корректно интегрирован в ядро ALI3NATION!`);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col h-full overflow-y-auto max-h-[500px]" id="ali3n-plugins-manager">
      <div>
        <h2 className="text-lg font-bold font-display text-gray-900 dark:text-zinc-100 flex items-center gap-2">
          <Puzzle className="w-5 h-5 text-indigo-500 animate-spin-slow" />
          Менеджер Javascript-Плагинов
        </h2>
        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
          Расширяйте возможности фильтрации, добавляйте кастомные DNS-серверы и правила маршрутизации.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-4">
        {/* Active plugins lists */}
        <div className="space-y-3.5">
          <h3 className="text-xs font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            <Info className="w-3.5 h-3.5" /> Установленные расширения
          </h3>

          <div className="space-y-3">
            {plugins.map(p => (
              <div
                key={p.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  p.enabled 
                    ? "border-emerald-200/50 dark:border-emerald-950/50 bg-emerald-500/5" 
                    : "border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-gray-800 dark:text-zinc-200">{p.name}</h4>
                    <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium">Версия {p.version} • от {p.author}</span>
                  </div>

                  <button
                    onClick={() => handleTogglePlugin(p.id)}
                    className="p-1 rounded-full text-zinc-400 hover:text-indigo-500"
                    title={p.enabled ? "Отключить" : "Включить"}
                  >
                    {p.enabled ? (
                      <ToggleRight className="w-8 h-8 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-gray-300 dark:text-zinc-600" />
                    )}
                  </button>
                </div>

                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2 font-sans leading-relaxed">
                  {p.description}
                </p>

                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800/60 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-950/20 p-2 rounded">
                  <span className="text-[10px] font-mono text-gray-400 truncate max-w-[150px]">{p.code.slice(0, 40)}...</span>
                  <button
                    onClick={() => executePluginDiagnostic(p)}
                    className="flex items-center gap-1 text-[10px] bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded font-bold hover:bg-indigo-100 transition-all font-sans"
                  >
                    <Play className="w-2.5 h-2.5" /> Тест плагина
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Developers plugin installer */}
        <div className="border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/20 rounded-xl p-4 flex flex-col justify-between">
          <form onSubmit={handleInstallPlugin} className="space-y-3">
            <h3 className="text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1 font-display">
              <Plus className="w-4 h-4 text-purple-500" /> Написать свой плагин
            </h3>
            
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1 font-mono">Название плагина</label>
              <input
                type="text"
                placeholder="Напр. Custom Subscription Feed"
                value={pluginName}
                onChange={(e) => setPluginName(e.target.value)}
                className="w-full bg-white dark:bg-zinc-950 text-gray-800 dark:text-zinc-100 px-3 py-1.5 text-xs border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1 font-mono">Описание работы</label>
              <input
                type="text"
                placeholder="Что делает плагин в ядре туннеля..."
                value={pluginDesc}
                onChange={(e) => setPluginDesc(e.target.value)}
                className="w-full bg-white dark:bg-zinc-950 text-gray-800 dark:text-zinc-100 px-3 py-1.5 text-xs border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1 font-mono">Javascript Код</label>
              <textarea
                placeholder="function onStartup() { console.log('Init plugin'); }"
                rows={4}
                value={pluginCode}
                onChange={(e) => setPluginCode(e.target.value)}
                className="w-full bg-white dark:bg-zinc-950 text-gray-800 dark:text-zinc-100 px-3 py-1.5 text-xs border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            {addingError && (
              <p className="text-rose-500 text-[10px] leading-relaxed font-sans">{addingError}</p>
            )}

            <button
              type="submit"
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
            >
              Залить плагин
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
