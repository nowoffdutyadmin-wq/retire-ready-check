export type Member = {
  id: string;
  email: string;
  full_name: string;
  timezone: string;
  cohort_id: string | null;
  role: "member" | "admin";
  onboarded: boolean;
  created_at: string;
};

export type Cohort = {
  id: string;
  name: string;
  start_date: string;
  status: "active" | "completed" | "upcoming";
  created_at: string;
};

export type DailyContent = {
  id: string;
  cohort_id: string;
  week_number: number;
  day_number: number;
  title: string;
  audio_url: string;
  duration_seconds: number;
  unlock_date: string;
};

export type PracticeLog = {
  id: string;
  member_id: string;
  content_id: string;
  completed_at: string;
  completion_date: string;
  percent_completed: number;
};

export type PairStreak = {
  id: string;
  pair_id: string;
  current_streak: number;
  longest_streak: number;
  last_joint_completion_date: string | null;
  updated_at: string;
};

export type PairMember = {
  pair_id: string;
  member_id: string;
  members: Member;
};
