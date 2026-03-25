import { useState, useEffect, useRef, useCallback, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════════
   LEXICON — THE DEFINITIVE SPELLING BEE SOLVER
   Triple-refined, Michelin-grade, 20 improvements deep.
   ═══════════════════════════════════════════════════════════════ */

// ── Audio Engine (Web Audio API) ──────────────────────────────
const AudioEngine = (() => {
  let ctx = null;
  const getCtx = () => {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  };
  const play = (freq, dur, type = "sine", vol = 0.08) => {
    try {
      const c = getCtx(), o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      o.connect(g); g.connect(c.destination);
      o.start(); o.stop(c.currentTime + dur);
    } catch (e) {}
  };
  return {
    keyClick: () => play(1800, 0.04, "square", 0.03),
    solve: () => { play(523, 0.15); setTimeout(() => play(659, 0.15), 100); setTimeout(() => play(784, 0.25), 200); },
    pangram: () => { [523,659,784,1047].forEach((f,i) => setTimeout(() => play(f, 0.2, "sine", 0.1), i*80)); },
    shuffle: () => play(400, 0.08, "triangle", 0.05),
    hint: () => play(880, 0.12, "sine", 0.06),
    copy: () => play(1200, 0.06, "square", 0.03),
    error: () => play(220, 0.3, "sawtooth", 0.04),
  };
})();

// ── Confetti System ───────────────────────────────────────────
function Confetti({ active }) {
  const [particles, setParticles] = useState([]);
  useEffect(() => {
    if (!active) return;
    const ps = Array.from({ length: 60 }, (_, i) => ({
      id: i, x: 50 + (Math.random() - 0.5) * 30, y: 40,
      vx: (Math.random() - 0.5) * 8, vy: -(Math.random() * 6 + 4),
      rot: Math.random() * 360, size: Math.random() * 8 + 4,
      color: ["#D4A843","#E8C564","#F0D98C","#B8922E","#FFEEB3"][Math.floor(Math.random()*5)],
      shape: Math.random() > 0.5 ? "hex" : "rect",
    }));
    setParticles(ps);
    const t = setTimeout(() => setParticles([]), 2500);
    return () => clearTimeout(t);
  }, [active]);

  if (!particles.length) return null;
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999, overflow: "hidden" }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: "absolute", left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size,
          background: p.color,
          borderRadius: p.shape === "hex" ? "2px" : "0",
          clipPath: p.shape === "hex" ? "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" : "none",
          animation: `confettiFall 2.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
          animationDelay: `${Math.random() * 0.3}s`,
          transform: `rotate(${p.rot}deg)`,
          "--vx": `${p.vx * 40}px`, "--vy": `${p.vy * 60}px`,
        }} />
      ))}
    </div>
  );
}

// ── Hexagonal Particles Background ────────────────────────────
function HexParticles({ theme }) {
  const particles = useMemo(() => Array.from({ length: 24 }, (_, i) => ({
    id: i, left: Math.random() * 100, top: Math.random() * 100,
    size: Math.random() * 12 + 6, delay: Math.random() * 10,
    duration: Math.random() * 8 + 8, opacity: Math.random() * 0.12 + 0.03,
  })), []);

  const gold = theme === "dark" ? "rgba(212,168,67," : "rgba(160,120,30,";
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: "absolute", left: `${p.left}%`, top: `${p.top}%`,
          width: p.size, height: p.size,
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          background: `${gold}${p.opacity})`,
          animation: `hexFloat ${p.duration}s ease-in-out ${p.delay}s infinite`,
        }} />
      ))}
    </div>
  );
}

// ── Animated Counter ──────────────────────────────────────────
function AnimCounter({ target, duration = 1200 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) { setVal(0); return; }
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(ease * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return <>{val}</>;
}

// ── Rank System ───────────────────────────────────────────────
const RANKS = [
  { name: "Beginner", pct: 0 }, { name: "Good Start", pct: 0.02 },
  { name: "Moving Up", pct: 0.05 }, { name: "Good", pct: 0.08 },
  { name: "Solid", pct: 0.15 }, { name: "Nice", pct: 0.25 },
  { name: "Great", pct: 0.40 }, { name: "Amazing", pct: 0.50 },
  { name: "Genius", pct: 0.70 }, { name: "Queen Bee", pct: 1.0 },
];

function RankBar({ points, maxPoints, theme }) {
  const pct = maxPoints > 0 ? points / maxPoints : 0;
  const currentRank = [...RANKS].reverse().find(r => pct >= r.pct) || RANKS[0];
  const nextRank = RANKS[RANKS.indexOf(currentRank) + 1];
  const isDark = theme === "dark";

  return (
    <div style={{
      marginBottom: 28, padding: "18px 22px",
      background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
      border: `1px solid ${isDark ? "rgba(212,168,67,0.12)" : "rgba(160,120,30,0.12)"}`,
      borderRadius: 12,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <span style={{
          fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600,
          color: isDark ? "#E8C564" : "#8B6914",
        }}>
          {currentRank.name}
        </span>
        {nextRank && (
          <span style={{
            fontFamily: "'Literata', serif", fontSize: 12,
            color: isDark ? "rgba(196,184,160,0.4)" : "rgba(100,80,40,0.4)",
          }}>
            {Math.round(nextRank.pct * maxPoints - points)} pts to {nextRank.name}
          </span>
        )}
      </div>
      <div style={{
        height: 6, borderRadius: 3, position: "relative",
        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
        overflow: "hidden",
      }}>
        {RANKS.slice(1).map((r, i) => (
          <div key={i} style={{
            position: "absolute", left: `${r.pct * 100}%`, top: 0, bottom: 0,
            width: 1, background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
          }} />
        ))}
        <div style={{
          height: "100%", borderRadius: 3,
          width: `${Math.min(pct * 100, 100)}%`,
          background: "linear-gradient(90deg, #B8922E, #E8C564, #F0D98C)",
          transition: "width 1.5s cubic-bezier(0.16, 1, 0.3, 1)",
          boxShadow: "0 0 12px rgba(212,168,67,0.4)",
        }} />
      </div>
    </div>
  );
}

// ── Honeycomb Display ─────────────────────────────────────────
function Honeycomb({ letters, centerIndex, onShuffle, shuffleAnim, compact, theme }) {
  const isDark = theme === "dark";
  const center = letters[centerIndex];
  const outer = letters.filter((_, i) => i !== centerIndex);
  const size = compact ? 46 : 64;
  const cSize = compact ? 56 : 76;
  const gap = compact ? 54 : 72;

  const hexPoints = (s) => Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    return `${s/2 + (s/2)*Math.cos(a)},${s/2 + (s/2)*Math.sin(a)}`;
  }).join(" ");

  const positions = [
    { x: 0, y: -gap }, { x: gap * 0.866, y: -gap / 2 },
    { x: gap * 0.866, y: gap / 2 }, { x: 0, y: gap },
    { x: -gap * 0.866, y: gap / 2 }, { x: -gap * 0.866, y: -gap / 2 },
  ];

  const HexCell = ({ letter, isCenter, pos }) => {
    const s = isCenter ? cSize : size;
    return (
      <div style={{
        position: "absolute",
        left: `calc(50% + ${pos?.x || 0}px)`, top: `calc(50% + ${pos?.y || 0}px)`,
        transform: `translate(-50%, -50%)`,
        transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}>
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: "block" }}>
          <polygon points={hexPoints(s)}
            fill={isCenter
              ? (isDark ? "#D4A843" : "#C49B2A")
              : (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)")}
            stroke={isCenter
              ? (isDark ? "#E8C564" : "#D4A843")
              : (isDark ? "rgba(212,168,67,0.25)" : "rgba(160,120,30,0.2)")}
            strokeWidth={isCenter ? 2 : 1}
            style={{ filter: isCenter ? `drop-shadow(0 0 ${compact ? 8 : 14}px rgba(212,168,67,0.3))` : "none" }}
          />
          <text x="50%" y="53%" dominantBaseline="middle" textAnchor="middle"
            fill={isCenter ? "#1A1410" : (isDark ? "#E8DCC8" : "#3A3020")}
            fontSize={isCenter ? (compact ? 20 : 28) : (compact ? 16 : 22)}
            fontFamily="'Cormorant Garamond', serif"
            fontWeight={isCenter ? 700 : 600}
          >{letter.toUpperCase()}</text>
        </svg>
      </div>
    );
  };

  return (
    <div style={{
      position: "relative",
      width: compact ? 160 : 220, height: compact ? 160 : 220,
      margin: "0 auto",
    }}>
      <HexCell letter={center} isCenter pos={{ x: 0, y: 0 }} />
      {outer.map((l, i) => <HexCell key={`${i}-${l}-${shuffleAnim}`} letter={l} pos={positions[i]} />)}
      {onShuffle && (
        <button onClick={onShuffle} title="Shuffle (S)" style={{
          position: "absolute", bottom: compact ? -32 : -42, left: "50%",
          transform: "translateX(-50%)", background: "none", border: "none",
          cursor: "pointer", padding: "6px 14px",
          fontFamily: "'Literata', serif", fontSize: 12,
          color: isDark ? "rgba(196,184,160,0.4)" : "rgba(80,60,20,0.4)",
          letterSpacing: "0.1em", textTransform: "uppercase", transition: "color 0.2s",
        }}
        onMouseEnter={e => e.target.style.color = isDark ? "#D4A843" : "#8B6914"}
        onMouseLeave={e => e.target.style.color = isDark ? "rgba(196,184,160,0.4)" : "rgba(80,60,20,0.4)"}
        >⟳ Shuffle</button>
      )}
    </div>
  );
}

// ── Definition Tooltip ────────────────────────────────────────
function WordWithTooltip({ word, isLongest, isPangram, index, theme, onCopy }) {
  const [def, setDef] = useState(null);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const isDark = theme === "dark";
  const timerRef = useRef(null);

  const fetchDef = async () => {
    if (def !== null) return;
    setLoading(true);
    try {
      const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      if (r.ok) {
        const data = await r.json();
        const meaning = data[0]?.meanings?.[0];
        setDef(meaning ? `(${meaning.partOfSpeech}) ${meaning.definitions[0]?.definition}` : "No definition found");
      } else { setDef("No definition found"); }
    } catch { setDef("Offline"); }
    setLoading(false);
  };

  const handleEnter = () => { timerRef.current = setTimeout(() => { setShow(true); fetchDef(); }, 400); };
  const handleLeave = () => { clearTimeout(timerRef.current); setShow(false); };

  const bg = isPangram
    ? (isDark ? "linear-gradient(135deg, rgba(212,168,67,0.25), rgba(180,140,40,0.12))" : "linear-gradient(135deg, rgba(212,168,67,0.2), rgba(180,140,40,0.08))")
    : isLongest
    ? (isDark ? "linear-gradient(135deg, rgba(212,168,67,0.15), rgba(232,197,100,0.06))" : "linear-gradient(135deg, rgba(212,168,67,0.12), rgba(232,197,100,0.04))")
    : (isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)");

  const border = isPangram ? (isDark ? "rgba(212,168,67,0.45)" : "rgba(160,120,30,0.35)")
    : isLongest ? (isDark ? "rgba(212,168,67,0.3)" : "rgba(160,120,30,0.2)")
    : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)");

  return (
    <div onMouseEnter={handleEnter} onMouseLeave={handleLeave}
      onClick={() => { navigator.clipboard?.writeText(word); AudioEngine.copy(); onCopy?.(word); }}
      style={{
        position: "relative", display: "inline-flex", alignItems: "center", gap: 6,
        padding: "7px 14px", background: bg, border: `1px solid ${border}`,
        borderRadius: 7, cursor: "pointer",
        animation: `cardReveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.018}s both`,
        transition: "all 0.2s ease",
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: isPangram ? 17 : isLongest ? 16 : 15,
        fontWeight: isPangram || isLongest ? 700 : 500,
        color: isPangram || isLongest ? (isDark ? "#E8C564" : "#8B6914") : (isDark ? "#C4B8A0" : "#5A4A2A"),
        letterSpacing: "0.04em", textTransform: "uppercase",
      }}>
      {isPangram && <span style={{ fontSize: 11 }}>✦</span>}
      {isLongest && !isPangram && <span style={{ fontSize: 11, opacity: 0.7 }}>★</span>}
      {word}
      <span style={{ fontSize: 10, opacity: 0.35, fontFamily: "'Literata', serif", fontWeight: 400, marginLeft: 2 }}>{word.length}</span>

      {show && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: "50%",
          transform: "translateX(-50%)", minWidth: 220, maxWidth: 300, padding: "10px 14px",
          background: isDark ? "#252017" : "#FFFDF5",
          border: `1px solid ${isDark ? "rgba(212,168,67,0.2)" : "rgba(160,120,30,0.15)"}`,
          borderRadius: 8, zIndex: 100,
          boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.6)" : "0 8px 32px rgba(0,0,0,0.12)",
          fontFamily: "'Literata', serif", fontSize: 13, fontWeight: 400,
          color: isDark ? "#C4B8A0" : "#5A4A2A",
          textTransform: "none", letterSpacing: 0, lineHeight: 1.5,
          animation: "fadeUp 0.2s ease both",
        }}>
          {loading ? "Loading…" : def}
          <div style={{
            position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%) rotate(45deg)",
            width: 10, height: 10, background: isDark ? "#252017" : "#FFFDF5",
            borderRight: `1px solid ${isDark ? "rgba(212,168,67,0.2)" : "rgba(160,120,30,0.15)"}`,
            borderBottom: `1px solid ${isDark ? "rgba(212,168,67,0.2)" : "rgba(160,120,30,0.15)"}`,
          }} />
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  MAIN APPLICATION
// ══════════════════════════════════════════════════════════════
export default function SpellingBeeSolver() {
  const [letters, setLetters] = useState(["","","","","","",""]);
  const [centerIndex, setCenterIndex] = useState(0);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState("dark");
  const [shuffleAnim, setShuffleAnim] = useState(false);
  const [filter, setFilter] = useState("");
  const [filterLetter, setFilterLetter] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [revealedHints, setRevealedHints] = useState(0);
  const [hintMode, setHintMode] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [copiedWord, setCopiedWord] = useState(null);
  const [discoveredWords, setDiscoveredWords] = useState([]);
  const [loadProgress, setLoadProgress] = useState(0);
  const inputRefs = useRef([]);

  const isDark = theme === "dark";
  const allFilled = letters.every(l => /^[a-zA-Z]$/.test(l));
  const uniqueLetters = useMemo(() => [...new Set(letters.filter(l => l))], [letters]);

  // ── Persistence (localStorage) ──────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem("bee-state");
      if (saved) {
        const s = JSON.parse(saved);
        if (s.letters) setLetters(s.letters);
        if (typeof s.centerIndex === "number") setCenterIndex(s.centerIndex);
        if (s.results) setResults(s.results);
        if (s.theme) setTheme(s.theme);
        if (s.results) {
          const groups = {};
          s.results.words.forEach(w => { groups[w.length] = true; });
          setExpandedGroups(groups);
        }
      }
    } catch {}
  }, []);

  const persist = useCallback((overrides = {}) => {
    try {
      localStorage.setItem("bee-state", JSON.stringify({
        letters, centerIndex, results, theme, ...overrides,
      }));
    } catch {}
  }, [letters, centerIndex, results, theme]);

  useEffect(() => { if (allFilled || results) persist(); }, [letters, centerIndex, results, theme]);

  // ── Paste support ─────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const text = (e.clipboardData || window.clipboardData)?.getData("text")?.replace(/[^a-zA-Z]/g, "");
      if (text && text.length >= 7 && document.activeElement?.classList?.contains("bee-input")) {
        e.preventDefault();
        setLetters(text.slice(0, 7).toLowerCase().split(""));
        AudioEngine.keyClick();
      }
    };
    document.addEventListener("paste", handler);
    return () => document.removeEventListener("paste", handler);
  }, []);

  // ── Keyboard navigation ───────────────────────────────────
  const solveRef = useRef(null);
  const shuffleRef = useRef(null);
  const resetRef = useRef(null);
  const themeRef = useRef(null);
  const hintRef = useRef(null);

  solveRef.current = useCallback(() => {
    if (allFilled && !loading) solve();
  }, [allFilled, loading]);

  useEffect(() => {
    const handler = (e) => {
      const tag = e.target.tagName;
      const isInput = tag === "INPUT" && !e.target.classList.contains("filter-input");
      if (isInput) return;
      if (tag === "INPUT") return; // don't intercept filter input either for single keys

      if (e.key === "Enter" && allFilled && !loading) { e.preventDefault(); solveRef.current?.(); }
      if (e.key === "Escape") resetRef.current?.();
      if ((e.key === "s" || e.key === "S") && !e.ctrlKey && !e.metaKey && allFilled) shuffleRef.current?.();
      if ((e.key === "t" || e.key === "T") && !e.ctrlKey && !e.metaKey) themeRef.current?.();
      if ((e.key === "h" || e.key === "H") && !e.ctrlKey && !e.metaKey) hintRef.current?.();
      if (e.key >= "1" && e.key <= "7" && allFilled) setCenterIndex(parseInt(e.key) - 1);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [allFilled, loading]);

  // ── Letter Input ──────────────────────────────────────────
  const handleLetterChange = (index, value) => {
    const char = value.replace(/[^a-zA-Z]/g, "").slice(-1).toLowerCase();
    const nl = [...letters]; nl[index] = char; setLetters(nl);
    if (char) { AudioEngine.keyClick(); if (index < 6) inputRefs.current[index + 1]?.focus(); }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !letters[index] && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === "Enter" && allFilled && !loading) solve();
    if (e.key === "ArrowLeft" && index > 0) { e.preventDefault(); inputRefs.current[index - 1]?.focus(); }
    if (e.key === "ArrowRight" && index < 6) { e.preventDefault(); inputRefs.current[index + 1]?.focus(); }
  };

  // ── Shuffle ───────────────────────────────────────────────
  const shuffleLetters = useCallback(() => {
    AudioEngine.shuffle();
    setShuffleAnim(s => !s);
    const outer = letters.filter((_, i) => i !== centerIndex);
    for (let i = outer.length - 1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [outer[i],outer[j]]=[outer[j],outer[i]]; }
    const nl = []; let oi = 0;
    for (let i = 0; i < 7; i++) nl.push(i === centerIndex ? letters[centerIndex] : outer[oi++]);
    setLetters(nl);
  }, [letters, centerIndex]);
  shuffleRef.current = shuffleLetters;

  // ── Theme ─────────────────────────────────────────────────
  const toggleTheme = useCallback(() => {
    setTheme(t => { const n = t === "dark" ? "light" : "dark"; return n; });
  }, []);
  themeRef.current = toggleTheme;

  // ── Hint ──────────────────────────────────────────────────
  const revealHint = useCallback(() => {
    if (!results || !hintMode) return;
    const sorted = [...results.words].sort((a, b) => a.length - b.length);
    setRevealedHints(r => {
      if (r < sorted.length) {
        AudioEngine.hint();
        setDiscoveredWords(dw => [...dw, sorted[r]]);
        return r + 1;
      }
      return r;
    });
  }, [results, hintMode]);
  hintRef.current = revealHint;

  // ── Copy / Share ──────────────────────────────────────────
  const copyAll = () => {
    if (!results) return;
    navigator.clipboard?.writeText(results.words.join("\n"));
    AudioEngine.copy();
    setCopiedWord("ALL");
    setTimeout(() => setCopiedWord(null), 1500);
  };

  const shareResults = () => {
    if (!results) return;
    const maxPts = results.words.reduce((a, w) => a + (w.length === 4 ? 1 : w.length), 0);
    const pct = maxPts > 0 ? results.totalPoints / maxPts : 0;
    const rank = [...RANKS].reverse().find(r => pct >= r.pct)?.name || "Beginner";
    const text = `🐝 Lexicon Spelling Bee\n${results.words.length} words · ${results.pangrams.length} pangram${results.pangrams.length!==1?"s":""} · ${results.totalPoints} pts\nRank: ${rank}\n\n${letters.map((l,i) => i===centerIndex ? `[${l.toUpperCase()}]` : l.toUpperCase()).join(" ")}`;
    navigator.clipboard?.writeText(text);
    AudioEngine.copy();
    setCopiedWord("SHARED");
    setTimeout(() => setCopiedWord(null), 2000);
  };

  // ── Dictionary Cache ───────────────────────────────────────
  const dictRef = useRef(null);
  const loadDict = useCallback(async () => {
    if (dictRef.current) return dictRef.current;
    const res = await fetch(import.meta.env.BASE_URL + "words.txt");
    const text = await res.text();
    dictRef.current = text.split("\n").filter(w => w.length >= 4);
    return dictRef.current;
  }, []);

  // ── Solve (fully offline) ─────────────────────────────────
  const solve = useCallback(async () => {
    if (!allFilled || loading) return;
    setLoading(true); setError(""); setLoadProgress(0);
    setRevealedHints(0); setDiscoveredWords([]); setHintMode(false);
    setFilter(""); setFilterLetter(null);

    const cl = letters[centerIndex];
    const letterSet = new Set(letters);

    try {
      setLoadProgress(10);
      const dict = await loadDict();
      setLoadProgress(50);

      // Filter words: must contain center letter, only use allowed letters
      const valid = dict.filter(w => {
        if (!w.includes(cl)) return false;
        for (let i = 0; i < w.length; i++) {
          if (!letterSet.has(w[i])) return false;
        }
        return true;
      });

      setLoadProgress(80);

      const sorted = [...new Set(valid)].sort((a, b) => b.length - a.length);

      // Find pangrams — words that use all 7 unique letters
      const pangrams = sorted.filter(w => {
        const u = new Set(w);
        return letters.every(l => u.has(l));
      });

      const totalPts = sorted.reduce((a, w) => a + (w.length === 4 ? 1 : w.length), 0);

      setLoadProgress(100);

      const res = { words: sorted, pangrams, longest: sorted[0] || "", totalPoints: totalPts };
      setResults(res);
      persist({ results: res });

      const groups = {};
      sorted.forEach(w => { groups[w.length] = true; });
      setExpandedGroups(groups);

      AudioEngine.solve();
      if (pangrams.length > 0) {
        setTimeout(() => { AudioEngine.pangram(); setShowConfetti(true); setTimeout(() => setShowConfetti(false), 100); }, 600);
      }
    } catch (err) {
      AudioEngine.error();
      setError("Could not load dictionary. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  }, [letters, centerIndex, allFilled, loading, persist, loadDict]);

  // ── Reset ─────────────────────────────────────────────────
  const reset = useCallback(() => {
    setLetters(["","","","","","",""]); setCenterIndex(0);
    setResults(null); setError(""); setFilter("");
    setFilterLetter(null); setRevealedHints(0);
    setDiscoveredWords([]); setHintMode(false); setLoadProgress(0);
    try { localStorage.removeItem("bee-state"); } catch {}
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }, []);
  resetRef.current = reset;

  // ── Filtered + Grouped Results ────────────────────────────
  const displayWords = useMemo(() => {
    if (!results) return [];
    let words = hintMode ? discoveredWords : results.words;
    if (filter) words = words.filter(w => w.includes(filter.toLowerCase()));
    if (filterLetter) words = words.filter(w => w.startsWith(filterLetter));
    return words;
  }, [results, filter, filterLetter, hintMode, discoveredWords]);

  const groupedWords = useMemo(() => {
    const groups = {};
    displayWords.forEach(w => { if (!groups[w.length]) groups[w.length] = []; groups[w.length].push(w); });
    return Object.entries(groups).sort((a, b) => Number(b[0]) - Number(a[0]));
  }, [displayWords]);

  const handleCopy = (word) => { setCopiedWord(word); setTimeout(() => setCopiedWord(null), 1200); };

  // ── Theme Colors ──────────────────────────────────────────
  const C = useMemo(() => ({
    bg: isDark
      ? "linear-gradient(165deg, #0F0D0A 0%, #1A1610 30%, #141210 60%, #0D0B09 100%)"
      : "linear-gradient(165deg, #FFFCF4 0%, #FFF8E8 30%, #FFFDF5 60%, #FFF9EC 100%)",
    text: isDark ? "#E8DCC8" : "#3A3020",
    muted: isDark ? "rgba(196,184,160,0.5)" : "rgba(100,80,40,0.45)",
    dimmer: isDark ? "rgba(196,184,160,0.3)" : "rgba(100,80,40,0.25)",
    gold: isDark ? "#D4A843" : "#8B6914",
    goldBright: isDark ? "#E8C564" : "#B8922E",
    cardBg: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)",
    cardBorder: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
    inputBg: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.025)",
    inputBorder: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    line: isDark ? "rgba(212,168,67,0.15)" : "rgba(160,120,30,0.12)",
    panelBg: isDark ? "#151210" : "#FFFCF4",
  }), [isDark]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Literata:opsz,wght@7..72,300;7..72,400;7..72,500;7..72,600&display=swap');
        @keyframes hexFloat { 0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.08; } 50% { transform: translateY(-25px) rotate(30deg); opacity: 0.18; } }
        @keyframes cardReveal { from { opacity: 0; transform: translateY(8px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 20px rgba(212,168,67,0.08); } 50% { box-shadow: 0 0 40px rgba(212,168,67,0.2); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes confettiFall {
          0% { transform: translate(0,0) rotate(0deg); opacity: 1; }
          100% { transform: translate(var(--vx, 20px), 400px) rotate(720deg); opacity: 0; }
        }
        @keyframes progressPulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        @keyframes pangramShine {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .bee-input:focus { outline: none; border-color: ${C.gold} !important; box-shadow: 0 0 0 3px ${isDark ? "rgba(212,168,67,0.12)" : "rgba(160,120,30,0.1)"}; }
        .bee-input::placeholder { color: ${C.dimmer}; }
        .filter-input:focus { outline: none; border-color: ${C.gold} !important; }
        .filter-input::placeholder { color: ${C.dimmer}; }
        .solve-btn { position: relative; overflow: hidden; transition: all 0.3s ease; }
        .solve-btn::before { content: ''; position: absolute; top: 0; left: -100%; width: 200%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); animation: shimmer 3s ease-in-out infinite; }
        .solve-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(212,168,67,0.25); }
        .tool-btn { transition: all 0.2s; }
        .tool-btn:hover { border-color: ${C.gold} !important; color: ${C.goldBright} !important; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${isDark ? "rgba(212,168,67,0.15)" : "rgba(160,120,30,0.12)"}; border-radius: 3px; }
        * { box-sizing: border-box; }
      `}</style>

      <Confetti active={showConfetti} />

      <div style={{
        minHeight: "100vh", background: C.bg, color: C.text,
        fontFamily: "'Literata', serif", position: "relative", overflow: "hidden",
        transition: "background 0.5s ease, color 0.5s ease",
      }}>
        <HexParticles theme={theme} />

        {/* Top gold line */}
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 1, zIndex: 10, background: `linear-gradient(90deg, transparent, ${C.gold}44, transparent)` }} />

        {/* Theme toggle + hints */}
        <div style={{ position: "fixed", top: 14, right: 16, zIndex: 20, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 9, color: C.dimmer, fontFamily: "'Literata', serif", letterSpacing: "0.06em" }}>
            S shuffle · T theme · Esc reset · 1-7 center
          </span>
          <button onClick={toggleTheme} title="Toggle theme (T)" style={{
            width: 34, height: 34, borderRadius: 8,
            background: C.cardBg, border: `1px solid ${C.cardBorder}`,
            color: C.muted, cursor: "pointer", fontSize: 15,
            display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s",
          }}>{isDark ? "☀" : "☾"}</button>
        </div>

        <div style={{ position: "relative", zIndex: 1, maxWidth: 740, margin: "0 auto", padding: "48px 24px 80px" }}>

          {/* ── Header ───────────────────────────────────── */}
          <div style={{ textAlign: "center", marginBottom: 44, animation: "fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
              <div style={{ width: 44, height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}88)` }} />
              <span style={{ fontFamily: "'Literata', serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", color: C.gold }}>Lexicon</span>
              <div style={{ width: 44, height: 1, background: `linear-gradient(90deg, ${C.gold}88, transparent)` }} />
            </div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 52, fontWeight: 300, letterSpacing: "-0.01em", lineHeight: 1.05, margin: 0, color: isDark ? "#F0E8D8" : "#2A2010" }}>
              Spelling Bee
              <span style={{ display: "block", fontSize: 17, fontWeight: 600, fontStyle: "italic", color: C.goldBright, letterSpacing: "0.1em", marginTop: 4 }}>Solver</span>
            </h1>
            <p style={{ fontFamily: "'Literata', serif", fontSize: 13, color: C.muted, marginTop: 14, letterSpacing: "0.015em", lineHeight: 1.6 }}>
              Seven letters. One center. Every word revealed.
            </p>
          </div>

          {/* ── Input Panel ──────────────────────────────── */}
          <div style={{ animation: "fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both" }}>
            <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: "30px 26px", backdropFilter: "blur(20px)" }}>

              <div style={{ marginBottom: 22 }}>
                <label style={{ display: "block", fontFamily: "'Literata', serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: C.muted, marginBottom: 10 }}>
                  Seven Letters <span style={{ opacity: 0.5, fontWeight: 400 }}>(paste 7 letters to auto-fill)</span>
                </label>
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                  {letters.map((letter, i) => (
                    <div key={i} style={{ position: "relative" }}>
                      <input
                        ref={el => inputRefs.current[i] = el}
                        type="text" value={letter.toUpperCase()}
                        onChange={e => handleLetterChange(i, e.target.value)}
                        onKeyDown={e => handleKeyDown(i, e)}
                        maxLength={2} className="bee-input"
                        style={{
                          width: 52, height: 60, textAlign: "center",
                          fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600,
                          background: i === centerIndex ? (isDark ? "rgba(212,168,67,0.1)" : "rgba(212,168,67,0.08)") : C.inputBg,
                          border: i === centerIndex ? `1.5px solid ${isDark ? "rgba(212,168,67,0.45)" : "rgba(160,120,30,0.35)"}` : `1px solid ${C.inputBorder}`,
                          borderRadius: 10, color: i === centerIndex ? C.goldBright : C.text, transition: "all 0.2s ease",
                        }}
                        placeholder="·"
                      />
                      {i === centerIndex && (
                        <div style={{
                          position: "absolute", top: -7, left: "50%", transform: "translateX(-50%)",
                          fontSize: 8, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
                          color: C.gold, background: C.panelBg, padding: "0 6px",
                          fontFamily: "'Literata', serif", whiteSpace: "nowrap",
                        }}>CENTER</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 26 }}>
                <label style={{ display: "block", fontFamily: "'Literata', serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: C.muted, marginBottom: 10 }}>
                  Center Letter <span style={{ opacity: 0.5, fontWeight: 400 }}>(or press 1–7)</span>
                </label>
                <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                  {letters.map((letter, i) => (
                    <button key={i} onClick={() => setCenterIndex(i)} style={{
                      width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 600,
                      background: i === centerIndex ? `linear-gradient(135deg, ${isDark ? "#D4A843" : "#C49B2A"}, ${isDark ? "#B8922E" : "#A07A1A"})` : C.inputBg,
                      border: i === centerIndex ? "none" : `1px solid ${C.inputBorder}`,
                      borderRadius: 8, cursor: "pointer", color: i === centerIndex ? "#1A1410" : C.muted, transition: "all 0.2s",
                    }}>{letter ? letter.toUpperCase() : (i + 1)}</button>
                  ))}
                </div>
              </div>

              <button onClick={solve} disabled={!allFilled || loading} className="solve-btn" style={{
                width: "100%", padding: "16px 32px",
                fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 600,
                letterSpacing: "0.14em", textTransform: "uppercase",
                background: allFilled && !loading ? `linear-gradient(135deg, ${isDark ? "#D4A843" : "#C49B2A"}, ${isDark ? "#B8922E" : "#A07A1A"})` : C.inputBg,
                color: allFilled && !loading ? "#1A1410" : C.dimmer,
                border: "none", borderRadius: 10, cursor: allFilled && !loading ? "pointer" : "not-allowed",
              }}>
                {loading ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 16, height: 16, border: "2px solid rgba(26,20,16,0.15)", borderTopColor: "#1A1410", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                    Discovering Words…
                  </span>
                ) : "Solve"}
              </button>

              {loading && (
                <div style={{ marginTop: 14, height: 3, borderRadius: 2, background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 2, width: `${loadProgress}%`,
                    background: "linear-gradient(90deg, #B8922E, #E8C564)",
                    transition: "width 0.3s ease", animation: "progressPulse 1.5s ease-in-out infinite",
                  }} />
                </div>
              )}

              {error && <p style={{ textAlign: "center", color: "#C47A5A", fontSize: 13, marginTop: 12 }}>{error}</p>}
            </div>
          </div>

          {/* ── Honeycomb (persists into results) ────────── */}
          {allFilled && (
            <div style={{ margin: results ? "28px 0 0" : "36px 0", animation: "fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both" }}>
              <Honeycomb letters={letters} centerIndex={centerIndex} onShuffle={shuffleLetters}
                shuffleAnim={shuffleAnim} compact={!!results} theme={theme} />
            </div>
          )}

          {/* ── Results ──────────────────────────────────── */}
          {results && (
            <div style={{ marginTop: 36, animation: "fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both" }}>

              <RankBar points={results.totalPoints}
                maxPoints={results.words.reduce((a, w) => a + (w.length === 4 ? 1 : w.length), 0)}
                theme={theme} />

              {/* Stats */}
              <div style={{
                display: "flex", justifyContent: "center", gap: 28, marginBottom: 28, padding: "18px 0",
                borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`,
              }}>
                {[
                  { label: "Words", value: results.words.length },
                  { label: "Pangrams", value: results.pangrams.length },
                  { label: "Points", value: results.totalPoints },
                  { label: "Longest", value: results.longest.length, suffix: " ltr" },
                ].map((stat, i) => (
                  <div key={i} style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 300, color: C.goldBright, lineHeight: 1 }}>
                      <AnimCounter target={stat.value} />{stat.suffix || ""}
                    </div>
                    <div style={{ fontFamily: "'Literata', serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: C.dimmer, marginTop: 6 }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Toolbar */}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 22 }}>
                <input type="text" value={filter} onChange={e => { setFilter(e.target.value); setFilterLetter(null); }}
                  placeholder="Filter words…" className="filter-input"
                  style={{
                    flex: 1, minWidth: 130, padding: "8px 14px",
                    fontFamily: "'Literata', serif", fontSize: 13,
                    background: C.inputBg, border: `1px solid ${C.inputBorder}`,
                    borderRadius: 8, color: C.text, transition: "all 0.2s",
                  }}
                />
                <div style={{ display: "flex", gap: 3 }}>
                  {uniqueLetters.map(l => (
                    <button key={l} onClick={() => { setFilterLetter(filterLetter === l ? null : l); setFilter(""); }}
                      style={{
                        width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "'Cormorant Garamond', serif", fontSize: 14, fontWeight: 600,
                        background: filterLetter === l ? C.gold : C.inputBg,
                        color: filterLetter === l ? "#1A1410" : C.muted,
                        border: `1px solid ${filterLetter === l ? C.gold : C.inputBorder}`,
                        borderRadius: 6, cursor: "pointer", transition: "all 0.15s", textTransform: "uppercase",
                      }}>{l}</button>
                  ))}
                </div>
                {[
                  { label: hintMode ? "Show All" : "Hints", action: () => setHintMode(!hintMode), icon: hintMode ? "◉" : "◎" },
                  ...(hintMode ? [{ label: "Reveal (H)", action: revealHint, icon: "+" }] : []),
                  { label: "Copy All", action: copyAll, icon: "⎘" },
                  { label: "Share", action: shareResults, icon: "↗" },
                ].map((btn, i) => (
                  <button key={i} onClick={btn.action} className="tool-btn" style={{
                    padding: "6px 12px", display: "flex", alignItems: "center", gap: 4,
                    fontFamily: "'Literata', serif", fontSize: 11, fontWeight: 500,
                    background: C.inputBg, border: `1px solid ${C.inputBorder}`,
                    borderRadius: 7, color: C.muted, cursor: "pointer", whiteSpace: "nowrap",
                  }}>{btn.icon} {btn.label}</button>
                ))}
              </div>

              {/* Copied toast */}
              {copiedWord && (
                <div style={{
                  position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
                  padding: "10px 24px", borderRadius: 10, zIndex: 100,
                  background: isDark ? "#252017" : "#FFFDF5",
                  border: `1px solid ${C.gold}44`,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                  fontFamily: "'Literata', serif", fontSize: 13, color: C.goldBright,
                  animation: "fadeUp 0.25s ease both",
                }}>
                  {copiedWord === "ALL" ? "All words copied!" : copiedWord === "SHARED" ? "Results copied to clipboard!" : `"${copiedWord}" copied!`}
                </div>
              )}

              {/* Longest Word */}
              {results.longest && !hintMode && (
                <div style={{
                  textAlign: "center", marginBottom: 28, padding: "22px",
                  background: `linear-gradient(135deg, ${isDark ? "rgba(212,168,67,0.08)" : "rgba(212,168,67,0.06)"}, ${isDark ? "rgba(212,168,67,0.02)" : "rgba(212,168,67,0.01)"})`,
                  border: `1px solid ${isDark ? "rgba(212,168,67,0.15)" : "rgba(160,120,30,0.1)"}`,
                  borderRadius: 14, animation: "pulseGlow 3s ease-in-out infinite",
                }}>
                  <div style={{ fontFamily: "'Literata', serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: `${C.gold}99`, marginBottom: 8 }}>★ Longest Word</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 40, fontWeight: 300, color: C.goldBright, letterSpacing: "0.1em", textTransform: "uppercase" }}>{results.longest}</div>
                </div>
              )}

              {/* Pangrams */}
              {results.pangrams.length > 0 && !hintMode && (
                <div style={{ marginBottom: 26 }}>
                  <h3 style={{ fontFamily: "'Literata', serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: `${C.gold}99`, marginBottom: 12 }}>✦ Pangrams — all 7 letters</h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {results.pangrams.map((word, i) => (
                      <WordWithTooltip key={word} word={word} isPangram isLongest={false} index={i} theme={theme} onCopy={handleCopy} />
                    ))}
                  </div>
                </div>
              )}

              {/* Grouped Words */}
              {groupedWords.map(([len, words]) => (
                <div key={len} style={{ marginBottom: 12 }}>
                  <button onClick={() => setExpandedGroups(g => ({ ...g, [len]: !g[len] }))}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, width: "100%",
                      padding: "8px 0", background: "none", border: "none", textAlign: "left", cursor: "pointer",
                      fontFamily: "'Literata', serif", fontSize: 11, fontWeight: 600,
                      letterSpacing: "0.12em", textTransform: "uppercase", color: C.muted,
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = C.goldBright}
                    onMouseLeave={e => e.currentTarget.style.color = C.muted}
                  >
                    <span style={{ display: "inline-block", transition: "transform 0.2s", transform: expandedGroups[len] ? "rotate(90deg)" : "rotate(0deg)", fontSize: 10 }}>▶</span>
                    {len}-letter words
                    <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.5 }}>({words.length})</span>
                    <div style={{ flex: 1, height: 1, marginLeft: 8, background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />
                  </button>
                  {expandedGroups[len] && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 7, paddingLeft: 18, paddingTop: 4, paddingBottom: 4 }}>
                      {words.map((word, i) => (
                        <WordWithTooltip key={word} word={word}
                          isLongest={word === results.longest}
                          isPangram={results.pangrams.includes(word)}
                          index={i} theme={theme} onCopy={handleCopy} />
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {displayWords.length === 0 && (
                <p style={{ textAlign: "center", color: C.dimmer, fontSize: 14, padding: 20 }}>
                  {hintMode ? "Press \"Reveal\" or H to discover words one at a time." : "No words match your filter."}
                </p>
              )}

              {/* Reset */}
              <div style={{ textAlign: "center", marginTop: 32 }}>
                <button onClick={reset} className="tool-btn" style={{
                  padding: "12px 36px", fontFamily: "'Literata', serif", fontSize: 11,
                  fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase",
                  background: "none", border: `1px solid ${C.line}`, borderRadius: 8,
                  color: C.muted, cursor: "pointer",
                }}>New Puzzle</button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ textAlign: "center", marginTop: 56, paddingTop: 20, borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"}` }}>
            <p style={{ fontFamily: "'Literata', serif", fontSize: 11, color: C.dimmer, letterSpacing: "0.04em", lineHeight: 1.8 }}>
              Letters reusable · Min 4 letters · Center letter required · Hover for definitions · Click to copy
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
