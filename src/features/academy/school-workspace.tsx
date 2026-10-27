import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  Check,
  ExternalLink,
  Megaphone,
  NotebookPen,
  Plus,
  RefreshCw,
  School,
  Trash2,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/academy";
import type { ExamQuestion } from "./exams";
import {
  learnerLabel,
  useSchoolData,
  type SchoolClass,
  type SchoolData,
  type SchoolEnrollment,
} from "./school-data";
import type { PortalRole } from "./school-nav";
import { Attachments } from "@/features/academy/attachments";
import { SettingsPanel, NotificationsPanel } from "@/features/academy/settings-panel";

type Profile = { id: string; full_name: string; role: Role };
type Store = ReturnType<typeof useSchoolData>;
type Context = {
  role: PortalRole;
  demo: boolean;
  profile: Profile | null;
  store: Store;
  classIds: Set<string>;
  enrollments: SchoolEnrollment[];
  classes: SchoolClass[];
  notify: (message: string) => void;
};
const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const niceDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const niceDateTime = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
const schoolUrl = (role: PortalRole, section: string) => `/portal/${role}/${section}`;
const isStaff = (role: PortalRole) => role === "admin" || role === "teacher";
const className = (data: SchoolData, id: string) =>
  data.classes.find((item) => item.id === id)?.title || "Class";
function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="school-empty">
      <BookOpen size={24} />
      <p>{children}</p>
    </div>
  );
}
function PanelHeading({
  title,
  copy,
  children,
}: {
  title: string;
  copy?: string;
  children?: ReactNode;
}) {
  return (
    <div className="school-panel-heading">
      <div>
        <h2>{title}</h2>
        {copy && <p>{copy}</p>}
      </div>
      {children}
    </div>
  );
}
function ClassSelect({
  classes,
  value,
  onChange,
  required = true,
}: {
  classes: SchoolClass[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <select required={required} value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">Choose a class</option>
      {classes.map((group) => (
        <option value={group.id} key={group.id}>
          {group.title}
        </option>
      ))}
    </select>
  );
}
function LearnerSelect({
  ctx,
  value,
  onChange,
}: {
  ctx: Context;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <select required value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">Choose learner</option>
      {ctx.enrollments.map((item) => (
        <option value={item.id} key={item.id}>
          {learnerLabel(item, ctx.store.data)}
        </option>
      ))}
    </select>
  );
}

export function SchoolWorkspace({
  role,
  section,
  demo,
  profile,
}: {
  role: PortalRole;
  section: string;
  demo: boolean;
  profile: Profile | null;
}) {
  const store = useSchoolData(demo);
  const [notice, setNotice] = useState("");
  const [selectedChild, setSelectedChild] = useState("");
  useEffect(() => {
    setSelectedChild(sessionStorage.getItem("noor-selected-child") || "");
  }, []);
  const baseEnrollments =
    role === "teacher"
      ? store.data.enrollments.filter((item) =>
          store.data.classes.some((group) => group.id === item.class_id),
        )
      : store.data.enrollments;
  useEffect(() => {
    if (role === "student" && !selectedChild && baseEnrollments[0])
      setSelectedChild(baseEnrollments[0].id);
  }, [role, selectedChild, baseEnrollments]);
  const enrollments =
    (role === "parent" || role === "student") &&
    selectedChild &&
    baseEnrollments.some((item) => item.id === selectedChild)
      ? baseEnrollments.filter((item) => item.id === selectedChild)
      : baseEnrollments;
  const classIds = new Set(enrollments.map((item) => item.class_id).filter(Boolean) as string[]);
  const classes =
    role === "parent" || role === "student"
      ? store.data.classes.filter((group) => classIds.has(group.id))
      : store.data.classes;
  const ctx: Context = {
    role,
    demo,
    profile,
    store,
    classIds,
    enrollments,
    classes,
    notify: setNotice,
  };
  const titles: Record<string, [string, string]> = {
    overview: [
      role === "teacher" ? "Your teaching day" : "Academy overview",
      role === "teacher"
        ? "Plan classes, review student work and keep families informed."
        : "A clear view of your academy.",
    ],
    today: ["Today’s learning", "Your next class and what to work on."],
    classes: [
      role === "teacher" ? "My classes" : "Class groups",
      "Create a class and keep its learning details current.",
    ],
    timetable: ["Weekly timetable", "A recurring plan in each class’s local time zone."],
    lessons: [
      role === "parent" ? "Class summaries" : "Lessons & summaries",
      "Topic, date, class link and what was learned.",
    ],
    attendance: ["Attendance", "A record for every learner in every class session."],
    homework: ["Homework", "Assignments, submissions and teacher feedback."],
    exams: ["Exams & grading", "Publish assessments and review student answers."],
    learners: ["My learners", "See class placement and add individual progress notes."],
    progress: ["Learning progress", "Strengths, recent feedback and next steps."],
    announcements: ["Class announcements", "Updates shared with enrolled families."],
    payments: ["Payment records", "Manual payment status for your family."],
  };
  const [title, copy] = titles[section] ?? [
    "School workspace",
    "Islamic Studies learning records.",
  ];
  if (store.loading)
    return (
      <div className="workspace school-workspace">
        <p>Loading school records…</p>
      </div>
    );
  return (
    <div className="workspace school-workspace">
      <div className="school-page-head">
        <div>
          <span className="academy-eyebrow">
            ✦ {demo ? "DEMO SCHOOL" : "AL TARBIYAH"} · {role.toUpperCase()}
          </span>
          <h1>{title}</h1>
          <p>{copy}</p>
        </div>
        <button className="school-refresh" onClick={store.reload} aria-label="Refresh records">
          <RefreshCw size={18} />
        </button>
      </div>
      {(role === "parent" || role === "student") && baseEnrollments.length > 1 && (
        <label className="school-child-select">
          Choose child
          <select
            value={selectedChild}
            onChange={(event) => {
              setSelectedChild(event.target.value);
              sessionStorage.setItem("noor-selected-child", event.target.value);
            }}
          >
            <option value="">All children</option>
            {baseEnrollments.map((item) => (
              <option value={item.id} key={item.id}>
                {learnerLabel(item, store.data)}
              </option>
            ))}
          </select>
        </label>
      )}
      {demo && (
        <div className="school-demo-note">
          This account uses sample records saved in this browser and cannot change live academy
          data.
        </div>
      )}
      {store.error && (
        <p className="form-error" role="alert">
          {store.error}
        </p>
      )}
      {notice && (
        <p className="form-success" role="status">
          {notice}
        </p>
      )}
      {section === "overview" || section === "today" ? <Overview ctx={ctx} /> : null}
      {section === "classes" ? <ClassesPanel ctx={ctx} /> : null}
      {section === "timetable" ? <TimetablePanel ctx={ctx} /> : null}
      {section === "lessons" ? <LessonsPanel ctx={ctx} /> : null}
      {section === "attendance" ? <AttendancePanel ctx={ctx} /> : null}
      {section === "homework" ? <HomeworkPanel ctx={ctx} /> : null}
      {section === "exams" ? <ExamsPanel ctx={ctx} /> : null}
      {section === "learners" || section === "progress" ? (
        <ProgressPanel ctx={ctx} learnersOnly={section === "learners"} />
      ) : null}
      {section === "announcements" ? <AnnouncementsPanel ctx={ctx} /> : null}
      {section === "payments" ? <PaymentsPanel ctx={ctx} /> : null}
      {section === "notifications" ? <NotificationsPanel ctx={ctx} /> : null}
      {section === "settings" ? <SettingsPanel ctx={ctx} /> : null}
    </div>
  );
}

function Overview({ ctx }: { ctx: Context }) {
  const { role, store, enrollments, classes } = ctx;
  const data = store.data;
  const student = role === "student";
  const staff = isStaff(role);
  const homework = data.homework_assignments.filter(
    (item) => item.published && classes.some((group) => group.id === item.class_id),
  );
  const pending = homework.filter(
    (item) =>
      !data.homework_submissions.some(
        (sub) =>
          sub.assignment_id === item.id && enrollments.some((e) => e.id === sub.enrollment_id),
      ),
  );
  const next = data.lessons
    .filter(
      (item) =>
        classes.some((group) => group.id === item.class_id) &&
        new Date(item.starts_at) >= new Date(),
    )
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0];
  const metrics = staff
    ? [
        ["Class groups", classes.length],
        ["Learners", enrollments.length],
        [
          "Homework to review",
          data.homework_submissions.filter((item) => item.score === null).length,
        ],
        [
          "Upcoming lessons",
          data.lessons.filter((item) => new Date(item.starts_at) >= new Date()).length,
        ],
      ]
    : [
        ["My classes", classes.length],
        [
          "Upcoming lessons",
          data.lessons.filter((item) => new Date(item.starts_at) >= new Date()).length,
        ],
        ["Homework to do", pending.length],
        [
          "Progress notes",
          data.progress_notes.filter((item) => enrollments.some((e) => e.id === item.enrollment_id))
            .length,
        ],
      ];
  const quickActions: Array<[string, string, LucideIcon]> = staff
    ? [
        ["Create a class", "classes", School],
        ["Plan a lesson", "lessons", BookOpen],
        ["Assign homework", "homework", NotebookPen],
        ["Mark attendance", "attendance", CalendarCheck],
      ]
    : [
        ["View timetable", "timetable", CalendarDays],
        ["Read class summary", "lessons", BookOpen],
        ["Check homework", "homework", NotebookPen],
        ["See progress", "progress", Users],
      ];
  const highlights = data.progress_notes
    .filter((note) => staff || enrollments.some((item) => item.id === note.enrollment_id))
    .slice(0, 2);
  return (
    <>
      <div className="school-welcome">
        <span>
          ✦ {staff ? "TEACH WITH PURPOSE" : student ? "READY TO LEARN" : "YOUR CHILD’S JOURNEY"}
        </span>
        <h2>
          {staff
            ? "Every lesson can build faith and character."
            : student
              ? "Assalamu alaikum! What will you learn today?"
              : "Stay close to every step of their learning."}
        </h2>
        <p>
          {staff
            ? "Use your class tools to plan Islamic Studies, record attendance and share progress with families."
            : "See your timetable, class summaries, homework, results and next steps in one place."}
        </p>
        <a href={schoolUrl(role, staff ? "timetable" : "lessons")}>
          Explore your schedule <ArrowRight size={17} />
        </a>
      </div>
      <div className="metric-grid school-metrics">
        {metrics.map(([label, value]) => (
          <div className="metric" key={label}>
            <small>{label}</small>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="school-overview-grid">
        <div className="info-card">
          <PanelHeading
            title="Next live class"
            copy={
              next
                ? `${className(data, next.class_id)} · ${niceDateTime(next.starts_at)}`
                : "Nothing scheduled yet"
            }
          />
          {next ? (
            <>
              <h3>{next.topic}</h3>
              <p>{next.summary || "A summary will be shared after class."}</p>
              {data.classes.find((group) => group.id === next.class_id)?.meeting_url && (
                <a
                  className="text-link"
                  href={data.classes.find((group) => group.id === next.class_id)!.meeting_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open class link <ExternalLink size={15} />
                </a>
              )}
            </>
          ) : (
            <p>New lessons appear here when a teacher plans them.</p>
          )}
        </div>
        <div className="info-card">
          <PanelHeading title={staff ? "Quick actions" : "To do next"} />
          <div className="school-quick-links">
            {quickActions.map(([label, section, Icon]) => (
              <a href={schoolUrl(role, section)} key={section}>
                <Icon size={17} />
                {label}
                <ArrowRight size={15} />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="school-overview-grid">
        <div className="info-card">
          <PanelHeading title="Latest class news" />
          <div className="school-list">
            {data.class_announcements
              .filter((item) => classes.some((group) => group.id === item.class_id))
              .slice(0, 3)
              .map((item) => (
                <article key={item.id}>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                  <small>
                    {className(data, item.class_id)} · {niceDate(item.created_at)}
                  </small>
                </article>
              ))}
            {!data.class_announcements.some((item) =>
              classes.some((group) => group.id === item.class_id),
            ) && <p>No announcements yet.</p>}
          </div>
        </div>
        <div className="info-card">
          <PanelHeading title={staff ? "Recent learning" : "Progress highlight"} />
          {highlights.map((note) => (
            <article className="school-compact" key={note.id}>
              <strong>{note.topic}</strong>
              <p>{note.note}</p>
              <small>Next: {note.next_step || "Continue learning"}</small>
            </article>
          ))}
          {!highlights.length && <p>Progress notes will appear after teaching begins.</p>}
        </div>
      </div>
    </>
  );
}

function ClassesPanel({ ctx }: { ctx: Context }) {
  const { role, profile, store, classes, enrollments, notify } = ctx;
  const staff = isStaff(role);
  const [draft, setDraft] = useState({
    title: "",
    grade: "3",
    schedule_text: "",
    time_zone: "UTC",
    meeting_url: "",
    teacher_id: "",
  });
  async function create(event: FormEvent) {
    event.preventDefault();
    const success = await store.add("classes", {
      ...draft,
      grade: Number(draft.grade),
      teacher_id: role === "teacher" ? profile?.id || "demo-teacher" : draft.teacher_id || null,
    });
    if (success) {
      setDraft({
        title: "",
        grade: "3",
        schedule_text: "",
        time_zone: "UTC",
        meeting_url: "",
        teacher_id: "",
      });
      notify("Class created. Add its weekly timetable next.");
    }
  }
  return (
    <>
      {staff && (
        <form className="info-card academy-form school-form" onSubmit={create}>
          <PanelHeading
            title="Create a class"
            copy="Teachers can create their own grade group; administrators can assign learners after enrollment."
          />
          <div className="form-grid three">
            <label>
              Class name
              <input
                required
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="Grade 4 · Olive Group"
              />
            </label>
            <label>
              Grade
              <select
                value={draft.grade}
                onChange={(e) => setDraft({ ...draft, grade: e.target.value })}
              >
                {[1, 2, 3, 4, 5, 6].map((grade) => (
                  <option key={grade} value={grade}>
                    Grade {grade}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Time zone
              <input
                required
                value={draft.time_zone}
                onChange={(e) => setDraft({ ...draft, time_zone: e.target.value })}
                placeholder="Europe/London"
              />
            </label>
          </div>
          <div className="form-grid">
            <label>
              Schedule note
              <input
                value={draft.schedule_text}
                onChange={(e) => setDraft({ ...draft, schedule_text: e.target.value })}
                placeholder="Mon, Wed, Fri · 4 PM"
              />
            </label>
            <label>
              Live meeting URL
              <input
                type="url"
                value={draft.meeting_url}
                onChange={(e) => setDraft({ ...draft, meeting_url: e.target.value })}
                placeholder="https://meet.google.com/…"
              />
            </label>
            {role === "admin" && (
              <label>
                Teacher
                <select
                  value={draft.teacher_id}
                  onChange={(e) => setDraft({ ...draft, teacher_id: e.target.value })}
                >
                  <option value="">Assign later</option>
                  {store.data.profiles
                    .filter((item) => item.role === "teacher")
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.full_name || item.id}
                      </option>
                    ))}
                </select>
              </label>
            )}
          </div>
          <button className="academy-button small">
            <Plus size={17} /> Create class
          </button>
        </form>
      )}
      <PanelHeading
        title={staff ? "Your class groups" : "Your child’s classes"}
        copy="Class details, learners and quick access to teaching records."
      />
      <div className="school-card-grid">
        {classes.map((group) => (
          <article className="school-class-card" key={group.id}>
            <div className="school-card-top">
              <span className="school-card-icon">
                <School size={23} />
              </span>
              <span className="pill">Grade {group.grade}</span>
            </div>
            <h3>{group.title}</h3>
            <p>
              {group.schedule_text || "Timetable to be confirmed"} · {group.time_zone}
            </p>
            {role === "admin" && (
              <label className="school-teacher-select">
                Assigned teacher
                <select
                  value={group.teacher_id || ""}
                  onChange={async (event) => {
                    if (
                      await store.update("classes", group.id, {
                        teacher_id: event.target.value || null,
                      })
                    )
                      notify("Teacher assignment updated for this class and its learners.");
                  }}
                >
                  <option value="">Unassigned</option>
                  {store.data.profiles
                    .filter((item) => item.role === "teacher")
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.full_name || item.id}
                      </option>
                    ))}
                </select>
              </label>
            )}
            <div className="school-card-foot">
              <span>
                <Users size={15} />
                {enrollments.filter((item) => item.class_id === group.id).length} learner(s)
              </span>
              {group.meeting_url && (
                <a href={group.meeting_url} target="_blank" rel="noreferrer">
                  Class link ↗
                </a>
              )}
            </div>
            <div className="school-card-links">
              <a href={schoolUrl(role, "timetable")}>Timetable</a>
              <a href={schoolUrl(role, "lessons")}>Lessons</a>
              <a href={schoolUrl(role, "homework")}>Homework</a>
            </div>
          </article>
        ))}
        {!classes.length && (
          <Empty>
            {staff
              ? "Create your first class above."
              : "A class will appear after enrollment is confirmed."}
          </Empty>
        )}
      </div>
    </>
  );
}

function TimetablePanel({ ctx }: { ctx: Context }) {
  const { role, store, classes, notify } = ctx;
  const staff = isStaff(role);
  const [draft, setDraft] = useState({
    class_id: "",
    weekday: "1",
    starts_local: "16:00",
    duration_minutes: "50",
    subject: "Islamic Studies",
  });
  async function create(event: FormEvent) {
    event.preventDefault();
    const success = await store.add("timetable_slots", {
      class_id: draft.class_id,
      weekday: Number(draft.weekday),
      starts_local: draft.starts_local,
      duration_minutes: Number(draft.duration_minutes),
      subject: draft.subject,
    });
    if (success) {
      notify("Timetable slot added.");
      setDraft({ ...draft, subject: "Islamic Studies" });
    }
  }
  const slots = store.data.timetable_slots
    .filter((item) => classes.some((group) => group.id === item.class_id))
    .sort((a, b) => a.weekday - b.weekday || a.starts_local.localeCompare(b.starts_local));
  return (
    <>
      {staff && (
        <form className="info-card academy-form school-form" onSubmit={create}>
          <PanelHeading
            title="Add a weekly class time"
            copy="Times are entered in the class’s time zone and repeat each week."
          />
          <div className="form-grid three">
            <label>
              Class
              <ClassSelect
                classes={classes}
                value={draft.class_id}
                onChange={(value) => setDraft({ ...draft, class_id: value })}
              />
            </label>
            <label>
              Day
              <select
                value={draft.weekday}
                onChange={(e) => setDraft({ ...draft, weekday: e.target.value })}
              >
                {weekdays.map((day, index) => (
                  <option key={day} value={index}>
                    {day}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Local start time
              <input
                required
                type="time"
                value={draft.starts_local}
                onChange={(e) => setDraft({ ...draft, starts_local: e.target.value })}
              />
            </label>
          </div>
          <div className="form-grid">
            <label>
              Learning focus
              <input
                required
                value={draft.subject}
                onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                placeholder="Seerah and character"
              />
            </label>
            <label>
              Duration (minutes)
              <input
                required
                type="number"
                min="15"
                max="180"
                value={draft.duration_minutes}
                onChange={(e) => setDraft({ ...draft, duration_minutes: e.target.value })}
              />
            </label>
          </div>
          <button className="academy-button small" disabled={!classes.length}>
            <Plus size={17} /> Add to timetable
          </button>
        </form>
      )}
      <PanelHeading
        title="Weekly class timetable"
        copy="All times use the time zone shown for each class."
      />
      <div className="school-week-grid">
        {weekdays.map((day, index) => (
          <div className="school-day" key={day}>
            <h3>{day}</h3>
            {slots
              .filter((slot) => slot.weekday === index)
              .map((slot) => (
                <article key={slot.id}>
                  <strong>{slot.starts_local.slice(0, 5)}</strong>
                  <span>{slot.subject}</span>
                  <small>
                    {className(store.data, slot.class_id)} · {slot.duration_minutes} min ·{" "}
                    {classes.find((group) => group.id === slot.class_id)?.time_zone}
                  </small>
                  {staff && (
                    <button
                      aria-label={`Remove ${slot.subject} on ${day}`}
                      onClick={() => store.remove("timetable_slots", slot.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </article>
              ))}
            {!slots.some((slot) => slot.weekday === index) && <p>No class</p>}
          </div>
        ))}
      </div>
      {!slots.length && <Empty>No weekly class times are set yet.</Empty>}
    </>
  );
}

function LessonsPanel({ ctx }: { ctx: Context }) {
  const { role, store, classes, notify } = ctx;
  const staff = isStaff(role);
  const [draft, setDraft] = useState({ class_id: "", starts_at: "", topic: "", summary: "" });
  async function create(event: FormEvent) {
    event.preventDefault();
    const success = await store.add("lessons", {
      class_id: draft.class_id,
      starts_at: new Date(draft.starts_at).toISOString(),
      topic: draft.topic,
      summary: draft.summary,
    });
    if (success) {
      notify("Lesson planned.");
      setDraft({ class_id: "", starts_at: "", topic: "", summary: "" });
    }
  }
  const lessons = store.data.lessons
    .filter((item) => classes.some((group) => group.id === item.class_id))
    .sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  return (
    <>
      {staff && (
        <form className="info-card academy-form school-form" onSubmit={create}>
          <PanelHeading
            title="Plan a live lesson"
            copy="Add the topic now; share a meaningful class summary after teaching."
          />
          <div className="form-grid three">
            <label>
              Class
              <ClassSelect
                classes={classes}
                value={draft.class_id}
                onChange={(value) => setDraft({ ...draft, class_id: value })}
              />
            </label>
            <label>
              Date and time
              <input
                required
                type="datetime-local"
                value={draft.starts_at}
                onChange={(e) => setDraft({ ...draft, starts_at: e.target.value })}
              />
            </label>
            <label>
              Islamic Studies topic
              <input
                required
                value={draft.topic}
                onChange={(e) => setDraft({ ...draft, topic: e.target.value })}
                placeholder="The steps of Wudu"
              />
            </label>
          </div>
          <label>
            Learning plan or class summary
            <textarea
              rows={3}
              value={draft.summary}
              onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
              placeholder="What will the children learn?"
            />
          </label>
          <button className="academy-button small" disabled={!classes.length}>
            <Plus size={17} /> Save lesson
          </button>
        </form>
      )}
      <PanelHeading
        title={role === "parent" ? "What each class covered" : "Lesson record"}
        copy={
          role === "parent"
            ? "Read each topic and the teacher’s summary after class."
            : "Upcoming and completed lessons for your classes."
        }
      />
      <div className="school-list">
        {lessons.map((lesson) => (
          <LessonCard key={lesson.id} lesson={lesson} ctx={ctx} />
        ))}
        {!lessons.length && <Empty>Lessons will appear when a teacher plans them.</Empty>}
      </div>
    </>
  );
}
function LessonCard({ lesson, ctx }: { lesson: SchoolData["lessons"][number]; ctx: Context }) {
  const { role, store, classes, notify } = ctx;
  const staff = isStaff(role);
  const [summary, setSummary] = useState(lesson.summary);
  const [editing, setEditing] = useState(false);
  const group = classes.find((item) => item.id === lesson.class_id);
  const complete = new Date(lesson.starts_at) < new Date();
  return (
    <article className="school-record">
      <div className="school-record-side">
        <span>{niceDate(lesson.starts_at)}</span>
        <small>
          {new Date(lesson.starts_at).toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
          })}
        </small>
      </div>
      <div className="school-record-body">
        <div className="school-record-top">
          <div>
            <span className="school-kicker">
              {group?.title} · {complete ? "Completed" : "Upcoming"}
            </span>
            <h3>{lesson.topic}</h3>
          </div>
          <span className="pill">{complete ? "Summary" : "Planned"}</span>
        </div>
        <p>{lesson.summary || "A class summary will be added after the lesson."}</p>
        {group?.meeting_url && (
          <a className="text-link" href={group.meeting_url} target="_blank" rel="noreferrer">
            Open live class <ExternalLink size={15} />
          </a>
        )}
        {staff && (
          <div className="school-inline-actions">
            <button onClick={() => setEditing(!editing)}>
              {editing ? "Cancel" : "Edit summary"}
            </button>
            <a href={schoolUrl(role, "attendance")}>Mark attendance →</a>
          </div>
        )}
        <Attachments
          context="lesson_material"
          contextId={lesson.id}
          canAdd={staff}
          demo={ctx.demo}
          label="Lesson materials"
        />
        {editing && (
          <form
            className="academy-form"
            onSubmit={async (event) => {
              event.preventDefault();
              if (await store.update("lessons", lesson.id, { summary })) {
                setEditing(false);
                notify("Class summary saved for families.");
              }
            }}
          >
            <label>
              Class summary
              <textarea
                required
                rows={4}
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
              />
            </label>
            <button className="academy-button small">Save summary</button>
          </form>
        )}
      </div>
    </article>
  );
}

function AttendancePanel({ ctx }: { ctx: Context }) {
  const { role, store, classes, enrollments } = ctx;
  const staff = isStaff(role);
  const lessons = store.data.lessons
    .filter((item) => classes.some((group) => group.id === item.class_id))
    .sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  const marked = store.data.attendance.filter((item) =>
    enrollments.some((e) => e.id === item.enrollment_id),
  );
  const present = marked.filter(
    (item) => item.status === "present" || item.status === "late",
  ).length;
  return (
    <>
      <div className="metric-grid school-metrics">
        <div className="metric">
          <small>Lessons</small>
          <strong>{lessons.length}</strong>
        </div>
        <div className="metric">
          <small>Attendance recorded</small>
          <strong>{marked.length}</strong>
        </div>
        <div className="metric">
          <small>Present or late</small>
          <strong>{present}</strong>
        </div>
        <div className="metric">
          <small>Attendance rate</small>
          <strong>{marked.length ? `${Math.round((present / marked.length) * 100)}%` : "—"}</strong>
        </div>
      </div>
      <PanelHeading
        title={staff ? "Mark each class session" : "Your child’s attendance"}
        copy={
          staff
            ? "Choose a status for every learner. Changes save immediately."
            : "See attendance by lesson, including excused absences."
        }
      />
      <div className="school-list">
        {lessons.map((lesson) => (
          <article className="info-card school-attendance-card" key={lesson.id}>
            <div className="school-record-top">
              <div>
                <span className="school-kicker">
                  {className(store.data, lesson.class_id)} · {niceDateTime(lesson.starts_at)}
                </span>
                <h3>{lesson.topic}</h3>
              </div>
              <span className="pill">
                {enrollments.filter((item) => item.class_id === lesson.class_id).length} learner(s)
              </span>
            </div>
            {enrollments
              .filter((item) => item.class_id === lesson.class_id)
              .map((enrollment) => {
                const record = store.data.attendance.find(
                  (item) => item.lesson_id === lesson.id && item.enrollment_id === enrollment.id,
                );
                return (
                  <div className="school-attendance-row" key={enrollment.id}>
                    <span>{learnerLabel(enrollment, store.data)}</span>
                    {staff ? (
                      <select
                        aria-label={`Attendance for ${learnerLabel(enrollment, store.data)} in ${lesson.topic}`}
                        value={record?.status || ""}
                        onChange={(e) =>
                          store.upsertAttendance(lesson.id, enrollment.id, e.target.value)
                        }
                      >
                        <option value="">Mark attendance</option>
                        {["present", "late", "absent", "excused"].map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="pill">{record?.status || "Not marked"}</span>
                    )}
                  </div>
                );
              })}
          </article>
        ))}
        {!lessons.length && <Empty>No lessons have been planned for this class yet.</Empty>}
      </div>
    </>
  );
}

function HomeworkPanel({ ctx }: { ctx: Context }) {
  const { role, store, classes, enrollments, notify } = ctx;
  const staff = isStaff(role);
  const [draft, setDraft] = useState({
    class_id: "",
    title: "",
    instructions: "",
    due_at: "",
    resource_url: "",
    published: true,
  });
  async function create(event: FormEvent) {
    event.preventDefault();
    const success = await store.add("homework_assignments", {
      class_id: draft.class_id,
      title: draft.title,
      instructions: draft.instructions,
      due_at: draft.due_at ? new Date(draft.due_at).toISOString() : null,
      resource_url: draft.resource_url,
      published: draft.published,
      created_at: new Date().toISOString(),
    });
    if (success) {
      notify("Homework saved for the class.");
      setDraft({
        class_id: "",
        title: "",
        instructions: "",
        due_at: "",
        resource_url: "",
        published: true,
      });
    }
  }
  const tasks = store.data.homework_assignments
    .filter(
      (item) => classes.some((group) => group.id === item.class_id) && (staff || item.published),
    )
    .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
  return (
    <>
      {staff && (
        <form className="info-card academy-form school-form" onSubmit={create}>
          <PanelHeading
            title="Assign homework"
            copy="Use a short, age appropriate activity linked to the lesson."
          />
          <div className="form-grid three">
            <label>
              Class
              <ClassSelect
                classes={classes}
                value={draft.class_id}
                onChange={(value) => setDraft({ ...draft, class_id: value })}
              />
            </label>
            <label>
              Homework title
              <input
                required
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="Wudu steps practice"
              />
            </label>
            <label>
              Due date
              <input
                type="datetime-local"
                value={draft.due_at}
                onChange={(e) => setDraft({ ...draft, due_at: e.target.value })}
              />
            </label>
          </div>
          <label>
            Instructions
            <textarea
              required
              rows={4}
              value={draft.instructions}
              onChange={(e) => setDraft({ ...draft, instructions: e.target.value })}
              placeholder="What should the learner do and submit?"
            />
          </label>
          <div className="form-grid">
            <label>
              Optional resource URL
              <input
                type="url"
                value={draft.resource_url}
                onChange={(e) => setDraft({ ...draft, resource_url: e.target.value })}
                placeholder="https://…"
              />
            </label>
            <label className="inline-check">
              <input
                type="checkbox"
                checked={draft.published}
                onChange={(e) => setDraft({ ...draft, published: e.target.checked })}
              />{" "}
              Publish to families now
            </label>
          </div>
          <button className="academy-button small" disabled={!classes.length}>
            <Plus size={17} /> Create homework
          </button>
        </form>
      )}
      <PanelHeading
        title={staff ? "Assigned work" : "Your homework"}
        copy={
          staff
            ? "Review submissions, add scores and write personal feedback."
            : "Completed and upcoming tasks for your class."
        }
      />
      <div className="school-list">
        {tasks.map((task) => (
          <article className="info-card school-homework-card" key={task.id}>
            <div className="school-record-top">
              <div>
                <span className="school-kicker">
                  {className(store.data, task.class_id)} ·{" "}
                  {task.due_at ? `Due ${niceDate(task.due_at)}` : "No due date"}
                </span>
                <h3>{task.title}</h3>
              </div>
              <span className="pill">{task.published ? "Published" : "Draft"}</span>
            </div>
            <p>{task.instructions}</p>
            {task.resource_url && (
              <a className="text-link" href={task.resource_url} target="_blank" rel="noreferrer">
                Open learning resource <ExternalLink size={15} />
              </a>
            )}
            {staff && (
              <div className="school-inline-actions">
                <button
                  onClick={() =>
                    store.update("homework_assignments", task.id, { published: !task.published })
                  }
                >
                  {task.published ? "Unpublish" : "Publish"}
                </button>
                <span>
                  {
                    store.data.homework_submissions.filter((sub) => sub.assignment_id === task.id)
                      .length
                  }{" "}
                  submitted
                </span>
              </div>
            )}
            {enrollments
              .filter((e) => e.class_id === task.class_id)
              .map((enrollment) => (
                <HomeworkLearner
                  key={enrollment.id}
                  ctx={ctx}
                  task={task}
                  enrollment={enrollment}
                />
              ))}
          </article>
        ))}
        {!tasks.length && (
          <Empty>
            {staff ? "Create an assignment to begin." : "No homework has been assigned yet."}
          </Empty>
        )}
      </div>
    </>
  );
}
function HomeworkLearner({
  ctx,
  task,
  enrollment,
}: {
  ctx: Context;
  task: SchoolData["homework_assignments"][number];
  enrollment: SchoolEnrollment;
}) {
  const { role, store, notify } = ctx;
  const staff = isStaff(role);
  const student = role === "student";
  const submission = store.data.homework_submissions.find(
    (item) => item.assignment_id === task.id && item.enrollment_id === enrollment.id,
  );
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState(submission?.score?.toString() ?? "");
  const [feedback, setFeedback] = useState(submission?.feedback ?? "");
  const closed = Boolean(task.due_at && new Date(task.due_at) < new Date());
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (
      await store.add("homework_submissions", {
        assignment_id: task.id,
        enrollment_id: enrollment.id,
        answer,
        score: null,
        feedback: "",
        submitted_at: new Date().toISOString(),
      })
    ) {
      setAnswer("");
      notify("Homework submitted for teacher review.");
    }
  }
  return (
    <div className="school-submission">
      <div className="school-record-top">
        <strong>{staff ? learnerLabel(enrollment, store.data) : "Your work"}</strong>
        <span className="pill">
          {submission
            ? submission.score === null
              ? "Submitted · awaiting review"
              : `Graded · ${submission.score}%`
            : closed
              ? "Due date passed"
              : "To do"}
        </span>
      </div>
      {submission ? (
        <>
          <p>{submission.answer}</p>
          {submission.feedback && (
            <p>
              <strong>Teacher feedback:</strong> {submission.feedback}
            </p>
          )}
          <Attachments
            context="homework_submission"
            contextId={submission.id}
            canAdd={student}
            demo={ctx.demo}
            label="Submitted files"
          />
          {staff && (
            <form
              className="academy-form school-grade-form"
              onSubmit={async (event) => {
                event.preventDefault();
                if (
                  await store.update("homework_submissions", submission.id, {
                    score: Number(score),
                    feedback,
                  })
                )
                  notify("Homework grade saved.");
              }}
            >
              <label>
                Score %
                <input
                  required
                  type="number"
                  min="0"
                  max="100"
                  value={score}
                  onChange={(event) => setScore(event.target.value)}
                />
              </label>
              <label>
                Feedback
                <input value={feedback} onChange={(event) => setFeedback(event.target.value)} />
              </label>
              <button className="academy-button small">Save grade</button>
            </form>
          )}
        </>
      ) : student && !closed ? (
        <form className="academy-form" onSubmit={submit}>
          <label>
            Write your answer
            <textarea
              required
              rows={4}
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="Type your homework response here"
            />
          </label>
          <button className="academy-button small">Submit homework</button>
        </form>
      ) : (
        <p className="form-note">
          {closed
            ? "This homework has passed its due date."
            : staff
              ? "No submission yet."
              : "Open the student account to submit this task."}
        </p>
      )}
    </div>
  );
}

const newQuestion = (): ExamQuestion => ({
  id: crypto.randomUUID(),
  prompt: "",
  type: "short",
  options: [],
});
function ExamsPanel({ ctx }: { ctx: Context }) {
  const { role, store, classes, enrollments, notify } = ctx;
  const staff = isStaff(role);
  const [draft, setDraft] = useState({
    class_id: "",
    title: "",
    instructions: "",
    due_at: "",
    published: true,
  });
  const [questions, setQuestions] = useState<ExamQuestion[]>([newQuestion()]);
  async function create(event: FormEvent) {
    event.preventDefault();
    if (
      questions.some(
        (item) => !item.prompt.trim() || (item.type === "choice" && item.options.length < 2),
      )
    ) {
      notify("Each question needs a prompt; multiple choice needs at least two choices.");
      return;
    }
    const success = await store.add("exams", {
      class_id: draft.class_id,
      title: draft.title,
      instructions: draft.instructions,
      questions,
      due_at: draft.due_at ? new Date(draft.due_at).toISOString() : null,
      published: draft.published,
    });
    if (success) {
      notify("Exam created.");
      setDraft({ class_id: "", title: "", instructions: "", due_at: "", published: true });
      setQuestions([newQuestion()]);
    }
  }
  const exams = store.data.exams.filter(
    (item) => classes.some((group) => group.id === item.class_id) && (staff || item.published),
  );
  return (
    <>
      {staff && (
        <form className="info-card academy-form school-form" onSubmit={create}>
          <PanelHeading
            title="Create an exam"
            copy="Write clear questions, set a due date and publish when ready."
          />
          <div className="form-grid three">
            <label>
              Class
              <ClassSelect
                classes={classes}
                value={draft.class_id}
                onChange={(value) => setDraft({ ...draft, class_id: value })}
              />
            </label>
            <label>
              Exam title
              <input
                required
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="Worship and manners review"
              />
            </label>
            <label>
              Due date
              <input
                type="datetime-local"
                value={draft.due_at}
                onChange={(e) => setDraft({ ...draft, due_at: e.target.value })}
              />
            </label>
          </div>
          <label>
            Instructions
            <textarea
              rows={2}
              value={draft.instructions}
              onChange={(e) => setDraft({ ...draft, instructions: e.target.value })}
            />
          </label>
          {questions.map((question, index) => (
            <div className="editor-question" key={question.id}>
              <div className="section-bar">
                <strong>Question {index + 1}</strong>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setQuestions((items) => items.filter((item) => item.id !== question.id))
                    }
                    aria-label={`Remove question ${index + 1}`}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <label>
                Prompt
                <input
                  required
                  value={question.prompt}
                  onChange={(e) =>
                    setQuestions((items) =>
                      items.map((item) =>
                        item.id === question.id ? { ...item, prompt: e.target.value } : item,
                      ),
                    )
                  }
                />
              </label>
              <label>
                Answer type
                <select
                  value={question.type}
                  onChange={(e) =>
                    setQuestions((items) =>
                      items.map((item) =>
                        item.id === question.id
                          ? { ...item, type: e.target.value as ExamQuestion["type"] }
                          : item,
                      ),
                    )
                  }
                >
                  <option value="short">Written answer</option>
                  <option value="choice">Multiple choice</option>
                </select>
              </label>
              {question.type === "choice" && (
                <label>
                  Choices, one per line
                  <textarea
                    rows={3}
                    value={question.options.join("\n")}
                    onChange={(e) =>
                      setQuestions((items) =>
                        items.map((item) =>
                          item.id === question.id
                            ? {
                                ...item,
                                options: e.target.value
                                  .split("\n")
                                  .map((value) => value.trim())
                                  .filter(Boolean),
                              }
                            : item,
                        ),
                      )
                    }
                  />
                </label>
              )}
            </div>
          ))}
          <button
            type="button"
            className="add-child"
            onClick={() => setQuestions((items) => [...items, newQuestion()])}
          >
            <Plus size={17} /> Add question
          </button>
          <label className="inline-check">
            <input
              type="checkbox"
              checked={draft.published}
              onChange={(e) => setDraft({ ...draft, published: e.target.checked })}
            />{" "}
            Publish to families
          </label>
          <button className="academy-button small" disabled={!classes.length}>
            <Plus size={17} /> Create exam
          </button>
        </form>
      )}
      <PanelHeading
        title={
          staff ? "Assessments and submissions" : role === "parent" ? "Exam results" : "Your exams"
        }
      />
      <div className="school-list">
        {exams.map((exam) => (
          <article className="info-card school-exam-card" key={exam.id}>
            <div className="school-record-top">
              <div>
                <span className="school-kicker">
                  {className(store.data, exam.class_id)} ·{" "}
                  {exam.due_at ? `Due ${niceDate(exam.due_at)}` : "Open date"}
                </span>
                <h3>{exam.title}</h3>
              </div>
              <span className="pill">{exam.published ? "Published" : "Draft"}</span>
            </div>
            <p>{exam.instructions || `${exam.questions.length} question(s)`}</p>
            {staff && (
              <div className="school-inline-actions">
                <button
                  onClick={() => store.update("exams", exam.id, { published: !exam.published })}
                >
                  {exam.published ? "Unpublish" : "Publish"}
                </button>
                <span>
                  {store.data.exam_submissions.filter((item) => item.exam_id === exam.id).length}{" "}
                  submitted
                </span>
              </div>
            )}
            {enrollments
              .filter((item) => item.class_id === exam.class_id)
              .map((enrollment) => (
                <ExamLearner key={enrollment.id} ctx={ctx} exam={exam} enrollment={enrollment} />
              ))}
          </article>
        ))}
        {!exams.length && (
          <Empty>
            {staff ? "Create the first exam above." : "No exam is published for your class yet."}
          </Empty>
        )}
      </div>
    </>
  );
}
function ExamLearner({
  ctx,
  exam,
  enrollment,
}: {
  ctx: Context;
  exam: SchoolData["exams"][number];
  enrollment: SchoolEnrollment;
}) {
  const { role, store, notify } = ctx;
  const staff = isStaff(role);
  const student = role === "student";
  const submission = store.data.exam_submissions.find(
    (item) => item.exam_id === exam.id && item.enrollment_id === enrollment.id,
  );
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [score, setScore] = useState(submission?.score?.toString() ?? "");
  const [feedback, setFeedback] = useState(submission?.feedback ?? "");
  const closed = Boolean(exam.due_at && new Date(exam.due_at) < new Date());
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (
      await store.add("exam_submissions", {
        exam_id: exam.id,
        enrollment_id: enrollment.id,
        answers,
        score: null,
        feedback: "",
        submitted_at: new Date().toISOString(),
      })
    ) {
      notify("Exam submitted for teacher review.");
    }
  }
  return (
    <div className="school-submission">
      <div className="school-record-top">
        <strong>{staff ? learnerLabel(enrollment, store.data) : "Your exam"}</strong>
        <span className="pill">
          {submission
            ? submission.score === null
              ? "Submitted · awaiting grade"
              : `Graded · ${submission.score}%`
            : closed
              ? "Closed"
              : "Open"}
        </span>
      </div>
      {submission ? (
        <>
          {exam.questions.map((item) => (
            <p key={item.id}>
              <strong>{item.prompt}</strong>
              <br />
              {submission.answers[item.id] || "No answer"}
            </p>
          ))}
          {submission.feedback && (
            <p>
              <strong>Teacher feedback:</strong> {submission.feedback}
            </p>
          )}
          <Attachments
            context="exam_submission"
            contextId={submission.id}
            canAdd={student}
            demo={ctx.demo}
            label="Submitted files"
          />
          {staff && (
            <form
              className="academy-form school-grade-form"
              onSubmit={async (event) => {
                event.preventDefault();
                if (
                  await store.update("exam_submissions", submission.id, {
                    score: Number(score),
                    feedback,
                  })
                )
                  notify("Exam grade saved.");
              }}
            >
              <label>
                Score %
                <input
                  required
                  type="number"
                  min="0"
                  max="100"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                />
              </label>
              <label>
                Feedback
                <input value={feedback} onChange={(e) => setFeedback(e.target.value)} />
              </label>
              <button className="academy-button small">Save grade</button>
            </form>
          )}
        </>
      ) : student && !closed ? (
        <form className="academy-form" onSubmit={submit}>
          {exam.questions.map((item, index) => (
            <label key={item.id}>
              {index + 1}. {item.prompt}
              {item.type === "choice" ? (
                <select
                  required
                  value={answers[item.id] || ""}
                  onChange={(e) => setAnswers({ ...answers, [item.id]: e.target.value })}
                >
                  <option value="">Choose an answer</option>
                  {item.options.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              ) : (
                <textarea
                  required
                  rows={3}
                  value={answers[item.id] || ""}
                  onChange={(e) => setAnswers({ ...answers, [item.id]: e.target.value })}
                />
              )}
            </label>
          ))}
          <button className="academy-button small">Submit exam</button>
        </form>
      ) : (
        <p className="form-note">
          {closed
            ? "This exam is closed."
            : staff
              ? "No answer submitted yet."
              : "The student can complete this exam in the student account."}
        </p>
      )}
    </div>
  );
}

function ProgressPanel({ ctx, learnersOnly }: { ctx: Context; learnersOnly: boolean }) {
  const { role, store, enrollments, notify } = ctx;
  const staff = isStaff(role);
  const [draft, setDraft] = useState({ enrollment_id: "", topic: "", note: "", next_step: "" });
  async function create(event: FormEvent) {
    event.preventDefault();
    if (await store.add("progress_notes", { ...draft, created_at: new Date().toISOString() })) {
      notify("Progress note shared with the family.");
      setDraft({ enrollment_id: "", topic: "", note: "", next_step: "" });
    }
  }
  return (
    <>
      {staff && (
        <form className="info-card academy-form school-form" onSubmit={create}>
          <PanelHeading
            title="Add a progress note"
            copy="Describe the learner’s strengths and a specific next step."
          />
          <div className="form-grid">
            <label>
              Learner
              <LearnerSelect
                ctx={ctx}
                value={draft.enrollment_id}
                onChange={(value) => setDraft({ ...draft, enrollment_id: value })}
              />
            </label>
            <label>
              Learning area
              <input
                required
                value={draft.topic}
                onChange={(e) => setDraft({ ...draft, topic: e.target.value })}
                placeholder="Salah and daily worship"
              />
            </label>
          </div>
          <label>
            Teacher note
            <textarea
              required
              rows={3}
              value={draft.note}
              onChange={(e) => setDraft({ ...draft, note: e.target.value })}
            />
          </label>
          <label>
            Next step
            <input
              value={draft.next_step}
              onChange={(e) => setDraft({ ...draft, next_step: e.target.value })}
              placeholder="Practise the steps of Wudu"
            />
          </label>
          <button className="academy-button small" disabled={!enrollments.length}>
            <Plus size={17} /> Share progress note
          </button>
        </form>
      )}
      {learnersOnly && (
        <>
          <PanelHeading title="Class roster" copy="Learner placement and recent notes." />
          <div className="school-card-grid">
            {enrollments.map((item) => (
              <article className="info-card" key={item.id}>
                <span className="school-kicker">{className(store.data, item.class_id || "")}</span>
                <h3>{learnerLabel(item, store.data)}</h3>
                <span className="pill">{item.status}</span>
                <p>
                  {
                    store.data.progress_notes.filter((note) => note.enrollment_id === item.id)
                      .length
                  }{" "}
                  progress note(s)
                </p>
              </article>
            ))}
            {!enrollments.length && (
              <Empty>No learners have been placed in your classes yet.</Empty>
            )}
          </div>
        </>
      )}
      <PanelHeading title="Progress and next steps" />
      <div className="school-list">
        {store.data.progress_notes
          .filter((note) => enrollments.some((item) => item.id === note.enrollment_id))
          .sort((a, b) => b.created_at.localeCompare(a.created_at))
          .map((note) => (
            <article className="info-card school-progress-card" key={note.id}>
              <span className="school-kicker">
                {staff
                  ? learnerLabel(
                      enrollments.find((item) => item.id === note.enrollment_id)!,
                      store.data,
                    )
                  : "Your learning"}{" "}
                · {niceDate(note.created_at)}
              </span>
              <h3>{note.topic}</h3>
              <p>{note.note}</p>
              {note.next_step && (
                <div className="school-next-step">
                  <Check size={16} />
                  <span>
                    <strong>Next step:</strong> {note.next_step}
                  </span>
                </div>
              )}
            </article>
          ))}
        {!store.data.progress_notes.some((note) =>
          enrollments.some((item) => item.id === note.enrollment_id),
        ) && <Empty>Progress notes will appear after your first lessons.</Empty>}
      </div>
    </>
  );
}

function AnnouncementsPanel({ ctx }: { ctx: Context }) {
  const { role, store, classes, notify } = ctx;
  const staff = isStaff(role);
  const [draft, setDraft] = useState({ class_id: "", title: "", body: "" });
  async function create(event: FormEvent) {
    event.preventDefault();
    if (
      await store.add("class_announcements", { ...draft, created_at: new Date().toISOString() })
    ) {
      notify("Announcement shared with the class.");
      setDraft({ class_id: "", title: "", body: "" });
    }
  }
  const posts = store.data.class_announcements
    .filter((item) => classes.some((group) => group.id === item.class_id))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  return (
    <>
      {staff && (
        <form className="info-card academy-form school-form" onSubmit={create}>
          <PanelHeading
            title="Share a class update"
            copy="Families and learners in the class will see this announcement."
          />
          <div className="form-grid">
            <label>
              Class
              <ClassSelect
                classes={classes}
                value={draft.class_id}
                onChange={(value) => setDraft({ ...draft, class_id: value })}
              />
            </label>
            <label>
              Title
              <input
                required
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="What to bring to class"
              />
            </label>
          </div>
          <label>
            Message
            <textarea
              required
              rows={4}
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            />
          </label>
          <button className="academy-button small" disabled={!classes.length}>
            <Megaphone size={17} /> Publish update
          </button>
        </form>
      )}
      <PanelHeading title="Class news" />
      <div className="school-list">
        {posts.map((post) => (
          <article className="info-card school-news-card" key={post.id}>
            <span className="school-kicker">
              {className(store.data, post.class_id)} · {niceDate(post.created_at)}
            </span>
            <h3>{post.title}</h3>
            <p>{post.body}</p>
          </article>
        ))}
        {!posts.length && <Empty>No class announcements yet.</Empty>}
      </div>
    </>
  );
}

function PaymentsPanel({ ctx }: { ctx: Context }) {
  const { store, enrollments } = ctx;
  const records = store.data.payments.filter((item) =>
    enrollments.some((e) => e.id === item.enrollment_id),
  );
  return (
    <>
      <PanelHeading
        title="Manual payment records"
        copy="The academy records status after confirming a payment outside the website. This page does not charge you."
      />
      <div className="school-list">
        {records.map((record) => (
          <article className="info-card school-payment-card" key={record.id}>
            <div>
              <span className="school-kicker">
                {learnerLabel(
                  enrollments.find((item) => item.id === record.enrollment_id)!,
                  store.data,
                )}
              </span>
              <h3>
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: record.currency,
                }).format(record.amount)}
              </h3>
              <p>{record.reference || "No reference"}</p>
            </div>
            <span className="pill">{record.status}</span>
          </article>
        ))}
        {!records.length && <Empty>No payment records are available yet.</Empty>}
      </div>
    </>
  );
}
