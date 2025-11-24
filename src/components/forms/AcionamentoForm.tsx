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

const acionamentoSchema = z.object({
  codigo_acionamento: z.string().min(1, 'Código é obrigatório'),
  origem: z.string().min(1, 'Origem é obrigatória'),
  prioridade: z.enum(['normal', 'media', 'alta', 'emergencia']),
  modalidade: z.enum(['preventiva', 'corretiva', 'emergencia', 'melhorias']),
  numero_os: z.string().optional(),
  endereco: z.string().optional(),
  municipio: z.string().optional(),
  data_abertura: z.string().min(1, 'Data de abertura é obrigatória'),
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
      prioridade: 'normal',
      modalidade: 'preventiva',
      data_abertura: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = async (data: AcionamentoFormData) => {
    if (!user) return;

    setIsLoading(true);

    const { error } = await supabase.from('acionamentos').insert([{
      codigo_acionamento: data.codigo_acionamento,
      origem: data.origem,
      prioridade: data.prioridade,
      modalidade: data.modalidade,
      numero_os: data.numero_os || null,
      endereco: data.endereco || null,
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="codigo_acionamento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código do Acionamento*</FormLabel>
                <FormControl>
                  <Input placeholder="AC-2024-001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="origem"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Origem*</FormLabel>
                <FormControl>
                  <Input placeholder="Energisa" {...field} />
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
                <FormLabel>Prioridade*</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a prioridade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="emergencia">Emergência</SelectItem>
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
                    <SelectItem value="preventiva">Preventiva</SelectItem>
                    <SelectItem value="corretiva">Corretiva</SelectItem>
                    <SelectItem value="emergencia">Emergência</SelectItem>
                    <SelectItem value="melhorias">Melhorias</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="numero_os"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número da OS</FormLabel>
                <FormControl>
                  <Input placeholder="OS-123456" {...field} />
                </FormControl>
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
          name="endereco"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Endereço completo do acionamento" 
                  className="resize-none"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
