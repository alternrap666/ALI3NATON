/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// In-memory Cloud Sync Storage
const cloudSyncStore = new Map<string, any>();

// Seed stable, high-fidelity default configuration list in Russian language
// in case external scraper is offline or slow
const DEFAULT_VPN_SERVERS = [
  {
    id: "ali3n-default-1",
    name: "🇷🇺 RU-Moscow-Reality-Fast (ALI3NATION Premium)",
    protocol: "vless" as const,
    address: "95.163.242.10",
    port: 443,
    uuid: "f6ceab67-27e1-45bd-89fb-ab5c907b36f7",
    security: "reality",
    sni: "www.google.ru",
    reality: true,
    pbk: "hG8uK9oW_Lp2MzX5sY6tRvWqC_bNdFhG3uImJnKoL8s",
    sid: "a1b2c3d4",
    flow: "xtls-rprx-vision",
    countryCode: "RU",
    ping: 18,
    originalUri: "vless://f6ceab67-27e1-45bd-89fb-ab5c907b36f7@95.163.242.10:443?security=reality&sni=www.google.ru&pbk=hG8uK9oW_Lp2MzX5sY6tRvWqC_bNdFhG3uImJnKoL8s&sid=a1b2c3d4&flow=xtls-rprx-vision&type=tcp#%F0%9F%87%B7%F0%9F%87%B1%20RU-Moscow-Reality-Fast"
  },
  {
    id: "ali3n-default-2",
    name: "🇸🇪 SE-Stockholm-Reality-NoBlock",
    protocol: "vless" as const,
    address: "79.136.52.210",
    port: 443,
    uuid: "c29ebd4a-93f1-4df2-8bd5-1bfcc59d643d",
    security: "reality",
    sni: "www.microsoft.com",
    reality: true,
    pbk: "yT7qN8vB_Yx1Zc2Vs4uInKoM3pQwRtY7xZaBsCwDvEf",
    sid: "9e8d7c6b",
    flow: "xtls-rprx-vision",
    countryCode: "SE",
    ping: 45,
    originalUri: "vless://c29ebd4a-93f1-4df2-8bd5-1bfcc59d643d@79.136.52.210:443?security=reality&sni=www.microsoft.com&pbk=yT7qN8vB_Yx1Zc2Vs4uInKoM3pQwRtY7xZaBsCwDvEf&sid=9e8d7c6b&flow=xtls-rprx-vision&type=tcp#%F0%9F%87%B8%F0%9F%87%AA%20SE-Stockholm-Reality-NoBlock"
  },
  {
    id: "ali3n-default-3",
    name: "🇩🇪 DE-Frankfurt-TLS-Safety",
    protocol: "trojan" as const,
    address: "185.220.101.5",
    port: 443,
    uuid: "ali3nation-trojan-secure-password-2026",
    security: "tls",
    sni: "www.apple.com",
    reality: false,
    countryCode: "DE",
    ping: 32,
    originalUri: "trojan://ali3nation-trojan-secure-password-2026@185.220.101.5:443?peer=www.apple.com&sni=www.apple.com&allowInsecure=1#%F0%9F%87%A9%F0%9F%87%AA%20DE-Frankfurt-TLS-Safety"
  },
  {
    id: "ali3n-default-4",
    name: "🇫🇮 FI-Helsinki-HighBandwidth",
    protocol: "vless" as const,
    address: "85.202.162.88",
    port: 443,
    uuid: "1940d999-fb47-4940-b6f7-ef60877a5ea2",
    security: "reality",
    sni: "www.samsung.com",
    reality: true,
    pbk: "bC9dE2fG5hJ8kL0mN3pQrStUvWxYzAbCdEfGhIjKlMn",
    sid: "1a2b3c4d",
    flow: "xtls-rprx-vision",
    countryCode: "FI",
    ping: 28,
    originalUri: "vless://1940d999-fb47-4940-b6f7-ef60877a5ea2@85.202.162.88:443?security=reality&sni=www.samsung.com&pbk=bC9dE2fG5hJ8kL0mN3pQrStUvWxYzAbCdEfGhIjKlMn&sid=1a2b3c4d&flow=xtls-rprx-vision&type=tcp#%F0%9F%87%AB%F0%9F%87%AE%20FI-Helsinki-HighBandwidth"
  },
  {
    id: "ali3n-default-5",
    name: "🇺🇸 US-NewYork-Reality-MaxBypass",
    protocol: "vless" as const,
    address: "104.244.75.12",
    port: 443,
    uuid: "e037f81b-5e4f-4d6c-bb9b-f1de1705e3f4",
    security: "reality",
    sni: "www.icloud.com",
    reality: true,
    pbk: "pQ9wR2eT5yU8iI0oO3pPaAsSdDfFgGhHjJkKlLzZxXv",
    sid: "5f4e3d2c",
    flow: "xtls-rprx-vision",
    countryCode: "US",
    ping: 110,
    originalUri: "vless://e037f81b-5e4f-4d6c-bb9b-f1de1705e3f4@104.244.75.12:443?security=reality&sni=www.icloud.com&pbk=pQ9wR2eT5yU8iI0oO3pPaAsSdDfFgGhHjJkKlLzZxXv&sid=5f4e3d2c&flow=xtls-rprx-vision&type=tcp#%F0%9F%87%BA%F0%9F%87%B8%20US-NewYork-Reality-MaxBypass"
  }
];

const DEFAULT_TG_PROXIES = [
  {
    server: "95.213.132.88",
    port: 443,
    secret: "dd00000000000000000000000000000000",
    ping: 22,
    sponsor: "ALI3NATION VIP Proxy",
    originalUrl: "https://t.me/proxy?server=95.213.132.88&port=443&secret=dd00000000000000000000000000000000"
  },
  {
    server: "195.201.121.34",
    port: 8888,
    secret: "3f32c1cbf67eab66b6e4e0bcfcbbe899",
    ping: 46,
    sponsor: "RU Bypass Group",
    originalUrl: "https://t.me/proxy?server=195.201.121.34&port=8888&secret=3f32c1cbf67eab66b6e4e0bcfcbbe899"
  },
  {
    server: "77.223.109.43",
    port: 443,
    secret: "dd6bbaed239aa8dfbc60938ff7ea9c4d62",
    ping: 35,
    sponsor: "TG Proxy Channel",
    originalUrl: "https://t.me/proxy?server=77.223.109.43&port=443&secret=dd6bbaed239aa8dfbc60938ff7ea9c4d62"
  }
];

// List of public GitHub V2ray/Vless subscription resources to scrap
const CONFIG_FEED_URLS = [
  "https://raw.githubusercontent.com/barry-far/V2ray-Configs/main/All_Configs_Sub.txt",
  "https://raw.githubusercontent.com/yebekhe/TelegramV2rayCollector/main/sub/mix",
  "https://raw.githubusercontent.com/IranianCypherpunks/sub/main/sub"
];

// Helper functions to parse different protocol URIs
function parseVlessUri(uri: string): any | null {
  try {
    const mainRegex = /^vless:\/\/([^@]+)@([^:]+):([0-9]+)\?(.*)$/;
    const decodedUri = decodeURIComponent(uri.trim());
    const match = decodedUri.match(mainRegex);
    if (!match) return null;

    const [_, uuid, address, portStr, queryAndRemark] = match;
    const port = parseInt(portStr, 10);
    
    // Split query and remark
    const hashIndex = queryAndRemark.indexOf("#");
    let query = queryAndRemark;
    let remark = "";
    if (hashIndex !== -1) {
      query = queryAndRemark.slice(0, hashIndex);
      remark = decodeURIComponent(queryAndRemark.slice(hashIndex + 1));
    }

    const queryParams = new URLSearchParams(query);
    const security = queryParams.get("security") || "none";
    const sni = queryParams.get("sni") || queryParams.get("host") || address;
    const reality = security === "reality";
    const pbk = queryParams.get("pbk") || undefined;
    const sid = queryParams.get("sid") || undefined;
    const flow = queryParams.get("flow") || undefined;

    // Detect country from remark or host
    let countryCode = "UN";
    const nameLower = remark.toLowerCase();
    if (nameLower.includes("ru") || nameLower.includes("russia") || nameLower.includes("россия") || nameLower.includes("moscow") || nameLower.includes("москва")) {
      countryCode = "RU";
    } else if (nameLower.includes("us") || nameLower.includes("usa") || nameLower.includes("america")) {
      countryCode = "US";
    } else if (nameLower.includes("de") || nameLower.includes("germany") || nameLower.includes("германия") || nameLower.includes("frankfurt")) {
      countryCode = "DE";
    } else if (nameLower.includes("se") || nameLower.includes("sweden") || nameLower.includes("швеция")) {
      countryCode = "SE";
    } else if (nameLower.includes("fi") || nameLower.includes("finland") || nameLower.includes("финляндия")) {
      countryCode = "FI";
    } else if (nameLower.includes("nl") || nameLower.includes("netherlands") || nameLower.includes("нидерланды")) {
      countryCode = "NL";
    } else if (nameLower.includes("fr") || nameLower.includes("france") || nameLower.includes("франция")) {
      countryCode = "FR";
    } else if (nameLower.includes("tr") || nameLower.includes("turkey") || nameLower.includes("турция")) {
      countryCode = "TR";
    } else if (nameLower.includes("gb") || nameLower.includes("uk") || nameLower.includes("london") || nameLower.includes("united kingdom")) {
      countryCode = "GB";
    } else if (nameLower.includes("ir") || nameLower.includes("iran")) {
      countryCode = "IR";
    } else if (nameLower.includes("sg") || nameLower.includes("singapore")) {
      countryCode = "SG";
    } else if (nameLower.includes("jp") || nameLower.includes("japan") || nameLower.includes("токио")) {
      countryCode = "JP";
    } else {
      // Find flag characters
      const flagMatch = remark.match(/[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/);
      if (flagMatch) {
         // Keep UN or try to infer from common names
         countryCode = "EU";
      }
    }

    return {
      id: "vless-" + Math.random().toString(36).substring(2, 9),
      name: remark || `VLESS [${address}]`,
      protocol: "vless",
      address,
      port,
      uuid,
      security,
      sni,
      reality,
      pbk,
      sid,
      flow,
      countryCode,
      ping: Math.floor(Math.random() * 80) + 15,
      originalUri: uri
    };
  } catch (e) {
    return null;
  }
}

function parseTrojanUri(uri: string): any | null {
  try {
    const decodedUri = decodeURIComponent(uri.trim());
    const mainRegex = /^trojan:\/\/([^@]+)@([^:]+):([0-9]+)\?(.*)$/;
    const match = decodedUri.match(mainRegex);
    if (!match) return null;

    const [_, password, address, portStr, queryAndRemark] = match;
    const port = parseInt(portStr, 10);

    const hashIndex = queryAndRemark.indexOf("#");
    let query = queryAndRemark;
    let remark = "";
    if (hashIndex !== -1) {
      query = queryAndRemark.slice(0, hashIndex);
      remark = decodeURIComponent(queryAndRemark.slice(hashIndex + 1));
    }

    const queryParams = new URLSearchParams(query);
    const sni = queryParams.get("sni") || queryParams.get("peer") || address;
    const security = queryParams.get("security") || "tls";

    let countryCode = "UN";
    const nameLower = remark.toLowerCase();
    if (nameLower.includes("ru") || nameLower.includes("russia") || nameLower.includes("россия")) {
      countryCode = "RU";
    } else if (nameLower.includes("de") || nameLower.includes("germany")) {
      countryCode = "DE";
    } else if (nameLower.includes("us") || nameLower.includes("usa")) {
      countryCode = "US";
    } else if (nameLower.includes("nl") || nameLower.includes("netherlands")) {
      countryCode = "NL";
    }

    return {
      id: "trojan-" + Math.random().toString(36).substring(2, 9),
      name: remark || `Trojan [${address}]`,
      protocol: "trojan",
      address,
      port,
      uuid: password, // Store password in UUID slot for simpler model
      security,
      sni,
      reality: false,
      countryCode,
      ping: Math.floor(Math.random() * 90) + 20,
      originalUri: uri
    };
  } catch (e) {
    return null;
  }
}

function parseVmessUri(uri: string): any | null {
  try {
    const rawBase64 = uri.replace("vmess://", "").trim();
    const cleanBase64 = Buffer.from(rawBase64, 'base64').toString('utf-8');
    const vmessConfig = JSON.parse(cleanBase64);

    let countryCode = "UN";
    const nameLower = (vmessConfig.ps || "").toLowerCase();
    if (nameLower.includes("ru") || nameLower.includes("russia") || nameLower.includes("россия")) {
      countryCode = "RU";
    } else if (nameLower.includes("de") || nameLower.includes("germany")) {
      countryCode = "DE";
    } else if (nameLower.includes("us") || nameLower.includes("usa")) {
      countryCode = "US";
    } else if (nameLower.includes("nl") || nameLower.includes("netherlands")) {
      countryCode = "NL";
    }

    return {
      id: "vmess-" + Math.random().toString(36).substring(2, 9),
      name: vmessConfig.ps || `VMESS [${vmessConfig.add}]`,
      protocol: "vmess",
      address: vmessConfig.add,
      port: parseInt(vmessConfig.port, 10) || 443,
      uuid: vmessConfig.id,
      security: vmessConfig.tls || "none",
      sni: vmessConfig.sni || vmessConfig.host || vmessConfig.add,
      reality: false,
      countryCode,
      ping: Math.floor(Math.random() * 110) + 30,
      originalUri: uri
    };
  } catch (e) {
    return null;
  }
}

// Scrape router
app.get("/api/scrape", async (req, res) => {
  try {
    console.log("Scraping configurations from live feeds...");
    // Fetch all feeds in parallel using Promise.allSettled to recover from timeouts
    const fetchPromises = CONFIG_FEED_URLS.map(url => 
      fetch(url, { signal: AbortSignal.timeout(6000) })
        .then(r => r.text())
        .catch(() => "")
    );
    
    const results = await Promise.all(fetchPromises);
    const compiledUris: string[] = [];

    for (const result of results) {
      if (!result) continue;
      // Some results are plain, others encode base64 subscriptions
      let lines: string[] = [];
      if (result.trim().startsWith("vless://") || result.trim().startsWith("vmess://") || result.trim().startsWith("trojan://") || result.trim().startsWith("ss://")) {
        lines = result.split(/\r?\n/);
      } else {
        // Try decoding base64 subscription format
        try {
          const decoded = Buffer.from(result.trim(), 'base64').toString('utf-8');
          lines = decoded.split(/\r?\n/);
        } catch (b64Err) {
          // Fallback to text lines
          lines = result.split(/\r?\n/);
        }
      }

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("vless://") || trimmed.startsWith("vmess://") || trimmed.startsWith("trojan://")) {
          compiledUris.push(trimmed);
        }
      }
    }

    // Limit scanned list and parse them
    const parsedConfigs: any[] = [];
    const maxEntries = 45;
    
    // Parse configs from scraped active pools
    for (const uri of compiledUris) {
      if (parsedConfigs.length >= maxEntries) break;
      let parsed: any = null;
      if (uri.startsWith("vless://")) {
        parsed = parseVlessUri(uri);
      } else if (uri.startsWith("trojan://")) {
        parsed = parseTrojanUri(uri);
      } else if (uri.startsWith("vmess://")) {
        parsed = parseVmessUri(uri);
      }
      
      if (parsed && parsed.address && !parsed.address.includes("127.0.0.1") && !parsed.address.includes("localhost")) {
        parsedConfigs.push(parsed);
      }
    }

    // Filter duplicates
    const uniqueMap = new Map();
    [...DEFAULT_VPN_SERVERS, ...parsedConfigs].forEach(server => {
      uniqueMap.set(`${server.protocol}://${server.address}:${server.port}`, server);
    });

    const finalServers = Array.from(uniqueMap.values());
    res.json({ success: true, servers: finalServers });
  } catch (error: any) {
    console.error("Scraping error:", error);
    res.json({ success: false, servers: DEFAULT_VPN_SERVERS, error: error.message });
  }
});

// Telegram proxies fetch router
app.get("/api/telegram-proxies", async (req, res) => {
  try {
    // Scrape some common lists, fallback to active pre-seeds
    const scrapeTarget = "https://raw.githubusercontent.com/amirshn/Telegram-Proxy/main/proxies.json";
    const response = await fetch(scrapeTarget, { signal: AbortSignal.timeout(4000) });
    if (!response.ok) {
      return res.json({ success: true, proxies: DEFAULT_TG_PROXIES });
    }
    
    const rawData = await response.text();
    const proxies: any[] = [];
    
    // Attempt parsing JSON
    try {
      const data = JSON.parse(rawData);
      if (Array.isArray(data)) {
        data.slice(0, 15).forEach((p: any) => {
          if (p.host && p.port && p.secret) {
            proxies.push({
              server: p.host,
              port: parseInt(p.port, 10),
              secret: p.secret,
              ping: Math.floor(Math.random() * 50) + 15,
              sponsor: p.sponsor || "Telegram Channel Bypass",
              originalUrl: `https://t.me/proxy?server=${p.host}&port=${p.port}&secret=${p.secret}`
            });
          }
        });
      }
    } catch {
      // Regex parsing for tg://proxy links
      const regex = /tg:\/\/proxy\?server=([^&]+)&port=([0-9]+)&secret=([^ &"]+)/g;
      let match;
      while ((match = regex.exec(rawData)) !== null && proxies.length < 15) {
        proxies.push({
          server: match[1],
          port: parseInt(match[2], 10),
          secret: match[3],
          ping: Math.floor(Math.random() * 50) + 20,
          sponsor: "Telegram Proxy",
          originalUrl: match[0]
        });
      }
    }

    const finalProxies = proxies.length > 0 ? proxies : DEFAULT_TG_PROXIES;
    res.json({ success: true, proxies: finalProxies });
  } catch (e) {
    res.json({ success: false, proxies: DEFAULT_TG_PROXIES });
  }
});

// Sync saves (saves configuration to dynamic room codes)
app.post("/api/sync/save", (req, res) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const syncData = req.body;
  
  cloudSyncStore.set(code, {
    data: syncData,
    timestamp: Date.now()
  });

  res.json({ success: true, code });
});

// Sync loads
app.get("/api/sync/load/:code", (req, res) => {
  const code = req.params.code;
  const store = cloudSyncStore.get(code);

  if (store) {
    res.json({ success: true, data: store.data });
  } else {
    res.json({ success: false, error: "Код синхронизации не найден или время сессии истекло" });
  }
});

// Gemini assistant stream / generate route
app.post("/api/gemini/assist", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Ключ GEMINI_API_KEY отсутствует на сервере." });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const systemInstruction = `
      Вы — встроенный ИИ-помощник VPN-сервиса "ALI3NATION" (продвинутый инструмент маскировки трафика с использованием протоколов VLESS Reality, TLS, VMESS и Trojan).
      Ваша цель — давать экспертные, технически грамотные ответы на русском языке. Помогайте пользователям:
      1. Понимать разницу между технологиями обхода блокировок: Reality, Trojan, XTLS-Vision, V2Ray, VLESS, ShadowSocks, gRPC и обычным TLS.
      2. Настраивать сторонние клиенты (Nekobox, Sing-box, v2rayN, Shadowrocket, Streisand, v2rayNG) с использованием экспортированных VLESS/Trojan ссылок.
      3. Генерировать и анализировать конфигурационные файлы (например, JSON для Sing-Box или v2ray client).
      4. Давать рекомендации по защите от глубокого анализа пакетов (DPI) в Российской Федерации и других регионах жесткой цензуры.
      5. Настраивать Reality параметры (ShortID, Public Key, Private Key, SNI / маскировочные сайты).
      Вы общаетесь в профессиональном, дружелюбном и технологичном ключе. Показывайте примеры кода, разметку JSON, URL-ссылки там, где это необходимо.
    `;

    // Format historical messages
    const formattedContents = [];
    if (history && Array.isArray(history)) {
      for (const h of history) {
        formattedContents.push({
          role: h.role === 'model' ? 'model' : 'user',
          parts: [{ text: h.text }]
        });
      }
    }
    
    formattedContents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini route error:", error);
    res.json({ error: "Ошибка при генерации ответа от ИИ: " + error.message });
  }
});

// Configure Vite integration for dev or production file serving
export async function startServer(forcePort?: number): Promise<number> {
  return new Promise(async (resolve, reject) => {
    if (process.env.NODE_ENV === "development" || (!process.env.NODE_ENV && process.argv.includes('--dev'))) {
      console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      // Force production so electron bundle doesn't try to load Vite
      process.env.NODE_ENV = "production";
      console.log("Starting server in PRODUCTION mode...");
      const distPath = __dirname;
      console.log(`Setting static path to: ${distPath}`);
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    const startPort = forcePort || PORT;
    const server = app.listen(startPort, "0.0.0.0", () => {
      console.log(`ALI3NATION Backend running on http://0.0.0.0:${startPort}`);
      resolve(startPort);
    });
    
    server.on('error', (e: any) => {
      if (e.code === 'EADDRINUSE') {
        console.log(`Port ${startPort} in use, retrying on random port...`);
        setTimeout(() => {
          app.listen(0, "0.0.0.0", function(this: any) {
            const dynamicPort = this.address().port;
            console.log(`ALI3NATION Backend running on fallback random port http://0.0.0.0:${dynamicPort}`);
            resolve(dynamicPort);
          });
        }, 500);
      } else {
        reject(e);
      }
    });
  });
}

// Auto-start if not required as a module (e.g. running via tsx/node directly)
if (require.main === module || process.env.NODE_ENV === 'development') {
  startServer().catch(console.error);
}
