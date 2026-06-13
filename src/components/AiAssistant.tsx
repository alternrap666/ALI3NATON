/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, ArrowRight, Bot, User, Trash2, AlertCircle } from "lucide-react";
import { ChatMessage } from "../types";

interface AiAssistantProps {
  chatHistory: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  onClearHistory: () => void;
  loading: boolean;
}

export default function AiAssistant({ chatHistory, onSendMessage, onClearHistory, loading }: AiAssistantProps) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, loading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  const handleSuggestedPrompt = (prompt: string) => {
    if (loading) return;
    onSendMessage(prompt);
  };

  // Basic custom renderer for simple Markdown elements (bold, code blocks, lists)
  const renderMessageContent = (text: string) => {
    const lines = text.split("\n");
    let inCodeBlock = false;
    let codeContent: string[] = [];

    return lines.map((line, idx) => {
      // Toggle Code Blocks
      if (line.trim().startsWith("```")) {
        if (inCodeBlock) {
          inCodeBlock = false;
          const blockText = codeContent.join("\n");
          codeContent = [];
          return (
            <pre key={idx} className="bg-zinc-950 text-zinc-300 font-mono text-[11px] p-3 rounded-lg my-2 overflow-x-auto border border-zinc-900 leading-relaxed block">
              <code>{blockText}</code>
            </pre>
          );
        } else {
          inCodeBlock = true;
          return null;
        }
      }

      if (inCodeBlock) {
        codeContent.push(line);
        return null;
      }

      // Format bold text **text** -> <strong>text</strong>
      let formattedLine = line;
      const boldRegex = /\*\*([^*]+)\*\*/g;
      
      // Basic lists
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        return (
          <li key={idx} className="list-disc list-inside ml-2.5 my-1 text-xs text-gray-700 dark:text-zinc-300 leading-relaxed">
            {line.trim().substring(2)}
          </li>
        );
      }

      return (
        <p key={idx} className="text-xs text-gray-700 dark:text-zinc-300 leading-relaxed my-1.5 break-words">
          {line}
        </p>
      );
    });
  };

  const suggestions = [
    "Что такое протокол VLESS Reality?",
    "Как импортировать профиль в Nekobox?",
    "Как защититься от DPI анализа пакетов?",
    "Как настроить прокси для Телеграм?"
  ];

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col h-full overflow-hidden" id="ali3n-ai-assistant">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-bold font-display text-gray-900 dark:text-zinc-100 uppercase tracking-wider">
              ALI3NATION AI Помощник
            </h2>
            <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium">Работает на базе Gemini-3.5-Flash</p>
          </div>
        </div>

        {chatHistory.length > 0 && (
          <button
            onClick={onClearHistory}
            className="p-1 px-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-300 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-gray-400" /> Очистить
          </button>
        )}
      </div>

      {/* Messages thread */}
      <div className="grow overflow-y-auto max-h-[280px] my-3 pr-1 space-y-3.5 scrollbar-thin scrollbar-thumb-zinc-200">
        {chatHistory.length === 0 ? (
          <div className="h-full flex flex-col justify-center py-6">
            <div className="text-center max-w-sm mx-auto mb-4">
              <Bot className="w-10 h-10 text-indigo-500 mx-auto mb-2 animate-bounce" />
              <h3 className="text-xs font-bold text-gray-700 dark:text-zinc-200">Привет, я искусственный разум ALI3NATION!</h3>
              <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1 leading-relaxed">
                Спросите меня о настройках обхода блокировок, шифровании Reality, конфигурации сторонних клиентов на Android/iOS/PC или проверке пинга.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md mx-auto w-full px-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSuggestedPrompt(s)}
                  className="p-2 border border-indigo-50 hover:border-indigo-100 dark:border-zinc-800 dark:hover:border-zinc-700 bg-indigo-50/10 dark:bg-zinc-950/20 rounded-xl text-left text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/35 transition-all flex items-center justify-between"
                >
                  <span>{s}</span>
                  <ArrowRight className="w-3 h-3 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {chatHistory.map((m) => (
              <div key={m.id} className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center shrink-0 ${
                  m.role === "user" 
                    ? "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300" 
                    : "bg-indigo-600 text-white"
                }`}>
                  {m.role === "user" ? <User className="w-4.5 h-4.5" /> : <Bot className="w-4.5 h-4.5" />}
                </div>

                <div className={`p-3 rounded-2xl max-w-[85%] border shadow-xs ${
                  m.role === "user"
                    ? "bg-gray-50 dark:bg-zinc-950 border-gray-100 dark:border-zinc-800 rounded-tr-none text-gray-800 dark:text-zinc-100"
                    : "bg-indigo-50/25 dark:bg-indigo-950/25 border-indigo-100/40 dark:border-indigo-950/40 rounded-tl-none text-gray-800 dark:text-zinc-100"
                }`}>
                  {renderMessageContent(m.text)}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 items-center">
                <div className="w-7.5 h-7.5 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4.5 h-4.5 animate-pulse" />
                </div>
                <div className="bg-indigo-50/10 dark:bg-indigo-950/10 border border-indigo-100/20 px-4 py-2.5 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce delay-75"></span>
                  <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce delay-150"></span>
                  <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce delay-300"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Form container */}
      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-gray-100 dark:border-zinc-800 pt-3 shrink-0">
        <input
          type="text"
          placeholder="Спросить у ALI3NATION AI..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="w-full bg-gray-50 dark:bg-zinc-950 text-gray-800 dark:text-zinc-100 px-3.5 py-2 text-xs border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={loading || !inputText.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-2 px-3 rounded-xl transition-colors cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
