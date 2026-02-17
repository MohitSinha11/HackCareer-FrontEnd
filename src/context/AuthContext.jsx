import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEYS = {
  token: 'hackcareer_token',
  currentUser: 'hackcareer_current_user',
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

let demoDb = {
  users: [
    {
      id: 1,
      name: 'HackCareer Admin',
      email: 'admin@hackcareer.com',
      role: 'admin',
      password: 'Admin@123',
    },
    {
      id: 2,
      name: 'Demo Mentor',
      email: 'mentor1@hackcareer.com',
      role: 'mentor',
      password: 'Mentor@123',
      about: 'Backend engineer with 6 years of experience',
      review: 'Great mentor',
      rating: 4.8,
    },
    {
      id: 3,
      name: 'Demo Mentee',
      email: 'mentee1@hackcareer.com',
      role: 'mentee',
      password: 'Mentee@123',
      about: 'Final year CSE student',
      bio: 'Final year CSE student',
      mentorId: 2,
    },
  ],
  tasks: [],
  meetings: [],
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
  const requestUrl = path.startsWith('http://') || path.startsWith('https://')
    ? path
    : `${API_BASE_URL}${path}`;

  const response = await fetch(requestUrl, {
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

  const loadDemoRoleData = useCallback((user) => {
    if (!user) {
      setUsers([]);
      setTasks([]);
      setMeetings([]);
      return;
    }

    if (user.role === 'admin') {
      setUsers(demoDb.users.filter((item) => item.role !== 'admin').map(({ password, ...rest }) => rest));
      setTasks([]);
      setMeetings([]);
      return;
    }

    if (user.role === 'mentor') {
      setUsers(
        demoDb.users
          .filter((item) => item.role === 'mentee' && item.mentorId === user.id)
          .map(({ password, ...rest }) => rest),
      );
      setTasks(demoDb.tasks.filter((task) => task.mentorId === user.id));
      setMeetings(demoDb.meetings.filter((meeting) => meeting.mentorId === user.id));
      return;
    }

    if (user.role === 'mentee') {
      const mentor = demoDb.users.find((item) => item.role === 'mentor' && item.id === user.mentorId);
      setUsers(mentor ? [{ ...mentor, password: undefined }] : []);
      setTasks(demoDb.tasks.filter((task) => task.menteeId === user.id));
      setMeetings(demoDb.meetings.filter((meeting) => meeting.menteeId === user.id));
    }
  }, []);

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
      if (DEMO_MODE) {
        loadDemoRoleData(user);
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
    [loadAdminData, loadMenteeData, loadMentorData, loadDemoRoleData],
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
    if (DEMO_MODE) {
      const match = demoDb.users.find(
        (user) =>
          user.email.toLowerCase() === email.trim().toLowerCase() &&
          user.password === password &&
          user.role === normalizeRole(role),
      );

      if (!match) {
        return { ok: false, message: 'Invalid credentials for demo mode.' };
      }

      const loggedInUser = {
        id: match.id,
        name: match.name,
        email: match.email,
        role: match.role,
        about: match.about,
        bio: match.bio,
        review: match.review,
        rating: match.rating,
        mentorId: match.mentorId,
      };

      setToken('demo-token');
      setCurrentUser(loggedInUser);
      loadDemoRoleData(loggedInUser);
      return { ok: true };
    }

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
    if (DEMO_MODE) {
      const nextId = Math.max(...demoDb.users.map((user) => user.id)) + 1;
      demoDb.users.push({
        id: nextId,
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        role: 'admin',
        password,
      });
      const loggedInUser = {
        id: nextId,
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        role: 'admin',
      };
      setToken('demo-token');
      setCurrentUser(loggedInUser);
      loadDemoRoleData(loggedInUser);
      return { ok: true };
    }

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
    if (DEMO_MODE) {
      const nextId = Math.max(...demoDb.users.map((user) => user.id)) + 1;
      const user = {
        id: nextId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        password,
      };
      if (role === 'mentor') {
        user.about = about;
        user.review = 'No reviews yet.';
        user.rating = 0;
      } else {
        user.about = about;
        user.bio = about;
      }
      demoDb.users.push(user);
      if (currentUser) {
        loadDemoRoleData(currentUser);
      }
      return { ok: true };
    }

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
    if (DEMO_MODE) {
      const mentee = demoDb.users.find((user) => user.id === Number(menteeId) && user.role === 'mentee');
      if (!mentee) {
        return { ok: false, message: 'Mentee not found.' };
      }
      mentee.mentorId = Number(mentorId);
      if (currentUser) {
        loadDemoRoleData(currentUser);
      }
      return { ok: true };
    }

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
    if (DEMO_MODE) {
      const taskId = demoDb.tasks.length ? Math.max(...demoDb.tasks.map((task) => task.id)) + 1 : 1;
      const task = {
        id: taskId,
        mentorId: currentUser.id,
        menteeId: Number(menteeId),
        title: title.trim(),
        description: description.trim(),
        dueDate,
        status: 'pending',
        completedAt: null,
        menteeReviewForMentor: null,
        menteeRatingForMentor: null,
        mentorReviewForMentee: null,
        mentorRatingForMentee: null,
        createdAt: new Date().toISOString(),
      };
      demoDb.tasks.unshift(task);
      setTasks((prev) => mergeById([task, ...prev]));
      return { ok: true };
    }

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
    if (DEMO_MODE) {
      const task = demoDb.tasks.find((item) => item.id === Number(taskId));
      if (!task) {
        return { ok: false, message: 'Task not found.' };
      }
      task.status = 'done';
      task.completedAt = task.completedAt || new Date().toISOString();
      task.menteeRatingForMentor = Number(rating);
      task.menteeReviewForMentor = comment.trim();
      setTasks((prev) => prev.map((item) => (item.id === task.id ? { ...item, ...task } : item)));
      return { ok: true };
    }

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
    if (DEMO_MODE) {
      const task = demoDb.tasks.find((item) => item.id === Number(taskId));
      if (!task) {
        return { ok: false, message: 'Task not found.' };
      }
      task.mentorRatingForMentee = Number(rating);
      task.mentorReviewForMentee = comment.trim();
      setTasks((prev) => prev.map((item) => (item.id === task.id ? { ...item, ...task } : item)));
      return { ok: true };
    }

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
    if (DEMO_MODE) {
      const meetingId = demoDb.meetings.length ? Math.max(...demoDb.meetings.map((meeting) => meeting.id)) + 1 : 1;
      const meeting = {
        id: meetingId,
        mentorId: currentUser.id,
        menteeId: Number(menteeId),
        title: title.trim() || 'Mentorship Meeting',
        agenda: title.trim(),
        date,
        time,
        scheduledAt: `${date}T${time}:00`,
        meetingLink: String(meetingLink || '').trim(),
        createdAt: new Date().toISOString(),
      };
      demoDb.meetings.unshift(meeting);
      setMeetings((prev) => mergeById([meeting, ...prev]));
      return { ok: true };
    }

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
    if (DEMO_MODE) {
      setTasks(demoDb.tasks.filter((task) => task.menteeId === Number(menteeId) && task.mentorId === currentUser.id));
      setMeetings(
        demoDb.meetings.filter(
          (meeting) => meeting.menteeId === Number(menteeId) && meeting.mentorId === currentUser.id,
        ),
      );
      return;
    }

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
