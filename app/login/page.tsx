'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { useRouter } from 'next/navigation'; // Importe useRouter
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore'; // Importe o store Zustand

// Zod schema for login form validation
const loginFormSchema = z.object({
  email: z.string().email({ message: 'E-mail inválido.' }),
  password: z
    .string()
    .min(6, { message: 'A senha deve ter no mínimo 6 caracteres.' }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter(); // Inicialize o router

  // Obtenha as funções do store Zustand para atualizar o estado de autenticação
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const response = await axios.post(
        'http://localhost:3333/user/login', // Endpoint de login
        values
      );
      toast.success('Login realizado com sucesso!');

      // Salva o token e os dados do usuário no store Zustand
      setToken(response.data.token);
      setUser(response.data.user);

      // Redireciona para a página protegida após o login bem-sucedido
      router.push('/');
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        'Erro ao fazer login. Tente novamente.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h2 className="mb-6 text-center text-3xl font-bold text-gray-800">
          Login
        </h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="email">E-mail</FormLabel>
                  <FormControl>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      {...field}
                    />
                  </FormControl>
                  {form.formState.errors.email && (
                    <FormMessage>
                      {form.formState.errors.email.message}
                    </FormMessage>
                  )}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="password">Senha</FormLabel>
                  <FormControl>
                    <Input
                      id="password"
                      type="password"
                      placeholder="******"
                      {...field}
                    />
                  </FormControl>
                  {form.formState.errors.password && (
                    <FormMessage>
                      {form.formState.errors.password.message}
                    </FormMessage>
                  )}
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </Form>
        <p className="mt-6 text-center text-sm text-gray-600">
          Não tem uma conta?{' '}
          <a href="/register" className="text-blue-600 hover:underline">
            Cadastre-se
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
