import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Define a interface para o estado do usuário
interface User {
  id: string;
  name: string;
  email: string;
}

// Define a interface para o estado da autenticação
interface AuthState {
  token: string | null;
  user: User | null;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  clearAuth: () => void;
}

// Cria o store Zustand com persistência no localStorage
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      clearAuth: () => set({ token: null, user: null }),
    }),
    {
      name: 'auth-storage', // Nome da chave no localStorage
      storage: createJSONStorage(() => localStorage), // Usa localStorage
      // Opcional: whitelist ou blacklist para quais partes do estado persistir
      // partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
