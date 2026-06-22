import { Link } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import { MobileFolderSheet } from './MobileFolderSheet';
import { SearchBar } from '@/components/search/SearchBar';
import { SearchIconButton } from '@/components/search/SearchIconButton';
import { useAuth } from '@/auth/AuthContext';

export function Header(): React.ReactElement {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center gap-4">
        <div className="flex items-center gap-2">
          {user !== null && <MobileFolderSheet />}
          <Link
            to="/"
            className="text-sm font-semibold tracking-tight"
            aria-label="Personal Knowledge Base home"
          >
            PKB
          </Link>
        </div>
        {user !== null && (
          <>
            <SearchBar />
            <SearchIconButton />
          </>
        )}
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
