import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

const acionamentoSchema = z.object({
  codigo_acionamento: z.string().min(1, 'Código é obrigatório'),
  prioridade: z.enum(['emergencia', 'programado']),
  prioridade_nivel: z.enum(['normal', 'media', 'alta']).optional(),
  modalidade: z.enum(['LM', 'LV', 'LM+LV']),
  encarregado: z.string().min(1, 'Encarregado é obrigatório'),
  elemento_id: z.string().min(1, 'Elemento/ID é obrigatório'),
  tipo_atividade: z.string().min(1, 'Tipo da atividade é obrigatório'),
  status: z.enum(['concluido', 'em_andamento', 'pendente', 'cancelado', 'programado']),
  numero_os: z.string().optional(),
  observacao: z.string().optional(),
  municipio: z.string().optional(),
  data_abertura: z.string().min(1, 'Data de abertura é obrigatória'),
  email_msg: z.string().optional(),
});

type AcionamentoFormData = z.infer<typeof acionamentoSchema>;

interface AcionamentoFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const AcionamentoForm = ({ onSuccess, onCancel }: AcionamentoFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<AcionamentoFormData>({
    resolver: zodResolver(acionamentoSchema),
    defaultValues: {
      codigo_acionamento: '',
      prioridade: undefined,
      prioridade_nivel: undefined,
      modalidade: undefined,
      encarregado: '',
      elemento_id: '',
      tipo_atividade: '',
      status: undefined,
      numero_os: '',
      observacao: '',
      municipio: '',
      data_abertura: '',
      email_msg: '',
    } as Partial<AcionamentoFormData>,
  });

  const onSubmit = async (data: AcionamentoFormData) => {
    if (!user) return;

    setIsLoading(true);

    const { error } = await supabase.from('acionamentos').insert([{
      codigo_acionamento: data.codigo_acionamento,
      prioridade: data.prioridade,
      prioridade_nivel: data.prioridade_nivel,
      modalidade: data.modalidade,
      encarregado: data.encarregado,
      elemento_id: data.elemento_id,
      tipo_atividade: data.tipo_atividade,
      status: data.status,
      numero_os: data.numero_os || null,
      observacao: data.observacao || null,
      email_msg: data.email_msg || null,
      municipio: data.municipio || null,
      criado_por: user.id,
      data_abertura: new Date(data.data_abertura).toISOString(),
    }]);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar acionamento',
        description: error.message,
      });
    } else {
      toast({
        title: 'Acionamento criado com sucesso!',
      });
      form.reset();
      onSuccess?.();
    }

    setIsLoading(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="codigo_acionamento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Acionamento*</FormLabel>
                <FormControl>
                  <Input placeholder="AC-2024-001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="prioridade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Acionamento*</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="emergencia">Emergência</SelectItem>
                    <SelectItem value="programado">Programado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="prioridade_nivel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prioridade*</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a prioridade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="modalidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modalidade*</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a modalidade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                <SelectItem value="LM">LM</SelectItem>
                <SelectItem value="LV">LV</SelectItem>
                <SelectItem value="LM+LV">LM + LV</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="encarregado"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Encarregado*</FormLabel>
                <FormControl>
                  <Input placeholder="Nome do encarregado fixo da equipe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="elemento_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Elemento / ID*</FormLabel>
                <FormControl>
                  <Input placeholder="Identificador do elemento/ativo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tipo_atividade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo da Atividade*</FormLabel>
                <FormControl>
                  <Input placeholder="Ex.: Manutenção preventiva" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status*</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="concluido">CONCLUÍDO</SelectItem>
                    <SelectItem value="em_andamento">EM ANDAMENTO</SelectItem>
                    <SelectItem value="pendente">PENDENTE</SelectItem>
                    <SelectItem value="cancelado">CANCELADO</SelectItem>
                    <SelectItem value="programado">PROGRAMADO</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="data_abertura"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Abertura*</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="municipio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Município</FormLabel>
                <FormControl>
                  <Input placeholder="Cuiabá" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="observacao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observação</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Observações adicionais" 
                  className="resize-none"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <Label>Email (.msg)</Label>
          <Input
            type="file"
            accept=".msg"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) {
                form.setValue('email_msg', '');
                return;
              }
              const reader = new FileReader();
              reader.onload = () => {
                const result = reader.result as string;
                form.setValue('email_msg', result);
              };
              reader.readAsDataURL(file);
            }}
          />
          <p className="text-xs text-muted-foreground">
            Anexe o email original em formato .msg para manter o histórico no sistema.
          </p>
        </div>

        <div className="flex gap-2 justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Acionamento'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};
