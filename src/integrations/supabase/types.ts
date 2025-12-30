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
      acionamento_equipes: {
        Row: {
          criado_em: string | null
          criado_por: string | null
          encarregado_nome: string | null
          id_acionamento: string
          id_acionamento_equipe: string
          id_equipe: string
          papel: string | null
        }
        Insert: {
          criado_em?: string | null
          criado_por?: string | null
          encarregado_nome?: string | null
          id_acionamento: string
          id_acionamento_equipe?: string
          id_equipe: string
          papel?: string | null
        }
        Update: {
          criado_em?: string | null
          criado_por?: string | null
          encarregado_nome?: string | null
          id_acionamento?: string
          id_acionamento_equipe?: string
          id_equipe?: string
          papel?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acionamento_equipes_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id_usuario"]
          },
          {
            foreignKeyName: "acionamento_equipes_id_acionamento_fkey"
            columns: ["id_acionamento"]
            isOneToOne: false
            referencedRelation: "acionamentos"
            referencedColumns: ["id_acionamento"]
          },
          {
            foreignKeyName: "acionamento_equipes_id_equipe_fkey"
            columns: ["id_equipe"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id_equipe"]
          },
        ]
      }
      acionamento_etapa_logs: {
        Row: {
          criado_em: string
          criado_por: string | null
          etapa_anterior: number | null
          etapa_nova: number | null
          id_acionamento: string
          id_log: string
          motivo: string | null
        }
        Insert: {
          criado_em?: string
          criado_por?: string | null
          etapa_anterior?: number | null
          etapa_nova?: number | null
          id_acionamento: string
          id_log?: string
          motivo?: string | null
        }
        Update: {
          criado_em?: string
          criado_por?: string | null
          etapa_anterior?: number | null
          etapa_nova?: number | null
          id_acionamento?: string
          id_log?: string
          motivo?: string | null
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
      acionamento_execucao: {
        Row: {
          alimentador: string | null
          atualizado_em: string | null
          criado_em: string | null
          id: string
          id_acionamento: string
          id_poste: string | null
          inicio_servico: string | null
          km_final: number | null
          km_inicial: number | null
          km_total: number | null
          numero_intervencao: string | null
          numero_transformador: string | null
          observacoes: string | null
          os_tablet: string | null
          retorno_base: string | null
          retorno_servico: string | null
          saida_base: string | null
          ss_nota: string | null
          subestacao: string | null
          tensao_ab: string | null
          tensao_an: string | null
          tensao_bc: string | null
          tensao_bn: string | null
          tensao_ca: string | null
          tensao_cn: string | null
          trafo_inst_ano: string | null
          trafo_inst_marca: string | null
          trafo_inst_numero_serie: string | null
          trafo_inst_patrimonio: string | null
          trafo_inst_potencia: string | null
          trafo_inst_tensao_primaria: string | null
          trafo_inst_tensao_secundaria: string | null
          trafo_ret_ano: string | null
          trafo_ret_marca: string | null
          trafo_ret_numero_serie: string | null
          trafo_ret_patrimonio: string | null
          trafo_ret_potencia: string | null
          trafo_ret_tensao_primaria: string | null
          trafo_ret_tensao_secundaria: string | null
          troca_transformador: boolean | null
        }
        Insert: {
          alimentador?: string | null
          atualizado_em?: string | null
          criado_em?: string | null
          id?: string
          id_acionamento: string
          id_poste?: string | null
          inicio_servico?: string | null
          km_final?: number | null
          km_inicial?: number | null
          km_total?: number | null
          numero_intervencao?: string | null
          numero_transformador?: string | null
          observacoes?: string | null
          os_tablet?: string | null
          retorno_base?: string | null
          retorno_servico?: string | null
          saida_base?: string | null
          ss_nota?: string | null
          subestacao?: string | null
          tensao_ab?: string | null
          tensao_an?: string | null
          tensao_bc?: string | null
          tensao_bn?: string | null
          tensao_ca?: string | null
          tensao_cn?: string | null
          trafo_inst_ano?: string | null
          trafo_inst_marca?: string | null
          trafo_inst_numero_serie?: string | null
          trafo_inst_patrimonio?: string | null
          trafo_inst_potencia?: string | null
          trafo_inst_tensao_primaria?: string | null
          trafo_inst_tensao_secundaria?: string | null
          trafo_ret_ano?: string | null
          trafo_ret_marca?: string | null
          trafo_ret_numero_serie?: string | null
          trafo_ret_patrimonio?: string | null
          trafo_ret_potencia?: string | null
          trafo_ret_tensao_primaria?: string | null
          trafo_ret_tensao_secundaria?: string | null
          troca_transformador?: boolean | null
        }
        Update: {
          alimentador?: string | null
          atualizado_em?: string | null
          criado_em?: string | null
          id?: string
          id_acionamento?: string
          id_poste?: string | null
          inicio_servico?: string | null
          km_final?: number | null
          km_inicial?: number | null
          km_total?: number | null
          numero_intervencao?: string | null
          numero_transformador?: string | null
          observacoes?: string | null
          os_tablet?: string | null
          retorno_base?: string | null
          retorno_servico?: string | null
          saida_base?: string | null
          ss_nota?: string | null
          subestacao?: string | null
          tensao_ab?: string | null
          tensao_an?: string | null
          tensao_bc?: string | null
          tensao_bn?: string | null
          tensao_ca?: string | null
          tensao_cn?: string | null
          trafo_inst_ano?: string | null
          trafo_inst_marca?: string | null
          trafo_inst_numero_serie?: string | null
          trafo_inst_patrimonio?: string | null
          trafo_inst_potencia?: string | null
          trafo_inst_tensao_primaria?: string | null
          trafo_inst_tensao_secundaria?: string | null
          trafo_ret_ano?: string | null
          trafo_ret_marca?: string | null
          trafo_ret_numero_serie?: string | null
          trafo_ret_patrimonio?: string | null
          trafo_ret_potencia?: string | null
          trafo_ret_tensao_primaria?: string | null
          trafo_ret_tensao_secundaria?: string | null
          troca_transformador?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "acionamento_execucao_id_acionamento_fkey"
            columns: ["id_acionamento"]
            isOneToOne: false
            referencedRelation: "acionamentos"
            referencedColumns: ["id_acionamento"]
          },
        ]
      }
      acionamentos: {
        Row: {
          almox_conferido_em: string | null
          almox_conferido_por: string | null
          assinatura_cliente_em: string | null
          assinatura_fiscal_em: string | null
          assinatura_lider_equipe_em: string | null
          book_enviado_em: string | null
          codigo_acionamento: string
          criado_em: string | null
          criado_por: string | null
          data_abertura: string
          data_chegada: string | null
          data_conclusao: string | null
          data_despacho: string | null
          data_execucao: string | null
          elemento_id: string | null
          email_msg: string | null
          encarregado: string | null
          endereco: string | null
          etapa_atual: number | null
          etapa_manual: number | null
          execucao_finalizada_em: string | null
          fiscal_enviado_em: string | null
          id_acionamento: string
          id_equipe: string | null
          id_viatura: string | null
          lote_gerado_em: string | null
          materiais_consumidos_em: string | null
          medicao_aprovada_em: string | null
          medicao_enviada_em: string | null
          medicao_registrada_em: string | null
          modalidade: string
          municipio: string | null
          nf_emitida_em: string | null
          nf_numero: string | null
          numero_os: string | null
          observacao: string | null
          origem: string
          os_criada_em: string | null
          pre_lista_validada_em: string | null
          prioridade: string
          prioridade_nivel: string | null
          status: string
          sucatas_enviadas_em: string | null
          tci_criado_em: string | null
          tipo_atividade: string | null
        }
        Insert: {
          almox_conferido_em?: string | null
          almox_conferido_por?: string | null
          assinatura_cliente_em?: string | null
          assinatura_fiscal_em?: string | null
          assinatura_lider_equipe_em?: string | null
          book_enviado_em?: string | null
          codigo_acionamento: string
          criado_em?: string | null
          criado_por?: string | null
          data_abertura: string
          data_chegada?: string | null
          data_conclusao?: string | null
          data_despacho?: string | null
          data_execucao?: string | null
          elemento_id?: string | null
          email_msg?: string | null
          encarregado?: string | null
          endereco?: string | null
          etapa_atual?: number | null
          etapa_manual?: number | null
          execucao_finalizada_em?: string | null
          fiscal_enviado_em?: string | null
          id_acionamento?: string
          id_equipe?: string | null
          id_viatura?: string | null
          lote_gerado_em?: string | null
          materiais_consumidos_em?: string | null
          medicao_aprovada_em?: string | null
          medicao_enviada_em?: string | null
          medicao_registrada_em?: string | null
          modalidade: string
          municipio?: string | null
          nf_emitida_em?: string | null
          nf_numero?: string | null
          numero_os?: string | null
          observacao?: string | null
          origem: string
          os_criada_em?: string | null
          pre_lista_validada_em?: string | null
          prioridade: string
          prioridade_nivel?: string | null
          status?: string
          sucatas_enviadas_em?: string | null
          tci_criado_em?: string | null
          tipo_atividade?: string | null
        }
        Update: {
          almox_conferido_em?: string | null
          almox_conferido_por?: string | null
          assinatura_cliente_em?: string | null
          assinatura_fiscal_em?: string | null
          assinatura_lider_equipe_em?: string | null
          book_enviado_em?: string | null
          codigo_acionamento?: string
          criado_em?: string | null
          criado_por?: string | null
          data_abertura?: string
          data_chegada?: string | null
          data_conclusao?: string | null
          data_despacho?: string | null
          data_execucao?: string | null
          elemento_id?: string | null
          email_msg?: string | null
          encarregado?: string | null
          endereco?: string | null
          etapa_atual?: number | null
          etapa_manual?: number | null
          execucao_finalizada_em?: string | null
          fiscal_enviado_em?: string | null
          id_acionamento?: string
          id_equipe?: string | null
          id_viatura?: string | null
          lote_gerado_em?: string | null
          materiais_consumidos_em?: string | null
          medicao_aprovada_em?: string | null
          medicao_enviada_em?: string | null
          medicao_registrada_em?: string | null
          modalidade?: string
          municipio?: string | null
          nf_emitida_em?: string | null
          nf_numero?: string | null
          numero_os?: string | null
          observacao?: string | null
          origem?: string
          os_criada_em?: string | null
          pre_lista_validada_em?: string | null
          prioridade?: string
          prioridade_nivel?: string | null
          status?: string
          sucatas_enviadas_em?: string | null
          tci_criado_em?: string | null
          tipo_atividade?: string | null
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
        ]
      }
      codigos_mao_de_obra: {
        Row: {
          ativo: boolean | null
          codigo_mao_de_obra: string
          created_at: string | null
          descricao: string | null
          operacao: string
          raw_line: Json | null
          tipo: string
          unidade: string | null
          ups: number | null
        }
        Insert: {
          ativo?: boolean | null
          codigo_mao_de_obra: string
          created_at?: string | null
          descricao?: string | null
          operacao: string
          raw_line?: Json | null
          tipo: string
          unidade?: string | null
          ups?: number | null
        }
        Update: {
          ativo?: boolean | null
          codigo_mao_de_obra?: string
          created_at?: string | null
          descricao?: string | null
          operacao?: string
          raw_line?: Json | null
          tipo?: string
          unidade?: string | null
          ups?: number | null
        }
        Relationships: []
      }
      codigos_mo: {
        Row: {
          ativo: string | null
          codigo_mao_de_obra: string
          descricao: string | null
          operacao: string
          tipo: string | null
          unidade: string | null
          ups: number | null
        }
        Insert: {
          ativo?: string | null
          codigo_mao_de_obra: string
          descricao?: string | null
          operacao: string
          tipo?: string | null
          unidade?: string | null
          ups?: number | null
        }
        Update: {
          ativo?: string | null
          codigo_mao_de_obra?: string
          descricao?: string | null
          operacao?: string
          tipo?: string | null
          unidade?: string | null
          ups?: number | null
        }
        Relationships: []
      }
      equipes: {
        Row: {
          ativo: string
          encarregado_nome: string | null
          encarregado_telefone: string | null
          id_equipe: string
          linha: string | null
          nome_equipe: string
        }
        Insert: {
          ativo?: string
          encarregado_nome?: string | null
          encarregado_telefone?: string | null
          id_equipe?: string
          linha?: string | null
          nome_equipe: string
        }
        Update: {
          ativo?: string
          encarregado_nome?: string | null
          encarregado_telefone?: string | null
          id_equipe?: string
          linha?: string | null
          nome_equipe?: string
        }
        Relationships: []
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
          atualizado_em: string | null
          atualizado_por: string | null
          criado_em: string | null
          criado_por: string | null
          id_acionamento: string | null
          id_lista_aplicacao: string
          observacao: string | null
        }
        Insert: {
          atualizado_em?: string | null
          atualizado_por?: string | null
          criado_em?: string | null
          criado_por?: string | null
          id_acionamento?: string | null
          id_lista_aplicacao?: string
          observacao?: string | null
        }
        Update: {
          atualizado_em?: string | null
          atualizado_por?: string | null
          criado_em?: string | null
          criado_por?: string | null
          id_acionamento?: string | null
          id_lista_aplicacao?: string
          observacao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lista_aplicacao_cabecalho_id_acionamento_fkey"
            columns: ["id_acionamento"]
            isOneToOne: false
            referencedRelation: "acionamentos"
            referencedColumns: ["id_acionamento"]
          },
        ]
      }
      lista_aplicacao_itens: {
        Row: {
          atualizado_em: string | null
          atualizado_por: string | null
          codigo_material: string
          criado_em: string | null
          criado_por: string | null
          descricao_item: string
          id_acionamento: string | null
          id_lista_aplicacao: string | null
          id_lista_aplicacao_item: string
          ordem_item: number | null
          quantidade: number
          removido_em: string | null
          removido_por: string | null
          unidade_medida: string
          valor_total: number | null
          valor_unitario_upr: number | null
        }
        Insert: {
          atualizado_em?: string | null
          atualizado_por?: string | null
          codigo_material: string
          criado_em?: string | null
          criado_por?: string | null
          descricao_item: string
          id_acionamento?: string | null
          id_lista_aplicacao?: string | null
          id_lista_aplicacao_item?: string
          ordem_item?: number | null
          quantidade: number
          removido_em?: string | null
          removido_por?: string | null
          unidade_medida: string
          valor_total?: number | null
          valor_unitario_upr?: number | null
        }
        Update: {
          atualizado_em?: string | null
          atualizado_por?: string | null
          codigo_material?: string
          criado_em?: string | null
          criado_por?: string | null
          descricao_item?: string
          id_acionamento?: string | null
          id_lista_aplicacao?: string | null
          id_lista_aplicacao_item?: string
          ordem_item?: number | null
          quantidade?: number
          removido_em?: string | null
          removido_por?: string | null
          unidade_medida?: string
          valor_total?: number | null
          valor_unitario_upr?: number | null
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
            foreignKeyName: "lista_aplicacao_itens_id_acionamento_fkey"
            columns: ["id_acionamento"]
            isOneToOne: false
            referencedRelation: "acionamentos"
            referencedColumns: ["id_acionamento"]
          },
          {
            foreignKeyName: "lista_aplicacao_itens_id_lista_aplicacao_fkey"
            columns: ["id_lista_aplicacao"]
            isOneToOne: false
            referencedRelation: "lista_aplicacao_cabecalho"
            referencedColumns: ["id_lista_aplicacao"]
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
      medicao_orcamentos: {
        Row: {
          atualizado_em: string
          atualizado_por: string | null
          fora_horario: boolean
          id: string
          id_acionamento: string
          itens_lm: Json
          itens_lv: Json
          total_base_lm: number
          total_base_lv: number
          total_final_lm: number
          total_final_lv: number
          valor_ups_lm: number | null
          valor_ups_lv: number | null
        }
        Insert: {
          atualizado_em?: string
          atualizado_por?: string | null
          fora_horario?: boolean
          id?: string
          id_acionamento: string
          itens_lm?: Json
          itens_lv?: Json
          total_base_lm?: number
          total_base_lv?: number
          total_final_lm?: number
          total_final_lv?: number
          valor_ups_lm?: number | null
          valor_ups_lv?: number | null
        }
        Update: {
          atualizado_em?: string
          atualizado_por?: string | null
          fora_horario?: boolean
          id?: string
          id_acionamento?: string
          itens_lm?: Json
          itens_lv?: Json
          total_base_lm?: number
          total_base_lv?: number
          total_final_lm?: number
          total_final_lv?: number
          valor_ups_lm?: number | null
          valor_ups_lv?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "medicao_orcamentos_id_acionamento_fkey"
            columns: ["id_acionamento"]
            isOneToOne: true
            referencedRelation: "acionamentos"
            referencedColumns: ["id_acionamento"]
          },
        ]
      }
      medicao_retorno_items: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          id_acionamento: string
          lote_retorno_id: string
          modalidade: string
          origem: string
          regra_aplicada: string | null
          total_valor: number
          ups: number
          quantidade: number
          codigo: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          id_acionamento: string
          lote_retorno_id?: string
          modalidade: string
          origem: string
          regra_aplicada?: string | null
          total_valor?: number
          ups?: number
          quantidade?: number
          codigo: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          id_acionamento?: string
          lote_retorno_id?: string
          modalidade?: string
          origem?: string
          regra_aplicada?: string | null
          total_valor?: number
          ups?: number
          quantidade?: number
          codigo?: string
        }
        Relationships: [
          {
            foreignKeyName: "medicao_retorno_items_id_acionamento_fkey"
            columns: ["id_acionamento"]
            isOneToOne: false
            referencedRelation: "acionamentos"
            referencedColumns: ["id_acionamento"]
          },
        ]
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
      sucata_itens: {
        Row: {
          classificacao: string | null
          codigo_material: string
          criado_em: string | null
          id: string
          id_acionamento: string
          quantidade_retirada: number
        }
        Insert: {
          classificacao?: string | null
          codigo_material: string
          criado_em?: string | null
          id?: string
          id_acionamento: string
          quantidade_retirada: number
        }
        Update: {
          classificacao?: string | null
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
          concedido_por: string | null
          created_at: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          concedido_por?: string | null
          created_at?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          concedido_por?: string | null
          created_at?: string | null
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
          pode_alterar_acionamento: boolean | null
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
          pode_alterar_acionamento?: boolean | null
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
          pode_alterar_acionamento?: boolean | null
          telefone?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      avancar_etapa_acionamento: {
        Args: {
          p_direcao?: string
          p_id_acionamento: string
          p_update_step?: string
        }
        Returns: undefined
      }
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
