export function useAuth() {
  // Usuário mockado para ambiente local/desenvolvimento
  return {
    user: {
      id: 'mock-user-1',
      name: 'Usuário Dev',
      email: 'dev@local.test',
      roles: ['ADMIN'],
    },
    isAuthenticated: true,
    loading: false,
  };
}
