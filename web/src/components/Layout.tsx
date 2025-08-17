import { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import Header from './Header';
import Navigation from './Navigation';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export default function Layout({ children, title = 'Concert Connect' }: LayoutProps) {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        {session && (
          <aside className="hidden md:flex md:w-64 md:flex-col">
            <Navigation />
          </aside>
        )}
        
        <main className={`flex-1 ${session ? 'md:ml-0' : ''}`}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            {title && title !== 'Concert Connect' && (
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}