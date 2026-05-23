"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/* ---------- Ranking system ---------- */

// Buffett's number: 74 years of active investing (1951–2025).
// Berkshire receives ~1,000+ proposals/year in recent decades.
// Early decades ~200–400/year. Conservative lifetime estimate:
// ~600 avg/year × 74 years = 44,400. Subtract ~65 acquisitions
// and ~100 long-term stock positions = 44,235 passed on.
const BUFFETT_NUMBER = 44_235;

interface Rank {
  name: string;
  note: string;
  min: number;
}

const RANKS: Rank[] = [
  { name: "Tire Kicker", note: "Everyone starts somewhere", min: 0 },
  { name: "Window Shopper", note: "Looking, not buying", min: 5 },
  { name: "Cautious Analyst", note: "Starting to see the pattern", min: 25 },
  { name: "Deal Skeptic", note: "If in doubt, don't", min: 100 },
  { name: "Serial Passer", note: "No is your default", min: 500 },
  { name: "The Gatekeeper", note: "Nothing gets through", min: 1_500 },
  { name: "Charlie Munger", note: "\"Invert, always invert\"", min: 5_000 },
  { name: "Warren Buffett", note: "The Oracle of Omaha", min: BUFFETT_NUMBER },
];

function getRank(count: number): { current: Rank; next: Rank | null; progress: number } {
  let current = RANKS[0];
  let nextIdx = 1;
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (count >= RANKS[i].min) {
      current = RANKS[i];
      nextIdx = i + 1;
      break;
    }
  }
  const next = nextIdx < RANKS.length ? RANKS[nextIdx] : null;
  const progress = next
    ? ((count - current.min) / (next.min - current.min)) * 100
    : 100;
  return { current, next, progress: Math.min(100, progress) };
}

/* ---------- Animated big number ---------- */

interface Token {
  id: string;
  ch: string;
  state: "in" | "stay";
  out?: string;
}

function fmt(n: number): string {
  return n.toLocaleString("en-US");
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
        fontSize: "clamp(80px, 28vw, 520px)",
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
            {t.ch === " " ? " " : t.ch}
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
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/count")
      .then((r) => r.json())
      .then((d) => setCount(d.count))
      .catch(() => setCount(0));
  }, []);

  const act = useCallback(async (action: "increment" | "decrement") => {
    if (busy) return;
    setBusy(true);
    setCount((c) =>
      action === "increment" ? (c ?? 0) + 1 : Math.max(0, (c ?? 0) - 1)
    );
    try {
      const res = await fetch("/api/count", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      setCount(data.count);
    } catch {
      setCount((c) =>
        action === "increment" ? (c ?? 0) - 1 : (c ?? 0) + 1
      );
    }
    setBusy(false);
  }, [busy]);

  if (count === null) return null;

  const { current, next, progress } = getRank(count);
  const buffettProgress = Math.min(100, (count / BUFFETT_NUMBER) * 100);

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
        gap: "clamp(28px, 6vw, 48px)",
        padding: "clamp(20px, 5vw, 40px)",
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

      {/* Rank display */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        width: "min(360px, 85vw)",
      }}>
        {/* Current rank */}
        <div style={{
          fontFamily: "var(--font-serif), serif",
          fontSize: "clamp(22px, 5vw, 32px)",
          fontStyle: "italic",
          textAlign: "center",
        }}>
          {current.name}
        </div>
        <div style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 10,
          letterSpacing: "0.12em",
          color: "var(--fg)",
          opacity: 0.5,
          textAlign: "center",
        }}>
          {current.note}
        </div>

        {/* Progress to next rank */}
        {next && (
          <div style={{ width: "100%", marginTop: 8 }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              fontFamily: "var(--font-mono), monospace",
              fontSize: 9,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--fg)",
              opacity: 0.4,
              marginBottom: 6,
            }}>
              <span>{current.name}</span>
              <span>{next.name}</span>
            </div>
            <div style={{
              height: 3,
              background: "var(--fg)",
              opacity: 0.1,
              borderRadius: 2,
              overflow: "hidden",
            }}>
              <div style={{
                height: "100%",
                width: `${progress}%`,
                background: "var(--accent)",
                borderRadius: 2,
                transition: "width 0.3s ease",
              }} />
            </div>
            <div style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 9,
              letterSpacing: "0.1em",
              color: "var(--fg)",
              opacity: 0.35,
              marginTop: 5,
              textAlign: "right",
            }}>
              {fmt(next.min - count)} to go
            </div>
          </div>
        )}

        {/* Buffett goal */}
        <div style={{ width: "100%", marginTop: 4 }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            fontFamily: "var(--font-mono), monospace",
            fontSize: 9,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--fg)",
            opacity: 0.4,
            marginBottom: 6,
          }}>
            <span>THE BUFFETT GOAL</span>
            <span>{fmt(BUFFETT_NUMBER)}</span>
          </div>
          <div style={{
            height: 3,
            background: "var(--fg)",
            opacity: 0.1,
            borderRadius: 2,
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${buffettProgress}%`,
              background: "var(--accent)",
              borderRadius: 2,
              transition: "width 0.3s ease",
              opacity: 0.6,
            }} />
          </div>
          <div style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 9,
            letterSpacing: "0.1em",
            color: "var(--fg)",
            opacity: 0.35,
            marginTop: 5,
            textAlign: "right",
          }}>
            {buffettProgress < 100
              ? `${buffettProgress.toFixed(2)}% of the way`
              : "You've matched the Oracle"}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        <button
          onClick={() => act("increment")}
          disabled={busy}
          style={{
            background: "var(--accent)",
            color: "#fff",
            border: "none",
            padding: "16px 28px",
            fontFamily: "var(--font-mono), ui-monospace, monospace",
            fontSize: 13,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            cursor: busy ? "wait" : "pointer",
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
          onClick={() => act("decrement")}
          disabled={count === 0 || busy}
          style={{
            background: "transparent",
            color: "var(--fg)",
            border: "none",
            padding: "4px 8px",
            fontFamily: "var(--font-mono), ui-monospace, monospace",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.16em",
            cursor: count === 0 || busy ? "not-allowed" : "pointer",
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
