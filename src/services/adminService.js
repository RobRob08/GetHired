import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    updateDoc,
    where,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const usersCollection = collection(db, "users");
const jobsCollection = collection(db, "jobs");
const applicationsCollection = collection(db, "applications");

export const getAdminStats = async () => {
  try {
    // Total users (all)
    const usersSnap = await getDocs(usersCollection);
    const totalUsers = usersSnap.size;

    // Regular users count (only role: 'user')
    const regularUsersQ = query(usersCollection, where("role", "==", "user"));
    const regularUsersSnap = await getDocs(regularUsersQ);
    const regularUsers = regularUsersSnap.size;

    // Employers count
    const employersQ = query(usersCollection, where("role", "==", "employer"));
    const employersSnap = await getDocs(employersQ);
    const totalEmployers = employersSnap.size;

    // Active jobs
    const activeJobsQ = query(jobsCollection, where("active", "==", true));
    const jobsSnap = await getDocs(activeJobsQ);
    const activeJobs = jobsSnap.size;

    // Total applications
    const appsSnap = await getDocs(applicationsCollection);
    const totalApplications = appsSnap.size;

    return {
      totalUsers,
      regularUsers,
      totalEmployers,
      activeJobs,
      totalApplications,
    };
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return {
      totalUsers: 0,
      regularUsers: 0,
      totalEmployers: 0,
      activeJobs: 0,
      totalApplications: 0,
    };
  }
};

export const subscribeToAllUsers = (onUsers, onError) => {
  const q = query(usersCollection, orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => {
      const users = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      onUsers(users);
    },
    (error) => onError?.(error),
  );
};

export const subscribeToAllJobs = (onJobs, onError) => {
  const q = query(jobsCollection, orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => {
      const jobs = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      onJobs(jobs);
    },
    (error) => onError?.(error),
  );
};

export const subscribeToFlaggedContent = (onFlagged, onError) => {
  const flaggedJobs = query(jobsCollection, where("flagged", "==", true));
  return onSnapshot(
    flaggedJobs,
    (snap) => {
      const flagged = snap.docs
        .map((d) => ({
          id: d.id,
          type: "job",
          ...d.data(),
        }))
        .sort(
          (a, b) => (b.flaggedAt?.toDate() || 0) - (a.flaggedAt?.toDate() || 0),
        );
      onFlagged(flagged);
    },
    (error) => onError?.(error),
  );
};

export const reviewFlaggedJob = async (jobId, approved = true) => {
  try {
    const jobRef = doc(db, "jobs", jobId);
    if (approved) {
      await updateDoc(jobRef, { flagged: false, flaggedAt: null });
    } else {
      await deleteDoc(jobRef);
    }
  } catch (error) {
    console.error("Error reviewing flagged job:", error);
    throw error;
  }
};

export const toggleUserStatus = async (userId, shouldActivate) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { active: shouldActivate });
  } catch (error) {
    console.error("Error updating user status:", error);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    await deleteDoc(userRef);
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

export const getDailyActivity = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    // New users today
    const newUsersQ = query(
      usersCollection,
      where("createdAt", ">=", todayTimestamp),
    );
    const newUsersSnap = await getDocs(newUsersQ);
    const newUsersCount = newUsersSnap.size;

    // New jobs posted today
    const newJobsQ = query(
      jobsCollection,
      where("createdAt", ">=", todayTimestamp),
    );
    const newJobsSnap = await getDocs(newJobsQ);
    const newJobsCount = newJobsSnap.size;

    // Applications today
    const appsQ = query(
      applicationsCollection,
      where("createdAt", ">=", todayTimestamp),
    );
    const appsSnap = await getDocs(appsQ);
    const applicationsCount = appsSnap.size;

    return {
      newUsers: newUsersCount,
      newJobs: newJobsCount,
      applications: applicationsCount,
    };
  } catch (error) {
    console.error("Error fetching daily activity:", error);
    return {
      newUsers: 0,
      newJobs: 0,
      applications: 0,
    };
  }
};

export const subscribeToDailyActivity = (onActivity, onError) => {
  const checkActivity = async () => {
    try {
      const activity = await getDailyActivity();
      onActivity(activity);
    } catch (error) {
      onError?.(error);
    }
  };

  // Check immediately
  checkActivity();

  // Set interval to check every 30 seconds
  const interval = setInterval(checkActivity, 30000);

  return () => clearInterval(interval);
};
