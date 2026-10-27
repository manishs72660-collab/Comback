import { useState } from "react";
import { ArrowRight, ArrowUpRight, Check, Palette, Play, Sparkles, Wifi, WifiOff, X } from "lucide-react";
import BrandLogo from "../components/BrandLogo";
import { PwaInstallButton, usePwa } from "../components/PwaProvider";
import { colorThemes, saveColorTheme, validTheme } from "../utils/themes";

const highlights = [
  { number: "01", title: "Make a little space", copy: "Routines shaped around your real life—not an ideal version of it." },
  { number: "02", title: "See what is working", copy: "Notice the small, steady progress that is easy to overlook." },
  { number: "03", title: "Bring your people in", copy: "Share encouragement and consistency, while your daily details stay yours." },
];

function PreviewCard() {
  return (
    <div className="landing-preview">
      <div className="preview-topline"><span>MONDAY, OCTOBER 26</span><span className="preview-live"><i /> YOUR DAY</span></div>
      <div className="preview-heading"><div><span className="eyebrow">A MOMENT FOR YOU</span><h2>Make today<br />count <em>gently.</em></h2></div><span className="preview-date">26<small>OCT</small></span></div>
      <div className="preview-progress"><div><span>Today's rhythm</span><strong>3 <small>of 5</small></strong></div><div className="preview-track"><i /></div><small>You're finding your pace. Keep going.</small></div>
      <div className="preview-list">
        <div><span className="preview-check done"><Check size={14} /></span><span><strong>A quiet morning</strong><small>Mindfulness · Morning</small></span><b>DONE</b></div>
        <div><span className="preview-check done"><Check size={14} /></span><span><strong>Move your body</strong><small>Movement · Afternoon</small></span><b>DONE</b></div>
        <div><span className="preview-check" /><span><strong>Read a few pages</strong><small>Learning · Evening</small></span><b>UP NEXT</b></div>
      </div>
      <div className="preview-quote"><span className="quote-mark">“</span><span>Small steps still move you forward.</span></div>
      <div className="preview-foot"><span><span className="preview-mini-avatar">M</span> Yours to shape</span><span>MADE FOR REAL LIFE</span></div>
    </div>
  );
}

function FloatingCards() {
  return (
    <div className="landing-floats" aria-hidden="true">
      <div className="landing-float-card float-balance">
        <span className="float-icon"><Sparkles size={15} /></span>
        <span><small>A LITTLE PROGRESS</small><strong>68% <i>this week</i></strong></span>
        <span className="float-sparkline"><i /><i /><i /><i /><i /><i /><i /></span>
      </div>
      <div className="landing-float-card float-quote">
        <span className="float-quote-mark">“</span>
        <span><strong>Keep showing up</strong><small>It adds up in ways you can't see yet.</small></span>
      </div>
    </div>
  );
}

export default function LandingPage({ onAuth }) {
  const { online } = usePwa();
  const [colorTheme, setColorTheme] = useState(() => {
    const savedTheme = window.localStorage.getItem("comeback-theme") || document.documentElement.dataset.theme;
    return validTheme(savedTheme) ? savedTheme : "orange";
  });
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const selectColorTheme = (theme) => {
    if (saveColorTheme(theme)) setColorTheme(theme);
  };

  return (
    <main className="landing-page">
      <nav className="landing-nav">
        <a className="landing-brand" href="#home" aria-label="Comeback home"><BrandLogo /></a>
        <div className="landing-links"><a href="#approach">Our approach</a><a href="#features">A gentler routine</a></div>
        <div className="landing-theme-control">
          <button className="landing-theme-trigger" type="button" aria-expanded={themePickerOpen} aria-controls="landing-theme-picker" onClick={() => setThemePickerOpen((open) => !open)}><Palette size={16} /><span>Colors</span></button>
          {themePickerOpen && <div className="landing-theme-picker" id="landing-theme-picker" aria-label="Choose a color theme">
            <div className="landing-theme-picker-heading"><strong>Choose a color</strong><button type="button" aria-label="Close color themes" onClick={() => setThemePickerOpen(false)}><X size={15} /></button></div>
            {colorThemes.map(({ id, label, color }) => <button type="button" key={id} className={`landing-theme-option ${colorTheme === id ? "selected" : ""}`} onClick={() => selectColorTheme(id)} aria-pressed={colorTheme === id}>
              <span className="landing-theme-swatch" style={{ "--swatch-color": color }}>{colorTheme === id && <Check size={12} />}</span><span>{label}</span>{colorTheme === id && <Check className="landing-theme-selected" size={15} />}
            </button>)}
          </div>}
        </div>
        <div className="landing-nav-actions"><button className="landing-login" onClick={() => onAuth("login")}>Log in</button><button className="button landing-cta" onClick={() => onAuth("register")}>Start your comeback <ArrowUpRight size={16} /></button></div>
        <button className="landing-mobile-menu" aria-label="Start your comeback" onClick={() => onAuth("register")}>Get started <ArrowUpRight size={15} /></button>
      </nav>

      <section className="landing-hero" id="home">
        <div className="landing-copy">
          <span className="landing-kicker"><i /> YOUR LIFE, AT YOUR PACE</span>
          <h1>Build days that<br />feel like <em>your own.</em></h1>
          <p className="landing-lede">A calmer place for the habits, plans and people that bring you back to what matters. No perfect streak required.</p>
          <div className="landing-actions"><button className="button landing-cta large" onClick={() => onAuth("register")}>Begin your comeback <ArrowRight size={17} /></button><a className="landing-watch" href="#approach"><span><Play size={12} fill="currentColor" /></span> A more human kind of progress</a></div>
          <div className="landing-proof"><span className="proof-rule" /><p><strong>Start small. Keep what works.</strong><br />Your progress belongs to you.</p></div>
        </div>
        <div className="landing-visual"><div className="visual-haze" /><div className="visual-caption caption-top"><span>YOUR SPACE</span><span className="caption-line" /></div><PreviewCard /><FloatingCards /><div className="visual-caption caption-bottom"><span>NO STREAKS TO PROVE.</span><span>JUST YOU, SHOWING UP.</span></div></div>
        <div className="landing-vertical-note">COME BACK TO WHAT MATTERS</div>
      </section>

      <section className="landing-manifesto" id="approach">
        <div className="manifesto-label"><span className="eyebrow">A DIFFERENT KIND OF PRODUCTIVITY</span><span className="manifesto-line" /></div>
        <div className="manifesto-content"><h2>Progress without<br />the pressure to be <em>perfect.</em></h2><div><p>Some days flow. Some days don't. Comeback helps you create a little structure, notice the effort you make, and begin again without judgement.</p><button className="manifesto-link" onClick={() => onAuth("register")}>Find your own rhythm <ArrowUpRight size={15} /></button></div></div>
      </section>

      <section className="landing-features" id="features">
        <div className="features-heading"><span className="eyebrow">THOUGHTFULLY MADE FOR EVERYDAY LIFE</span><h2>A softer way to<br /><em>show up for yourself.</em></h2></div>
        <div className="feature-grid">{highlights.map(({ number, title, copy }) => <article className="feature-item glass-feature" key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p><span className="feature-corner" aria-hidden="true">↗</span></article>)}</div>
      </section>
      <section className="landing-last-call"><span className="eyebrow">YOU CAN BEGIN RIGHT WHERE YOU ARE</span><h2>One small step is <em>enough.</em></h2><button className="button landing-cta large" onClick={() => onAuth("register")}>Make a fresh start <ArrowRight size={16} /></button></section>
      <footer className="landing-footer"><BrandLogo compact /><p>Come back to what matters.</p><span className={`pwa-network-status landing-network-status ${online ? "online" : "offline"}`} role="status">{online ? <Wifi size={13} /> : <WifiOff size={13} />}<span>{online ? "Online" : "Offline"}</span></span><PwaInstallButton className="landing-install-button" /><button onClick={() => onAuth("login")}>Already have an account? Log in <ArrowUpRight size={14} /></button></footer>
    </main>
  );
}
