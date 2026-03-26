// src/constants/data.js

// Demo job listings used across Home and Map screens
export const JOBS = [
  {
    id: 1,
    title: "Senior React Native Dev",
    company: "TechCorp PH",
    latitude: 14.5547,
    longitude: 121.0244,
    salary: "₱120k / mo",
    type: "Full-time",
    category: "Tech",
  },
  {
    id: 2,
    title: "UI/UX Designer",
    company: "Creative Studio",
    latitude: 14.549,
    longitude: 121.019,
    salary: "₱70k / mo",
    type: "Remote",
    category: "Design",
  },
  {
    id: 3,
    title: "Frontend Engineer",
    company: "Startup Labs",
    latitude: 14.561,
    longitude: 121.03,
    salary: "₱90k / mo",
    type: "Hybrid",
    category: "Tech",
  },
  {
    id: 4,
    title: "Data Analyst",
    company: "DataFlow Inc.",
    latitude: 14.552,
    longitude: 121.017,
    salary: "₱65k / mo",
    type: "Full-time",
    category: "Data",
  },
  {
    id: 5,
    title: "Mobile Developer",
    company: "AppWorks",
    latitude: 14.558,
    longitude: 121.035,
    salary: "₱85k / mo",
    type: "Hybrid",
    category: "Tech",
  },
];

// Job categories for the Home screen
import COLORS from "./colors";
export const JOB_CATEGORIES = [
  {
    id: "tech",
    label: "Tech",
    count: 124,
    color: COLORS.primary,
    bg: COLORS.primaryBg,
  },
  {
    id: "design",
    label: "Design",
    count: 42,
    color: COLORS.secondary,
    bg: COLORS.secondaryBg,
  },
  {
    id: "data",
    label: "Data",
    count: 31,
    color: COLORS.success,
    bg: COLORS.successBg,
  },
  {
    id: "support",
    label: "Support",
    count: 27,
    color: COLORS.orange,
    bg: COLORS.orangeBg,
  },
];

// Applications for the Track screen
export const APPLICATIONS = [
  {
    id: "a1",
    title: "React Native Dev",
    company: "TechCorp PH",
    date: "Feb 10",
    status: "Interview",
  },
  {
    id: "a2",
    title: "UI/UX Designer",
    company: "Creative Studio",
    date: "Feb 8",
    status: "Applied",
  },
  {
    id: "a3",
    title: "Frontend Engineer",
    company: "Startup Labs",
    date: "Feb 6",
    status: "Reviewed",
  },
  {
    id: "a4",
    title: "Data Analyst",
    company: "DataFlow Inc.",
    date: "Feb 3",
    status: "Rejected",
  },
];

// Employer postings for the employer dashboard
export const EMPLOYER_POSTINGS = [
  {
    id: "e1",
    title: "Senior React Native Dev",
    applicants: 24,
    date: "Posted 3d ago",
    status: "Active",
  },
  {
    id: "e2",
    title: "UI/UX Designer",
    applicants: 12,
    date: "Posted 1w ago",
    status: "Active",
  },
  {
    id: "e3",
    title: "QA Engineer",
    applicants: 7,
    date: "Posted 2w ago",
    status: "Paused",
  },
  {
    id: "e4",
    title: "IT Support Specialist",
    applicants: 15,
    date: "Closed Jan 30",
    status: "Closed",
  },
];
