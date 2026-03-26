import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    updateDoc,
    where
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const usersCollection = collection(db, "users");
const jobsCollection = collection(db, "jobs");
const applicationsCollection = collection(db, "applications");

export const getAdminStats = async () => {
  try {
    // Total users
    const usersSnap = await getDocs(usersCollection);
    const totalUsers = usersSnap.size;

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
      totalEmployers,
      activeJobs,
      totalApplications,
    };
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return {
      totalUsers: 0,
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
  const flaggedJobs = query(
    jobsCollection,
    where("flagged", "==", true),
    orderBy("flaggedAt", "desc"),
  );
  return onSnapshot(
    flaggedJobs,
    (snap) => {
      const flagged = snap.docs.map((d) => ({
        id: d.id,
        type: "job",
        ...d.data(),
      }));
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

export const toggleUserStatus = async (userId, isActive) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { active: !isActive });
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
