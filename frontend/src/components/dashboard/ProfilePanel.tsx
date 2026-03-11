import { X, LogOut, Settings, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface ProfilePanelProps {
  open: boolean;
  onClose: () => void;
}

const ProfilePanel = ({ open, onClose }: ProfilePanelProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!open || !user) return null;

  const handleLogout = () => {
    logout();
    navigate("/");
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-card border-l border-border z-50 p-6 overflow-y-auto animate-in slide-in-from-right">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-display font-bold text-foreground">Profile</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="text-center mb-8">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-20 h-20 rounded-2xl bg-muted mx-auto mb-4"
          />
          <h3 className="text-xl font-display font-bold text-foreground">{user.name}</h3>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <span className="inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-lg bg-secondary/10 text-secondary capitalize">
            {user.role}
          </span>
        </div>

        <div className="space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors text-foreground text-sm">
            <User className="w-4 h-4 text-muted-foreground" />
            Edit Profile
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors text-foreground text-sm">
            <Settings className="w-4 h-4 text-muted-foreground" />
            Settings
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-destructive/10 transition-colors text-destructive text-sm"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
};

export default ProfilePanel;
