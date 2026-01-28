# Plano de Melhorias - Gerador de Fundo Fixo

Este plano detalha as melhorias propostas para elevar a qualidade técnica, visual e de segurança do projeto, seguindo os padrões dos especialistas Antigravity.

## Visão Geral
O projeto atual é funcional, mas possui um arquivo `App.jsx` monolítico e uma interface que segue padrões comuns ("SaaS Safe Harbor"). Buscamos modularizar o código, modernizar a UI com animações fluidas e otimizar a camada de dados.

## User Review Required
> [!IMPORTANT]
> A modularização do código envolverá a divisão do `App.jsx` em múltiplos arquivos. Isso não altera as funcionalidades, mas facilita a manutenção futura.

## Mudanças Propostas

### 1. Arquitetura e Organização de Código
- **Modularização de Componentes**: Extrair `Generator`, `HistoryDashboard` e `Login` para arquivos separados em `src/components/`.
- **Camada de Dados**: Mover a constante `STORES` para um arquivo de configuração ou carregar dinamicamente do Supabase.
- **Custom Hooks**: Criar hooks como `useSupabaseSync` e `usePDFGenerator` para isolar a lógica de negócio.

### 2. UI/UX (Design "Maestro")
- **Refatoração Visual**: Aplicar princípios de *Deep Design Thinking* para sair do layout padrão.
- **Animações Fluidas**: Implementar transições de entrada (Entrance Animations) e micro-interação em botões usando `framer-motion` de forma mais agressiva.
- **Geometria**: Abandonar o uso excessivo de bordas arredondadas padrão, alternando com bordas mais afiadas para um visual "Premium/Technical".

### 3. Segurança e Performance
- **Validação de Inputs**: Integrar `Zod` para validar dados antes de enviar ao banco.
- **Otimização de PDF**: Refinar ainda mais a captura para garantir 100% de legibilidade em todas as resoluções.

## Próximos Passos
1. [/] Mapear componentes para extração.
2. [ ] Refatorar estrutura de pastas.
3. [ ] Implementar novo sistema de design.
4. [ ] Validar com testes E2E.

## Verificação
- [ ] Build concluído com sucesso.
- [ ] Filtro de registros funcionando.
- [ ] Download de PDF e ZIP funcionando após refatoração.
