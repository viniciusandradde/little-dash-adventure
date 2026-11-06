# Plano de QA — Little Dash Adventure

## Estratégia
Regras de jogo e progressão são testadas em Node sem navegador (simulação pura). Telas, áudio e toque são verificados com Playwright (`scripts/qa-smoke.cjs`) e manualmente em aparelhos reais.

## Testes automatizados (`npm test`)
| Área | Cenário | Resultado esperado |
|---|---|---|
| Catálogo | 12 fases, 3 por mundo, ids únicos, próxima fase | Dados consistentes |
| Catálogo | Meta, 3 checkpoints, 3 moedas, ≥ 40 estrelas por fase | Verdadeiro para todas |
| Catálogo | Duração 35–75 s; buracos e blocos fisicamente transponíveis | Verdadeiro para todas |
| Simulação | Sem nenhum input, modo criança | Todas as 12 fases concluem (CA12) |
| Simulação | Bot simples | Conclui, ≥ 40% das estrelas, ≥ 1 moeda, ≤ 6 tropeços |
| Simulação | Mesmos inputs duas vezes | Resultado idêntico (determinismo) |
| Simulação | Toque antes do pouso | Pulo acontece ao pousar (buffer) |
| Simulação | Tropeço | Estrelas mantidas, invulnerabilidade, combo zera |
| Simulação | Modo Desafio | Volta ao checkpoint, mantém estrelas, tentativa +1 |
| Simulação | Portais | Voo e velocidade mudam o estado |
| Progresso | Migração v1 → v2 | Personagem, som e fases concluídas preservados |
| Progresso | Registrar resultado | Melhor pontuação, moedas acumuladas, figurinha |
| Progresso | localStorage | Salvar e carregar |

## Comandos
- `npm install`
- `npm test`
- `npm run build`
- `npm run preview` e abrir `http://localhost:4173/little-dash-adventure/?qa=1`
- `node scripts/qa-smoke.cjs` (requer Playwright instalado)

## Testes em dispositivos
- Android Chrome: telas pequenas e grandes, retrato e paisagem.
- Toque rápido, toque prolongado (pulos repetidos) e multitouch.
- Alternar aplicativo/aba (o jogo pausa sozinho), bloquear tela e retornar.
- Rede lenta, offline e atualização de versão do service worker.
- CPU, bateria e memória em sessão de 10 minutos.

## Critérios de aceite infantil
- Não existe estado de derrota, texto de "Game Over" ou perda de estrelas.
- Em modo criança a fase sempre termina, mesmo sem toques.
- Nenhum anúncio, compra, chat ou link externo; nenhum download de terceiros em tempo de execução.
- Som e música desligáveis; opção de menos movimento; sem flashes rápidos.
