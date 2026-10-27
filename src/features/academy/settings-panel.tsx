import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Bell, BellOff, Save, UserRound } from "lucide-react";
import { supabase, type Role } from "@/lib/academy";
import { useSchoolData } from "./school-data";
import type { PortalRole } from "./school-nav";

type Store = ReturnType<typeof useSchoolData>;
type Ctx = {
  role: PortalRole;
  demo: boolean;
  profile: { id: string; full_name: string; role: Role } | null;
  store: Store;
  classIds: Set<string>;
  notify: (message: string) => void;
};

type Settings = {
  full_name: string;
  phone: string;
  time_zone: string;
  notify_announcements: boolean;
  notify_homework: boolean;
  notify_results: boolean;
};
const blank: Settings = {
  full_name: "",
  phone: "",
  time_zone: "",
  notify_announcements: true,
  notify_homework: true,
  notify_results: true,
};

export function SettingsPanel({ ctx }: { ctx: Ctx }) {
  const { profile, demo, notify } = ctx;
  const [form, setForm] = useState<Settings>(blank);
  const [loaded, setLoaded] = useState(demo);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (demo || !supabase || !profile) return;
    let active = true;
    supabase
      .from("profiles")
      .select("full_name, phone, time_zone, notify_announcements, notify_homework, notify_results")
      .eq("id", profile.id)
      .single()
      .then(({ data, error: cause }) => {
        if (!active) return;
        if (data) setForm({ ...blank, ...data });
        else if (cause) setError(cause.message);
        setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [demo, profile]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (demo) {
      notify("Demo settings are not saved. Sign in to a real account to change your details.");
      return;
    }
    if (!supabase || !profile) return;
    setBusy(true);
    setError("");
    // The role is deliberately absent: a database trigger refuses a role change
    // from anyone who is not an admin, so sending it would only fail.
    const { error: cause } = await supabase.from("profiles").update(form).eq("id", profile.id);
    setBusy(false);
    if (cause) setError(cause.message);
    else notify("Your settings are saved.");
  }

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  return (
    <>
      <div className="school-panel-heading">
        <div>
          <h2>Settings</h2>
          <p>Your details, and what the academy tells you about.</p>
        </div>
      </div>
      {error && (
        <p className="form-error" role="status">
          {error}
        </p>
      )}
      <form className="info-card academy-form" onSubmit={save}>
        <h3>
          <UserRound size={17} /> Your details
        </h3>
        <label>
          Full name
          <input
            required
            value={form.full_name}
            onChange={(event) => set("full_name", event.target.value)}
            placeholder="Fatima Ahmed"
          />
        </label>
        <div className="form-grid">
          <label>
            Phone (optional)
            <input
              value={form.phone}
              onChange={(event) => set("phone", event.target.value)}
              placeholder="+44 7700 900000"
            />
          </label>
          <label>
            Time zone
            <input
              value={form.time_zone}
              onChange={(event) => set("time_zone", event.target.value)}
              placeholder={Intl.DateTimeFormat().resolvedOptions().timeZone}
            />
          </label>
        </div>
        <p className="form-note">
          Class times are shown in your browser&rsquo;s time zone. Telling us yours helps the
          academy plan groups that suit your family.
        </p>

        <hr />
        <h3>
          <Bell size={17} /> What you are told about
        </h3>
        <p className="form-note">
          These choose what appears in your Notifications. Your academy records are always
          available in the sections above, whatever you choose here.
        </p>
        {(
          [
            ["notify_announcements", "Announcements from the academy and your classes"],
            ["notify_homework", "New homework and approaching due dates"],
            ["notify_results", "Marks and teacher feedback"],
          ] as const
        ).map(([key, label]) => (
          <label className="inline-check" key={key}>
            <input
              type="checkbox"
              checked={form[key]}
              onChange={(event) => set(key, event.target.checked)}
            />{" "}
            {label}
          </label>
        ))}

        <div className="form-actions">
          <button className="academy-button small" disabled={busy || !loaded}>
            <Save size={17} /> Save settings
          </button>
        </div>
        {demo && (
          <p className="form-note">
            This is a demo workspace. Nothing here is saved to a real account.
          </p>
        )}
      </form>
    </>
  );
}

type Item = { id: string; kind: string; title: string; body: string; at: string };

export function NotificationsPanel({ ctx }: { ctx: Ctx }) {
  const { profile, demo, store, classIds } = ctx;
  const [prefs, setPrefs] = useState({
    notify_announcements: true,
    notify_homework: true,
    notify_results: true,
  });

  useEffect(() => {
    if (demo || !supabase || !profile) return;
    let active = true;
    supabase
      .from("profiles")
      .select("notify_announcements, notify_homework, notify_results")
      .eq("id", profile.id)
      .single()
      .then(({ data }) => {
        if (active && data) setPrefs(data);
      });
    return () => {
      active = false;
    };
  }, [demo, profile]);

  // Everything here is already in the workspace; this gathers what is recent and
  // relevant into one place, newest first, so nothing has to be hunted for.
  const items = useMemo(() => {
    const data = store.data;
    const mine = (classId: string) => classIds.size === 0 || classIds.has(classId);
    const titleOf = (classId: string) =>
      data.classes.find((group) => group.id === classId)?.title ?? "Your class";
    const list: Item[] = [];

    if (prefs.notify_announcements)
      for (const item of data.class_announcements)
        if (mine(item.class_id))
          list.push({
            id: `a-${item.id}`,
            kind: "Announcement",
            title: item.title,
            body: `${titleOf(item.class_id)} · ${item.body}`,
            at: item.created_at,
          });

    if (prefs.notify_homework)
      for (const task of data.homework_assignments)
        if (task.published && mine(task.class_id))
          list.push({
            id: `h-${task.id}`,
            kind: "Homework",
            title: task.title,
            body: task.due_at
              ? `${titleOf(task.class_id)} · due ${new Date(task.due_at).toLocaleDateString()}`
              : titleOf(task.class_id),
            at: task.created_at,
          });

    if (prefs.notify_results)
      for (const mark of data.homework_submissions)
        if (mark.score !== null)
          list.push({
            id: `r-${mark.id}`,
            kind: "Result",
            title: `Homework marked · ${mark.score}%`,
            body: mark.feedback || "No written feedback was left.",
            at: mark.submitted_at,
          });

    return list.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 40);
  }, [store.data, classIds, prefs]);

  const off = !prefs.notify_announcements && !prefs.notify_homework && !prefs.notify_results;

  return (
    <>
      <div className="school-panel-heading">
        <div>
          <h2>Notifications</h2>
          <p>Recent announcements, homework and results, newest first.</p>
        </div>
        <a className="academy-button outline small" href={`/portal/${ctx.role}/settings`}>
          Choose what you see
        </a>
      </div>
      {off ? (
        <div className="info-card">
          <h3>
            <BellOff size={17} /> Everything is switched off
          </h3>
          <p>Turn something on in Settings and it will appear here.</p>
        </div>
      ) : items.length === 0 ? (
        <div className="info-card">
          <h3>Nothing yet</h3>
          <p>
            Announcements, homework and marks will appear here as teachers add them.
          </p>
        </div>
      ) : (
        <div className="record-list">
          {items.map((item) => (
            <div className="record-card notification-row" key={item.id}>
              <div>
                <span className="pill">{item.kind}</span>
                <strong>{item.title}</strong>
                <span>{item.body}</span>
                <small>{new Date(item.at).toLocaleString()}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
