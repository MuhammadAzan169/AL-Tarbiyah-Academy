import { useEffect, useState } from "react";
import { ArrowRight, LogOut, ShieldCheck } from "lucide-react";
import { supabase, type Role } from "@/lib/academy";
import { AdminWorkspace } from "./workspace";
import { SchoolWorkspace } from "./school-workspace";
import { DemoWorkspace } from "./demo-workspace";
import { defaultSection, portalLinks, type PortalRole } from "./school-nav";
import { useConfirm } from "@/features/academy/confirm";

type Profile = { id: string; full_name: string; role: Role };
const operations = new Set([
  "overview",
  "forms",
  "families",
  "influencers",
  "enrollments",
  "payments",
  "teachers",
  "accounts",
]);
export function PortalPage({ role, section }: { role: PortalRole; section?: string | undefined }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "denied" | "demo">("loading");
  const current =
    section && portalLinks[role].some((item) => item.id === section)
      ? section
      : defaultSection(role);
  useEffect(() => {
    let active = true;
    setState("loading");
    if (sessionStorage.getItem("noor-demo-role") === role) {
      setState("demo");
      return;
    }
    if (!supabase) {
      setState("denied");
      return;
    }
    supabase.auth.getUser().then(async ({ data }) => {
      if (!active) return;
      if (!data.user) {
        setState("denied");
        return;
      }
      const { data: found } = await supabase!
        .from("profiles")
        .select("id,full_name,role")
        .eq("id", data.user.id)
        .single();
      if (!active) return;
      if (!found || found.role !== role) {
        setState("denied");
        return;
      }
      setProfile(found as Profile);
      setState("ready");
    });
    return () => {
      active = false;
    };
  }, [role]);
  const { ask, dialog } = useConfirm();
  async function signOut() {
    sessionStorage.removeItem("noor-demo-role");
    if (state !== "demo") await supabase?.auth.signOut();
    window.location.assign(role === "admin" ? "/admin/login" : "/login");
  }
  function askSignOut() {
    ask({
      title: "Sign out of your workspace?",
      body: state === "demo"
        ? "The demo records stay in this browser, and you can open the preview again from the sign-in page."
        : "You will need to sign in again to open this workspace. Anything you have typed but not saved will be lost.",
      action: "Sign out",
      run: () => { void signOut(); },
    });
  }
  function askLeave() {
    ask({
      title: "Open the public website?",
      body: "This leaves your workspace. Anything you have typed but not saved will be lost.",
      action: "Open website",
      run: () => window.location.assign("/"),
    });
  }
  if (state === "loading")
    return (
      <main className="academy-shell academy-section">
        <p>Opening your academy workspace…</p>
      </main>
    );
  if (state === "denied")
    return (
      <main className="academy-shell access-card">
        <ShieldCheck size={36} />
        <h1>Sign in for this workspace</h1>
        <p>This area is available only to the matching academy account.</p>
        <a href={role === "admin" ? "/admin/login" : "/login"} className="academy-button">
          Go to sign in <ArrowRight size={18} />
        </a>
      </main>
    );
  const links = portalLinks[role];
  const groups = [...new Set(links.map((item) => item.group))];
  const active = links.find((item) => item.id === current)!;
  return (
    <div className="portal-layout school-portal-layout">
      <aside className="portal-sidebar school-sidebar">
        <a href="/" className="academy-logo light">
          <span className="logo-icon">✦</span>
          <span>
            Al Tarbiyah <small>ACADEMY</small>
          </span>
        </a>
        <div className="school-profile">
          <span className="school-avatar">{role[0]!.toUpperCase()}</span>
          <div>
            <strong>
              {state === "demo"
                ? `${role[0]!.toUpperCase() + role.slice(1)} demo`
                : profile?.full_name || `${role[0]!.toUpperCase() + role.slice(1)} account`}
            </strong>
            <small>
              {role === "teacher"
                ? "Teaching workspace"
                : role === "student"
                  ? "Learning workspace"
                  : role === "parent"
                    ? "Family workspace"
                    : "Academy operations"}
            </small>
          </div>
        </div>
        <nav aria-label={`${role} workspace navigation`}>
          {groups.map((group) => (
            <div className="school-nav-group" key={group}>
              <span className="school-nav-heading">{group}</span>
              {links
                .filter((item) => item.group === group)
                .map((item) => (
                  <a
                    key={item.id}
                    className={current === item.id ? "active" : ""}
                    aria-current={current === item.id ? "page" : undefined}
                    href={`/portal/${role}/${item.id}`}
                  >
                    <item.icon size={17} />
                    {item.label}
                  </a>
                ))}
            </div>
          ))}
        </nav>
        <button className="school-signout" onClick={askSignOut}>
          <LogOut size={17} /> Sign out
        </button>
      </aside>
      <main className="portal-main">
        <div className="portal-top school-topbar">
          <div>
            <span className="school-top-role">{role} portal</span>
            <strong>{active.label}</strong>
          </div>
          <div className="school-top-actions">
            {state === "demo" && <span className="school-preview-pill">Sample data</span>}
            <a href="/" onClick={event => { event.preventDefault(); askLeave(); }}>View website ↗</a>
            <button className="school-mobile-signout" onClick={askSignOut}>
              Sign out
            </button>
          </div>
        </div>
        {role === "admin" && operations.has(current) ? (
          state === "demo" ? (
            <DemoWorkspace role="admin" section={current} />
          ) : (
            <AdminWorkspace section={current} />
          )
        ) : (
          <SchoolWorkspace
            role={role}
            section={current}
            demo={state === "demo"}
            profile={profile}
          />
        )}
      </main>
      {dialog}
    </div>
  );
}
