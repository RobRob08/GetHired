import { useEffect, useState } from 'react';
import { subscribeToActiveJobs } from '../services/jobsService';

const useJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToActiveJobs(
      (nextJobs) => {
        setJobs(nextJobs);
        setLoading(false);
      },
      (error) => {
        setErrorMsg(error?.message ?? 'Could not load jobs.');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  return { jobs, loading, errorMsg };
};

export default useJobs;

