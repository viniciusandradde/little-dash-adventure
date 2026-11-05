# Plano de QA — Little Dash Adventure

## Estratégia
Priorizar testes unitários para regras puras, testes de integração para persistência e engine, e testes manuais em dispositivos reais para toque, orientação e PWA.

## Matriz de testes
| Área | Cenário | Resultado esperado |
|---|---|---|
| Catálogo | Gerar lista de fases | 12 IDs únicos, 3 por mundo |
| Catálogo | Consultar ID inexistente | Retornar fallback documentado |
| Engine | Iniciar e parar | Um único loop; parar cancela RAF |
| Engine | Pausar e retomar | Tempo não avança durante pausa |
| Engine | Redimensionar canvas | DPR limitado e dimensões atualizadas |
| Progresso | Salvar/carregar | Dados válidos persistem |
| Progresso | JSON inválido/ausente | Recuperação para estado inicial |
| Jogo | Concluir fase | Progresso salvo sem duplicar conclusão |
| Acessibilidade | Controles por toque | Alvos grandes e sem hover |
| PWA | Primeira visita | Recursos essenciais carregam |
| PWA | Reabrir offline | App inicializa com cache válido |

## Comandos
- npm ci
- npm test
- npm run build
- npm run preview

## Testes em dispositivos
- Android Chrome: telas pequenas e grandes.
- Retrato e paisagem.
- Toque rápido, toque prolongado e multitouch.
- Alternar aplicativo/aba, bloquear tela e retornar.
- Rede lenta, offline e atualização de versão.
- CPU, bateria e memória em sessão de 10 minutos.

## Critérios de aceite infantil
- Não existe estado de derrota ou perda de progresso.
- O jogador sempre consegue retomar a experiência.
- Nenhum anúncio, compra, chat ou link externo.
- Não solicitar nome, e-mail, localização ou outros dados da criança.
- Som desligável e sem flashes rápidos.
