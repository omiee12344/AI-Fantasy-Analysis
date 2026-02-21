import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useLogoutWithTeamSave } from "@/hooks/useLogoutWithTeamSave";

export default function Navigation() {
  const { user, isAuthenticated } = useAuth();
  const { handleLogout } = useLogoutWithTeamSave();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we're on the homepage
  const isHomePage = location.pathname === '/';
  
  const linkBase =
    "px-4 py-2 rounded-md font-display font-medium hover:bg-accent/20 hover:text-accent border border-transparent hover:border-accent/30 transition-all";
  const linkActive = "bg-accent/10 text-accent border-accent/50 pl-text-glow";

  const navItem = ({ to, label }: { to: string; label: string }) => (
    <NavLink
      to={to}
      className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}
    >
      {label}
    </NavLink>
  );

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <nav className={`w-full ${isHomePage ? 'absolute top-0 left-0 right-0 z-50' : 'border-b border-accent/20 bg-background/95 backdrop-blur-sm'}`}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Left: Logo / Home */}
        <div className="flex items-center gap-6">
          <Link to="/" className="hover:scale-105 transition-transform font-semibold text-lg text-white">
            AI Fantasy Analytics
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {navItem({ to: "/dashboard", label: "Dashboard" })}
            {navItem({ to: "/predictor", label: "Predictor" })}
            {navItem({ to: "/my-team", label: "My Team" })}
            {navItem({ to: "/fixtures", label: "Fixtures" })}
          </div>
        </div>

        {/* Right: Auth status */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 h-8 px-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs bg-green-600 text-white">
                      {user?.profile.firstName.charAt(0)}{user?.profile.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden md:inline">
                    {user?.profile.teamName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={handleLogin} className="bg-green-600 hover:bg-green-700">
              Sign In
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
