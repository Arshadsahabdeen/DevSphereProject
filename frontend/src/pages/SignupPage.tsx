import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { Code2, Github, Mail, Lock, User, ArrowRight } from "lucide-react";

interface SignupPageProps {
  onSignup: () => void;
  onNavigate: (page: string) => void;
}

export function SignupPage({ onSignup, onNavigate }: SignupPageProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters";
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }
    if (!formData.agreeToTerms) newErrors.terms = "You must agree to the terms";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    onSignup();
  };

  const handleSSOSignup = async (provider: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    onSignup();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4" style={{ background: 'var(--gray-900)' }}>
      <div className="w-full max-w-md">
        <div 
          className="p-8 rounded-xl shadow-lg"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          {/* Logo */}
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
              Create your account
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Start collaborating with your team today
            </p>
          </div>

          {/* SSO Buttons */}
          <div className="space-y-3 mb-6">
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 border hover:bg-accent/10 transition-smooth press-scale"
              style={{ borderColor: 'var(--border)' }}
              onClick={() => handleSSOSignup('github')}
              disabled={isLoading}
            >
              <Github className="mr-2 size-5" />
              Sign up with GitHub
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 border hover:bg-accent/10 transition-smooth press-scale"
              style={{ borderColor: 'var(--border)' }}
              onClick={() => handleSSOSignup('google')}
              disabled={isLoading}
            >
              <Mail className="mr-2 size-5" />
              Sign up with Google
            </Button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: 'var(--border)' }}></div>
            </div>
            <div className="relative flex justify-center">
              <span 
                className="px-4 text-sm"
                style={{ background: 'var(--surface)', color: 'var(--text-secondary)' }}
              >
                Or sign up with email
              </span>
            </div>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="size-4" />
                Full name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="h-11 bg-gray-800 border-border focus:border-accent transition-smooth"
                required
                disabled={isLoading}
                aria-label="Full name"
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-xs" style={{ color: 'var(--danger)' }}>{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="size-4" />
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="h-11 bg-gray-800 border-border focus:border-accent transition-smooth"
                required
                disabled={isLoading}
                aria-label="Email address"
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-xs" style={{ color: 'var(--danger)' }}>{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="size-4" />
                Password
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
                aria-label="Password"
                aria-invalid={!!errors.password}
              />
              {errors.password && (
                <p className="text-xs" style={{ color: 'var(--danger)' }}>{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                <Lock className="size-4" />
                Confirm password
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

            <div className="flex items-start space-x-2 pt-2">
              <Checkbox
                id="terms"
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) => setFormData({...formData, agreeToTerms: checked as boolean})}
                disabled={isLoading}
                aria-invalid={!!errors.terms}
              />
              <Label 
                htmlFor="terms" 
                className="text-sm cursor-pointer leading-tight"
                style={{ color: 'var(--text-secondary)', fontWeight: 400 }}
              >
                I agree to the{" "}
                <button type="button" className="hover:underline" style={{ color: 'var(--accent)' }}>
                  Terms of Service
                </button>
                {" "}and{" "}
                <button type="button" className="hover:underline" style={{ color: 'var(--accent)' }}>
                  Privacy Policy
                </button>
              </Label>
            </div>
            {errors.terms && (
              <p className="text-xs" style={{ color: 'var(--danger)' }}>{errors.terms}</p>
            )}

            <Button 
              type="submit" 
              className="w-full h-11 mt-6 press-scale"
              style={{ background: 'var(--accent)' }}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Create account
                  <ArrowRight className="size-4" />
                </span>
              )}
            </Button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-secondary)' }}>
            Already have an account?{" "}
            <button 
              className="hover:underline transition-smooth"
              style={{ color: 'var(--accent)' }}
              onClick={() => onNavigate('login')}
              disabled={isLoading}
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
