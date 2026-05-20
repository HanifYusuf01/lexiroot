// Admin overview analytics payload — drives the dashboard cards/charts.

export interface AnalyticsDailyActivityPoint {
  date: string;
  label: string;
  active: number;
  newUsers: number;
}

export interface AnalyticsTopLanguage {
  language: string;
  code: string;
  percent: number;
  color: string;
}

export interface AnalyticsTopLesson {
  id: string;
  title: string;
  level: string;
  completions: number;
  progress: number;
  color: string;
}

export interface AnalyticsOverview {
  totalUsers: number;
  activeUsers: number;
  lessonsCompleted: number;
  xpEarned: number;
  dailyActivity: AnalyticsDailyActivityPoint[];
  topLanguages: AnalyticsTopLanguage[];
  topLessons: AnalyticsTopLesson[];
}
