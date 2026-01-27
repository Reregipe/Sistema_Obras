import { useState, useEffect } from 'react';
import { fetchMateriais } from '@/services/dataSource';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { updateMaterialStatus } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Search, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Material {
  codigo_material: string;
  descricao: string;
  unidade_medida: string;
  status: number;
}

export const MateriaisTable = () => {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [filteredMateriais, setFilteredMateriais] = useState<Material[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    fetchMateriais().then(({ data, error }) => {
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar materiais',
          description: error.message,
        });
        setMateriais([]);
      } else {
        setMateriais(data ?? []);
        console.log('Materiais recebidos:', data);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (search) {
      const filtered = materiais.filter(
        (m) =>
          m.codigo_material.toLowerCase().includes(search.toLowerCase()) ||
          m.descricao.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredMateriais(filtered);
    } else {
      setFilteredMateriais(materiais);
    }
  }, [search, materiais]);



  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  // Função para atualizar status do material
  const handleStatusChange = async (codigo: string, novoStatus: number) => {
    try {
      await updateMaterialStatus(codigo, novoStatus);
      setMateriais((prev) => prev.map((m) => m.codigo_material === codigo ? { ...m, status: novoStatus } : m));
      toast({ title: `Status alterado para ${novoStatus === 1 ? 'Ativo' : 'Inativo'}` });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar status',
        description: error?.message || 'Erro desconhecido',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Status</TableHead>

            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMateriais.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhum material encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredMateriais.map((material) => (
                <TableRow key={material.codigo_material}>
                  <TableCell className="font-mono">{material.codigo_material}</TableCell>
                  <TableCell>{material.descricao}</TableCell>
                  <TableCell>{material.unidade_medida}</TableCell>
                  <TableCell>
                    {Number(material.status) === 1 ? 'Inativo' : 'Ativo'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
