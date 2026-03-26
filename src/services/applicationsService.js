import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const applicationsCollection = collection(db, "applications");
const notificationsCollection = collection(db, "notifications");

export const applyToJob = async ({
  job,
  applicantId,
  applicantName,
  applicantEmail,
  employerId,
}) => {
  if (!job?.id || !applicantId || !employerId) {
    throw new Error("Missing required data for job application.");
  }

  // Prevent accidental duplicates (client-side) for UX.
  const existingQ = query(
    applicationsCollection,
    where("jobId", "==", job.id),
    where("applicantId", "==", applicantId),
  );
  const existingSnap = await getDocs(existingQ);
  if (!existingSnap.empty) {
    return { created: false, applicationId: existingSnap.docs[0].id };
  }

  const payload = {
    jobId: job.id,
    jobTitle: job.title ?? "",
    employerId,
    employerName: job.company ?? "",
    applicantId,
    applicantName: applicantName ?? "",
    applicantEmail: applicantEmail ?? "",
    status: "Applied",
    readByEmployer: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(applicationsCollection, payload);
  return { created: true, applicationId: ref.id };
};

export const subscribeEmployerApplications = (
  employerId,
  onApplications,
  onError,
) => {
  const q = query(
    applicationsCollection,
    where("employerId", "==", employerId),
    orderBy("createdAt", "desc"),
  );

  return onSnapshot(
    q,
    (snap) => {
      const apps = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      onApplications(apps);
    },
    (error) => onError?.(error),
  );
};

export const subscribeUserApplications = (
  applicantId,
  onApplications,
  onError,
) => {
  const q = query(
    applicationsCollection,
    where("applicantId", "==", applicantId),
    orderBy("createdAt", "desc"),
  );

  return onSnapshot(
    q,
    (snap) => {
      const apps = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      onApplications(apps);
    },
    (error) => onError?.(error),
  );
};

export const setApplicationStatus = async ({
  applicationId,
  employerId,
  status,
}) => {
  await updateDoc(doc(db, "applications", applicationId), {
    status,
    employerId, // keep explicit for security rules that might compare fields
    updatedAt: serverTimestamp(),
  });
};

export const createNotification = async ({
  recipientId,
  senderId,
  type,
  message,
  meta,
}) => {
  if (!recipientId || !senderId || !type || !message) {
    throw new Error("Missing notification data.");
  }

  const payload = {
    recipientId,
    senderId,
    type,
    message,
    meta: meta ?? null,
    read: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(notificationsCollection, payload);
  return ref.id;
};

export const subscribeUserNotifications = (
  recipientId,
  onNotifications,
  onError,
  limitCount = 10,
) => {
  const q = query(
    notificationsCollection,
    where("recipientId", "==", recipientId),
    orderBy("createdAt", "desc"),
  );

  // Note: Firestore doesn't allow `limitCount` to be passed conditionally
  // without affecting query identity; keep it simple for now.
  return onSnapshot(
    q,
    (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      onNotifications(all.slice(0, limitCount));
    },
    (error) => onError?.(error),
  );
};

export const markNotificationsRead = async (notificationIds) => {
  if (!Array.isArray(notificationIds) || notificationIds.length === 0) return;

  // Parallel updates (small number expected for mobile UI).
  await Promise.all(
    notificationIds.map((id) =>
      updateDoc(doc(db, "notifications", id), {
        read: true,
        updatedAt: serverTimestamp(),
      }),
    ),
  );
};

