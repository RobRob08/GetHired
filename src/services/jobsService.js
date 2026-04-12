import {
    addDoc,
    collection,
    onSnapshot,
    query,
    serverTimestamp,
    where,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const jobsCollection = collection(db, "jobs");

const toJob = (docSnap) => {
  const data = docSnap.data();
  const lat = data?.location?.lat ?? data?.latitude ?? null;
  const lng = data?.location?.lng ?? data?.longitude ?? null;

  return {
    id: docSnap.id,
    title: data.title ?? "",
    company: data.company ?? "",
    salary: data.salary ?? "",
    type: data.type ?? "Full-time",
    category: data.category ?? "General",
    latitude: lat,
    longitude: lng,
    active: data.active ?? true,
    createdBy: data.createdBy ?? null,
    createdAt: data.createdAt ?? null,
  };
};

export const subscribeToActiveJobs = (onJobs, onError) => {
  const q = query(jobsCollection, where("active", "==", true));
  return onSnapshot(
    q,
    (snap) => {
      const jobs = snap.docs
        .map(toJob)
        .filter((job) => job.latitude != null && job.longitude != null);
      onJobs(jobs);
    },
    (error) => {
      if (onError) onError(error);
    },
  );
};

export const subscribeToEmployerJobs = (employerId, onJobs, onError) => {
  const q = query(
    jobsCollection,
    where("active", "==", true),
    where("createdBy", "==", employerId),
  );
  return onSnapshot(
    q,
    (snap) => {
      const jobs = snap.docs.map(toJob);
      onJobs(jobs);
    },
    (error) => {
      if (onError) onError(error);
    },
  );
};

export const createJobPin = async ({
  title,
  company,
  salary,
  type,
  category = "Employer",
  latitude,
  longitude,
  createdBy,
}) => {
  if (!createdBy) {
    throw new Error("createdBy (user UID) is required to post a job");
  }

  const payload = {
    title: title.trim(),
    company: company.trim(),
    salary: salary.trim(),
    type: type.trim() || "Full-time",
    category,
    location: {
      lat: latitude,
      lng: longitude,
    },
    createdBy, // Must be the authenticated user's UID
    active: true,
    createdAt: serverTimestamp(),
  };

  const ref = await addDoc(jobsCollection, payload);
  return ref.id;
};
