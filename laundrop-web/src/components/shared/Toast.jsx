import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { createPortal } from 'react-dom';
import './Toast.css';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle size={18} />;
      case 'danger':
        return <AlertCircle size={18} />;
      case 'warning':
        return <AlertTriangle size={18} />;
      case 'info':
        return <Info size={18} />;
      default:
        return <Info size={18} />;
    }
  };

  return createPortal(
    <div className={`toast ${toast.type}`}>
      {getIcon()}
      <span>{toast.msg}</span>
      <button className="toast-close" onClick={onClose}>
        <X size={14} />
      </button>
    </div>,
    document.body
  );
}