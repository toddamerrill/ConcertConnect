import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  HomeIcon,
  CalendarIcon,
  UserGroupIcon,
  TicketIcon,
  CogIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Home', href: '/', icon: HomeIcon },
  { name: 'Events', href: '/events', icon: CalendarIcon },
  { name: 'Social', href: '/social', icon: UserGroupIcon },
  { name: 'My Events', href: '/my-events', icon: TicketIcon },
  { name: 'Profile', href: '/profile', icon: UserIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
];

export default function Navigation() {
  const router = useRouter();

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200 pt-5 pb-4">
      <div className="flex flex-col flex-grow overflow-y-auto">
        <nav className="flex-1 px-3 space-y-1">
          {navigation.map((item) => {
            const isActive = router.pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  isActive
                    ? 'bg-primary-50 border-primary-500 text-primary-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group border-l-4 flex items-center px-3 py-2 text-sm font-medium`}
              >
                <item.icon
                  className={`${
                    isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                  } mr-3 h-6 w-6`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}