import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import './SeedDataPrompt.css';

export default function SeedDataPrompt() {
  const [loading, setLoading] = useState(false);

  const handleDemoClick = () => {
    setLoading(true);
    // Simulasi loading saja karena kamu belum mau pakai database
    setTimeout(() => {
      setLoading(false);
      alert("Mode Demo: Data dummy sudah ditampilkan di dashboard.");
    }, 1500);
  };

  return (
    <div className="seed-container">
      <div className="seed-icon-wrapper">
        <Sparkles className="seed-icon" />
      </div>
      <h3 className="seed-title">Selamat Datang di Laundrop</h3>
      <p className="seed-description">
        Dashboard saat ini menampilkan data simulasi. Gunakan mode ini untuk 
        mengeksplorasi semua fitur tampilan sebelum menghubungkan database asli.
      </p>
      <button 
        onClick={handleDemoClick} 
        disabled={loading} 
        className="seed-button"
      >
        {loading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
        Mulai Eksplorasi
      </button>
    </div>
  );
}