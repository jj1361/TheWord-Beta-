/**
 * Forgot Password Modal Component
 * Since this is a client-side only app, we show the reset token directly
 * In a production app, this would send an email
 */

import React, { useState } from 'react';
import { authService } from '../../services/authService';
import './Auth.css';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToLogin: () => void;
}

type Step = 'email' | 'token' | 'reset' | 'success';

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onBackToLogin,
}) => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [generatedToken, setGeneratedToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const resetToken = authService.generatePasswordResetToken(email);
      if (resetToken) {
        setGeneratedToken(resetToken);
        setStep('token');
      } else {
        // Don't reveal if email exists - show same message
        setError('If an account exists with this email, you can proceed to reset.');
        // Still allow proceeding for demo purposes in client-side app
        setStep('token');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate reset token');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyToken = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validation = authService.validateResetToken(token || generatedToken);
    if (validation.valid) {
      setStep('reset');
    } else {
      setError('Invalid or expired reset token');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(token || generatedToken, newPassword);
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('email');
    setEmail('');
    setToken('');
    setGeneratedToken('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    onClose();
  };

  const handleBackToLogin = () => {
    handleClose();
    onBackToLogin();
  };

  return (
    <div className="auth-modal-overlay" onClick={handleClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={handleClose}>
          &times;
        </button>

        {step === 'email' && (
          <>
            <div className="auth-modal-header">
              <h2>Forgot Password</h2>
              <p>Enter your email to reset your password</p>
            </div>

            <form onSubmit={handleRequestReset} className="auth-form">
              {error && <div className="auth-error">{error}</div>}

              <div className="auth-field">
                <label htmlFor="reset-email">Email</label>
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                />
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? 'Processing...' : 'Continue'}
              </button>
            </form>
          </>
        )}

        {step === 'token' && (
          <>
            <div className="auth-modal-header">
              <h2>Reset Token</h2>
              <p>
                {generatedToken
                  ? 'Copy this token to reset your password (in a real app, this would be emailed)'
                  : 'Enter the reset token'}
              </p>
            </div>

            <form onSubmit={handleVerifyToken} className="auth-form">
              {error && <div className="auth-error">{error}</div>}

              {generatedToken && (
                <div className="auth-token-display">
                  <label>Your Reset Token:</label>
                  <code className="auth-token-code">{generatedToken}</code>
                  <button
                    type="button"
                    className="auth-copy-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedToken);
                    }}
                  >
                    Copy
                  </button>
                </div>
              )}

              <div className="auth-field">
                <label htmlFor="reset-token">Reset Token</label>
                <input
                  id="reset-token"
                  type="text"
                  value={token || generatedToken}
                  onChange={e => setToken(e.target.value)}
                  placeholder="Paste your reset token"
                  required
                />
              </div>

              <button type="submit" className="auth-submit-btn">
                Verify Token
              </button>
            </form>
          </>
        )}

        {step === 'reset' && (
          <>
            <div className="auth-modal-header">
              <h2>Set New Password</h2>
              <p>Enter your new password</p>
            </div>

            <form onSubmit={handleResetPassword} className="auth-form">
              {error && <div className="auth-error">{error}</div>}

              <div className="auth-field">
                <label htmlFor="new-password">New Password</label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              <div className="auth-field">
                <label htmlFor="confirm-password">Confirm Password</label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}

        {step === 'success' && (
          <>
            <div className="auth-modal-header">
              <h2>Password Reset</h2>
              <p>Your password has been successfully reset</p>
            </div>

            <div className="auth-success-message">
              You can now sign in with your new password.
            </div>

            <button
              type="button"
              className="auth-submit-btn"
              onClick={handleBackToLogin}
            >
              Back to Sign In
            </button>
          </>
        )}

        {step !== 'success' && (
          <div className="auth-switch">
            <span>Remember your password? </span>
            <button type="button" onClick={handleBackToLogin} className="auth-switch-btn">
              Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
