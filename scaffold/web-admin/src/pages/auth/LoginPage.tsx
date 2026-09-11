import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useStore } from '../../hooks/useStore';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { setUser, setToken, setStore } = useStore();

  const loginMutation = useMutation({
    mutationFn: () => api.auth.login(email, password),
    onSuccess: (response: any) => {
      const { user, accessToken } = response.data;
      setUser(user);
      setToken(accessToken);
      
      // Set first available store
      if (user.storeAccess?.length > 0) {
        setStore(user.storeAccess[0].store);
      }
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Login failed');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="max-w-md w-full p-6">
        <h1 className="text-2xl font-bold text-center mb-6 text-foreground">
          Restaurant Platform
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="danger">{error}</Alert>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full"
          >
            {loginMutation.isPending ? 'Logging in...' : 'Login'}
          </Button>
        </form>
        {import.meta.env.DEV && (
          <div className="mt-4 text-sm text-muted-foreground text-center">
            <p>Default login:</p>
            <p>owner@pizzapalace.com / password123</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default LoginPage;
