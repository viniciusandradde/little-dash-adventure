# Little Dash Adventure

Um jogo de plataforma infantil, mobile-first, inspirado no gênero endless runner/plataforma rítmica. Desenvolvido para crianças pequenas, com controles simples, assistência automática e progresso sem punições.

> **Status:** fundação do projeto + MVP jogável em construção. A arquitetura e os requisitos estão documentados; esta primeira versão é um ponto de partida técnico, não uma declaração de que todos os 12 níveis já estão finalizados.

## Executar localmente

Requer Node.js 20+.

```bash
npm install
npm run dev
```

Abra o endereço informado pelo Vite. Para validar a build:

```bash
npm test
npm run build
npm run preview
```

Também é possível servir a pasta de build em qualquer hospedagem estática HTTPS. O service worker habilita cache offline após a primeira visita.

## Conceito

- Criança controla o personagem com um toque para pular.
- Movimento automático em velocidade confortável.
- Sem vidas, Game Over, punição ou perda de progresso.
- Obstáculos são desafios visuais amigáveis: o personagem não morre.
- Assistência automática configurável e recuperação suave.
- Quatro mundos, quatro personagens e 12 fases planejadas.
- Interface visual simples, alvos grandes e orientação paisagem.
- Sem anúncios, compras, login, rastreamento ou backend.

## Mundos

1. Reino dos Doces — pirulitos, chocolates e nuvens.
2. Ilha dos Dinossauros — dinossauros amigáveis, ovos e plantas.
3. Fundo do Mar — peixes, bolhas, tartarugas e tesouros.
4. Aventura Espacial — planetas, foguetes e astronautas.

Cada mundo terá três fases. Todos os mundos e personagens ficam disponíveis desde o início.

## Personagens

Cubinho, Dino, Estrelinha e Foguetinho.

## Engenharia

Veja:
- [PRD](docs/PRD.md)
- [Arquitetura](docs/ARCHITECTURE.md)
- [Roadmap](docs/ROADMAP.md)
- [Plano de QA](docs/QA.md)
- [Catálogo de arte e checklist de integração](docs/ART_ASSETS.md)
- [Contribuição](CONTRIBUTING.md)
- [Avisos de terceiros](THIRD_PARTY_NOTICES.md)

## Princípios de segurança infantil

O jogo não solicita dados pessoais, não oferece chat, links externos, anúncios ou compras. O progresso é salvo somente no dispositivo. Áudio pode ser desligado. A experiência deve continuar até a conclusão mesmo sem interação.

## Licença

MIT. Consulte [LICENSE](LICENSE).
