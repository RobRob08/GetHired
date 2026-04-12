import { useEffect, useState } from "react";
import { auth } from "../firebase/firebaseConfig";
import { subscribeToActiveJobs } from "../services/jobsService";

const isLogoutPermissionError = (error) => {
  return error?.code === "permission-denied" && !auth.currentUser;
};

const useJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToActiveJobs(
      (nextJobs) => {
        setJobs(nextJobs);
        setErrorMsg(null);
        setLoading(false);
      },
      (error) => {
        if (isLogoutPermissionError(error)) {
          setJobs([]);
          setErrorMsg(null);
          setLoading(false);
          return;
        }
        setErrorMsg(error?.message ?? "Could not load jobs.");
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  return { jobs, loading, errorMsg };
};

export default useJobs;

