export default function ProtectedRoute({ user, allowedRoles, children }) {
  if (!user) {
    return <div className="p-6 text-red-600">Please log in first.</div>;
  }

  if (!allowedRoles.includes(user.role)) {
    return <div className="p-6 text-red-600">Access denied for this role.</div>;
  }

  return children;
}
