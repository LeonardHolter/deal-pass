"use client";

import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "pass-on:count:v1";

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

/* ---------- Animated big number ---------- */

interface Token {
  id: string;
  ch: string;
  state: "in" | "stay";
  out?: string;
}

function BigNumber({ value }: { value: number }) {
  const str = fmt(value);
  const prevRef = useRef(str);
  const [tokens, setTokens] = useState<Token[]>(() =>
    str.split("").map((ch, i) => ({ id: "init-" + i, ch, state: "in" as const }))
  );

  useEffect(() => {
    const prev = prevRef.current;
    if (prev === str) return;
    const len = Math.max(prev.length, str.length);
    const a = prev.padStart(len, " ");
    const b = str.padStart(len, " ");
    const next: Token[] = [];
    for (let i = 0; i < len; i++) {
      if (a[i] === b[i]) {
        next.push({ id: "stay-" + i + "-" + b[i], ch: b[i], state: "stay" });
      } else {
        next.push({
          id: "in-" + Date.now() + "-" + i,
          ch: b[i],
          state: "in",
          out: a[i],
        });
      }
    }
    setTokens(next);
    prevRef.current = str;
  }, [str]);

  return (
    <div
      style={{
        fontFamily: "var(--font-serif), 'Times New Roman', serif",
        fontWeight: 400,
        fontSize: "clamp(140px, 30vw, 520px)",
        lineHeight: 0.85,
        letterSpacing: "-0.03em",
        display: "flex",
        justifyContent: "center",
        userSelect: "none",
        fontFeatureSettings: '"tnum" 1, "lnum" 1',
      }}
    >
      {tokens.map((t, i) => (
        <span
          key={i}
          style={{
            position: "relative",
            display: "inline-block",
            minWidth:
              t.ch === "," ? "0.25em" : t.ch === " " ? "0em" : "0.55em",
            textAlign: "center",
            overflow: "hidden",
          }}
        >
          <span
            key={t.id}
            className={t.state === "in" ? "digit-in" : ""}
            style={{ display: "inline-block" }}
          >
            {t.ch === " " ? " " : t.ch}
          </span>
          {t.state === "in" && t.out && t.out !== " " ? (
            <span className="digit-out" style={{ display: "inline-block" }}>
              {t.out}
            </span>
          ) : null}
        </span>
      ))}
    </div>
  );
}

/* ---------- App ---------- */

export default function Home() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      setCount(v ? parseInt(v, 10) || 0 : 0);
    } catch {
      setCount(0);
    }
  }, []);

  useEffect(() => {
    if (count === null) return;
    try {
      localStorage.setItem(STORAGE_KEY, String(count));
    } catch {}
  }, [count]);

  if (count === null) return null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--fg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 56,
        padding: 40,
        boxSizing: "border-box",
      }}
    >
      <BigNumber value={count} />

      <div
        style={{
          fontFamily: "var(--font-mono), ui-monospace, monospace",
          fontSize: 13,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          textAlign: "center",
          opacity: 0.7,
        }}
      >
        BUSINESS OPPORTUNITIES PASSED ON
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        <button
          onClick={() => setCount((c) => (c ?? 0) + 1)}
          style={{
            background: "var(--accent)",
            color: "#fff",
            border: "none",
            padding: "16px 28px",
            fontFamily: "var(--font-mono), ui-monospace, monospace",
            fontSize: 13,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            cursor: "pointer",
            borderRadius: 2,
            transition: "transform 0.08s ease",
          }}
          onMouseDown={(e) =>
            (e.currentTarget.style.transform = "scale(0.97)")
          }
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          + pass on another
        </button>
        <button
          onClick={() => setCount((c) => Math.max(0, (c ?? 0) - 1))}
          disabled={count === 0}
          style={{
            background: "transparent",
            color: "var(--fg)",
            border: "none",
            padding: "4px 8px",
            fontFamily: "var(--font-mono), ui-monospace, monospace",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.16em",
            cursor: count === 0 ? "not-allowed" : "pointer",
            opacity: count === 0 ? 0.25 : 0.5,
            transition: "opacity 0.15s ease",
          }}
          onMouseEnter={(e) => {
            if (count > 0) e.currentTarget.style.opacity = "0.9";
          }}
          onMouseLeave={(e) => {
            if (count > 0) e.currentTarget.style.opacity = "0.5";
          }}
        >
          undo
        </button>
      </div>
    </div>
  );
}
