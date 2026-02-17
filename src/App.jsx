import { useEffect, useMemo, useState } from 'react';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import AdminDashboard from './pages/admin/AdminDashboard';
import AssignMentor from './pages/admin/AssignMentor';
import ManageUsers from './pages/admin/ManageUsers';
import Login from './pages/auth/Login';
import MenteeDashboard from './pages/mentee/MenteeDashboard';
import MyTasks from './pages/mentee/MyTasks';
import MentorDashboard from './pages/mentor/MentorDashboard';
import MeetingPage from './pages/mentor/MeetingPage';
import MenteesList from './pages/mentor/MenteesList';
import TaskPage from './pages/mentor/TaskPage';
import { useAuth } from './context/AuthContext';

const adminMenu = [
  { label: 'Overview', value: 'overview' },
  { label: 'Manage Users', value: 'manage-users' },
  { label: 'Assign Mentor', value: 'assign-mentor' },
];

const mentorMenu = [
  { label: 'Dashboard', value: 'dashboard' },
  { label: 'Mentees', value: 'mentees' },
  { label: 'Tasks', value: 'tasks' },
  { label: 'Meetings', value: 'meetings' },
];

const menteeMenu = [
  { label: 'Profile', value: 'profile' },
  { label: 'My Tasks', value: 'tasks' },
];

function AdminView({ activeTab, setActiveTab }) {
  const { currentUser, users, createUser, assignMentor } = useAuth();
  const mentors = users.filter((user) => user.role === 'mentor');
  const mentees = users.filter((user) => user.role === 'mentee');

  return (
    <ProtectedRoute user={currentUser} allowedRoles={['admin']}>
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <Sidebar items={adminMenu} active={activeTab} onSelect={setActiveTab} />
        <div>
          {activeTab === 'overview' ? (
            <AdminDashboard admin={currentUser} mentors={mentors} mentees={mentees} />
          ) : null}
          {activeTab === 'manage-users' ? (
            <ManageUsers
              mentors={mentors}
              mentees={mentees}
              onCreateUser={createUser}
            />
          ) : null}
          {activeTab === 'assign-mentor' ? (
            <AssignMentor mentors={mentors} mentees={mentees} onAssign={assignMentor} />
          ) : null}
        </div>
      </div>
    </ProtectedRoute>
  );
}

function MentorView({ activeTab, setActiveTab }) {
  const {
    currentUser,
    users,
    tasks,
    meetings,
    createTask,
    reviewTask,
    createMeeting,
    loadMentorMenteeItems,
  } = useAuth();
  const [selectedMenteeId, setSelectedMenteeId] = useState(null);

  const mentees = useMemo(
    () => users.filter((user) => user.role === 'mentee' && user.mentorId === currentUser.id),
    [users, currentUser],
  );

  const selectedMentee = mentees.find((mentee) => mentee.id === selectedMenteeId) || null;

  useEffect(() => {
    if (selectedMenteeId || mentees.length === 0) {
      return;
    }
    setSelectedMenteeId(mentees[0].id);
  }, [selectedMenteeId, mentees]);

  const menteeTasks = selectedMentee
    ? tasks.filter((task) => task.menteeId === selectedMentee.id)
    : [];
  const menteeMeetings = selectedMentee
    ? meetings.filter((meeting) => meeting.menteeId === selectedMentee.id)
    : [];

  useEffect(() => {
    if (!selectedMenteeId) {
      return;
    }
    loadMentorMenteeItems(selectedMenteeId);
  }, [selectedMenteeId, loadMentorMenteeItems]);

  const handleCreateTask = async (form) => {
    if (!selectedMentee) {
      return { ok: false, message: 'Select a mentee first.' };
    }

    return createTask({
      menteeId: selectedMentee.id,
      ...form,
    });
  };

  const handleCreateMeeting = async (form) => {
    if (!selectedMentee) {
      return { ok: false, message: 'Select a mentee first.' };
    }

    return createMeeting({
      menteeId: selectedMentee.id,
      ...form,
    });
  };

  return (
    <ProtectedRoute user={currentUser} allowedRoles={['mentor']}>
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <Sidebar items={mentorMenu} active={activeTab} onSelect={setActiveTab} />
        <div className="space-y-4">
          {activeTab === 'dashboard' ? (
            <MentorDashboard mentor={currentUser} mentees={mentees} />
          ) : null}

          {activeTab === 'mentees' ? (
            <MenteesList
              mentees={mentees}
              selectedMenteeId={selectedMenteeId}
              onSelect={setSelectedMenteeId}
            />
          ) : null}

          {activeTab === 'tasks' ? (
            <TaskPage
              selectedMentee={selectedMentee}
              onCreateTask={handleCreateTask}
              onReviewTask={reviewTask}
              tasks={menteeTasks}
            />
          ) : null}

          {activeTab === 'meetings' ? (
            <MeetingPage
              selectedMentee={selectedMentee}
              onCreateMeeting={handleCreateMeeting}
              meetings={menteeMeetings}
            />
          ) : null}
        </div>
      </div>
    </ProtectedRoute>
  );
}

function MenteeView({ activeTab, setActiveTab }) {
  const { currentUser, users, tasks, meetings, completeTask } = useAuth();

  const mentor = users.find((user) => user.id === currentUser.mentorId);
  const myTasks = tasks.filter((task) => task.menteeId === currentUser.id);
  const myMeetings = meetings.filter((meeting) => meeting.menteeId === currentUser.id);

  return (
    <ProtectedRoute user={currentUser} allowedRoles={['mentee']}>
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <Sidebar items={menteeMenu} active={activeTab} onSelect={setActiveTab} />
        <div>
          {activeTab === 'profile' ? (
            <MenteeDashboard mentee={currentUser} mentor={mentor} />
          ) : null}
          {activeTab === 'tasks' ? (
            <MyTasks tasks={myTasks} meetings={myMeetings} onCompleteTask={completeTask} />
          ) : null}
        </div>
      </div>
    </ProtectedRoute>
  );
}

function App() {
  const { currentUser, login, signupAdmin, logout } = useAuth();
  const [activeAdminTab, setActiveAdminTab] = useState('overview');
  const [activeMentorTab, setActiveMentorTab] = useState('dashboard');
  const [activeMenteeTab, setActiveMenteeTab] = useState('profile');

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 p-4">
        <Login onLogin={login} onAdminSignup={signupAdmin} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <Navbar user={currentUser} onLogout={logout} />

        {currentUser.role === 'admin' ? (
          <AdminView activeTab={activeAdminTab} setActiveTab={setActiveAdminTab} />
        ) : null}

        {currentUser.role === 'mentor' ? (
          <MentorView activeTab={activeMentorTab} setActiveTab={setActiveMentorTab} />
        ) : null}

        {currentUser.role === 'mentee' ? (
          <MenteeView activeTab={activeMenteeTab} setActiveTab={setActiveMenteeTab} />
        ) : null}
      </div>
    </div>
  );
}

export default App;
