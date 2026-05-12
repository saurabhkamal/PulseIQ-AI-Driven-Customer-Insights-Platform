"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { analystService } from "@/services/analyst.service";
import type { AnalystQueryResponse } from "@/services/analyst.service";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  status?: "ok" | "blocked" | "error";
  toolCallsMade?: number;
  latencyMs?: number;
  guardrailTriggered?: boolean;
}

const SUGGESTED_QUESTIONS = [
  "What are the top churn risk signals this month?",
  "Which customers are most likely to open a savings ISA?",
  "Where are customers dropping off in the KYC journey?",
  "What is the current engagement trend for retail banking customers?",
  "Give me a cross-sell recommendation for premium current account holders.",
];

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] bg-[#0A66C2] text-white rounded-2xl rounded-br-sm px-4 py-3 text-[14px] leading-relaxed">
          {msg.content}
        </div>
      </div>
    );
  }

  const isBlocked = msg.status === "blocked";
  const isError = msg.status === "error";

  return (
    <div className="flex justify-start gap-3">
      {/* AI avatar */}
      <div className="shrink-0 h-8 w-8 rounded-full bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center">
        <svg className="h-4 w-4 text-[#7C3AED]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7H3a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zM9 9H7.5A1.5 1.5 0 006 10.5v1A1.5 1.5 0 007.5 13H9v-4zm6 0v4h1.5A1.5 1.5 0 0018 11.5v-1A1.5 1.5 0 0016.5 9H15zM9 15h6v2H9v-2z" />
        </svg>
      </div>

      <div className="max-w-[80%] space-y-1">
        <div
          className={`rounded-2xl rounded-bl-sm px-4 py-3 text-[14px] leading-relaxed whitespace-pre-wrap ${
            isBlocked
              ? "bg-[#FFF3CD] border border-[#E8940A]/30 text-[#92600A]"
              : isError
              ? "bg-[#FFF0F0] border border-[#CC3333]/20 text-[#CC3333]"
              : "bg-white border border-[#D9D8D3] text-[#1A1A1A]"
          }`}
        >
          {isBlocked && (
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#E8940A] mb-2">
              Request blocked by guardrails
            </p>
          )}
          {msg.content}
        </div>

        {/* Metadata row */}
        {msg.status === "ok" && (msg.toolCallsMade !== undefined || msg.latencyMs !== undefined) && (
          <div className="flex items-center gap-3 px-1 text-[11px] text-[#8A8A8A]">
            {msg.toolCallsMade !== undefined && msg.toolCallsMade > 0 && (
              <span>{msg.toolCallsMade} tool call{msg.toolCallsMade !== 1 ? "s" : ""}</span>
            )}
            {msg.latencyMs !== undefined && (
              <span>{(msg.latencyMs / 1000).toFixed(1)}s</span>
            )}
            <span className="flex items-center gap-1 text-[#7C3AED]">
              <span className="h-1 w-1 rounded-full bg-[#7C3AED]" aria-hidden="true" />
              AI Analyst
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start gap-3">
      <div className="shrink-0 h-8 w-8 rounded-full bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center">
        <svg className="h-4 w-4 text-[#7C3AED]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7H3a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zM9 9H7.5A1.5 1.5 0 006 10.5v1A1.5 1.5 0 007.5 13H9v-4zm6 0v4h1.5A1.5 1.5 0 0018 11.5v-1A1.5 1.5 0 0016.5 9H15zM9 15h6v2H9v-2z" />
        </svg>
      </div>
      <div className="bg-white border border-[#D9D8D3] rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-[#8A8A8A] animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AnalystChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = useCallback(
    async (question: string) => {
      if (!question.trim() || isLoading) return;

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: question.trim(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);

      try {
        const res: AnalystQueryResponse = await analystService.query({
          question: question.trim(),
          session_id: sessionId,
        });

        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: res.answer,
          status: res.status,
          toolCallsMade: res.tool_calls_made,
          latencyMs: res.latency_ms,
          guardrailTriggered: res.guardrail_triggered,
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err: unknown) {
        const errorMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "I couldn't complete your request. Please try again.",
          status: "error",
        };
        setMessages((prev) => [...prev, errorMsg]);
        void err;
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [isLoading, sessionId]
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full bg-[#F3F2EF] rounded-xl border border-[#D9D8D3] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 bg-white border-b border-[#D9D8D3]">
        <div className="h-9 w-9 rounded-full bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center">
          <svg className="h-5 w-5 text-[#7C3AED]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7H3a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zM9 9H7.5A1.5 1.5 0 006 10.5v1A1.5 1.5 0 007.5 13H9v-4zm6 0v4h1.5A1.5 1.5 0 0018 11.5v-1A1.5 1.5 0 0016.5 9H15zM9 15h6v2H9v-2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-[15px] font-semibold text-[#1A1A1A]">AI Analyst</h2>
          <p className="text-[12px] text-[#8A8A8A]">Ask questions about your banking data</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 bg-[#7C3AED]/10 border border-[#7C3AED]/20 rounded-full px-2.5 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED] animate-pulse" aria-hidden="true" />
          <span className="text-[11px] font-medium text-[#7C3AED]">GPT-4o · LangGraph</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 min-h-0">
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <div className="h-16 w-16 rounded-full bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-[#7C3AED]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-2">
              Your AI Analyst is ready
            </h3>
            <p className="text-[13px] text-[#8A8A8A] max-w-sm mb-6">
              Ask anything about customer behaviour, churn signals, KYC funnels, or product affinity across your banking data.
            </p>

            {/* Suggested questions */}
            <div className="w-full max-w-lg space-y-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => void sendMessage(q)}
                  className="w-full text-left px-4 py-3 bg-white border border-[#D9D8D3] rounded-lg text-[13px] text-[#4A4A4A] hover:border-[#7C3AED]/40 hover:bg-[#7C3AED]/5 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {isLoading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="px-6 py-4 bg-white border-t border-[#D9D8D3]">
        <div className="flex items-end gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your data… (Enter to send, Shift+Enter for new line)"
            rows={1}
            disabled={isLoading}
            className="flex-1 resize-none rounded-lg border border-[#D9D8D3] px-4 py-3 text-[14px] text-[#1A1A1A] placeholder-[#8A8A8A] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ maxHeight: "120px", minHeight: "44px" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
            }}
          />
          <button
            onClick={() => void sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="shrink-0 h-[44px] w-[44px] rounded-lg bg-[#7C3AED] text-white flex items-center justify-center hover:bg-[#6D28D9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
        <p className="text-[11px] text-[#8A8A8A] mt-2 text-center">
          AI responses are generated from your organisation&apos;s data only. Always verify before acting.
        </p>
      </div>
    </div>
  );
}
