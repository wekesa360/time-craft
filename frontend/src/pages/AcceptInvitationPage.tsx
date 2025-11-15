import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { useAuthStore } from '../stores/auth';
import AuthLayout from '../components/layout/AuthLayout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AcceptInvitationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const token = searchParams.get('token');

  const acceptInvitationMutation = useMutation({
    mutationFn: async (invitationToken: string) => {
      const response = await apiClient.client.post('/api/social/connections/accept-invitation', {
        token: invitationToken
      });
      return response.data;
    },
    onSuccess: () => {
      setStatus('success');
      toast.success('Connection request accepted successfully!');
      // Redirect after 2 seconds
      setTimeout(() => {
        if (isAuthenticated) {
          navigate('/social');
        } else {
          navigate('/login');
        }
      }, 2000);
    },
    onError: (error: any) => {
      setStatus('error');
      const message = error?.response?.data?.error || 'Failed to accept invitation';
      setErrorMessage(message);
      toast.error(message);
    }
  });

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Invalid invitation link. No token provided.');
      return;
    }

    // Accept the invitation
    acceptInvitationMutation.mutate(token);
  }, [token]);

  return (
    <AuthLayout>
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Accept Connection Request</CardTitle>
            <CardDescription>
              {status === 'loading' && 'Processing your invitation...'}
              {status === 'success' && 'Connection request accepted!'}
              {status === 'error' && 'Unable to accept invitation'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === 'loading' && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Please wait while we process your invitation...</p>
              </div>
            )}

            {status === 'success' && (
              <div className="flex flex-col items-center justify-center py-8">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                <p className="text-center text-muted-foreground mb-4">
                  You've successfully accepted the connection request!
                </p>
                <p className="text-sm text-center text-muted-foreground">
                  Redirecting you now...
                </p>
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center justify-center py-8">
                <XCircle className="h-12 w-12 text-destructive mb-4" />
                <p className="text-center text-muted-foreground mb-4">
                  {errorMessage || 'Failed to accept the invitation. The link may be invalid or expired.'}
                </p>
                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate('/login')}
                  >
                    Go to Login
                  </Button>
                  {isAuthenticated && (
                    <Button
                      className="flex-1"
                      onClick={() => navigate('/social')}
                    >
                      Go to Social
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}

