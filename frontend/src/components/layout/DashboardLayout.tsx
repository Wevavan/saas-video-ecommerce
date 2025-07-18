import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../theme-toggle';
// import { CreditCounter } from '../credits/CreditCounter';
import { BuyCreditsModal } from '../credits/BuyCreditsModal';
import { 
  Menu, 
  X, 
  Home, 
  Video, 
  Plus, 
  Settings, 
  CreditCard,
  LogOut, 
  User,
  ChevronDown,
  Bell,
  Zap
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/Dropdown-menu';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navigation: NavItem[] = [
  { name: 'Overview', href: '/dashboard', icon: Home },
  { name: 'Mes vidéos', href: '/dashboard/videos', icon: Video, badge: 'Nouveau' },
  { name: 'Créer vidéo', href: '/dashboard/generate', icon: Plus },
  { name: 'Crédits', href: '/dashboard/credits', icon: CreditCard },
  { name: 'Paramètres', href: '/dashboard/settings', icon: Settings },
];

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showBuyCreditsModal, setShowBuyCreditsModal] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const handleBuyCredits = () => {
    setShowBuyCreditsModal(true);
  };

  // const handlePurchase = (packageId: string) => {
  //   console.log('Purchase package:', packageId);
  //   // TODO: Intégration Stripe
  //   setShowBuyCreditsModal(false);
  // };

  const isActivePath = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  // Component Sidebar
  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex flex-col h-full ${mobile ? 'w-full' : sidebarCollapsed ? 'w-16' : 'w-64'} transition-all duration-300`}>
      {/* Logo / Brand */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {(!sidebarCollapsed || mobile) && (
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Video className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">VideoSaaS</span>
          </Link>
        )}
        {!mobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={sidebarCollapsed ? 'w-full justify-center' : ''}
          >
            <Menu className="w-4 h-4" />
          </Button>
        )}
        {mobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = isActivePath(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => mobile && setSidebarOpen(false)}
              className={`
                flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${isActive 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }
                ${sidebarCollapsed && !mobile ? 'justify-center' : ''}
              `}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {(!sidebarCollapsed || mobile) && (
                <>
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section avec CreditCounter intégré */}
      {(!sidebarCollapsed || mobile) && (
        <div className="p-4 border-t border-border space-y-3">
          {/* Credit Counter compact */}
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{user?.credits || 0}</span>
              <span className="text-xs text-muted-foreground">crédits</span>
            </div>
          </div>
          
          {/* User info */}
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user?.name}</p>
              <p className="text-muted-foreground truncate capitalize">
                Plan {user?.plan}
              </p>
            </div>
          </div>
          
          {/* Quick buy credits button */}
          <Button 
            size="sm" 
            variant="outline" 
            className="w-full"
            onClick={handleBuyCredits}
          >
            <Zap className="w-3 h-3 mr-2" />
            Recharger
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-auto bg-card border-r border-border">
          <Sidebar />
        </div>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/20" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Left side */}
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>

              {/* Breadcrumbs */}
              <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
                <span>Dashboard</span>
                {location.pathname !== '/dashboard' && (
                  <>
                    <span>/</span>
                    <span className="text-foreground font-medium">
                      {navigation.find(item => 
                        location.pathname.startsWith(item.href) && item.href !== '/dashboard'
                      )?.name || 'Page'}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Credits display - Version desktop avec CreditCounter */}
              <div className="hidden md:flex items-center space-x-2 text-sm">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{user?.credits || 0}</span>
                <span className="text-muted-foreground">crédits</span>
                <Button size="sm" variant="outline" onClick={handleBuyCredits}>
                  <Zap className="w-3 h-3 mr-1" />
                  Recharger
                </Button>
              </div>

              {/* Credits display - Version mobile simple */}
              <div className="flex md:hidden items-center space-x-2 text-sm">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{user?.credits}</span>
                <span className="text-muted-foreground">crédits</span>
              </div>

              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>

              {/* Theme toggle */}
              <ThemeToggle />

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
                      <User className="w-3 h-3" />
                    </div>
                    <span className="hidden sm:block text-sm font-medium">{user?.name}</span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <CreditCard className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {user?.credits} crédits • Plan {user?.plan}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleBuyCredits}>
                    <Zap className="w-4 h-4 mr-2" />
                    Acheter des crédits
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/settings" className="flex items-center">
                      <Settings className="w-4 h-4 mr-2" />
                      Paramètres
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/credits" className="flex items-center">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Gérer les crédits
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-auto">
          {children || <Outlet />}
        </main>
      </div>

      {/* Modal d'achat de crédits */}
      <BuyCreditsModal
        isOpen={showBuyCreditsModal}
        onClose={() => setShowBuyCreditsModal(false)}
      />
    </div>
  );
};