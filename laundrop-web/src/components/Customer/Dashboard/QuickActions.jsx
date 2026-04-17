import { useNavigate } from "react-router-dom";
import { ShoppingBag, Clock } from "lucide-react";
import "./QuickActions.css";

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="quick-actions">
      <div className="qa-card qa-primary" onClick={() => navigate("/customer/order")}>
        <div className="qa-text">
          <span className="qa-label">Ready to wash?</span>
          <span className="qa-title">Order Now</span>
        </div>
        <div className="qa-icon">
          <ShoppingBag size={22} />
        </div>
      </div>

      <div className="qa-card qa-secondary" onClick={() => navigate("/customer/history")}>
        <div className="qa-text">
          <span className="qa-label">View progress</span>
          <span className="qa-title">Order History</span>
        </div>
        <div className="qa-icon qa-icon-outline">
          <Clock size={22} />
        </div>
      </div>
    </div>
  );
}