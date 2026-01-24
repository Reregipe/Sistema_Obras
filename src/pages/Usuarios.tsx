import { useUsuarios } from '../hooks/useUsuarios';

export default function Usuarios() {
  const { data, loading, error } = useUsuarios();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Erro: {error}</div>;
  if (!data || data.length === 0) return <div>Nenhum usuário encontrado.</div>;

  return (
    <table>
      <thead>
        <tr>
          <th>Nome</th>
          <th>Email</th>
        </tr>
      </thead>
      <tbody>
        {data.map((usuario) => (
          <tr key={usuario.id_usuario}>
            <td>{usuario.nome}</td>
            <td>{usuario.email_empresa}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
