---
name: saveall
description: Salva todo o estado do trabalho para retomar depois, em outra sessão ou após a compactação do contexto. Atualiza a memória do projeto (CLAUDE.md), o handoff (docs/handoff/ESTADO.md e HISTORICO.md) e a memória da sessão no scratchpad, confere segredos, faz commit e push do que estiver pendente em todos os repositórios, abre o PR do handoff e termina pedindo o /compact. Use quando o usuário digitar /saveall ou pedir "salvar tudo", "fazer handoff", "salvar memória", "salvar o andamento", ou avisar que a sessão ou o contexto estão acabando.
argument-hint: "[observação opcional para o histórico]"
---

# /saveall: salvar memória, status, andamento e handoff, fazer commit e compactar

Objetivo: qualquer pessoa, ou uma nova sessão do Claude, retoma o trabalho só lendo `CLAUDE.md` e `docs/handoff/ESTADO.md` do repositório. O contêiner da sessão é apagado; **o que não estiver no Git se perde.**

A skill é a mesma em todos os repositórios. As regras próprias de cada projeto (comandos de teste, CI, convenções de commit, ADRs) ficam no `CLAUDE.md` e no `README` de cada repositório: leia esses arquivos antes de começar.

Observação do usuário para o histórico, se houver: `$ARGUMENTS`

## Regras
- Escreva em pt-BR, direto. Se o `CLAUDE.md` do projeto pedir outro tom (ex.: voz formal), siga o projeto.
- **Nunca grave segredos**: tokens (`github_pat_`, `ghp_`, chaves de API, tokens do Cloudflare), senhas, códigos de login, conteúdo de `.env`. Descreva onde o segredo fica (ex.: "segredo `GITHUB_TOKEN` no projeto Pages"), nunca o valor.
- **Nunca faça commit direto na branch principal** (`main`/`master`). Trabalho pendente vai para a branch em que está, ou para uma branch nova `wip/AAAA-MM-DD-<assunto>`. O handoff vai para a branch `docs/handoff-AAAA-MM-DD`.
- **Destino dos PRs:** a branch de integração que o projeto indicar (ex.: `dev`, quando o `CLAUDE.md` disser que o desenvolvimento acontece nela e que a `main` publica). Se não houver indicação, use a branch padrão do repositório.
- Não reescreva a história (sem `--force`, `rebase` ou `amend` em branches já enviadas).
- Só faça merge de PR se o usuário já tiver autorizado merges nesta sessão **para aquele repositório** e se todos os checks obrigatórios estiverem verdes. Na dúvida, deixe o PR aberto e avise. Lembre que um merge na branch principal pode disparar o deploy de produção.
- Siga a convenção de commits do projeto (ex.: `docs:`, `chore:`). Use o autor e os trailers definidos pelas instruções da sessão. O autor dos projetos VSA é Vinicius Andrade <viniciusandradde@gmail.com>.

## Passo a passo

### 1. Levantar o estado (só leitura)
Para cada repositório Git no diretório de trabalho (ex.: `/home/user/*/`):
```bash
git -C <repo> status --short --branch
git -C <repo> log --oneline -5
git -C <repo> rev-list --count @{u}..HEAD 2>/dev/null   # commits não enviados
git -C <repo> stash list
```
Levante também:
- os PRs abertos de cada repositório (ferramentas do GitHub, `list_pull_requests`, estado `open`) e o resultado dos checks de cada um;
- as tarefas da sessão (TaskList), se existirem;
- a memória da sessão no scratchpad (ex.: `ESTADO-SESSAO.md`), se existir: é a fonte mais detalhada do que aconteceu;
- o que está publicado, quando o projeto tiver como ver (endpoint de versão ou de status, URL de produção; veja o `CLAUDE.md`).

### 2. Salvar o trabalho pendente
Para cada repositório com alterações não commitadas ou commits não enviados:
1. Se estiver na branch principal, crie `wip/AAAA-MM-DD-<assunto>`.
2. Rode as verificações rápidas que o `CLAUDE.md` ou o `README` indicarem (ex.: `npm test`, `npx astro check`, `make check`, `pnpm lint`). Commit de WIP com verificação falhando é permitido, mas diga isso na mensagem.
3. Faça `git add` só do que pertence ao trabalho. Nunca inclua `.env`, build (`dist/`, `.next/`), `node_modules/`, caches nem logs.
4. Rode a varredura de segredos do passo 4.
5. Faça o commit (`wip: <resumo>` quando estiver incompleto) e `git push -u origin <branch>`.
6. Clone raso: depois do push, crie a referência remota, senão o hook reclama:
   ```bash
   git config --add remote.origin.fetch "+refs/heads/<branch>:refs/remotes/origin/<branch>"
   git fetch -q origin <branch> && git branch --set-upstream-to=origin/<branch>
   ```

### 3. Atualizar memória e handoff
No repositório principal da sessão (o que recebeu mais trabalho), e nos outros que tiveram mudanças relevantes, crie a branch `docs/handoff-AAAA-MM-DD` a partir da branch principal atualizada e atualize:

**`CLAUDE.md`** (memória permanente do projeto, lida automaticamente no início de cada sessão):
- **Se não existir**, crie um arquivo curto com:
  - as preferências e regras do usuário;
  - o que é o repositório e onde fica cada parte;
  - as decisões que não mudam sem perguntar;
  - como trabalhar: build, testes, PR e deploy;
  - um link para `docs/handoff/ESTADO.md`.
- **Se já existir** e for o contrato do projeto (regras de engenharia, arquitetura, fonte de verdade), **não reescreva**. Só garanta uma seção curta "Handoff" com o link para `docs/handoff/ESTADO.md`. Se o próprio `CLAUDE.md` exigir ADR ou outro processo para mudar decisões, siga o processo. Decisões novas vão para o handoff ou para uma ADR, não para dentro do contrato.

**Convenção própria do projeto:** se o repositório já tiver arquivos de contexto e handoff (ex.: `.ai/context.md`, `.ai/progress.md` e `.ai/handoff.md`), atualize esses arquivos com o conteúdo abaixo e **não** crie `docs/handoff/`.

**`docs/handoff/ESTADO.md`** (reescreva por inteiro, é a foto de agora):
1. Data e hora, o commit da branch principal e o que está publicado.
2. **Resumo em 5 linhas:** o que está pronto e no ar.
3. **Em andamento:** branch, PR, o que falta e o próximo passo exato.
4. **Aguardando o usuário:** decisões e ações que só ele pode fazer.
5. **Pendências por prioridade**, com links para os documentos do projeto.
6. **Como retomar:** os comandos e arquivos para começar.
7. **Configuração externa** (hospedagem, serviços, integrações): o que existe e onde, sem segredos.

**`docs/handoff/HISTORICO.md`** (só acrescente no topo, nunca apague):
```
## AAAA-MM-DD
- O que foi feito (PRs com número e o que mudaram).
- Decisões tomadas pelo usuário.
- Observação: $ARGUMENTS (se houver)
```

**Memória da sessão no scratchpad**, se existir: acrescente uma linha dizendo que o handoff foi salvo, com a branch e o PR.

### 4. Varredura de segredos (obrigatória antes de cada commit)
```bash
git diff --cached | grep -nE 'github_pat_[A-Za-z0-9_]{20,}|ghp_[A-Za-z0-9]{30,}|gho_[A-Za-z0-9]{30,}|sk-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY|xox[abp]-|Bearer [A-Za-z0-9._-]{20,}' && echo "PARE: possível segredo"
```
Se aparecer algo, tire do commit e avise o usuário. Não faça commit com segredo, mesmo em branch.

### 5. Commit, push e PR do handoff
1. Rode o formatador do projeto nos arquivos novos, se o CI verificar formatação (ex.: `npx prettier --write` em `.md`).
2. `git add CLAUDE.md docs/handoff/` e commit: `docs(handoff): estado em AAAA-MM-DD`.
3. Faça push e crie a referência remota (como no passo 2).
4. Abra o PR para a branch principal. No corpo, coloque o resumo do ESTADO.md e a lista do que foi salvo.
5. Se o usuário já autorizou merges nesse repositório, espere os checks ficarem verdes e faça o merge. Se não autorizou, deixe o PR aberto.

### 6. Responder ao usuário
Em poucas linhas:
- o que foi salvo e onde: arquivos, branches, commits, PRs;
- o que estava pendente e foi enviado como WIP;
- o que **não** foi salvo e por quê (ex.: segredo detectado, push recusado);
- o próximo passo para retomar.

### 7. Compactar o contexto (`/compact`)
O `/compact` é um comando do Claude Code. O Claude não consegue executá-lo sozinho, nem de dentro de uma skill. Por isso o último passo é pedir ao usuário que rode o comando.

1. Só peça o `/compact` depois de confirmar que **tudo** foi salvo:
   - push feito;
   - PR aberto, ou já mergeado;
   - nenhum repositório com alterações sem commit.

   Se algo falhou, diga o que ficou de fora e **não** sugira compactar.
2. Termine a resposta com o comando pronto para copiar, trocando `<repositório>` pelo repositório principal da sessão:
   ```
   /compact Retomar pelo handoff: ler CLAUDE.md e docs/handoff/ESTADO.md do repositório <repositório>. Manter: PRs e branches abertos, o que aguarda o usuário, decisões tomadas nesta sessão e o próximo passo.
   ```
   Troque o final pelo próximo passo real, ex.: "Próximo passo: merge do PR #N quando os checks ficarem verdes".
3. Se houver PR esperando checks para o merge, avise que o merge continua depois da compactação: a inscrição no PR e o check-in agendado sobrevivem ao `/compact`.
