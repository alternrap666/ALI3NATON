/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { KeyRound, RefreshCcw, Plus, Check, Eye, EyeOff, Sparkles, QrCode } from "lucide-react";
import { VpnServer } from "../types";

interface RealityFormProps {
  onAddCustomServer: (server: VpnServer) => void;
}

export default function RealityForm({ onAddCustomServer }: RealityFormProps) {
  const [name, setName] = useState("Мой Узел VLESS Reality");
  const [address, setAddress] = useState("185.112.144.12");
  const [port, setPort] = useState(443);
  const [uuid, setUuid] = useState("7ca61d9a-eeea-4c22-b5e7-a9a79fa7cf3d");
  const [sni, setSni] = useState("browser.yandex.ru");
  const [publicKey, setPublicKey] = useState("F3gXmK9uW_zpRyV5sA6tRmWqC_bNdFhG3uImJnKoL8s");
  const [privateKey, setPrivateKey] = useState("iT6nM3wZ_Yp8Zb0Vs7uXnHmB2rQwRtP9xZaCsL");
  const [shortId, setShortId] = useState("ef821c9b");
  const [flow, setFlow] = useState("xtls-rprx-vision");
  const [security, setSecurity] = useState("reality");
  
  const [generatedLink, setGeneratedLink] = useState("");
  const [showKeys, setShowKeys] = useState(false);
  const [added, setAdded] = useState(false);

  const generateUuid = () => {
    // Generate simple compliant UUID v4 string
    const hex = "0123456789abcdef";
    let generated = "";
    for (let i = 0; i < 36; i++) {
      if (i === 8 || i === 13 || i === 18 || i === 23) {
        generated += "-";
      } else if (i === 14) {
        generated += "4";
      } else {
        generated += hex[Math.floor(Math.random() * 16)];
      }
    }
    setUuid(generated);
  };

  const generateRealityKeys = () => {
    // Simulate generation of standard reality base64 256-bit keys
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    let pub = "";
    let priv = "";
    for (let i = 0; i < 43; i++) {
      pub += chars[Math.floor(Math.random() * chars.length)];
      priv += chars[Math.floor(Math.random() * chars.length)];
    }
    setPublicKey(pub);
    setPrivateKey(priv);
  };

  const generateShortId = () => {
    const hex = "0123456789abcdef";
    let res = "";
    for (let i = 0; i < 8; i++) {
       res += hex[Math.floor(Math.random() * 16)];
    }
    setShortId(res);
  };

  const buildVlessLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !port || !uuid) return;

    // Structure Reality VLESS connection string
    const query = new URLSearchParams({
      security,
      sni,
      pbk: publicKey,
      sid: shortId,
      flow,
      type: "tcp"
    }).toString();

    const remark = encodeURIComponent(name);
    const link = `vless://${uuid}@${address}:${port}?${query}#${remark}`;
    setGeneratedLink(link);
    setAdded(false);
  };

  const handleAddToPool = () => {
    if (!generatedLink) return;

    const customServer: VpnServer = {
      id: "vless-custom-" + Math.random().toString(36).substring(2, 9),
      name: `${getCountryEmoji()} ${name} (Custom)`,
      protocol: "vless",
      address,
      port,
      uuid,
      security,
      sni,
      reality: security === "reality",
      pbk: publicKey,
      sid: shortId,
      flow,
      countryCode: "RU", // default custom marker
      ping: null,
      isCustom: true,
      originalUri: generatedLink
    };

    onAddCustomServer(customServer);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const getCountryEmoji = () => {
    // Basic IP/Domain checks to infer emoji
    if (address.startsWith("95.") || address.startsWith("185.") || address.startsWith("91.")) return "🇷🇺";
    if (address.startsWith("104.") || address.startsWith("23.")) return "🇺🇸";
    return "🌍";
  };

  return (
    <div className="bg-white dark:bg-[#0d0d0f] border border-gray-150 dark:border-zinc-800/60 rounded-2xl p-5 shadow-sm flex flex-col h-full" id="ali3n-reality-form">
      <div>
        <h2 className="text-md font-bold font-display text-gray-900 dark:text-zinc-100 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-purple-500" />
          Конструктор VLESS Reality (Маскировка 443)
        </h2>
        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
          Reality имитирует обычное HTTPS TLS соединение с авторизованными сайтами для прохождения ТСПУ (DPI).
        </p>
      </div>

      <form onSubmit={buildVlessLink} className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 grow max-h-[350px] overflow-y-auto pr-1">
        {/* Name config */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 mb-1.5 uppercase tracking-widest font-display">Название сервера</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-50 dark:bg-[#0a0a0b] text-gray-800 dark:text-zinc-100 px-3.5 py-2 text-sm border border-gray-200 dark:border-zinc-850 rounded-xl focus:outline-none focus:border-indigo-505 font-semibold"
          />
        </div>

        {/* IP address and Port */}
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 mb-1.5 uppercase tracking-widest font-display">IP адрес / Хост</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#0a0a0b] text-gray-800 dark:text-zinc-100 px-3.5 py-2 text-sm border border-gray-200 dark:border-zinc-850 rounded-xl focus:outline-none focus:border-indigo-505 font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 mb-1.5 uppercase tracking-widest font-display">Порт</label>
            <input
              type="number"
              value={port}
              onChange={(e) => setPort(parseInt(e.target.value, 10))}
              className="w-full bg-gray-50 dark:bg-[#0a0a0b] text-gray-800 dark:text-zinc-100 px-3.5 py-2 text-sm border border-gray-200 dark:border-zinc-850 rounded-xl focus:outline-none focus:border-indigo-505 font-mono font-semibold"
            />
          </div>
        </div>

        {/* UUID generator */}
        <div className="md:col-span-2">
          <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 mb-1.5 uppercase tracking-widest font-display flex justify-between items-center">
            <span>UUID Клиента</span>
            <button
              type="button"
              onClick={generateUuid}
              className="text-indigo-500 hover:text-indigo-400 flex items-center gap-1 text-[11px] font-mono normal-case tracking-normal"
            >
              <RefreshCcw className="w-3 h-3" /> Сгенерировать
            </button>
          </label>
          <input
            type="text"
            value={uuid}
            onChange={(e) => setUuid(e.target.value)}
            className="w-full bg-gray-50 dark:bg-[#0a0a0b] text-gray-800 dark:text-zinc-100 px-3.5 py-2 text-sm border border-gray-200 dark:border-zinc-855 rounded-xl focus:outline-none focus:border-indigo-505 font-mono text-xs"
          />
        </div>

        {/* SNI mask host */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 mb-1.5 uppercase tracking-widest font-display">Маскировочный сайт (SNI)</label>
          <input
            type="text"
            value={sni}
            onChange={(e) => setSni(e.target.value)}
            className="w-full bg-gray-50 dark:bg-[#0a0a0b] text-gray-800 dark:text-zinc-100 px-3.5 py-2 text-sm border border-gray-200 dark:border-zinc-850 rounded-xl focus:outline-none focus:border-indigo-505 font-mono text-xs"
          />
        </div>

        {/* Short ID */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 mb-1.5 uppercase tracking-widest font-display flex justify-between items-center">
            <span>Short ID (Hex)</span>
            <button
              type="button"
              onClick={generateShortId}
              className="text-indigo-500 hover:text-indigo-400 flex items-center gap-1 text-[11px] font-mono normal-case tracking-normal"
            >
              <RefreshCcw className="w-3 h-3" /> Рандом
            </button>
          </label>
          <input
            type="text"
            value={shortId}
            onChange={(e) => setShortId(e.target.value)}
            className="w-full bg-gray-50 dark:bg-[#0a0a0b] text-gray-800 dark:text-zinc-100 px-3.5 py-2 text-sm border border-gray-200 dark:border-zinc-850 rounded-xl focus:outline-none focus:border-indigo-505 font-mono text-xs"
          />
        </div>

        {/* Keys setup */}
        <div className="md:col-span-2 border-t border-gray-100 dark:border-zinc-800/60 pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-600 dark:text-zinc-300 flex items-center gap-1 uppercase tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Ключи Reality (X25519)
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowKeys(!showKeys)}
                className="text-gray-400 hover:text-indigo-500 flex items-center gap-1 text-xs"
              >
                {showKeys ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showKeys ? "Скрыть" : "Показать"}</span>
              </button>
              <button
                type="button"
                onClick={generateRealityKeys}
                className="text-indigo-500 hover:text-indigo-400 flex items-center gap-1 text-[10px] uppercase font-bold border border-indigo-200/30 dark:border-indigo-500/20 px-2 py-0.5 rounded-lg bg-indigo-50/10 transition-colors"
              >
                Генератор ключей
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] uppercase tracking-wider text-gray-450 dark:text-zinc-500 mb-0.5 font-mono">Public Key (pbk)</label>
              <input
                type={showKeys ? "text" : "password"}
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#0a0a0b] text-gray-800 dark:text-zinc-100 px-3 py-1.5 text-xs border border-gray-200 dark:border-zinc-850 rounded-lg focus:outline-none focus:border-indigo-505 font-mono"
              />
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-wider text-gray-450 dark:text-zinc-500 mb-0.5 font-mono">Private Key (приватный на сервере)</label>
              <input
                type={showKeys ? "text" : "password"}
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#0a0a0b] text-gray-800 dark:text-zinc-100 px-3 py-1.5 text-xs border border-gray-200 dark:border-zinc-850 rounded-lg focus:outline-none focus:border-indigo-505 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Generate actions */}
        <div className="md:col-span-2 pt-2">
          <button
            type="submit"
            className="w-full py-2.5 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-xs uppercase font-bold tracking-wider select-none transition-all shadow-md active:scale-[0.99] cursor-pointer"
          >
            Собрать URI Конфигурации
          </button>
        </div>
      </form>

      {/* Generated output visualizer */}
      {generatedLink && (
        <div className="border border-purple-200/40 dark:border-purple-950/40 bg-purple-50/5 dark:bg-[#ffffff03] p-4 rounded-xl mt-auto">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="bg-white p-1.5 rounded-lg border border-gray-100 hidden sm:block shrink-0">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&margin=4&data=${encodeURIComponent(generatedLink)}`}
                alt="Reality config QR"
                referrerPolicy="no-referrer"
                className="w-20 h-20 block bg-white"
              />
            </div>

            <div className="grow truncate w-full text-center sm:text-left">
              <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest font-display block mb-1">Готовая сгенерированная VLESS-ссылка</span>
              <div className="bg-gray-50 dark:bg-[#0a0a0b] px-3 py-2 border border-gray-200 dark:border-zinc-850 rounded-lg text-xs font-mono truncate text-gray-600 dark:text-zinc-400 mb-2">
                {generatedLink}
              </div>

              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedLink);
                    alert("Скопировано!");
                  }}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-zinc-900 border border-transparent dark:border-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-200 font-semibold rounded-lg text-xs transition-colors"
                >
                  Копировать Ссылку
                </button>
                <button
                  type="button"
                  onClick={handleAddToPool}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    added 
                      ? "bg-emerald-550 text-white" 
                      : "bg-purple-650 hover:bg-purple-600 text-white shadow-sm"
                  }`}
                >
                  {added ? <Check className="w-3.5 h-3.5 animate-bounce" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{added ? "Добавлено!" : "Добавить в список"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
