import { useEffect, useMemo, useState } from "react";
import { auth } from "../firebase/firebaseConfig";
import { subscribeUserApplications } from "../services/applicationsService";

const isLogoutPermissionError = (error) => {
  return error?.code === "permission-denied" && !auth.currentUser;
};

const useApplications = ({ applicantId }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (!applicantId) {
      setApplications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = subscribeUserApplications(
      applicantId,
      (apps) => {
        setApplications(apps);
        setErrorMsg(null);
        setLoading(false);
      },
      (err) => {
        if (isLogoutPermissionError(err)) {
          setApplications([]);
          setErrorMsg(null);
          setLoading(false);
          return;
        }
        setErrorMsg(err?.message ?? "Could not load applications.");
        setLoading(false);
      },
    );

    return () => unsub?.();
  }, [applicantId]);

  const counts = useMemo(() => {
    const c = { Applied: 0, Approved: 0, Hired: 0, Rejected: 0 };
    for (const a of applications) {
      const s = a.status ?? "Applied";
      if (c[s] != null) c[s] += 1;
    }
    return c;
  }, [applications]);

  return { applications, counts, loading, errorMsg };
};

export default useApplications;
