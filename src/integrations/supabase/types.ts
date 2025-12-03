export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      acesso_nivel: {
        Row: {
          codigo: string
          criado_em: string | null
          descricao: string
          id_nivel: number
        }
        Insert: {
          codigo: string
          criado_em?: string | null
          descricao: string
          id_nivel?: number
        }
        Update: {
          codigo?: string
          criado_em?: string | null
          descricao?: string
          id_nivel?: number
        }
        Relationships: []
      }
      acionamento_eventos: {
        Row: {
          id_acionamento: string
          id_evento: string
          motivo: string | null
          status_novo: string
          timestamp: string
          usuario: string
        }
        Insert: {
          id_acionamento: string
          id_evento?: string
          motivo?: string | null
          status_novo: string
          timestamp?: string
          usuario: string
        }
        Update: {
          id_acionamento?: string
          id_evento?: string
          motivo?: string | null
          status_novo?: string
          timestamp?: string
          usuario?: string
        }
        Relationships: [
          {
            foreignKeyName: "acionamento_eventos_id_acionamento_fkey"
            columns: ["id_acionamento"]
            isOneToOne: false
            referencedRelation: "acionamentos"
            referencedColumns: ["id_acionamento"]
          },
          {
            foreignKeyName: "acionamento_eventos_usuario_fkey"
            columns: ["usuario"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id_usuario"]
          },
        ]
      }
      acionamentos: {
        Row: {
          codigo_acionamento: string | null
          criado_em: string | null
          criado_por: string
          data_abertura: string
          data_chegada: string | null
          data_conclusao: string | null
          data_despacho: string | null
          endereco: string | null
          id_acionamento: string
          id_equipe: string | null
          id_viatura: string | null
          modalidade: string
          municipio: string | null
          numero_os: string | null
          origem: string
          prioridade: string
          prioridade_nivel: string | null
          status: string
          encarregado: string | null
        }
        Insert: {
          codigo_acionamento?: string | null
          criado_em?: string | null
          criado_por: string
          data_abertura: string
          data_chegada?: string | null
          data_conclusao?: string | null
          data_despacho?: string | null
          endereco?: string | null
          id_acionamento?: string
          id_equipe?: string | null
          id_viatura?: string | null
          modalidade: string
          municipio?: string | null
          numero_os?: string | null
          origem: string
          prioridade: string
          prioridade_nivel?: string | null
          status?: string
          encarregado?: string | null
        }
        Update: {
          codigo_acionamento?: string | null
          criado_em?: string | null
          criado_por?: string
          data_abertura?: string
          data_chegada?: string | null
          data_conclusao?: string | null
          data_despacho?: string | null
          endereco?: string | null
          id_acionamento?: string
          id_equipe?: string | null
          id_viatura?: string | null
          modalidade?: string
          municipio?: string | null
          numero_os?: string | null
          origem?: string
          prioridade?: string
          prioridade_nivel?: string | null
          status?: string
          encarregado?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acionamentos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id_usuario"]
          },
          {
            foreignKeyName: "acionamentos_id_equipe_fkey"
            columns: ["id_equipe"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id_equipe"]
          },
          {
            foreignKeyName: "acionamentos_id_viatura_fkey"
            columns: ["id_viatura"]
            isOneToOne: false
            referencedRelation: "viaturas"
            referencedColumns: ["id_viatura"]
          },
        ]
      }
      codigos_mao_de_obra: {
        Row: {
          ativo: string | null
          codigo_mao_de_obra: string
          descricao: string
          ups: number
        }
        Insert: {
          ativo?: string | null
          codigo_mao_de_obra: string
          descricao: string
          ups: number
        }
        Update: {
          ativo?: string | null
          codigo_mao_de_obra?: string
          descricao?: string
          ups?: number
        }
        Relationships: []
      }
      equipes: {
        Row: {
          ativo: string
          id_encarregado: string
          id_equipe: string
          nome_equipe: string
        }
        Insert: {
          ativo?: string
          id_encarregado: string
          id_equipe?: string
          nome_equipe: string
        }
        Update: {
          ativo?: string
          id_encarregado?: string
          id_equipe?: string
          nome_equipe?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipes_id_encarregado_fkey"
            columns: ["id_encarregado"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id_usuario"]
          },
        ]
      }
      invites: {
        Row: {
          aceito_em: string | null
          convidado_por: string
          criado_em: string | null
          email: string
          expira_em: string
          id: string
          roles: string[]
          status: string
          token: string
        }
        Insert: {
          aceito_em?: string | null
          convidado_por: string
          criado_em?: string | null
          email: string
          expira_em: string
          id?: string
          roles?: string[]
          status?: string
          token: string
        }
        Update: {
          aceito_em?: string | null
          convidado_por?: string
          criado_em?: string | null
          email?: string
          expira_em?: string
          id?: string
          roles?: string[]
          status?: string
          token?: string
        }
        Relationships: []
      }
      lista_aplicacao_cabecalho: {
        Row: {
          data_emissao: string
          equipe: string | null
          id_lista_aplicacao: string
          id_obra: string
          id_param_upr: string
          modalidade: string
          numero_os: string
          observacao: string | null
          status: string
          upr_valor_usado: number
          viatura: string | null
        }
        Insert: {
          data_emissao: string
          equipe?: string | null
          id_lista_aplicacao?: string
          id_obra: string
          id_param_upr: string
          modalidade: string
          numero_os: string
          observacao?: string | null
          status?: string
          upr_valor_usado: number
          viatura?: string | null
        }
        Update: {
          data_emissao?: string
          equipe?: string | null
          id_lista_aplicacao?: string
          id_obra?: string
          id_param_upr?: string
          modalidade?: string
          numero_os?: string
          observacao?: string | null
          status?: string
          upr_valor_usado?: number
          viatura?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lista_aplicacao_cabecalho_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "lista_aplicacao_cabecalho_id_param_upr_fkey"
            columns: ["id_param_upr"]
            isOneToOne: false
            referencedRelation: "parametros_upr"
            referencedColumns: ["id_param_upr"]
          },
        ]
      }
      lista_aplicacao_itens: {
        Row: {
          codigo_material: string
          descricao_item: string
          id_acionamento: string | null
          id_lista_aplicacao: string | null
          id_lista_aplicacao_item: string
          ordem_item: number | null
          quantidade: number
          unidade_medida: string
          valor_total: number
          valor_unitario_upr: number
        }
        Insert: {
          codigo_material: string
          descricao_item: string
          id_acionamento?: string | null
          id_lista_aplicacao?: string | null
          id_lista_aplicacao_item?: string
          ordem_item?: number | null
          quantidade: number
          unidade_medida: string
          valor_total: number
          valor_unitario_upr: number
        }
        Update: {
          codigo_material?: string
          descricao_item?: string
          id_acionamento?: string | null
          id_lista_aplicacao?: string | null
          id_lista_aplicacao_item?: string
          ordem_item?: number | null
          quantidade?: number
          unidade_medida?: string
          valor_total?: number
          valor_unitario_upr?: number
        }
        Relationships: [
          {
            foreignKeyName: "lista_aplicacao_itens_codigo_material_fkey"
            columns: ["codigo_material"]
            isOneToOne: false
            referencedRelation: "materiais"
            referencedColumns: ["codigo_material"]
          },
          {
            foreignKeyName: "lista_aplicacao_itens_id_lista_aplicacao_fkey"
            columns: ["id_lista_aplicacao"]
            isOneToOne: false
            referencedRelation: "lista_aplicacao_cabecalho"
            referencedColumns: ["id_lista_aplicacao"]
          },
          {
            foreignKeyName: "lista_aplicacao_itens_id_acionamento_fkey"
            columns: ["id_acionamento"]
            isOneToOne: false
            referencedRelation: "acionamentos"
            referencedColumns: ["id_acionamento"]
          },
        ]
      }
      pre_lista_itens: {
        Row: {
          codigo_material: string
          criado_em: string | null
          id: string
          id_acionamento: string
          quantidade_prevista: number
        }
        Insert: {
          codigo_material: string
          criado_em?: string | null
          id?: string
          id_acionamento: string
          quantidade_prevista: number
        }
        Update: {
          codigo_material?: string
          criado_em?: string | null
          id?: string
          id_acionamento?: string
          quantidade_prevista?: number
        }
        Relationships: [
          {
            foreignKeyName: "pre_lista_itens_codigo_material_fkey"
            columns: ["codigo_material"]
            isOneToOne: false
            referencedRelation: "materiais"
            referencedColumns: ["codigo_material"]
          },
          {
            foreignKeyName: "pre_lista_itens_id_acionamento_fkey"
            columns: ["id_acionamento"]
            isOneToOne: false
            referencedRelation: "acionamentos"
            referencedColumns: ["id_acionamento"]
          },
        ]
      }
      sucata_itens: {
        Row: {
          codigo_material: string
          criado_em: string | null
          id: string
          id_acionamento: string
          quantidade_retirada: number
        }
        Insert: {
          codigo_material: string
          criado_em?: string | null
          id?: string
          id_acionamento: string
          quantidade_retirada: number
        }
        Update: {
          codigo_material?: string
          criado_em?: string | null
          id?: string
          id_acionamento?: string
          quantidade_retirada?: number
        }
        Relationships: [
          {
            foreignKeyName: "sucata_itens_codigo_material_fkey"
            columns: ["codigo_material"]
            isOneToOne: false
            referencedRelation: "materiais"
            referencedColumns: ["codigo_material"]
          },
          {
            foreignKeyName: "sucata_itens_id_acionamento_fkey"
            columns: ["id_acionamento"]
            isOneToOne: false
            referencedRelation: "acionamentos"
            referencedColumns: ["id_acionamento"]
          },
        ]
      }
      materiais: {
        Row: {
          ativo: string | null
          codigo_material: string
          descricao: string
          unidade_medida: string
        }
        Insert: {
          ativo?: string | null
          codigo_material: string
          descricao: string
          unidade_medida: string
        }
        Update: {
          ativo?: string | null
          codigo_material?: string
          descricao?: string
          unidade_medida?: string
        }
        Relationships: []
      }
      notificacoes: {
        Row: {
          criado_em: string | null
          etapa: string | null
          id_notificacao: string
          lida: boolean | null
          mensagem: string
          referencia_id: string | null
          referencia_tipo: string | null
          tipo: string
          titulo: string
          usuario_id: string | null
        }
        Insert: {
          criado_em?: string | null
          etapa?: string | null
          id_notificacao?: string
          lida?: boolean | null
          mensagem: string
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo: string
          titulo: string
          usuario_id?: string | null
        }
        Update: {
          criado_em?: string | null
          etapa?: string | null
          id_notificacao?: string
          lida?: boolean | null
          mensagem?: string
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo?: string
          titulo?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      obras: {
        Row: {
          alimentador: string | null
          codigo_acionamento: string | null
          criado_em: string | null
          eletricistas_nr: string | null
          encarregado: string | null
          endereco: string | null
          equipe: string | null
          gestor_aprovacao_data: string | null
          gestor_aprovacao_status: string | null
          gestor_observacao: string | null
          id_obra: string
          id_poste: string | null
          inicio_servico: string | null
          km_final: number | null
          km_inicial: number | null
          modalidade: string
          nota_ss: string | null
          numero_intervencao: string | null
          numero_os: string
          numero_transformador: string | null
          observacao: string | null
          os_data_aberta_pela_energisa: string | null
          os_data_abertura: string
          os_data_envio_energisa: string
          os_numero: string
          os_prazo_abertura_energisa: number | null
          os_status: string
          os_tablet: string | null
          retorno_base: string | null
          retorno_servico: string | null
          saida_base: string | null
          subestacao: string | null
          tci_data_emissao: string | null
          tci_numero: string | null
          tci_status: string | null
          tecnico_eng: string | null
        }
        Insert: {
          alimentador?: string | null
          codigo_acionamento?: string | null
          criado_em?: string | null
          eletricistas_nr?: string | null
          encarregado?: string | null
          endereco?: string | null
          equipe?: string | null
          gestor_aprovacao_data?: string | null
          gestor_aprovacao_status?: string | null
          gestor_observacao?: string | null
          id_obra?: string
          id_poste?: string | null
          inicio_servico?: string | null
          km_final?: number | null
          km_inicial?: number | null
          modalidade: string
          nota_ss?: string | null
          numero_intervencao?: string | null
          numero_os: string
          numero_transformador?: string | null
          observacao?: string | null
          os_data_aberta_pela_energisa?: string | null
          os_data_abertura: string
          os_data_envio_energisa: string
          os_numero: string
          os_prazo_abertura_energisa?: number | null
          os_status?: string
          os_tablet?: string | null
          retorno_base?: string | null
          retorno_servico?: string | null
          saida_base?: string | null
          subestacao?: string | null
          tci_data_emissao?: string | null
          tci_numero?: string | null
          tci_status?: string | null
          tecnico_eng?: string | null
        }
        Update: {
          alimentador?: string | null
          codigo_acionamento?: string | null
          criado_em?: string | null
          eletricistas_nr?: string | null
          encarregado?: string | null
          endereco?: string | null
          equipe?: string | null
          gestor_aprovacao_data?: string | null
          gestor_aprovacao_status?: string | null
          gestor_observacao?: string | null
          id_obra?: string
          id_poste?: string | null
          inicio_servico?: string | null
          km_final?: number | null
          km_inicial?: number | null
          modalidade?: string
          nota_ss?: string | null
          numero_intervencao?: string | null
          numero_os?: string
          numero_transformador?: string | null
          observacao?: string | null
          os_data_aberta_pela_energisa?: string | null
          os_data_abertura?: string
          os_data_envio_energisa?: string
          os_numero?: string
          os_prazo_abertura_energisa?: number | null
          os_status?: string
          os_tablet?: string | null
          retorno_base?: string | null
          retorno_servico?: string | null
          saida_base?: string | null
          subestacao?: string | null
          tci_data_emissao?: string | null
          tci_numero?: string | null
          tci_status?: string | null
          tecnico_eng?: string | null
        }
        Relationships: []
      }
      parametros_upr: {
        Row: {
          contrato: string
          id_param_upr: string
          observacao: string | null
          valor_upr: number
          vigencia_fim: string | null
          vigencia_inicio: string
        }
        Insert: {
          contrato: string
          id_param_upr?: string
          observacao?: string | null
          valor_upr: number
          vigencia_fim?: string | null
          vigencia_inicio: string
        }
        Update: {
          contrato?: string
          id_param_upr?: string
          observacao?: string | null
          valor_upr?: number
          vigencia_fim?: string | null
          vigencia_inicio?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          atualizado_em: string | null
          avatar_url: string | null
          cpf: string | null
          criado_em: string | null
          email: string
          id: string
          nome: string
          telefone: string | null
        }
        Insert: {
          atualizado_em?: string | null
          avatar_url?: string | null
          cpf?: string | null
          criado_em?: string | null
          email: string
          id: string
          nome: string
          telefone?: string | null
        }
        Update: {
          atualizado_em?: string | null
          avatar_url?: string | null
          cpf?: string | null
          criado_em?: string | null
          email?: string
          id?: string
          nome?: string
          telefone?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          atualizado_em: string | null
          atualizado_por: string | null
          chave: string
          descricao: string | null
          id: string
          tipo: string
          valor: string
        }
        Insert: {
          atualizado_em?: string | null
          atualizado_por?: string | null
          chave: string
          descricao?: string | null
          id?: string
          tipo?: string
          valor: string
        }
        Update: {
          atualizado_em?: string | null
          atualizado_por?: string | null
          chave?: string
          descricao?: string | null
          id?: string
          tipo?: string
          valor?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          concedido_em: string | null
          concedido_por: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          concedido_em?: string | null
          concedido_por?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          concedido_em?: string | null
          concedido_por?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_roles_history: {
        Row: {
          acao: string
          concedido_por: string | null
          criado_em: string | null
          id: string
          motivo: string | null
          role: string
          user_id: string
        }
        Insert: {
          acao: string
          concedido_por?: string | null
          criado_em?: string | null
          id?: string
          motivo?: string | null
          role: string
          user_id: string
        }
        Update: {
          acao?: string
          concedido_por?: string | null
          criado_em?: string | null
          id?: string
          motivo?: string | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      usuario_acesso: {
        Row: {
          concedido_em: string
          concedido_por: string | null
          id_nivel: number
          id_usuario: string
        }
        Insert: {
          concedido_em?: string
          concedido_por?: string | null
          id_nivel: number
          id_usuario: string
        }
        Update: {
          concedido_em?: string
          concedido_por?: string | null
          id_nivel?: number
          id_usuario?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuario_acesso_concedido_por_fkey"
            columns: ["concedido_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id_usuario"]
          },
          {
            foreignKeyName: "usuario_acesso_id_nivel_fkey"
            columns: ["id_nivel"]
            isOneToOne: false
            referencedRelation: "acesso_nivel"
            referencedColumns: ["id_nivel"]
          },
          {
            foreignKeyName: "usuario_acesso_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id_usuario"]
          },
        ]
      }
      usuarios: {
        Row: {
          ativo: string
          cpf: string
          criado_em: string | null
          email_empresa: string
          id_usuario: string
          nome: string
          observacao: string | null
          telefone: string | null
        }
        Insert: {
          ativo?: string
          cpf: string
          criado_em?: string | null
          email_empresa: string
          id_usuario?: string
          nome: string
          observacao?: string | null
          telefone?: string | null
        }
        Update: {
          ativo?: string
          cpf?: string
          criado_em?: string | null
          email_empresa?: string
          id_usuario?: string
          nome?: string
          observacao?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      viaturas: {
        Row: {
          apelido: string | null
          ativo: string
          id_viatura: string
          modelo: string | null
          placa: string
        }
        Insert: {
          apelido?: string | null
          ativo?: string
          id_viatura?: string
          modelo?: string | null
          placa: string
        }
        Update: {
          apelido?: string | null
          ativo?: string
          id_viatura?: string
          modelo?: string | null
          placa?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "ADMIN" | "ADM" | "OPER" | "GESTOR" | "FIN"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["ADMIN", "ADM", "OPER", "GESTOR", "FIN"],
    },
  },
} as const
