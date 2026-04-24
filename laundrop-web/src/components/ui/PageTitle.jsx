import "./PageTitle.css";

export default function PageTitle({ title, subtitle }) {
  return (
    <div className="page-title-wrap">
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
    </div>
  );
}