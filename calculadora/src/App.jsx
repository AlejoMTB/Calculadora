import { useState, useEffect, useRef } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .calc-root {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #000;
    font-family: 'Inter', sans-serif;
    position: relative;
    overflow: hidden;
  }

  /* ── Lluvia de binarios ── */
  .matrix-bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }

  .matrix-col {
    position: absolute;
    top: -100%;
    font-family: 'Inter', monospace;
    font-size: 12px;
    color: #fff;
    line-height: 1.5;
    white-space: pre;
    animation: fall linear infinite;
  }

  @keyframes fall {
    0%   { transform: translateY(0); }
    100% { transform: translateY(200vh); }
  }

  /* ── Tarjeta ── */
  .card {
    position: relative;
    z-index: 2;
    width: 300px;
    background: #111;
    border-radius: 16px;
    border: 1px solid #333;
    overflow: hidden;
    box-shadow: 0 4px 40px rgba(0,0,0,.6);
  }

  /* ── Display ── */
  .display {
    background: #1a1a1a;
    padding: 24px 20px 16px;
    text-align: right;
    border-bottom: 1px solid #2a2a2a;
  }

  .display-history {
    font-size: 13px;
    color: #555;
    min-height: 18px;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .display-current {
    font-size: 48px;
    font-weight: 300;
    color: #fcf8f8;
    line-height: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: font-size 0.1s;
  }

  .display-current.small  { font-size: 34px; }
  .display-current.xsmall { font-size: 24px; }

  /* ── Grid ── */
  .buttons-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1px;
    background: #222222;
  }

  /* ── Botones ── */
  .btn {
    height: 64px;
    border: none;
    font-family: 'Inter', sans-serif;
    font-size: 18px;
    font-weight: 400;
    cursor: pointer;
    background: #120f0f;
    color: #fcf9f9;
    transition: background 0.1s;
  }
  .btn:hover  { background: #1e1e1e; }
  .btn:active { background: #2a2a2a; }

  .btn-operator {
    background: #1a1a2e;
    color: #4d9fff;
    font-size: 20px;
  }
  .btn-operator:hover { background: #1e1e38; }
  .btn-operator.active {
    background: #2563eb;
    color: #fff;
  }

  .btn-clear {
    color: #ff4444;
    font-size: 14px;
    font-weight: 500;
  }
  .btn-clear:hover { background: #1a0000; }

  .btn-util {
    color: #666;
    font-size: 16px;
  }
  .btn-util:hover { color: #aaa; }

  .btn-equals {
    grid-column: span 2;
    background: #2563eb;
    color: #fff;
    font-size: 22px;
  }
  .btn-equals:hover { background: #1d4ed8; }

  .btn-zero {
    grid-column: span 2;
    text-align: left;
    padding-left: 24px;
  }
`;


function MatrixRain() {
  const ref = useRef(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const cols = Math.floor(window.innerWidth / 20);
    for (let i = 0; i < cols; i++) {
      const col = document.createElement("div");
      col.className = "matrix-col";
      col.style.left = `${i * 20}px`;
      col.style.animationDuration = `${7 + Math.random() * 10}s`;
      col.style.animationDelay = `${-Math.random() * 10}s`;
      col.style.opacity = 0.04 + Math.random() * 0.08;
      let txt = "";
      for (let j = 0; j < 60; j++) txt += (Math.random() > 0.5 ? "1" : "0") + "\n";
      col.textContent = txt;
      container.appendChild(col);
    }
    return () => { container.innerHTML = ""; };
  }, []);

  return <div className="matrix-bg" ref={ref} />;
}

// ── Componente Display ─────────────────────────────────────────────────────
function Display({ current, history }) {
  const len = current.length;
  const sizeClass = len > 11 ? "xsmall" : len > 7 ? "small" : "";
  return (
    <div className="display">
      <div className="display-history">{history || "\u00A0"}</div>
      <div className={`display-current ${sizeClass}`}>{current}</div>
    </div>
  );
}

// ── Componente Button ──────────────────────────────────────────────────────
function Button({ label, onClick, variant = "btn", className = "" }) {
  return (
    <button className={`btn ${variant} ${className}`} onClick={() => onClick(label)}>
      {label}
    </button>
  );
}

// ── Lógica ────────────────────────────────────────────────────────────────
const OPERATORS = ["+", "−", "×", "÷"];

function calculate(a, op, b) {
  const x = parseFloat(a), y = parseFloat(b);
  if (op === "+") return x + y;
  if (op === "−") return x - y;
  if (op === "×") return x * y;
  if (op === "÷") return y === 0 ? "Error" : x / y;
  return y;
}

function fmt(val) {
  if (val === "Error") return "Error";
  const n = parseFloat(val);
  if (!isFinite(n)) return "Error";
  return parseFloat(n.toPrecision(10)).toString();
}

// ── Calculadora principal ──────────────────────────────────────────────────
export default function Calculator() {
  const [current,     setCurrent]     = useState("0");
  const [prev,        setPrev]        = useState(null);
  const [operator,    setOperator]    = useState(null);
  const [history,     setHistory]     = useState("");
  const [waitingNext, setWaitingNext] = useState(false);

  function handleDigit(d) {
    if (current === "Error") { setCurrent(d); return; }
    if (waitingNext) { setCurrent(d === "." ? "0." : d); setWaitingNext(false); return; }
    if (d === ".") { if (!current.includes(".")) setCurrent(current + "."); return; }
    setCurrent(current === "0" ? d : current + d);
  }

  function handleOperator(op) {
    if (current === "Error") return;
    if (prev !== null && !waitingNext) {
      const r = fmt(calculate(prev, operator, current));
      if (r === "Error") { setCurrent("Error"); setHistory(""); setPrev(null); setOperator(null); return; }
      setPrev(r); setCurrent(r); setHistory(`${r} ${op}`);
    } else {
      setPrev(current); setHistory(`${current} ${op}`);
    }
    setOperator(op); setWaitingNext(true);
  }

  function handleEquals() {
    if (!operator || prev === null) return;
    const r = fmt(calculate(prev, operator, current));
    setHistory(`${prev} ${operator} ${current} =`);
    setCurrent(r); setPrev(null); setOperator(null); setWaitingNext(true);
  }

  function handleClear()   { setCurrent("0"); setPrev(null); setOperator(null); setHistory(""); setWaitingNext(false); }
  function handleSign()    { if (current !== "0" && current !== "Error") setCurrent(String(parseFloat(current) * -1)); }
  function handlePercent() { if (current !== "Error") setCurrent(String(parseFloat(current) / 100)); }

  function handleButton(label) {
    if ("0123456789.".includes(label)) return handleDigit(label);
    if (OPERATORS.includes(label))     return handleOperator(label);
    if (label === "=")   return handleEquals();
    if (label === "AC")  return handleClear();
    if (label === "+/-") return handleSign();
    if (label === "%")   return handlePercent();
  }

  const opVar = (op) =>
    `btn-operator${operator === op && waitingNext ? " active" : ""}`;

  return (
    <>
      <style>{styles}</style>
      <div className="calc-root">
        <MatrixRain />
        <div className="card">
          <Display current={current} history={history} />
          <div className="buttons-grid">
            <Button label="AC"  onClick={handleButton} variant="btn-clear" />
            <Button label="+/-" onClick={handleButton} variant="btn-util" />
            <Button label="%"   onClick={handleButton} variant="btn-util" />
            <Button label="÷"   onClick={handleButton} variant={opVar("÷")} />

            <Button label="7" onClick={handleButton} />
            <Button label="8" onClick={handleButton} />
            <Button label="9" onClick={handleButton} />
            <Button label="×" onClick={handleButton} variant={opVar("×")} />

            <Button label="4" onClick={handleButton} />
            <Button label="5" onClick={handleButton} />
            <Button label="6" onClick={handleButton} />
            <Button label="−" onClick={handleButton} variant={opVar("−")} />

            <Button label="1" onClick={handleButton} />
            <Button label="2" onClick={handleButton} />
            <Button label="3" onClick={handleButton} />
            <Button label="+" onClick={handleButton} variant={opVar("+")} />

            <Button label="0" onClick={handleButton} variant="btn-zero" className="btn-zero" />
            <Button label="." onClick={handleButton} />
            <Button label="=" onClick={handleButton} variant="btn-equals" className="btn-equals" />
          </div>
        </div>
      </div>
    </>
  );
}