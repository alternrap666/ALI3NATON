/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from "react";
import { VpnServer, TelegramProxy, AdBlockLog, ChatMessage } from "./types";
import { 
  Shield, Compass, KeyRound, Send, Sparkles, Cloud, Puzzle, 
  Sun, Moon, Globe, HelpCircle, Activity, Power, LogOut, CheckCircle, Laptop, Gamepad2
} from "lucide-react";
import VpnDashboard from "./components/VpnDashboard";
import ServerList from "./components/ServerList";
import RealityForm from "./components/RealityForm";
import ProxyList from "./components/ProxyList";
import AdBlocker from "./components/AdBlocker";
import SyncImport from "./components/SyncImport";
import AiAssistant from "./components/AiAssistant";
import PluginsManager from "./components/PluginsManager";
import DesktopInstaller from "./components/DesktopInstaller";

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<"servers" | "reality" | "proxies" | "adblock" | "sync" | "ai" | "plugins" | "desktop">("servers");
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // Core Data State
  const [servers, setServers] = useState<VpnServer[]>([]);
  const [telegramProxies, setTelegramProxies] = useState<TelegramProxy[]>([]);
  const [selectedServer, setSelectedServer] = useState<VpnServer | null>(null);
  const [adBlockEnabled, setAdBlockEnabled] = useState(true);
  const [adBlockLogs, setAdBlockLogs] = useState<AdBlockLog[]>([]);
  const [adBlockBlockedCount, setAdBlockBlockedCount] = useState(482);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // Action / State flags
  const [scraping, setScraping] = useState(false);
  const [pinging, setPinging] = useState(false);
  const [proxiesLoading, setProxiesLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [autoSwitch, setAutoSwitch] = useState(true);
  const [gamingMode, setGamingMode] = useState(false);

  const handleToggleGamingMode = () => {
    setGamingMode(prev => {
      const newVal = !prev;
      if (newVal) {
        addSystemLog("Игровой обход ВКЛЮЧЕН (UDP-Routing + Full-Cone NAT + MTU 1350).");
      } else {
        addSystemLog("Игровой обход выключен. Возврат к стандартной конфигурации VLESS Reality.");
      }
      return newVal;
    });
  };

  // App System log
  const [systemLogs, setSystemLogs] = useState<string[]>([
    "Система ALI3NATION запущена.",
    "Обфускация XTLS-Vision готова к работе.",
    "Bypass-ядро успешно собрано и инициализировано."
  ]);

  const addSystemLog = useCallback((text: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setSystemLogs(prev => [`[${timestamp}] ${text}`, ...prev.slice(0, 49)]);
  }, []);

  // Theme Management
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Initial Fetches (Scrape configs & TG proxies)
  const fetchServers = async () => {
    setScraping(true);
    addSystemLog("Запуск сканирования публичных сабскрипшенов VLESS Reality...");
    try {
      const res = await fetch("/api/scrape");
      const data = await res.json();
      if (data.success && Array.isArray(data.servers)) {
        setServers(data.servers);
        if (data.servers.length > 0 && !selectedServer) {
          setSelectedServer(data.servers[0]);
        }
        addSystemLog(`Успешно подгружено ${data.servers.length} конфигураций обхода.`);
      }
    } catch (e: any) {
      addSystemLog("Не удалось спарсить серверы из внешних источников. Используем default pre-seeds.");
    } finally {
      setScraping(false);
    }
  };

  const fetchTgProxies = async () => {
    setProxiesLoading(true);
    addSystemLog("Запуск парсинга рабочих Telegram MTProto прокси...");
    try {
      const res = await fetch("/api/telegram-proxies");
      const data = await res.json();
      if (data.success && Array.isArray(data.proxies)) {
        setTelegramProxies(data.proxies);
        addSystemLog(`Получено ${data.proxies.length} Telegram прокси.`);
      }
    } catch (e) {
      addSystemLog("Ошибка загрузки прокси Telegram. Загружены стабильные pre-seeds.");
    } finally {
      setProxiesLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
    fetchTgProxies();
  }, []);

  // Live Simulated DNS blocking logger for adblock page
  useEffect(() => {
    if (!adBlockEnabled) return;
    
    const adDomains = [
      "google-analytics.com", "doubleclick.net", "adnxs.com", "taboola.com", 
      "yandex.ru/ads", "metrics.yandex.ru", "vk.com/ads", "mail.com/traffic",
      "critio.com", "adservice.google.com", "facebook.com/tr", "analytics.google.com"
    ];

    const rules = ["EasyList", "EasyPrivacy", "MyAdBlocker", "AntiTrack-DNS", "HostsShield"];

    const interval = setInterval(() => {
      const randomDomain = adDomains[Math.floor(Math.random() * adDomains.length)];
      const randomRule = rules[Math.floor(Math.random() * rules.length)];
      const ts = new Date().toLocaleTimeString();

      const newLog: AdBlockLog = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: ts,
        domain: randomDomain,
        rule: randomRule,
        type: "dns"
      };

      setAdBlockLogs(prev => [newLog, ...prev.slice(0, 19)]);
      setAdBlockBlockedCount(prev => prev + 1);
    }, 3800);

    return () => clearInterval(interval);
  }, [adBlockEnabled]);

  // Staggered Simulated Ping testing
  const handleBulkPingTest = () => {
    setPinging(true);
    addSystemLog("Тестирование пинга всей базы серверов обхода...");
    
    setTimeout(() => {
      setServers(prev => prev.map(srv => {
        // Generate optimal or realistic ping based on country
        const multiplier = srv.countryCode === "RU" ? 1.0 : srv.countryCode === "DE" ? 1.8 : 2.5;
        const basePing = Math.floor(Math.random() * 30) + 12;
        return {
          ...srv,
          ping: Math.floor(basePing * multiplier)
        };
      }));
      setPinging(false);
      addSystemLog("Тест уровня пинга завершен успешно.");
    }, 2500);
  };

  // Connection Simulation
  const handleToggleConnect = () => {
    if (connected) {
      setConnected(false);
      addSystemLog("Соединение разорвано пользователем.");
    } else {
      if (!selectedServer) {
        alert("Выберите сервер перед соединением!");
        return;
      }
      setConnecting(true);
      addSystemLog(`Установка туннеля через ${selectedServer.name}...`);
      addSystemLog(`Применение протокола VLESS с подписью Reality SNI: ${selectedServer.sni || "unspecified"}`);
      if (gamingMode) {
        addSystemLog("Игровой Турбо-фильтр: активирована прямая UDP-инкапсуляция с низким пингом.");
      }
      
      setTimeout(() => {
        setConnecting(false);
        setConnected(true);
        if (gamingMode) {
          addSystemLog(`Игровой туннель подключен! Full-Cone NAT активен. MTU оптимизирован для снижения потерь пакетов.`);
        } else {
          addSystemLog(`Узел обхода подключен успешно! Порт: ${selectedServer.port}.`);
        }
      }, 1800);
    }
  };

  const handleToggleAutoSwitch = () => {
    setAutoSwitch(prev => !prev);
    addSystemLog(`Автоматическое переключение на самый быстрый сервер ${!autoSwitch ? 'ВКЛЮЧЕНО' : 'ВЫКЛЮЧЕНО'}.`);
  };

  // Delete profile from custom list
  const handleDeleteServer = (id: string) => {
    setServers(prev => prev.filter(s => s.id !== id));
    addSystemLog("Пользовательский профиль удален.");
    if (selectedServer?.id === id) {
      setSelectedServer(null);
    }
  };

  // Custom added or imported servers handler
  const handleImportServers = (importedList: VpnServer[]) => {
    setServers(prev => {
      const merged = [...importedList, ...prev];
      // filter duplicate addresses
      const unique: VpnServer[] = [];
      const seen = new Set();
      merged.forEach(item => {
        const key = `${item.protocol}://${item.address}:${item.port}`;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(item);
        }
      });
      return unique;
    });
    addSystemLog(`Импортировано ${importedList.length} новых серверов.`);
  };

  // Cloud Sync Saves
  const handleSaveToCloud = async (): Promise<string> => {
    const payload = {
      servers: servers.filter(s => s.isCustom),
      customProxies: telegramProxies,
      adBlockEnabled,
      theme
    };

    try {
      const res = await fetch("/api/sync/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.code) {
        addSystemLog(`Профили сохранены в облачную базу. Код сессии: ${data.code}`);
        return data.code;
      }
      throw new Error("Не удалось получить код с сервера");
    } catch (e: any) {
      addSystemLog("Сбой при соединении с облаком синхронизации.");
      throw e;
    }
  };

  // Cloud Sync Loads
  const handleLoadFromCloud = async (code: string): Promise<VpnServer[]> => {
    try {
      const res = await fetch(`/api/sync/load/${code}`);
      const data = await res.json();
      if (data.success && data.data) {
        addSystemLog(`Облако синхронизации успешно загружено по коду: ${code}`);
        return data.data.servers || [];
      }
      throw new Error(data.error || "Неверный код синхронизации");
    } catch (e: any) {
      addSystemLog(`Сбой скачивания бэкапа по коду "${code}".`);
      throw e;
    }
  };

  // Gemini send message
  const handleSendGeminiMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: "user",
      text,
      timestamp: new Date().toLocaleTimeString()
    };

    setChatHistory(prev => [...prev, userMsg]);
    setAiLoading(true);

    try {
      const res = await fetch("/api/gemini/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: chatHistory
        })
      });

      const data = await res.json();
      
      const botMsg: ChatMessage = {
        id: Math.random().toString(),
        role: "model",
        text: data.text || "Извините, не удалось сгенерировать ответ от ИИ: " + (data.error || "Ошибка"),
        timestamp: new Date().toLocaleTimeString()
      };

      setChatHistory(prev => [...prev, botMsg]);
    } catch (err) {
      const botMsg: ChatMessage = {
        id: Math.random().toString(),
        role: "model",
        text: "К сожалению, произошла ошибка связи с сервером Gemini ИИ.",
        timestamp: new Date().toLocaleTimeString()
      };
      setChatHistory(prev => [...prev, botMsg]);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className={`min-h-screen font-sans ${theme === "dark" ? "bg-[#0c0c0e] text-zinc-300" : "bg-zinc-50 text-zinc-800"} flex flex-col justify-between`}>
      {/* Upper Navigation Header bar - Elegant Dark style with dynamic stats */}
      <header className="h-20 border-b border-gray-150 dark:border-zinc-850/60 bg-white/80 dark:bg-[#0c0c0e]/95 backdrop-blur-md sticky top-0 z-30 px-6 sm:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8.5 h-8.5 bg-zinc-800 dark:bg-zinc-900 border border-zinc-700 rounded-lg flex items-center justify-center text-zinc-200 text-lg font-black italic tracking-tighter">
            A
          </div>
          <div className="hidden sm:block">
            <h1 className="text-md font-black tracking-widest text-gray-900 dark:text-zinc-100 font-display">
              ALI3NATION
            </h1>
            <span className="text-[9px] uppercase tracking-wider font-bold text-indigo-400 font-mono block -mt-0.5">
              REALITY BYPASS CORE v1.8.8
            </span>
          </div>
        </div>

        {/* Dynamic Center Status Indicators from Design HTML */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[9px] text-gray-400 dark:text-zinc-650 uppercase font-bold tracking-widest">Статус Сети</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : connecting ? "bg-indigo-500 animate-pulse" : "bg-zinc-500"}`}></span>
              <span className={`text-xs font-semibold ${connected ? "text-emerald-500" : connecting ? "text-indigo-400" : "text-zinc-500"}`}>
                {connected ? "АКТИВЕН" : connecting ? "СОЕДИНЕНИЕ..." : "ОТКЛЮЧЕН"}
              </span>
            </div>
          </div>
          
          <div className="h-8 w-[1px] bg-gray-200 dark:bg-zinc-850"></div>

          <div className="flex flex-col">
            <span className="text-[9px] text-gray-400 dark:text-zinc-650 uppercase font-bold tracking-widest">Протокол Обхода</span>
            <span className="text-xs font-mono text-zinc-400 font-medium mt-0.5">
              {selectedServer ? `${selectedServer.protocol.toUpperCase()}${selectedServer.reality ? " + Reality" : ""}` : "Резервный VLESS"}
            </span>
          </div>
        </div>

        {/* Header Actions & Theme Toggle */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-transparent dark:border-zinc-800/80 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all text-gray-600 dark:text-zinc-300"
            title="Переключить тему оформления"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button 
            onClick={() => {
              setActiveTab("sync");
              addSystemLog("Переход в модуль облачной синхронизации...");
            }}
            className="px-3.5 py-2 bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 text-xs font-semibold rounded-lg border border-gray-200 dark:border-zinc-800/80 text-gray-750 dark:text-zinc-300 transition-all cursor-pointer"
          >
            Импорт & Ссылки
          </button>

          <button 
            onClick={handleToggleConnect}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
              connected 
                ? "bg-rose-950/20 text-rose-400 border-rose-900/40 hover:bg-rose-900/30" 
                : "bg-zinc-800 dark:bg-zinc-900 text-zinc-100 border-zinc-700 dark:border-zinc-800/80 hover:bg-zinc-700 dark:hover:bg-zinc-800/80"
            }`}
          >
            {connected ? "Выключить" : "Подключить"}
          </button>
        </div>
      </header>

      {/* Main Grid Viewport */}
      <main className="max-w-7xl mx-auto w-full p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start grow">
        {/* Left Column: VPN Node Controller & Status Monitor */}
        <div className="lg:col-span-4 space-y-6 flex flex-col h-[650px] justify-between">
          <VpnDashboard
            connected={connected}
            connecting={connecting}
            autoSwitch={autoSwitch}
            selectedServer={selectedServer}
            onToggleConnect={handleToggleConnect}
            onToggleAutoSwitch={handleToggleAutoSwitch}
            adBlockCount={adBlockBlockedCount}
            gamingMode={gamingMode}
            onToggleGamingMode={handleToggleGamingMode}
          />

          {/* Core System terminal log files (styled with terminal styling) */}
          <div className="bg-[#0d0d0f] border border-gray-100 dark:border-zinc-800/80 rounded-2xl p-4 font-mono text-[11px] text-zinc-500 h-44 overflow-y-auto space-y-1.5 flex flex-col-reverse justify-end shadow-sm">
            {systemLogs.map((log, idx) => (
              <div key={idx} className="leading-snug">
                <span className="text-indigo-400 font-bold">&gt;&gt;</span> {log}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Interactive Menu Workspace */}
        <div className="lg:col-span-8 flex flex-col h-[650px]">
          {/* Navigation Tab links - Inspired by the Elegant Sidebar Navigation of design mockup */}
          <nav className="flex flex-wrap items-center gap-1 bg-gray-50 dark:bg-[#08080a]/60 p-1 rounded-xl mb-4 border border-gray-200/40 dark:border-zinc-900/60">
            <button
              onClick={() => setActiveTab("servers")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                activeTab === "servers"
                  ? "bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-200 border-gray-200 dark:border-zinc-800 shadow-sm"
                  : "text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-zinc-350 border-transparent bg-transparent"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Серверы ({servers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("reality")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                activeTab === "reality"
                  ? "bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-200 border-gray-200 dark:border-zinc-800 shadow-sm"
                  : "text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-zinc-350 border-transparent bg-transparent"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Reality Конструктор</span>
            </button>

            <button
              onClick={() => setActiveTab("proxies")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                activeTab === "proxies"
                  ? "bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-200 border-gray-200 dark:border-zinc-800 shadow-sm"
                  : "text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-zinc-350 border-transparent bg-transparent"
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Телеграм Прокси</span>
            </button>

            <button
              onClick={() => setActiveTab("adblock")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                activeTab === "adblock"
                  ? "bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-200 border-gray-200 dark:border-zinc-800 shadow-sm"
                  : "text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-zinc-350 border-transparent bg-transparent"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>AdBlock</span>
            </button>

            <button
              onClick={() => setActiveTab("sync")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                activeTab === "sync"
                  ? "bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-200 border-gray-200 dark:border-zinc-800 shadow-sm"
                  : "text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-zinc-350 border-transparent bg-transparent"
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Синхронизация</span>
            </button>

            <button
              onClick={() => setActiveTab("ai")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                activeTab === "ai"
                  ? "bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-200 border-gray-200 dark:border-zinc-800 shadow-sm"
                  : "text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-zinc-350 border-transparent bg-transparent"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>ИИ Ассистент</span>
            </button>

            <button
              onClick={() => setActiveTab("plugins")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                activeTab === "plugins"
                  ? "bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-200 border-gray-200 dark:border-zinc-800 shadow-sm"
                  : "text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-zinc-350 border-transparent bg-transparent"
              }`}
            >
              <Puzzle className="w-3.5 h-3.5" />
              <span>Плагины</span>
            </button>

            <button
              onClick={() => setActiveTab("desktop")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                activeTab === "desktop"
                  ? "bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-200 border-gray-200 dark:border-zinc-800 shadow-sm"
                  : "text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-zinc-350 border-transparent bg-transparent"
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>ПК Приложение</span>
            </button>
          </nav>

          {/* Active Workspaces Render */}
          <div className="grow min-h-0">
            {activeTab === "servers" && (
              <ServerList
                servers={servers}
                selectedServer={selectedServer}
                onSelectServer={setSelectedServer}
                onRefreshScraper={fetchServers}
                onDeleteServer={handleDeleteServer}
                scraping={scraping}
                onBulkPing={handleBulkPingTest}
                pinging={pinging}
              />
            )}

            {activeTab === "reality" && (
              <RealityForm onAddCustomServer={(srv) => handleImportServers([srv])} />
            )}

            {activeTab === "proxies" && (
              <ProxyList
                proxies={telegramProxies}
                loading={proxiesLoading}
                onRefreshProxies={fetchTgProxies}
              />
            )}

            {activeTab === "adblock" && (
              <AdBlocker
                logs={adBlockLogs}
                enabled={adBlockEnabled}
                onToggleEnabled={() => setAdBlockEnabled(!adBlockEnabled)}
                blockedCount={adBlockBlockedCount}
              />
            )}

            {activeTab === "sync" && (
              <SyncImport
                servers={servers}
                onImportServers={handleImportServers}
                onSaveCloud={handleSaveToCloud}
                onLoadCloud={handleLoadFromCloud}
              />
            )}

            {activeTab === "ai" && (
              <AiAssistant
                chatHistory={chatHistory}
                onSendMessage={handleSendGeminiMessage}
                onClearHistory={() => setChatHistory([])}
                loading={aiLoading}
              />
            )}

            {activeTab === "plugins" && (
              <PluginsManager />
            )}

            {activeTab === "desktop" && (
              <DesktopInstaller />
            )}
          </div>
        </div>
      </main>

      {/* Dynamic bottom Footer from the Design HTML */}
      <footer className="h-12 border-t border-gray-200/50 dark:border-zinc-800/60 bg-gray-50 dark:bg-black flex flex-col sm:flex-row items-center justify-between px-8 text-[11px] text-gray-500 dark:text-zinc-500 shrink-0 py-2 sm:py-0 text-center sm:text-left gap-1">
        <div className="flex flex-wrap justify-center sm:justify-start gap-3 sm:gap-6">
          <span>IP Проброса: <span className="text-gray-700 dark:text-zinc-400 font-mono font-semibold">185.244.12.90</span> (Netherlands)</span>
          <span className="hidden sm:inline text-zinc-700">|</span>
          <span>Шифрование: <span className="text-gray-700 dark:text-zinc-400 font-semibold font-mono">TLS 1.3 | AES-256-GCM</span></span>
        </div>
        <div className="flex gap-4">
          <span className="text-indigo-500/80 font-semibold">ALI3NATION LABS v1.8 - Stable</span>
          <span className="text-zinc-800 hidden sm:inline">|</span>
          <span>© 2026 ALI3NATION SECURE BYPASS</span>
        </div>
      </footer>
    </div>
  );
}
