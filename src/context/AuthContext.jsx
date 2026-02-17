import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEYS = {
  token: 'hackcareer_token',
  currentUser: 'hackcareer_current_user',
};

const AuthContext = createContext(null);

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function normalizeRole(role) {
  return String(role || '').toLowerCase();
}

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function parseJsonResponse(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function apiRequest(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(path, {
    method,
    headers: token ? authHeaders(token) : { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    const message = data?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

function mapUserSummary(user) {
  return {
    id: user.id,
    name: user.fullName,
    email: user.email,
    role: normalizeRole(user.role),
  };
}

function mapMentorProfile(profile) {
  return {
    id: profile.mentorId,
    name: profile.fullName,
    email: profile.email,
    role: 'mentor',
    about: profile.about,
    review: profile.review,
    rating: profile.rating,
  };
}

function mapMenteeProfile(profile) {
  return {
    id: profile.id,
    name: profile.fullName,
    email: profile.email,
    role: 'mentee',
    about: profile.bio,
    bio: profile.bio,
  };
}

function mapTask(task) {
  return {
    id: task.id,
    mentorId: task.mentorId,
    menteeId: task.menteeId,
    title: task.title,
    description: task.description,
    dueDate: task.dueDate,
    status: normalizeRole(task.status),
    completedAt: task.completedAt,
    menteeReviewForMentor: task.menteeReviewForMentor,
    menteeRatingForMentor: task.menteeRatingForMentor,
    mentorReviewForMentee: task.mentorReviewForMentee,
    mentorRatingForMentee: task.mentorRatingForMentee,
    createdAt: task.createdAt,
    mentorName: task.mentorName,
  };
}

function mapMeeting(meeting) {
  const scheduledAt = meeting.scheduledAt || '';
  const [date = '', timePart = ''] = scheduledAt.split('T');
  return {
    id: meeting.id,
    mentorId: meeting.mentorId,
    menteeId: meeting.menteeId,
    title: meeting.agenda || 'Mentorship Meeting',
    date,
    time: timePart ? timePart.slice(0, 5) : '',
    scheduledAt,
    agenda: meeting.agenda,
    meetingLink: meeting.meetingLink,
    createdAt: meeting.createdAt,
    mentorName: meeting.mentorName,
  };
}

function mergeById(items) {
  const map = new Map();
  items.forEach((item) => {
    map.set(item.id, item);
  });
  return Array.from(map.values());
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => readStorage(STORAGE_KEYS.token, null));
  const [currentUser, setCurrentUser] = useState(() => readStorage(STORAGE_KEYS.currentUser, null));
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [meetings, setMeetings] = useState([]);

  const resetRoleData = useCallback(() => {
    setUsers([]);
    setTasks([]);
    setMeetings([]);
  }, []);

  const loadAdminData = useCallback(async (activeToken) => {
    const [mentorsRaw, menteesRaw] = await Promise.all([
      apiRequest('/api/admin/mentors', { token: activeToken }),
      apiRequest('/api/admin/mentees', { token: activeToken }),
    ]);

    const mentors = mentorsRaw.map(mapUserSummary);
    const mentees = menteesRaw.map(mapUserSummary);
    setUsers([...mentors, ...mentees]);
  }, []);

  const loadMentorData = useCallback(async (activeToken, mentor) => {
    const [profileRaw, menteesRaw] = await Promise.all([
      apiRequest('/api/mentor/profile', { token: activeToken }),
      apiRequest('/api/mentor/mentees', { token: activeToken }),
    ]);

    setCurrentUser({ ...mentor, ...mapMentorProfile(profileRaw) });

    const mentees = menteesRaw.map((mentee) => ({
      id: mentee.id,
      name: mentee.fullName,
      email: mentee.email,
      role: 'mentee',
      mentorId: mentor.id,
    }));
    setUsers((prev) => mergeById([...prev.filter((item) => item.role !== 'mentee'), ...mentees]));
  }, []);

  const loadMenteeData = useCallback(async (activeToken, mentee) => {
    const [profileRaw, tasksRaw, meetingsRaw] = await Promise.all([
      apiRequest('/api/mentee/profile', { token: activeToken }),
      apiRequest('/api/mentee/tasks', { token: activeToken }),
      apiRequest('/api/mentee/meetings', { token: activeToken }),
    ]);

    const primaryMentorId = tasksRaw[0]?.mentorId || meetingsRaw[0]?.mentorId || null;
    const normalizedMentee = { ...mentee, ...mapMenteeProfile(profileRaw), mentorId: primaryMentorId };
    setCurrentUser(normalizedMentee);
    setTasks(tasksRaw.map((task) => ({ ...mapTask(task), menteeId: mentee.id })));
    setMeetings(meetingsRaw.map((meeting) => ({ ...mapMeeting(meeting), menteeId: mentee.id })));

    const mentorUsers = [...tasksRaw, ...meetingsRaw]
      .map((task) => ({
        id: task.mentorId,
        name: task.mentorName,
        email: '',
        role: 'mentor',
      }))
      .filter((mentorUser) => mentorUser.id);

    setUsers((prev) => mergeById([...prev.filter((item) => item.role !== 'mentor'), ...mentorUsers]));
  }, []);

  const loadRoleData = useCallback(
    async (activeToken, user) => {
      if (!activeToken || !user) {
        return;
      }

      if (user.role === 'admin') {
        await loadAdminData(activeToken);
        return;
      }

      if (user.role === 'mentor') {
        await loadMentorData(activeToken, user);
        return;
      }

      if (user.role === 'mentee') {
        await loadMenteeData(activeToken, user);
      }
    },
    [loadAdminData, loadMenteeData, loadMentorData],
  );

  useEffect(() => {
    if (!token || !currentUser) {
      return;
    }

    loadRoleData(token, currentUser).catch(() => {
      resetRoleData();
    });
  }, [token, currentUser?.id, currentUser?.role, loadRoleData, resetRoleData]);

  useEffect(() => {
    if (!token) {
      localStorage.removeItem(STORAGE_KEYS.token);
      return;
    }
    localStorage.setItem(STORAGE_KEYS.token, JSON.stringify(token));
  }, [token]);

  useEffect(() => {
    if (!currentUser) {
      localStorage.removeItem(STORAGE_KEYS.currentUser);
      return;
    }
    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(currentUser));
  }, [currentUser]);

  const login = async ({ email, password, role }) => {
    try {
      const payload = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: {
          email: email.trim().toLowerCase(),
          password,
          role: String(role || '').toUpperCase(),
        },
      });

      const loggedInUser = {
        id: payload.userId,
        name: payload.fullName,
        email: payload.email,
        role: normalizeRole(payload.role),
      };

      setToken(payload.token);
      setCurrentUser(loggedInUser);
      resetRoleData();

      await loadRoleData(payload.token, loggedInUser);
      return { ok: true };
    } catch (error) {
      return { ok: false, message: error.message || 'Login failed.' };
    }
  };

  const signupAdmin = async ({ fullName, email, password }) => {
    try {
      const payload = await apiRequest('/api/auth/admin-signup', {
        method: 'POST',
        body: {
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
        },
      });

      const loggedInUser = {
        id: payload.userId,
        name: payload.fullName,
        email: payload.email,
        role: normalizeRole(payload.role),
      };

      setToken(payload.token);
      setCurrentUser(loggedInUser);
      resetRoleData();

      await loadRoleData(payload.token, loggedInUser);
      return { ok: true };
    } catch (error) {
      return { ok: false, message: error.message || 'Admin signup failed.' };
    }
  };

  const logout = () => {
    setToken(null);
    setCurrentUser(null);
    resetRoleData();
  };

  const createUser = async ({ name, email, role, password, about = '' }) => {
    if (!token) {
      return { ok: false, message: 'Please log in first.' };
    }

    try {
      const isMentor = role === 'mentor';
      const path = isMentor ? '/api/admin/users/mentor' : '/api/admin/users/mentee';
      const body = isMentor
        ? {
            fullName: name.trim(),
            email: email.trim().toLowerCase(),
            password,
            about,
            review: 'No reviews yet.',
            rating: 0,
          }
        : {
            fullName: name.trim(),
            email: email.trim().toLowerCase(),
            password,
            bio: about,
          };

      await apiRequest(path, {
        method: 'POST',
        token,
        body,
      });

      await loadAdminData(token);
      return { ok: true };
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to create user.' };
    }
  };

  const assignMentor = async ({ mentorId, menteeId }) => {
    if (!token) {
      return { ok: false, message: 'Please log in first.' };
    }

    try {
      await apiRequest('/api/admin/assignments', {
        method: 'POST',
        token,
        body: {
          mentorId: Number(mentorId),
          menteeId: Number(menteeId),
        },
      });

      await loadAdminData(token);
      return { ok: true };
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to assign mentor.' };
    }
  };

  const createTask = async ({ menteeId, title, description, dueDate }) => {
    if (!token) {
      return { ok: false, message: 'Please log in first.' };
    }

    try {
      const created = await apiRequest('/api/mentor/tasks', {
        method: 'POST',
        token,
        body: {
          menteeId: Number(menteeId),
          title: title.trim(),
          description: description.trim(),
          dueDate,
        },
      });

      setTasks((prev) => mergeById([mapTask(created), ...prev]));
      return { ok: true };
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to create task.' };
    }
  };

  const completeTask = async ({ taskId, rating, comment }) => {
    if (!token) {
      return { ok: false, message: 'Please log in first.' };
    }

    try {
      const updated = await apiRequest(`/api/mentee/tasks/${taskId}/complete`, {
        method: 'POST',
        token,
        body: {
          rating: Number(rating),
          comment: comment.trim(),
        },
      });

      setTasks((prev) => prev.map((task) => (task.id === updated.id ? { ...task, ...mapTask(updated) } : task)));
      return { ok: true };
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to complete task.' };
    }
  };

  const reviewTask = async ({ taskId, rating, comment }) => {
    if (!token) {
      return { ok: false, message: 'Please log in first.' };
    }

    try {
      const updated = await apiRequest(`/api/mentor/tasks/${taskId}/review`, {
        method: 'POST',
        token,
        body: {
          rating: Number(rating),
          comment: comment.trim(),
        },
      });

      setTasks((prev) => prev.map((task) => (task.id === updated.id ? { ...task, ...mapTask(updated) } : task)));
      return { ok: true };
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to review task.' };
    }
  };

  const createMeeting = async ({ menteeId, title, date, time, meetingLink }) => {
    if (!token) {
      return { ok: false, message: 'Please log in first.' };
    }

    try {
      const scheduledAt = `${date}T${time}:00`;
      const created = await apiRequest('/api/mentor/meetings', {
        method: 'POST',
        token,
        body: {
          menteeId: Number(menteeId),
          scheduledAt,
          agenda: title.trim(),
          meetingLink: String(meetingLink || '').trim(),
        },
      });

      setMeetings((prev) => mergeById([mapMeeting(created), ...prev]));
      return { ok: true };
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to create meeting.' };
    }
  };

  const loadMentorMenteeItems = async (menteeId) => {
    if (!token || !menteeId) {
      setTasks([]);
      setMeetings([]);
      return;
    }

    try {
      const [tasksRaw, meetingsRaw] = await Promise.all([
        apiRequest(`/api/mentor/tasks/${menteeId}`, { token }),
        apiRequest(`/api/mentor/meetings/${menteeId}`, { token }),
      ]);

      setTasks(tasksRaw.map(mapTask));
      setMeetings(meetingsRaw.map(mapMeeting));
    } catch {
      setTasks([]);
      setMeetings([]);
    }
  };

  const value = useMemo(
    () => ({
      users,
      tasks,
      meetings,
      currentUser,
      login,
      signupAdmin,
      logout,
      createUser,
      assignMentor,
      createTask,
      completeTask,
      reviewTask,
      createMeeting,
      loadMentorMenteeItems,
    }),
    [users, tasks, meetings, currentUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}

export default AuthContext;
