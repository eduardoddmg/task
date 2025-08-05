'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

// Definições de tipos e esquemas Zod
enum Status {
  CRIADO = 'CRIADO',
  ANDAMENTO = 'ANDAMENTO',
  CONCLUIDO = 'CONCLUIDO',
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

const createTaskSchema = z.object({
  title: z
    .string()
    .min(3, { message: 'O título deve ter no mínimo 3 caracteres.' }),
  description: z.string().optional(),
});

const updateTaskSchema = z.object({
  id: z.string().uuid(),
  title: z
    .string()
    .min(3, { message: 'O título deve ter no mínimo 3 caracteres.' })
    .optional(),
  description: z.string().optional(),
  status: z.nativeEnum(Status).optional(),
});

type CreateTaskFormValues = z.infer<typeof createTaskSchema>;
type UpdateTaskFormValues = z.infer<typeof updateTaskSchema>;

const ProtectedPage: React.FC = () => {
  const { user, token, clearAuth } = useAuthStore();
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  // Estados para paginação e filtros
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalTasks, setTotalTasks] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  // O tipo do estado filterStatus foi atualizado para incluir 'all'
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all'); // Valor padrão 'all'

  const createTaskForm = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  const updateTaskForm = useForm<UpdateTaskFormValues>({
    resolver: zodResolver(updateTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      status: Status.CRIADO, // Atualizado para o novo status padrão
    },
  });

  const fetchTasks = useCallback(async () => {
    if (!token) {
      setLoadingTasks(false);
      return;
    }

    setLoadingTasks(true);
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('pageSize', pageSize.toString());
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      // A lógica de filtro foi ajustada para não enviar 'all' para a API
      if (filterStatus && filterStatus !== 'all') {
        params.append('status', filterStatus);
      }

      const response = await axios.get(
        `http://localhost:3333/task?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setTasks(response.data.items);
      setTotalTasks(response.data.pagination.totalItems);
    } catch (error: any) {
      console.error('Erro ao buscar tarefas:', error);
      toast.error(error.response?.data?.message || 'Erro ao carregar tarefas.');
      if (error.response?.status === 401) {
        clearAuth();
        router.push('/login');
      }
    } finally {
      setLoadingTasks(false);
    }
  }, [
    token,
    currentPage,
    pageSize,
    searchTerm,
    filterStatus,
    clearAuth,
    router,
  ]);

  useEffect(() => {
    if (!user) {
      // Se o usuário não estiver carregado, o layout já deve redirecionar
      // ou estar em estado de carregamento.
      return;
    }
    fetchTasks();
  }, [user, fetchTasks]); // Dependência de user para garantir que o usuário está carregado

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const handleCreateTask = async (values: CreateTaskFormValues) => {
    try {
      await axios.post('http://localhost:3333/task', values, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success('Tarefa criada com sucesso!');
      createTaskForm.reset();
      setIsCreating(false);
      fetchTasks(); // Recarrega a lista de tarefas
    } catch (error: any) {
      console.error('Erro ao criar tarefa:', error);
      toast.error(error.response?.data?.message || 'Erro ao criar tarefa.');
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    updateTaskForm.reset({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
    });
    setIsEditing(true);
  };

  const handleUpdateTask = async (values: UpdateTaskFormValues) => {
    if (!editingTask) return;

    try {
      await axios.put(`http://localhost:3333/task/${editingTask.id}`, values, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success('Tarefa atualizada com sucesso!');
      setIsEditing(false);
      setEditingTask(null);
      fetchTasks(); // Recarrega a lista de tarefas
    } catch (error: any) {
      console.error('Erro ao atualizar tarefa:', error);
      toast.error(error.response?.data?.message || 'Erro ao atualizar tarefa.');
    }
  };

  const handleDeleteConfirmation = (taskId: string) => {
    setTaskToDelete(taskId);
    setIsConfirmingDelete(true);
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      await axios.delete(`http://localhost:3333/task/${taskToDelete}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success('Tarefa excluída com sucesso!');
      setIsConfirmingDelete(false);
      setTaskToDelete(null);
      fetchTasks(); // Recarrega a lista de tarefas
    } catch (error: any) {
      console.error('Erro ao excluir tarefa:', error);
      toast.error(error.response?.data?.message || 'Erro ao excluir tarefa.');
    }
  };

  const totalPages = Math.ceil(totalTasks / pageSize);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-lg font-semibold text-gray-700">
          Carregando dados do usuário...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      {/* Seção de Informações do Usuário */}
      <div className="w-full max-w-4xl mx-auto rounded-lg bg-white p-6 shadow-lg mb-8">
        <h2 className="mb-4 text-2xl font-bold text-gray-800">
          Bem-vindo, {user.name}!
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600">
          <p>
            <strong>ID:</strong> {user.id}
          </p>
          <p>
            <strong>E-mail:</strong> {user.email}
          </p>
        </div>
        <Button
          onClick={handleLogout}
          className="mt-6 bg-red-500 hover:bg-red-600"
        >
          Sair
        </Button>
      </div>

      {/* Seção de Gerenciamento de Tarefas */}
      <div className="w-full max-w-4xl mx-auto rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-6 text-2xl font-bold text-gray-800">
          Minhas Tarefas
        </h2>

        {/* Controles de Filtro e Criação */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex w-full sm:w-auto space-x-2">
            <Input
              placeholder="Buscar por título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow"
            />
            <Select
              value={filterStatus}
              onValueChange={(value: Status | 'all') => setFilterStatus(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por Status" />
              </SelectTrigger>
              <SelectContent>
                {/* O valor foi alterado para 'all' */}
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value={Status.CRIADO}>Criado</SelectItem>
                <SelectItem value={Status.ANDAMENTO}>Em Andamento</SelectItem>
                <SelectItem value={Status.CONCLUIDO}>Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>Criar Nova Tarefa</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Criar Tarefa</DialogTitle>
                <DialogDescription>
                  Preencha os detalhes para criar uma nova tarefa.
                </DialogDescription>
              </DialogHeader>
              <Form {...createTaskForm}>
                <form
                  onSubmit={createTaskForm.handleSubmit(handleCreateTask)}
                  className="space-y-4"
                >
                  <FormField
                    control={createTaskForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input placeholder="Título da tarefa" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createTaskForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descrição da tarefa (opcional)"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">Salvar Tarefa</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabela de Tarefas */}
        {loadingTasks ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Carregando tarefas...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Nenhuma tarefa encontrada.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">
                        {task.title}
                      </TableCell>
                      <TableCell>{task.description || '-'}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold
                          ${
                            task.status === Status.CRIADO
                              ? 'bg-yellow-100 text-yellow-800'
                              : ''
                          }
                          ${
                            task.status === Status.ANDAMENTO
                              ? 'bg-blue-100 text-blue-800'
                              : ''
                          }
                          ${
                            task.status === Status.CONCLUIDO
                              ? 'bg-green-100 text-green-800'
                              : ''
                          }
                        `}
                        >
                          {task.status === Status.CRIADO && 'Criado'}
                          {task.status === Status.ANDAMENTO && 'Em Andamento'}
                          {task.status === Status.CONCLUIDO && 'Concluído'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="mr-2"
                          onClick={() => handleEditTask(task)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteConfirmation(task.id)}
                        >
                          Excluir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <Pagination className="mt-6">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      aria-disabled={currentPage === 1}
                      tabIndex={currentPage === 1 ? -1 : undefined}
                      className={
                        currentPage === 1
                          ? 'pointer-events-none opacity-50'
                          : undefined
                      }
                    />
                  </PaginationItem>
                  {[...Array(totalPages)].map((_, index) => (
                    <PaginationItem key={index}>
                      <PaginationLink
                        href="#"
                        onClick={() => setCurrentPage(index + 1)}
                        isActive={currentPage === index + 1}
                      >
                        {index + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      aria-disabled={currentPage === totalPages}
                      tabIndex={currentPage === totalPages ? -1 : undefined}
                      className={
                        currentPage === totalPages
                          ? 'pointer-events-none opacity-50'
                          : undefined
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </div>

      {/* Dialog para Edição de Tarefa */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Tarefa</DialogTitle>
            <DialogDescription>
              Faça alterações na sua tarefa aqui. Clique em salvar quando
              terminar.
            </DialogDescription>
          </DialogHeader>
          <Form {...updateTaskForm}>
            <form
              onSubmit={updateTaskForm.handleSubmit(handleUpdateTask)}
              className="space-y-4"
            >
              <FormField
                control={updateTaskForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Título da tarefa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateTaskForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descrição da tarefa (opcional)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateTaskForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={Status.CRIADO}>Criado</SelectItem>
                        <SelectItem value={Status.ANDAMENTO}>
                          Em Andamento
                        </SelectItem>
                        <SelectItem value={Status.CONCLUIDO}>
                          Concluído
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Salvar Alterações</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog para Confirmação de Exclusão */}
      <Dialog open={isConfirmingDelete} onOpenChange={setIsConfirmingDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmingDelete(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteTask}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProtectedPage;
