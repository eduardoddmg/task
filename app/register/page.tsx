'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
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

// Zod schema for registration form validation
const registerFormSchema = z.object({
  name: z.string().trim().min(3, {
    message:
      'O nome deve ter no mínimo 3 caracteres. (Não pode conter espaços)',
  }),
  email: z.string().email({ message: 'E-mail inválido.' }),
  password: z
    .string()
    .min(6, { message: 'A senha deve ter no mínimo 6 caracteres.' }),
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

const RegisterPage: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setLoading(true);
    try {
      // Replace with your actual API base URL
      const response = await axios.post(
        'http://localhost:3333/user/register', // Endpoint de registro
        values
      );
      toast.success('Cadastro realizado com sucesso!');
      console.log('Registration successful:', response.data);
      form.reset(); // Limpa os campos do formulário após o sucesso
      // Opcional: Redirecionar para a página de login ou dashboard
      // router.push('/login');
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || 'Erro ao cadastrar. Tente novamente.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h2 className="mb-6 text-center text-3xl font-bold text-gray-800">
          Cadastro
        </h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="name">Nome</FormLabel>
                  <FormControl>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome"
                      {...field}
                    />
                  </FormControl>
                  {form.formState.errors.name && (
                    <FormMessage>
                      {form.formState.errors.name.message}
                    </FormMessage>
                  )}
                </FormItem>
              )}
            />
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
              {loading ? 'Cadastrando...' : 'Cadastrar'}
            </Button>
          </form>
        </Form>
        <p className="mt-6 text-center text-sm text-gray-600">
          Já tem uma conta?{' '}
          <a href="/login" className="text-blue-600 hover:underline">
            Faça login
          </a>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
