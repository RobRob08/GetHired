import { useEffect, useMemo, useState } from "react";
import { auth } from "../firebase/firebaseConfig";
import { subscribeUserNotifications } from "../services/applicationsService";

const isLogoutPermissionError = (error) => {
  return error?.code === "permission-denied" && !auth.currentUser;
};

const useNotifications = ({ recipientId }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (!recipientId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = subscribeUserNotifications(
      recipientId,
      (next) => {
        setNotifications(next);
        setErrorMsg(null);
        setLoading(false);
      },
      (err) => {
        if (isLogoutPermissionError(err)) {
          setNotifications([]);
          setErrorMsg(null);
          setLoading(false);
          return;
        }
        setErrorMsg(err?.message ?? "Could not load notifications.");
        setLoading(false);
      },
      10,
    );

    return () => unsub?.();
  }, [recipientId]);

  const unreadCount = useMemo(() => {
    return notifications.reduce((acc, n) => acc + (n.read ? 0 : 1), 0);
  }, [notifications]);

  return { notifications, unreadCount, loading, errorMsg };
};

export default useNotifications;
