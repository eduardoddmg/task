'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import axios from 'axios';
import { toast } from 'sonner';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

const ProtectedLayout: React.FC<ProtectedLayoutProps> = ({ children }) => {
  const router = useRouter();
  const { token, user, setToken, setUser, clearAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      // Se não há token, redireciona para o login
      if (!token) {
        router.push('/login');
        toast.error('Você precisa estar logado para acessar esta página.');
        setLoading(false);
        return;
      }

      // Se já temos os dados do usuário, não precisamos buscar novamente
      if (user) {
        setLoading(false);
        return;
      }

      // Se temos o token mas não os dados do usuário, tentamos buscar
      try {
        const response = await axios.get('http://localhost:3333/user/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(response.data); // Salva os dados do usuário no store
        setLoading(false);
      } catch (error: any) {
        console.error('Erro ao buscar perfil do usuário:', error);
        toast.error('Sessão expirada ou inválida. Faça login novamente.');
        clearAuth(); // Limpa o token e redireciona
        router.push('/login');
        setLoading(false);
      }
    };

    verifyAuth();
  }, [token, user, router, setUser, clearAuth]); // Dependências do useEffect

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-lg font-semibold text-gray-700">Carregando...</p>
      </div>
    );
  }

  // Se o token existe e os dados do usuário foram carregados (ou já existiam), renderiza o conteúdo
  if (token && user) {
    return <>{children}</>;
  }

  // Caso contrário (se não autenticado após o carregamento), não renderiza nada (o redirecionamento já ocorreu)
  return null;
};

export default ProtectedLayout;
