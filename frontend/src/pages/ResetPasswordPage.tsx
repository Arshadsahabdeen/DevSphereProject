import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Code2, Lock, CheckCircle2 } from "lucide-react";

interface ResetPasswordPageProps {
  onNavigate: (page: string) => void;
}

export function ResetPasswordPage({ onNavigate }: ResetPasswordPageProps) {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    setIsReset(true);
  };

  if (isReset) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4" style={{ background: 'var(--gray-900)' }}>
        <div className="w-full max-w-md">
          <div 
            className="p-8 rounded-xl shadow-lg text-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex justify-center mb-6">
              <div 
                className="size-16 rounded-full flex items-center justify-center"
                style={{ background: 'var(--success)', opacity: 0.1 }}
              >
                <CheckCircle2 className="size-8" style={{ color: 'var(--success)' }} />
              </div>
            </div>

            <h2 className="text-[22px] font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              Password reset successful
            </h2>
            <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
              Your password has been reset successfully. You can now sign in with your new password.
            </p>

            <Button 
              onClick={() => onNavigate('login')}
              className="w-full h-11 press-scale"
              style={{ background: 'var(--accent)' }}
            >
              Continue to login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4" style={{ background: 'var(--gray-900)' }}>
      <div className="w-full max-w-md">
        <div 
          className="p-8 rounded-xl shadow-lg"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-center mb-8">
            <div 
              className="size-12 rounded-lg flex items-center justify-center"
              style={{ 
                background: 'linear-gradient(135deg, var(--gray-600) 0%, var(--gray-800) 100%)',
                border: '1px solid var(--border)'
              }}
            >
              <Code2 className="size-7" style={{ color: 'var(--accent)' }} />
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-[22px] font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Set new password
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Enter a new password for your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="size-4" />
                New password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="h-11 bg-gray-800 border-border focus:border-accent transition-smooth"
                required
                disabled={isLoading}
                aria-label="New password"
                aria-invalid={!!errors.password}
              />
              {errors.password && (
                <p className="text-xs" style={{ color: 'var(--danger)' }}>{errors.password}</p>
              )}
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Must be at least 8 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                <Lock className="size-4" />
                Confirm new password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className="h-11 bg-gray-800 border-border focus:border-accent transition-smooth"
                required
                disabled={isLoading}
                aria-label="Confirm password"
                aria-invalid={!!errors.confirmPassword}
              />
              {errors.confirmPassword && (
                <p className="text-xs" style={{ color: 'var(--danger)' }}>{errors.confirmPassword}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 mt-6 press-scale"
              style={{ background: 'var(--accent)' }}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Resetting password...
                </span>
              ) : (
                "Reset password"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
