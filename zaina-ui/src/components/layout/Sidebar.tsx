import { NavLink } from 'react-router-dom';

const links = [
  { to: '/manage', icon: '📚', label: 'Manage' },
  { to: '/study', icon: '🎓', label: 'Study' },
  { to: '/practice', icon: '✏️', label: 'Practice' },
  { to: '/progress', icon: '📊', label: 'Progress' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
];

export default function Sidebar() {
  return (
    <aside className="w-20 lg:w-56 bg-primary-600 min-h-screen flex flex-col py-6 px-2 lg:px-4 shrink-0">
      <div className="mb-8 text-center">
        <div className="text-2xl font-bold text-white hidden lg:block">Zaina</div>
        <div className="text-2xl font-bold text-white block lg:hidden">Z</div>
        <div className="text-primary-100 text-xs hidden lg:block">Learning Platform</div>
      </div>
      <nav className="flex flex-col gap-1">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 
               ${isActive
                 ? 'bg-white text-primary-600 font-semibold shadow-sm'
                 : 'text-primary-100 hover:bg-primary-700 hover:text-white'}`
            }
          >
            <span className="text-xl">{link.icon}</span>
            <span className="hidden lg:block text-sm">{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
