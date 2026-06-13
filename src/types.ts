/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface VpnServer {
  id: string;
  name: string;
  protocol: 'vless' | 'vmess' | 'trojan' | 'shadowsocks';
  address: string;
  port: number;
  uuid: string;
  security: string;
  sni: string;
  reality: boolean;
  pbk?: string;
  sid?: string;
  flow?: string;
  countryCode: string;
  ping: number | null;
  isCustom?: boolean;
  originalUri: string;
}

export interface TelegramProxy {
  server: string;
  port: number;
  secret: string;
  ping: number;
  sponsor?: string;
  originalUrl: string;
}

export interface AdBlockLog {
  id: string;
  timestamp: string;
  domain: string;
  rule: string;
  type: 'dns' | 'cosmetic';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface AppPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  enabled: boolean;
  code: string;
}

export interface SyncData {
  servers: VpnServer[];
  customProxies: TelegramProxy[];
  adBlockEnabled: boolean;
  blocklists: string[];
  theme: 'light' | 'dark';
}
