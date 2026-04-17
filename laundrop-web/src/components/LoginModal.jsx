import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginModal({ isOpen, onClose, onLogin }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff", borderRadius: 16, padding: 32,
          width: "100%", maxWidth: 380, textAlign: "center"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontWeight: 700, marginBottom: 8 }}>Login Diperlukan</h2>
        <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 24 }}>
          Silakan login terlebih dahulu untuk melakukan pemesanan.
        </p>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "12px", borderRadius: 8,
              border: "1px solid #e5e7eb", background: "#fff",
              cursor: "pointer", fontWeight: 600, fontSize: 14
            }}
          >
            Batal
          </button>
          <button
            onClick={onLogin}
            style={{
              flex: 1, padding: "12px", borderRadius: 8,
              border: "none", background: "#1A7BF2",
              color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14
            }}
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}