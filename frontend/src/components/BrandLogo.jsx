import logo from "../public/logo.png";

export default function BrandLogo({ compact = false }) {
  return (
    <span className={`brand-lockup ${compact ? "compact" : ""}`}>
      <span className="brand-image-crop"><img src={logo} alt="Comeback" /></span>
      {!compact && <span className="brand-word">COMEBACK<span>YOUR DAILY RHYTHM</span></span>}
    </span>
  );
}
