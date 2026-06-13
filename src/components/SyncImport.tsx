/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { Cloud, FileJson, QrCode, Lock, Unlock, Upload, Download, Copy, Check, UploadCloud, RefreshCw, AlertCircle } from "lucide-react";
import { VpnServer } from "../types";

interface SyncImportProps {
  servers: VpnServer[];
  onImportServers: (imported: VpnServer[]) => void;
  onSaveCloud: () => Promise<string>;
  onLoadCloud: (code: string) => Promise<VpnServer[]>;
}

export default function SyncImport({ servers, onImportServers, onSaveCloud, onLoadCloud }: SyncImportProps) {
  // Cloud Sync
  const [syncCode, setSyncCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [syncSaving, setSyncSaving] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState("");

  // Settings encryption
  const [exportPassword, setExportPassword] = useState("alien1337");
  const [encryptedExport, setEncryptedExport] = useState("");
  const [importPassword, setImportPassword] = useState("");
  const [encryptedImportText, setEncryptedImportText] = useState("");
  const [fileImportError, setFileImportError] = useState("");

  // QR manual uri
  const [pastedUri, setPastedUri] = useState("");

  const handleCreateCloudBackup = async () => {
    setSyncSaving(true);
    setSyncError("");
    try {
      const code = await onSaveCloud();
      setGeneratedCode(code);
    } catch (e: any) {
      setSyncError("Ошибка при сохранении в облако: " + e.message);
    } finally {
      setSyncSaving(false);
    }
  };

  const handleRestoreCloudBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!syncCode) return;
    setSyncLoading(true);
    setSyncError("");
    try {
      const loaded = await onLoadCloud(syncCode);
      onImportServers(loaded);
      alert("Синхронизация успешна! Серверы восстановлены.");
      setSyncCode("");
    } catch (e: any) {
      setSyncError(e.message || "Неверный код синхронизации");
    } finally {
      setSyncLoading(false);
    }
  };

  // Basic password encryption utility (XOR + Base64)
  const xorEncryptDecrypt = (input: string, key: string): string => {
    let output = "";
    for (let i = 0; i < input.length; i++) {
      const charCode = input.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      output += String.fromCharCode(charCode);
    }
    return btoa(unescape(encodeURIComponent(output)));
  };

  const xorDecrypt = (input: string, key: string): string => {
    try {
      const decodedB64 = decodeURIComponent(escape(atob(input)));
      let output = "";
      for (let i = 0; i < decodedB64.length; i++) {
        const charCode = decodedB64.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        output += String.fromCharCode(charCode);
      }
      return output;
    } catch (e) {
      throw new Error("Неверный пароль шифрования или поврежденный файл");
    }
  };

  const handleExportToFile = () => {
    try {
      const payload = JSON.stringify(servers);
      const encrypted = xorEncryptDecrypt(payload, exportPassword);
      setEncryptedExport(encrypted);

      // Trigger actual text file download
      const element = document.createElement("a");
      const file = new Blob([encrypted], { type: "text/plain" });
      element.href = URL.createObjectURL(file);
      element.download = `ALI3NATION-backup-${new Date().toISOString().slice(0,10)}.alien`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (e) {
      alert("Ошибка при шифровании экспорта");
    }
  };

  const handleImportFromFileString = () => {
    setFileImportError("");
    try {
      if (!encryptedImportText) {
        setFileImportError("Введите зашифрованный текст конфигурации");
        return;
      }
      const decrypted = xorDecrypt(encryptedImportText.trim(), importPassword);
      const parsedSrvs = JSON.parse(decrypted);
      
      if (!Array.isArray(parsedSrvs)) {
        throw new Error("Неверный формат данных");
      }

      onImportServers(parsedSrvs);
      alert("Резервная копия успешно распакована и импортирована!");
      setEncryptedImportText("");
      setImportPassword("");
    } catch (err: any) {
      setFileImportError(err.message || "Ошибка распаковки. Проверьте пароль.");
    }
  };

  const handlePasteUriImport = () => {
    if (!pastedUri.startsWith("vless://") && !pastedUri.startsWith("vmess://") && !pastedUri.startsWith("trojan://")) {
      alert("Неизвестный протокол! Строка должна начинаться с vless://, vmess:// или trojan://");
      return;
    }

    // Call basic raw regex parsing client side
    try {
      const isVless = pastedUri.startsWith("vless://");
      const isTrojan = pastedUri.startsWith("trojan://");
      
      let parsedServer: VpnServer;

      if (isVless) {
        const match = pastedUri.match(/vless:\/\/([^@]+)@([^:]+):([0-9]+)\?(.*)$/);
        if (!match) throw new Error();
        const [_, uuid, address, portStr, queryAndRemark] = match;
        const hashIdx = queryAndRemark.indexOf("#");
        const remark = hashIdx !== -1 ? decodeURIComponent(queryAndRemark.slice(hashIdx + 1)) : "Импортированный VLESS";
        
        parsedServer = {
          id: "custom-" + Math.random().toString(36).substring(2, 9),
          name: remark,
          protocol: "vless",
          address,
          port: parseInt(portStr, 10),
          uuid,
          security: "reality",
          sni: "www.google.com",
          reality: true,
          countryCode: "RU",
          ping: null,
          isCustom: true,
          originalUri: pastedUri
        };
      } else if (isTrojan) {
        const match = pastedUri.match(/trojan:\/\/([^@]+)@([^:]+):([0-9]+)\?(.*)$/);
        if (!match) throw new Error();
        const [_, password, address, portStr, queryAndRemark] = match;
        const hashIdx = queryAndRemark.indexOf("#");
        const remark = hashIdx !== -1 ? decodeURIComponent(queryAndRemark.slice(hashIdx + 1)) : "Импортированный Trojan";
        
        parsedServer = {
          id: "custom-" + Math.random().toString(36).substring(2, 9),
          name: remark,
          protocol: "trojan",
          address,
          port: parseInt(portStr, 10),
          uuid: password,
          security: "tls",
          sni: address,
          reality: false,
          countryCode: "DE",
          ping: null,
          isCustom: true,
          originalUri: pastedUri
        };
      } else {
        throw new Error();
      }

      onImportServers([parsedServer]);
      alert("Новый профиль успешно импортирован!");
      setPastedUri("");
    } catch {
      alert("Не удалось распарсить ссылку. Проверьте ее корректность.");
    }
  };

  const triggerMockQrScan = () => {
    // Inject a realistic free vless Reality link for demonstration of QR scan upload
    const testLink = "vless://4cf5d3a5-1311-46ab-8395-fc7129ea5b83@172.104.135.21:443?security=reality&sni=images.unsplash.com&pbk=Kp8Z9_vB_Yz1Xc4Us4uInKlM3pQwRtY7xZaBsCwDvGf&sid=e28d7b3a&flow=xtls-rprx-vision&type=tcp#%F0%9F%87%BA%F0%9F%87%B8%20US-Unsplash-Reality";
    setPastedUri(testLink);
    alert("Эмуляция QR-сканера: Считан VLESS-код из файла, вставьте или нажмите импортировать!");
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col h-full overflow-y-auto max-h-[500px]" id="ali3n-sync-import-panel">
      <div>
        <h2 className="text-lg font-bold font-display text-gray-900 dark:text-zinc-100 flex items-center gap-2">
          <Cloud className="w-5 h-5 text-indigo-500" />
          Синхронизация и Импорт Профилей
        </h2>
        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
          Мгновенный обмен серверами между ПК/телефоном и зашифрованные локальные бэкапы.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-4">
        {/* Cloud Sync section */}
        <div className="border border-indigo-100 dark:border-zinc-800 bg-indigo-50/5 dark:bg-zinc-900/45 rounded-xl p-4">
          <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5 font-display">
            <Cloud className="w-4 h-4" /> Облачная Синхронизация
          </h3>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mb-3">
            Сохраните ваши серверы в облаке и загрузите их на другом устройстве по коду.
          </p>

          <div className="space-y-3">
            <button
              onClick={handleCreateCloudBackup}
              disabled={syncSaving}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/10"
            >
              <UploadCloud className="w-4 h-4" />
              {syncSaving ? "Резервирование..." : "Получить Код Синхронизации"}
            </button>

            {generatedCode && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 text-center">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Ваш Код Синхронизации:</span>
                <span className="text-lg font-black font-display text-emerald-500 block tracking-widest my-1">{generatedCode}</span>
                <span className="text-[10px] text-gray-400">Код действителен в течение 24 часов на любом девайсе.</span>
              </div>
            )}

            <form onSubmit={handleRestoreCloudBackup} className="border-t border-gray-100 dark:border-zinc-800 pt-3">
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5 font-mono">Ввести Код для восстановления</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={syncCode}
                  onChange={(e) => setSyncCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-gray-50 dark:bg-zinc-950 text-gray-800 dark:text-zinc-100 px-3.5 py-1.5 text-center text-sm font-black tracking-widest border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={syncLoading || !syncCode}
                  className="bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 font-bold px-4 rounded-lg text-xs transition-colors shrink-0"
                >
                  {syncLoading ? "Загрузка..." : "Восстановить"}
                </button>
              </div>
            </form>

            {syncError && (
              <div className="flex items-center gap-1.5 text-rose-500 text-[11px] mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{syncError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Encrypted backup export section */}
        <div className="border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5 font-display">
              <Lock className="w-4 h-4 text-purple-500" /> Шифрование Бэкапов
            </h3>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mb-3">
              Экспортируйте ваши пароли и UUID в зашифрованный файл `.alien` для локального хранения.
            </p>

            {/* Export block */}
            <div className="space-y-2 border-b border-gray-100 dark:border-zinc-800/60 pb-3">
              <label className="block text-[10px] uppercase font-bold text-gray-400 font-mono">Пароль шифрования</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={exportPassword}
                  onChange={(e) => setExportPassword(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-zinc-950 text-gray-800 dark:text-zinc-100 px-3.5 py-1 text-xs border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleExportToFile}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1 rounded-lg text-xs transition-colors shrink-0 flex items-center gap-1 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" /> Экспорт
                </button>
              </div>
            </div>

            {/* Import block */}
            <div className="space-y-2 pt-3">
              <label className="block text-[10px] uppercase font-bold text-gray-400 font-mono">Распаковать бэкап</label>
              <input
                type="text"
                placeholder="Вставьте зашифрованную строку из бэкапа..."
                value={encryptedImportText}
                onChange={(e) => setEncryptedImportText(e.target.value)}
                className="w-full bg-gray-50 dark:bg-zinc-950 text-gray-800 dark:text-zinc-100 px-3 py-1 text-xs border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
              />
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Пароль дешифрования..."
                  value={importPassword}
                  onChange={(e) => setImportPassword(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-zinc-950 text-gray-800 dark:text-zinc-100 px-3 py-1 text-xs border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleImportFromFileString}
                  className="bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:text-zinc-200 font-bold px-3 py-1 rounded-lg text-xs transition-colors shrink-0 flex items-center gap-1 border border-transparent hover:border-gray-300"
                >
                  <Unlock className="w-3.5 h-3.5 text-emerald-500" /> Импорт
                </button>
              </div>
              
              {fileImportError && (
                <div className="flex items-center gap-1.5 text-rose-500 text-[10px] mt-1 font-sans">
                  <AlertCircle className="w-3 h-3" />
                  <span>{fileImportError}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QR code and direct URL pasted import */}
      <div className="border border-gray-100 dark:border-zinc-800 rounded-xl p-4 bg-gray-50/50 dark:bg-zinc-900/20">
        <h3 className="text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-display">
          <QrCode className="w-4 h-4 text-sky-500" /> Импорт через QR-коды & Ссылки
        </h3>
        <p className="text-xs text-gray-400 dark:text-zinc-500 mb-3">
          Вставьте raw VLESS/Trojan URI напрямую или загрузите скриншот/изображение QR-кода.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="vless://7ca61d9a-eeea-4c22-b5e7-a9a79fa7cf3d@85.202.162.88:443?security=reality..."
                value={pastedUri}
                onChange={(e) => setPastedUri(e.target.value)}
                className="w-full bg-gray-50 dark:bg-zinc-950 text-gray-800 dark:text-zinc-100 px-3 py-2 text-xs border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
              />
              <button
                onClick={handlePasteUriImport}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 rounded-lg text-xs transition-colors shrink-0 cursor-pointer"
              >
                Импорт по ссылке
              </button>
            </div>
          </div>

          <div className="md:col-span-2">
            <button
              onClick={triggerMockQrScan}
              className="w-full py-2 border-2 border-dashed border-gray-200 dark:border-zinc-800 hover:border-indigo-500 rounded-lg text-xs font-bold transition-all text-gray-500 dark:text-zinc-400 hover:text-indigo-500 bg-white dark:bg-zinc-900 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-4.5 h-4.5" />
              <span>Сканировать QR-изображение</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
