# Validação de login no Supabase

### 1. Verifique as variáveis de ambiente
Abra .env na raiz e confirme os valores:

`
VITE_SUPABASE_URL=https://<SEU_PROJETO>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOi...
`

Se você mudar algum valor, reinicie o dev server (
pm run dev ou yarn dev) para recarregar.

### 2. Confirme o usuário no dashboard
1. Em Supabase Studio ? **Authentication ? Users**, localize o e-mail usado pelo front (ex.: engenharia11@engeletraconstrucao.com.br).
2. Garanta que email_confirmed_at esteja preenchido.
3. Clique em  Reset password, defina uma nova senha e use ela ao logar no front.

### 3. Teste rápido com scripts/test-login.js
O projeto já inclui o script scripts/test-login.js que carrega o .env e tenta logar. Para rodar:

`
npm install --prefix scripts @supabase/supabase-js dotenv
node scripts/test-login.js
`

O script imprime o retorno completo do Supabase:
- status 400 / invalid_credentials significa que o e-mail/senha estão errados.
- Se data.session vier preenchido, a conexão funciona e o front também deve logar.

### 4. Validando outros usuários
Se quiser testar outro usuário, edite scripts/test-login.js e troque o e-mail/senha. Você pode também usar o console via supabase.auth.signUp para criar contas de teste e confirmar o fluxo.

### 5. Dica extra
Sempre execute o script com o mesmo .env que o front usa — isso garante que você esteja testando a mesma URL e chave. Para verificar manualmente, abra o console do navegador e execute:

`	s
supabase.auth.signInWithPassword({
  email: 'teste@exemplo.com',
  password: 'SenhaForte!'
}).then(console.log);
`

---

Esse guia facilita recuperar o login quando o front retorna Failed to fetch. Mantenha-o atualizado caso as variáveis do Supabase mudem ou surjam novos usuários de teste.
