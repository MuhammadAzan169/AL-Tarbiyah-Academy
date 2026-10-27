import { useCallback, useEffect, useState } from "react";
import { supabase, type Child } from "@/lib/academy";
import type { Exam, ExamSubmission } from "./exams";

export type SchoolClass = {
  id: string;
  title: string;
  grade: number;
  teacher_id: string | null;
  schedule_text: string;
  time_zone: string;
  meeting_url: string;
};
export type SchoolFamily = {
  id: string;
  parent_name: string;
  email: string;
  children: Child[];
  country: string;
  source_type: string;
  source_detail: string;
  influencer_id: string | null;
};
export type SchoolEnrollment = {
  id: string;
  submission_id: string;
  child_index: number;
  student_name: string;
  student_email: string;
  grade: number;
  class_id: string | null;
  status: string;
};
export type TimetableSlot = {
  id: string;
  class_id: string;
  weekday: number;
  starts_local: string;
  duration_minutes: number;
  subject: string;
};
export type SchoolLesson = {
  id: string;
  class_id: string;
  starts_at: string;
  topic: string;
  summary: string;
};
export type SchoolAttendance = {
  id: string;
  lesson_id: string;
  enrollment_id: string;
  status: string;
};
export type Homework = {
  id: string;
  class_id: string;
  title: string;
  instructions: string;
  due_at: string | null;
  resource_url: string;
  published: boolean;
  created_at: string;
};
export type HomeworkSubmission = {
  id: string;
  assignment_id: string;
  enrollment_id: string;
  answer: string;
  score: number | null;
  feedback: string;
  submitted_at: string;
};
export type Announcement = {
  id: string;
  class_id: string;
  title: string;
  body: string;
  created_at: string;
};
export type ProgressNote = {
  id: string;
  enrollment_id: string;
  topic: string;
  note: string;
  next_step: string;
  created_at: string;
};
export type SchoolPayment = {
  id: string;
  enrollment_id: string;
  amount: number;
  currency: string;
  status: string;
  reference: string;
};
export type SchoolProfile = { id: string; full_name: string; role: string };
export type SchoolData = {
  classes: SchoolClass[];
  families: SchoolFamily[];
  enrollments: SchoolEnrollment[];
  profiles: SchoolProfile[];
  timetable_slots: TimetableSlot[];
  lessons: SchoolLesson[];
  attendance: SchoolAttendance[];
  homework_assignments: Homework[];
  homework_submissions: HomeworkSubmission[];
  exams: Exam[];
  exam_submissions: ExamSubmission[];
  class_announcements: Announcement[];
  progress_notes: ProgressNote[];
  payments: SchoolPayment[];
};
export type WritableTable = Exclude<
  keyof SchoolData,
  "families" | "enrollments" | "payments" | "profiles"
>;
const empty: SchoolData = {
  classes: [],
  families: [],
  enrollments: [],
  profiles: [],
  timetable_slots: [],
  lessons: [],
  attendance: [],
  homework_assignments: [],
  homework_submissions: [],
  exams: [],
  exam_submissions: [],
  class_announcements: [],
  progress_notes: [],
  payments: [],
};
const demoKey = "noor-school-demo-v4";
const iso = (days: number) => new Date(Date.now() + days * 86400000).toISOString();
const demoSeed = (): SchoolData => ({
  classes: [
    {
      id: "class-3a",
      title: "Grade 3 · Cedar Group",
      grade: 3,
      teacher_id: "demo-teacher",
      schedule_text: "Monday, Wednesday and Friday · 16:00 UTC",
      time_zone: "UTC",
      meeting_url: "https://meet.google.com/",
    },
  ],
  families: [
    {
      id: "family-amina",
      parent_name: "Amina Rahman",
      email: "amina@example.com",
      country: "United Kingdom",
      source_type: "website",
      source_detail: "Academy website",
      influencer_id: null,
      children: [
        {
          age: "9",
          grade: "Grade 3",
          listening: "Understands most everyday English conversations.",
          reading: "Can read short paragraphs.",
          writing: "Can write simple English sentences.",
          accessibility: "No",
        },
      ],
    },
  ],
  enrollments: [
    {
      id: "student-yusuf",
      submission_id: "family-amina",
      child_index: 0,
      student_name: "Yusuf Rahman",
      student_email: "yusuf@example.com",
      grade: 3,
      class_id: "class-3a",
      status: "active",
    },
  ],
  profiles: [{ id: "demo-teacher", full_name: "Ustadha Maryam", role: "teacher" }],
  timetable_slots: [
    {
      id: "slot-mon",
      class_id: "class-3a",
      weekday: 1,
      starts_local: "16:00",
      duration_minutes: 50,
      subject: "Aqeedah & identity",
    },
    {
      id: "slot-wed",
      class_id: "class-3a",
      weekday: 3,
      starts_local: "16:00",
      duration_minutes: 50,
      subject: "Wudu & Salah",
    },
    {
      id: "slot-fri",
      class_id: "class-3a",
      weekday: 5,
      starts_local: "16:00",
      duration_minutes: 50,
      subject: "Seerah & character",
    },
  ],
  lessons: [
    {
      id: "lesson-1",
      class_id: "class-3a",
      starts_at: iso(-2),
      topic: "The five pillars",
      summary: "We named each pillar and discussed simple ways faith shapes daily life.",
    },
    {
      id: "lesson-2",
      class_id: "class-3a",
      starts_at: iso(1),
      topic: "Kindness in the Seerah",
      summary:
        "We will explore examples of mercy and kindness from the life of Prophet Muhammad ﷺ.",
    },
  ],
  attendance: [
    {
      id: "attendance-1",
      lesson_id: "lesson-1",
      enrollment_id: "student-yusuf",
      status: "present",
    },
  ],
  homework_assignments: [
    {
      id: "homework-1",
      class_id: "class-3a",
      title: "A kindness journal",
      instructions: "Write two ways you showed kindness this week and how it made someone feel.",
      due_at: iso(4),
      resource_url: "",
      published: true,
      created_at: iso(-1),
    },
  ],
  homework_submissions: [],
  exams: [
    {
      id: "exam-1",
      class_id: "class-3a",
      title: "The five pillars review",
      instructions: "Answer in your own words.",
      questions: [
        { id: "q1", prompt: "Name two pillars of Islam.", type: "short", options: [] },
        { id: "q2", prompt: "What does Salah mean to you?", type: "short", options: [] },
      ],
      due_at: iso(8),
      published: true,
    },
  ],
  exam_submissions: [],
  class_announcements: [
    {
      id: "notice-1",
      class_id: "class-3a",
      title: "Welcome to Cedar Group",
      body: "Please bring a notebook to each live class. Families can read lesson summaries here after class.",
      created_at: iso(-4),
    },
  ],
  progress_notes: [
    {
      id: "progress-1",
      enrollment_id: "student-yusuf",
      topic: "Belief and worship",
      note: "Yusuf can explain the five pillars and enjoys class discussion.",
      next_step: "Practice the steps of Wudu in the next lesson.",
      created_at: iso(-2),
    },
  ],
  payments: [
    {
      id: "payment-1",
      enrollment_id: "student-yusuf",
      amount: 45,
      currency: "USD",
      status: "pending",
      reference: "DEMO-001",
    },
  ],
});
const names = Object.keys(empty) as (keyof SchoolData)[];
const tableName = (key: keyof SchoolData) => (key === "families" ? "survey_submissions" : key);
export function useSchoolData(demo: boolean) {
  const [data, setData] = useState<SchoolData>(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (demo) {
      try {
        const stored = localStorage.getItem(demoKey);
        setData(stored ? { ...demoSeed(), ...(JSON.parse(stored) as SchoolData) } : demoSeed());
      } catch {
        setData(demoSeed());
      }
      setLoading(false);
      return;
    }
    if (!supabase) {
      setLoading(false);
      setError("Connect Supabase to use real school records.");
      return;
    }
    let current = true;
    setLoading(true);
    Promise.all(names.map((name) => supabase!.from(tableName(name)).select("*"))).then(
      (results) => {
        if (!current) return;
        const next = { ...empty };
        names.forEach((name, index) => {
          (next as unknown as Record<string, unknown>)[name] = results[index]?.data ?? [];
        });
        setData(next);
        setError(results.find((result) => result.error)?.error?.message ?? "");
        setLoading(false);
      },
    );
    return () => {
      current = false;
    };
  }, [demo, revision]);
  useEffect(() => {
    if (demo && !loading) localStorage.setItem(demoKey, JSON.stringify(data));
  }, [demo, data, loading]);
  const reload = useCallback(() => setRevision((value) => value + 1), []);
  async function add<T extends WritableTable>(table: T, record: Omit<SchoolData[T][number], "id">) {
    setError("");
    if (demo) {
      const value = { ...record, id: crypto.randomUUID() } as SchoolData[T][number];
      setData((previous) => ({ ...previous, [table]: [...previous[table], value] }));
      return true;
    }
    const result = await supabase!.from(table).insert(record as never);
    if (result.error) {
      setError(result.error.message);
      return false;
    }
    reload();
    return true;
  }
  async function update<T extends WritableTable>(
    table: T,
    id: string,
    patch: Partial<SchoolData[T][number]>,
  ) {
    setError("");
    if (demo) {
      setData((previous) => ({
        ...previous,
        [table]: previous[table].map((item) => (item.id === id ? { ...item, ...patch } : item)),
      }));
      return true;
    }
    const result = await supabase!
      .from(table)
      .update(patch as never)
      .eq("id", id);
    if (result.error) {
      setError(result.error.message);
      return false;
    }
    reload();
    return true;
  }
  async function remove<T extends WritableTable>(table: T, id: string) {
    setError("");
    if (demo) {
      setData((previous) => ({
        ...previous,
        [table]: previous[table].filter((item) => item.id !== id),
      }));
      return true;
    }
    const result = await supabase!.from(table).delete().eq("id", id);
    if (result.error) {
      setError(result.error.message);
      return false;
    }
    reload();
    return true;
  }
  async function upsertAttendance(lesson_id: string, enrollment_id: string, status: string) {
    setError("");
    if (demo) {
      setData((previous) => {
        const found = previous.attendance.find(
          (item) => item.lesson_id === lesson_id && item.enrollment_id === enrollment_id,
        );
        return {
          ...previous,
          attendance: found
            ? previous.attendance.map((item) => (item.id === found.id ? { ...item, status } : item))
            : [
                ...previous.attendance,
                { id: crypto.randomUUID(), lesson_id, enrollment_id, status },
              ],
        };
      });
      return true;
    }
    const result = await supabase!
      .from("attendance")
      .upsert({ lesson_id, enrollment_id, status }, { onConflict: "lesson_id,enrollment_id" });
    if (result.error) {
      setError(result.error.message);
      return false;
    }
    reload();
    return true;
  }
  function resetDemo() {
    if (!demo) return;
    setData(demoSeed());
    setError("");
  }
  function setDemoPaymentStatus(id: string, status: string) {
    if (!demo) return;
    setData((previous) => ({
      ...previous,
      payments: previous.payments.map((item) => (item.id === id ? { ...item, status } : item)),
    }));
  }
  return {
    data,
    loading,
    error,
    reload,
    add,
    update,
    remove,
    upsertAttendance,
    resetDemo,
    setDemoPaymentStatus,
  };
}
export function learnerLabel(enrollment: SchoolEnrollment, data: SchoolData) {
  const family = data.families.find((item) => item.id === enrollment.submission_id);
  return `${enrollment.student_name || `${family?.parent_name || family?.email || "Family"} · Child ${enrollment.child_index + 1}`} · Grade ${enrollment.grade}`;
}
