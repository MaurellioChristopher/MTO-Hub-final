// Type definitions for MTO-Hub

export type UserRole = "Admin" | "User";
export type Department = "INTI" | "MI" | "MP" | "SD" | "SI";
export type AttendanceStatus = "present" | "absent" | "excused";

export interface User {
  id: string;
  name: string;
  nim: string;
  email?: string | null;
  role: UserRole;
  department: Department;
  avatar_url?: string | null;
  is_active: boolean;
  created_at: string;
}

// Alias for member display
export type Member = User;

export interface Event {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  date: Date;
  created_by?: string | null;
  created_at: Date;
}

export interface Attendance {
  id: string;
  event_id: string;
  user_id: string;
  photo_url?: string | null;
  status: AttendanceStatus;
  timestamp: Date;
}

export interface MotmRating {
  id: string;
  rater_id: string;
  target_id: string;
  score: number;
  month: number;
  year: number;
  feedback_text?: string | null;
  created_at: Date;
}

export interface FeedbackEvent {
  id: string;
  event_id: string;
  user_id: string;
  comment?: string | null;
  rating?: number | null;
  created_at: Date;
}

// Extended types with relations
export interface UserWithStats extends User {
  average_score?: number;
  attendance_rate?: number;
}

export interface AttendanceWithUser extends Attendance {
  user: User;
}

export interface AttendanceWithEvent extends Attendance {
  event: Event;
}

export interface MotmLeaderboardEntry {
  user: User;
  average_score: number;
  total_ratings: number;
  rank: number;
}

// NextAuth session extension
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      nim: string;
      email: string;
      role: UserRole;
      department: Department;
    };
  }

  interface User {
    id: string;
    name: string;
    nim: string;
    email: string;
    role: UserRole;
    department: Department;
  }
}
