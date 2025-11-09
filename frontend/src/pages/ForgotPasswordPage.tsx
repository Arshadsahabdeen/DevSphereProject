import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Code2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

interface ForgotPasswordPageProps {
  onNavigate: (page: string) => void;
}

export function ForgotPasswordPage({ onNavigate }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
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
              Check your email
            </h2>
            <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
              We've sent a password reset link to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
            </p>
            <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
              Didn't receive the email? Check your spam folder or{" "}
              <button 
                onClick={() => setIsSubmitted(false)}
                className="hover:underline"
                style={{ color: 'var(--accent)' }}
              >
                try again
              </button>
            </p>

            <Button 
              onClick={() => onNavigate('login')}
              variant="outline"
              className="w-full h-11 border press-scale"
              style={{ borderColor: 'var(--border)' }}
            >
              <ArrowLeft className="mr-2 size-4" />
              Back to login
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
              Reset your password
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Enter your email and we'll send you a link to reset your password
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="size-4" />
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 bg-gray-800 border-border focus:border-accent transition-smooth"
                required
                disabled={isLoading}
                aria-label="Email address"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 press-scale"
              style={{ background: 'var(--accent)' }}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Sending...
                </span>
              ) : (
                "Send reset link"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button 
              className="text-sm hover:underline transition-smooth inline-flex items-center gap-2"
              style={{ color: 'var(--text-secondary)' }}
              onClick={() => onNavigate('login')}
              disabled={isLoading}
            >
              <ArrowLeft className="size-4" />
              Back to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
