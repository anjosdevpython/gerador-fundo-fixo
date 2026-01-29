# Auditoria de Segurança - Sistema de Gestão de Lojas

Esta auditoria detalha o estado atual da segurança do sistema e propõe melhorias críticas para proteger os dados sensíveis (CPF, PIX, Gastos).

## 🔍 Descobertas Atuais

### 1. Política de Acesso ao Banco de Dados (Risco: CRÍTICO)
As tabelas `lojas` e `prestacoes` possuem a política `Permitir tudo para anon`. 
- **Problema**: Como a chave `VITE_SUPABASE_ANON_KEY` é pública no navegador, qualquer pessoa com conhecimentos técnicos mínimos pode ler, alterar ou deletar todos os dados do banco de dados sem passar pelo login.

### 2. Sistema de Login (Risco: ALTO)
O login atual é feito via comparação de texto puro no frontend (`password === "Minipreco@123"`).
- **Problema**: Esta barreira é apenas visual. Não há proteção real no servidor. O acesso aos dados (`registros`) ocorre independentemente da senha estar correta ou não se alguém acessar o banco diretamente.

### 3. Dados Sensíveis (Risco: MÉDIO)
Dados como CPF e Chaves PIX são armazenados em texto puro e trafegam sem criptografia adicional (apenas o HTTPS padrão).

---

## 🛡️ Plano de Endurecimento (Hardening)

### Passo 1: Transição para Supabase Auth
Substituir o login manual por um login oficial do Supabase por E-mail/Senha.
- Permite identificar QUEM está acessando.
- Cria uma sessão segura e persistente.

### Passo 2: Implementar RLS Estrito (Row Level Security)
Alterar as políticas no banco de dados para:
- **Visualização**: Permitir apenas se o usuário estiver autenticado.
- **Escrita/Deleção**: Permitir apenas para administradores autenticados.

### Passo 3: Proteção de Dados de Lojas
Bloquear a deleção de lojas no banco de dados para evitar acidentes, exigindo uma confirmação de nível administrativo real.

---

## 🚀 Próximas Ações Sugeridas
1. Configurar um usuário administrador no Supabase Auth.
2. Atualizar o componente `Login.jsx` para usar `supabase.auth.signInWithPassword`.
3. Atualizar os comandos SQL de RLS para usar `TO authenticated` em vez de public/anon.
