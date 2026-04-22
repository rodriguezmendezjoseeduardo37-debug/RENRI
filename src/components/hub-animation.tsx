"use client";

/**
 * HubAnimation — Interactive animated Hub icon for the hero section.
 *
 * Each node represents a RENRI feature area. On hover:
 *   - The node scales up with a glow ripple
 *   - A label + mini-icon appears describing the feature
 *   - The connection line to that node brightens
 */

import { useEffect, useState } from "react";

const ACCENT = "#3A7D44";

type NodeId = "center" | "sat1" | "sat2" | "sat3" | null;

interface NodeInfo {
  label: string;
  desc: string;
  icon: string; // SVG path or emoji
  x: number;
  y: number;
  labelX: number;
  labelY: number;
  labelAnchor: "start" | "middle" | "end";
}

const NODES: Record<Exclude<NodeId, null>, NodeInfo> = {
  center: {
    label: "RENRI",
    desc: "Tu plataforma todo‑en‑uno",
    icon: "⚡",
    x: 100,
    y: 100,
    labelX: 100,
    labelY: 62,
    labelAnchor: "middle",
  },
  sat1: {
    label: "Citas & Turnos",
    desc: "Agenda y fila digital",
    icon: "📅",
    x: 172,
    y: 40,
    labelX: 172,
    labelY: 8,
    labelAnchor: "middle",
  },
  sat2: {
    label: "Pagos & Reportes",
    desc: "Cobra y analiza",
    icon: "💳",
    x: 28,
    y: 40,
    labelX: 28,
    labelY: 8,
    labelAnchor: "middle",
  },
  sat3: {
    label: "Inventario & Clientes",
    desc: "Productos y directorio",
    icon: "📦",
    x: 100,
    y: 172,
    labelX: 100,
    labelY: 200,
    labelAnchor: "middle",
  },
};

export function HubAnimation() {
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState<NodeId>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (id: NodeId) => hovered === id;

  return (
    <div
      className="hub-animation-wrapper"
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 560,
        aspectRatio: "1 / 1",
        margin: "0 auto",
        opacity: mounted ? 1 : 0,
        transition: "opacity 1.2s ease",
      }}
    >
      {/* Outer glow */}
      <div
        style={{
          position: "absolute",
          inset: "-15%",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${ACCENT}15 0%, transparent 65%)`,
          animation: "hubGlowPulse 6s ease-in-out infinite",
        }}
      />

      <svg
        viewBox="0 0 200 210"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%", display: "block", overflow: "visible" }}
      >
        <defs>
          {/* Gradient for connection lines */}
          <linearGradient id="lineGrad1" x1="100" y1="100" x2="172" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F4F2EE" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#F4F2EE" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id="lineGrad2" x1="100" y1="100" x2="28" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F4F2EE" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#F4F2EE" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id="lineGrad3" x1="100" y1="100" x2="100" y2="172" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F4F2EE" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#F4F2EE" stopOpacity="0.15" />
          </linearGradient>

          {/* Glow filter for accent */}
          <filter id="accentGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Soft glow filter for center hub */}
          <filter id="hubGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Hover ripple glow — larger, green-tinted */}
          <filter id="hoverGlow" x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Outer orbit rings ── */}
        <circle
          cx="100" cy="100" r="90"
          fill="none" stroke="#F4F2EE" strokeWidth="0.5"
          strokeDasharray="4 8" opacity="0.12"
          style={{ animation: "hubRotate 60s linear infinite" }}
        />
        <circle
          cx="100" cy="100" r="70"
          fill="none" stroke="#F4F2EE" strokeWidth="0.3"
          strokeDasharray="2 12" opacity="0.08"
          style={{ animation: "hubRotateReverse 45s linear infinite" }}
        />

        {/* ── Connection lines ── */}
        <line
          x1="100" y1="100" x2="172" y2="40"
          stroke={isActive("sat1") ? ACCENT : "url(#lineGrad1)"}
          strokeWidth={isActive("sat1") ? 3 : 2}
          strokeDasharray="120"
          opacity={isActive("sat1") ? 1 : undefined}
          style={{
            animation: "hubLineDraw 2s ease-out 0.3s both",
            transition: "stroke 0.4s, stroke-width 0.4s, opacity 0.4s",
          }}
        />
        <line
          x1="100" y1="100" x2="28" y2="40"
          stroke={isActive("sat2") ? ACCENT : "url(#lineGrad2)"}
          strokeWidth={isActive("sat2") ? 3 : 2}
          opacity={isActive("sat2") ? 1 : undefined}
          strokeDasharray="120"
          style={{
            animation: "hubLineDraw 2s ease-out 0.6s both",
            transition: "stroke 0.4s, stroke-width 0.4s, opacity 0.4s",
          }}
        />
        <line
          x1="100" y1="100" x2="100" y2="172"
          stroke={isActive("sat3") ? ACCENT : "url(#lineGrad3)"}
          strokeWidth={isActive("sat3") ? 3 : 2}
          opacity={isActive("sat3") ? 1 : undefined}
          strokeDasharray="120"
          style={{
            animation: "hubLineDraw 2s ease-out 0.9s both",
            transition: "stroke 0.4s, stroke-width 0.4s, opacity 0.4s",
          }}
        />

        {/* ── Data particles ── */}
        <circle r="2" fill={ACCENT} opacity="0.7">
          <animateMotion dur="3s" repeatCount="indefinite" begin="1.5s">
            <mpath href="#pathToSat1" />
          </animateMotion>
        </circle>
        <circle r="2" fill="#F4F2EE" opacity="0.4">
          <animateMotion dur="4s" repeatCount="indefinite" begin="2.5s">
            <mpath href="#pathToSat2" />
          </animateMotion>
        </circle>
        <circle r="1.5" fill={ACCENT} opacity="0.5">
          <animateMotion dur="3.5s" repeatCount="indefinite" begin="2s">
            <mpath href="#pathToSat3" />
          </animateMotion>
        </circle>

        {/* Hidden paths for animateMotion */}
        <path id="pathToSat1" d="M100,100 L172,40" fill="none" />
        <path id="pathToSat2" d="M100,100 L28,40" fill="none" />
        <path id="pathToSat3" d="M100,100 L100,172" fill="none" />

        {/* ══════════════════════════════════════════
            CENTER HUB — "RENRI"
            ══════════════════════════════════════════ */}
        <g
          onMouseEnter={() => setHovered("center")}
          onMouseLeave={() => setHovered(null)}
          style={{ cursor: "pointer" }}
        >
          {/* Invisible larger hit area */}
          <circle cx="100" cy="100" r="36" fill="transparent" />

          {/* Hover ripple */}
          {isActive("center") && (
            <circle
              cx="100" cy="100" r="38"
              fill="none" stroke={ACCENT} strokeWidth="2"
              opacity="0.5"
              style={{ animation: "hubRipple 1s ease-out forwards" }}
            />
          )}

          {/* Main hub circle */}
          <circle
            cx="100" cy="100"
            r={isActive("center") ? 28 : 24}
            fill="#F4F2EE"
            filter={isActive("center") ? "url(#hoverGlow)" : "url(#hubGlow)"}
            style={{
              animation: isActive("center") ? "none" : "hubCenterPulse 4s ease-in-out infinite",
              transition: "r 0.4s ease",
            }}
          />
          {/* Inner detail ring */}
          <circle
            cx="100" cy="100" r="18"
            fill="none" stroke="#0a0a0a" strokeWidth="2"
            opacity={isActive("center") ? 0.5 : 0.3}
            style={{ transition: "opacity 0.4s" }}
          />

          {/* Hover: Show RENRI text inside */}
          {isActive("center") && (
            <text
              x="100" y="104"
              textAnchor="middle"
              fill="#0E0E0E"
              fontSize="10"
              fontWeight="800"
              letterSpacing="2"
              style={{ animation: "hubFadeIn 0.3s ease-out" }}
            >
              R
            </text>
          )}
        </g>

        {/* ══════════════════════════════════════════
            SATELLITE 1 — "Citas & Turnos" (top-right)
            ══════════════════════════════════════════ */}
        <g
          onMouseEnter={() => setHovered("sat1")}
          onMouseLeave={() => setHovered(null)}
          style={{
            cursor: "pointer",
            animation: isActive("sat1") ? "none" : "hubSat1Float 6s ease-in-out infinite",
          }}
        >
          {/* Hit area */}
          <circle cx="172" cy="40" r="28" fill="transparent" />

          {/* Hover ripple */}
          {isActive("sat1") && (
            <circle
              cx="172" cy="40" r="28"
              fill="none" stroke={ACCENT} strokeWidth="1.5"
              opacity="0.6"
              style={{ animation: "hubRipple 1s ease-out forwards" }}
            />
          )}

          {/* Outer ring */}
          <circle
            cx="172" cy="40"
            r={isActive("sat1") ? 22 : 18}
            fill="none" stroke="#F4F2EE"
            strokeWidth={isActive("sat1") ? 4 : 3}
            opacity={isActive("sat1") ? 1 : 0.6}
            style={{ transition: "all 0.4s ease" }}
          />
          {/* Dashed orbit */}
          <circle
            cx="172" cy="40" r="18"
            fill="none" stroke="#F4F2EE" strokeWidth="1"
            strokeDasharray="3 6" opacity="0.2"
            style={{ animation: "hubRotate 8s linear infinite" }}
          />
          {/* Accent fill */}
          <circle
            cx="172" cy="40"
            r={isActive("sat1") ? 13 : 9}
            fill={ACCENT}
            filter="url(#accentGlow)"
            style={{
              animation: isActive("sat1") ? "none" : "hubAccentPulse 3s ease-in-out infinite",
              transition: "r 0.4s ease",
            }}
          />
          {/* Hover icon */}
          {isActive("sat1") && (
            <text
              x="172" y="44"
              textAnchor="middle"
              fontSize="12"
              style={{ animation: "hubFadeIn 0.3s ease-out" }}
            >
              📅
            </text>
          )}
        </g>

        {/* ══════════════════════════════════════════
            SATELLITE 2 — "Pagos & Reportes" (top-left)
            ══════════════════════════════════════════ */}
        <g
          onMouseEnter={() => setHovered("sat2")}
          onMouseLeave={() => setHovered(null)}
          style={{
            cursor: "pointer",
            animation: isActive("sat2") ? "none" : "hubSat2Float 7s ease-in-out infinite",
          }}
        >
          {/* Hit area */}
          <circle cx="28" cy="40" r="28" fill="transparent" />

          {/* Hover ripple */}
          {isActive("sat2") && (
            <circle
              cx="28" cy="40" r="28"
              fill="none" stroke={ACCENT} strokeWidth="1.5"
              opacity="0.6"
              style={{ animation: "hubRipple 1s ease-out forwards" }}
            />
          )}

          {/* Outer ring */}
          <circle
            cx="28" cy="40"
            r={isActive("sat2") ? 22 : 18}
            fill="none" stroke="#F4F2EE"
            strokeWidth={isActive("sat2") ? 4 : 3}
            opacity={isActive("sat2") ? 1 : 0.6}
            style={{ transition: "all 0.4s ease" }}
          />
          {/* Dashed orbit */}
          <circle
            cx="28" cy="40" r="18"
            fill="none" stroke="#F4F2EE" strokeWidth="1"
            strokeDasharray="3 6" opacity="0.2"
            style={{ animation: "hubRotateReverse 10s linear infinite" }}
          />
          {/* Inner dot */}
          <circle
            cx="28" cy="40"
            r={isActive("sat2") ? 13 : 4}
            fill={isActive("sat2") ? ACCENT : "#F4F2EE"}
            opacity={isActive("sat2") ? 1 : 0.4}
            filter={isActive("sat2") ? "url(#accentGlow)" : undefined}
            style={{ transition: "all 0.4s ease" }}
          />
          {/* Hover icon */}
          {isActive("sat2") && (
            <text
              x="28" y="44"
              textAnchor="middle"
              fontSize="12"
              style={{ animation: "hubFadeIn 0.3s ease-out" }}
            >
              💳
            </text>
          )}
        </g>

        {/* ══════════════════════════════════════════
            SATELLITE 3 — "Inventario & Clientes" (bottom)
            ══════════════════════════════════════════ */}
        <g
          onMouseEnter={() => setHovered("sat3")}
          onMouseLeave={() => setHovered(null)}
          style={{
            cursor: "pointer",
            animation: isActive("sat3") ? "none" : "hubSat3Float 5.5s ease-in-out infinite",
          }}
        >
          {/* Hit area */}
          <circle cx="100" cy="172" r="28" fill="transparent" />

          {/* Hover ripple */}
          {isActive("sat3") && (
            <circle
              cx="100" cy="172" r="28"
              fill="none" stroke={ACCENT} strokeWidth="1.5"
              opacity="0.6"
              style={{ animation: "hubRipple 1s ease-out forwards" }}
            />
          )}

          {/* Outer ring */}
          <circle
            cx="100" cy="172"
            r={isActive("sat3") ? 22 : 18}
            fill="none" stroke="#F4F2EE"
            strokeWidth={isActive("sat3") ? 4 : 3}
            opacity={isActive("sat3") ? 1 : 0.6}
            style={{ transition: "all 0.4s ease" }}
          />
          {/* Dashed orbit */}
          <circle
            cx="100" cy="172" r="18"
            fill="none" stroke="#F4F2EE" strokeWidth="1"
            strokeDasharray="3 6" opacity="0.2"
            style={{ animation: "hubRotate 12s linear infinite" }}
          />
          {/* Inner dot */}
          <circle
            cx="100" cy="172"
            r={isActive("sat3") ? 13 : 4}
            fill={isActive("sat3") ? ACCENT : "#F4F2EE"}
            opacity={isActive("sat3") ? 1 : 0.4}
            filter={isActive("sat3") ? "url(#accentGlow)" : undefined}
            style={{ transition: "all 0.4s ease" }}
          />
          {/* Hover icon */}
          {isActive("sat3") && (
            <text
              x="100" y="176"
              textAnchor="middle"
              fontSize="12"
              style={{ animation: "hubFadeIn 0.3s ease-out" }}
            >
              📦
            </text>
          )}
        </g>

        {/* ── Ambient particles ── */}
        <circle cx="140" cy="70" r="1" fill="#F4F2EE" opacity="0.15" style={{ animation: "hubParticleDrift1 8s ease-in-out infinite" }} />
        <circle cx="60" cy="70" r="1" fill="#F4F2EE" opacity="0.15" style={{ animation: "hubParticleDrift2 9s ease-in-out infinite" }} />
        <circle cx="100" cy="140" r="1" fill={ACCENT} opacity="0.2" style={{ animation: "hubParticleDrift3 7s ease-in-out infinite" }} />
        <circle cx="130" cy="130" r="0.8" fill="#F4F2EE" opacity="0.1" style={{ animation: "hubParticleDrift1 11s ease-in-out infinite" }} />
        <circle cx="70" cy="130" r="0.8" fill="#F4F2EE" opacity="0.1" style={{ animation: "hubParticleDrift2 10s ease-in-out infinite" }} />
      </svg>

      {/* ── Floating HTML labels (rendered outside SVG for crisp text) ── */}
      {hovered && hovered !== null && (
        <div
          style={{
            position: "absolute",
            left: `${(NODES[hovered].labelX / 200) * 100}%`,
            top: `${(NODES[hovered].labelY / 210) * 100}%`,
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            animation: "hubLabelSlideIn 0.35s ease-out both",
            zIndex: 10,
          }}
        >
          <div
            style={{
              background: "rgba(14,14,14,0.85)",
              backdropFilter: "blur(12px)",
              border: `1px solid ${ACCENT}44`,
              borderRadius: 12,
              padding: "10px 16px",
              textAlign: "center",
              whiteSpace: "nowrap",
              boxShadow: `0 4px 24px ${ACCENT}22, 0 0 0 1px rgba(244,242,238,0.06)`,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#F4F2EE", marginBottom: 2 }}>
              {NODES[hovered].icon} {NODES[hovered].label.toUpperCase()}
            </div>
            <div style={{ fontSize: 10, color: ACCENT, letterSpacing: 1, opacity: 0.9 }}>
              {NODES[hovered].desc}
            </div>
          </div>
        </div>
      )}

      {/* Inline keyframes */}
      <style>{`
        @keyframes hubCenterPulse {
          0%, 100% { r: 24; opacity: 1; }
          50% { r: 26; opacity: 0.85; }
        }
        @keyframes hubAccentPulse {
          0%, 100% { opacity: 0.8; r: 9; }
          50% { opacity: 1; r: 11; }
        }
        @keyframes hubGlowPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes hubRotate {
          from { transform-origin: center; transform: rotate(0deg); }
          to { transform-origin: center; transform: rotate(360deg); }
        }
        @keyframes hubRotateReverse {
          from { transform-origin: center; transform: rotate(360deg); }
          to { transform-origin: center; transform: rotate(0deg); }
        }
        @keyframes hubLineDraw {
          from { stroke-dashoffset: 120; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes hubSat1Float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(3px, -4px); }
        }
        @keyframes hubSat2Float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-3px, -3px); }
        }
        @keyframes hubSat3Float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(0, 4px); }
        }
        @keyframes hubRipple {
          0% { r: 18; opacity: 0.8; }
          100% { r: 36; opacity: 0; }
        }
        @keyframes hubFadeIn {
          from { opacity: 0; transform: scale(0.7); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes hubLabelSlideIn {
          from { opacity: 0; transform: translate(-50%, -50%) translateY(6px); }
          to { opacity: 1; transform: translate(-50%, -50%) translateY(0); }
        }
        @keyframes hubParticleDrift1 {
          0%, 100% { transform: translate(0, 0); opacity: 0.15; }
          33% { transform: translate(6px, -4px); opacity: 0.3; }
          66% { transform: translate(-2px, 3px); opacity: 0.1; }
        }
        @keyframes hubParticleDrift2 {
          0%, 100% { transform: translate(0, 0); opacity: 0.15; }
          33% { transform: translate(-5px, -3px); opacity: 0.25; }
          66% { transform: translate(3px, 4px); opacity: 0.1; }
        }
        @keyframes hubParticleDrift3 {
          0%, 100% { transform: translate(0, 0); opacity: 0.2; }
          50% { transform: translate(2px, 3px); opacity: 0.35; }
        }
      `}</style>
    </div>
  );
}
