import { useState } from "react";
import { Menu, X } from "lucide-react";
import { publicNav } from "@/config/brand";
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return <header className="academy-header"><div className="academy-shell header-inner">
    <a href="/" className="academy-logo" aria-label="Al Tarbiyah home"><span className="logo-icon">✦</span><span>Al Tarbiyah <small>ACADEMY</small></span></a>
    <nav className={open ? "header-nav is-open" : "header-nav"} aria-label="Main navigation">
      {publicNav.map(item => <a key={item.to} href={item.to} onClick={()=>setOpen(false)}>{item.label}</a>)}
      <a className="mobile-only" href="/login">Sign in</a>
    </nav>
    <div className="header-actions"><a className="header-login" href="/login">Sign in</a><a className="academy-button small" href="/surveys">Join the interest list <span>↗</span></a></div>
    <button type="button" className="menu-button" aria-label={open ? "Close menu" : "Open menu"} onClick={()=>setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
  </div></header>;
}
