# Catálogo de arte — Little Dash Adventure

> Estado: **assets gerados e baixados para ambiente de processamento; integração binária no Git ainda pendente**. Este documento registra as entregas do pipeline visual e os critérios obrigatórios antes de ativá-las no jogo.

## Identidade visual

Direção: jogo infantil original, alegre, acolhedor e legível em telas pequenas. Formas arredondadas, cores vivas equilibradas, contraste suficiente e ausência de elementos assustadores. Os quatro mundos são Reino dos Doces, Ilha dos Dinossauros, Fundo do Mar e Aventura Espacial.

## Assets gerados e verificados

Os cinco PNGs foram baixados com sucesso do CDN e inspecionados por metadados: todos têm 2048 × 2048 px e modo RGB. As quatro cenas foram convertidas em WebP de 768 × 768 px, qualidade 70, com os seguintes tamanhos aproximados:

| Asset | PNG original | WebP de trabalho | Estado |
|---|---:|---:|---|
| Reino dos Doces | 5,60 MB | 51 KB | Baixado e otimizado |
| Ilha dos Dinossauros | 4,86 MB | 50 KB | Baixado e otimizado |
| Fundo do Mar | 5,20 MB | 67 KB | Baixado e otimizado |
| Aventura Espacial | 5,50 MB | 50 KB | Baixado e otimizado |
| Atlas de personagens | 3,96 MB | 220 KB (WebP de origem) | RGB, sem canal alpha confirmado; não integrar como spritesheet |

Os PNGs originais e versões WebP de origem continuam acessíveis pelos links abaixo:

| Asset | Original PNG | WebP de origem |
|---|---|---|
| Reino dos Doces | [PNG](https://d8j0ntlcm91z4.cloudfront.net/user_3JEBvIBbBxFXhwnFWwMOJeZAkLe/hf_20261105_230025_ac0682e6-59ec-4130-ba3b-eabe20d45214.png) | [WebP](https://d8j0ntlcm91z4.cloudfront.net/user_3JEBvIBbBxFXhwnFWwMOJeZAkLe/hf_20261105_230025_ac0682e6-59ec-4130-ba3b-eabe20d45214_min.webp) |
| Ilha dos Dinossauros | [PNG](https://d8j0ntlcm91z4.cloudfront.net/user_3JEBvIBbBxFXhwnFWwMOJeZAkLe/hf_20261105_222844_1c90f0bc-79d5-4227-90ca-fdf86d765e03.png) | [WebP](https://d8j0ntlcm91z4.cloudfront.net/user_3JEBvIBbBxFXhwnFWwMOJeZAkLe/hf_20261105_222844_1c90f0bc-79d5-4227-90ca-fdf86d765e03_min.webp) |
| Fundo do Mar | [PNG](https://d8j0ntlcm91z4.cloudfront.net/user_3JEBvIBbBxFXhwnFWwMOJeZAkLe/hf_20261105_222844_37d4843a-e85c-40fb-be6f-d789805c90a8.png) | [WebP](https://d8j0ntlcm91z4.cloudfront.net/user_3JEBvIBbBxFXhwnFWwMOJeZAkLe/hf_20261105_222844_37d4843a-e85c-40fb-be6f-d789805c90a8_min.webp) |
| Aventura Espacial | [PNG](https://d8j0ntlcm91z4.cloudfront.net/user_3JEBvIBbBxFXhwnFWwMOJeZAkLe/hf_20261105_222845_4ff9d8bb-13a3-4f2a-a6e1-3c9751e01e74.png) | [WebP](https://d8j0ntlcm91z4.cloudfront.net/user_3JEBvIBbBxFXhwnFWwMOJeZAkLe/hf_20261105_222845_4ff9d8bb-13a3-4f2a-a6e1-3c9751e01e74_min.webp) |
| Atlas Cubinho, Dino, Estrelinha e Foguetinho | [PNG](https://d8j0ntlcm91z4.cloudfront.net/user_3JEBvIBbBxFXhwnFWwMOJeZAkLe/hf_20261105_222846_b8c5e3b0-4ff2-4520-b732-2035a326c487.png) | [WebP](https://d8j0ntlcm91z4.cloudfront.net/user_3JEBvIBbBxFXhwnFWwMOJeZAkLe/hf_20261105_222846_b8c5e3b0-4ff2-4520-b732-2035a326c487_min.webp) |

## Trilha musical

A trilha original do Reino dos Doces foi gerada e baixada: MP3, aproximadamente 30,04 segundos, instrumental, 132 BPM. Foi recodificada em MP3 a 112 kbps para teste. A continuidade perfeita do loop ainda precisa de validação auditiva; não declarar como loop sem emenda até esse teste.

Arquivo de origem: [MP3 gerado](https://d8j0ntlcm91z4.cloudfront.net/user_3JEBvIBbBxFXhwnFWwMOJeZAkLe/hf_20261105_230020_4a33d642-caba-48bb-8a94-b3eb0f2818ba.mp3).

## Critérios de integração

1. Versionar os arquivos finais localmente em `public/assets/`; não depender do CDN de geração em produção.
2. As imagens de cenário foram solicitadas em widescreen, mas a configuração efetiva foi 1:1. **Não esticar**: adaptar com crop/panning ou composição em camadas.
3. O atlas de personagens está em RGB e não possui transparência confirmada. Não usar como spritesheet. Separar personagens e poses, validar limites e alpha antes da integração.
4. Atualizar o cache versionado do service worker somente depois que os binários estiverem no repositório.
5. Registrar dimensões finais, tamanho em bytes, licença/origem e checksum no inventário técnico.
6. Testar desempenho, legibilidade e comportamento offline em dispositivos móveis reais.

## Pendências

- Arte de interface (botões, pausa, som, configurações parentais, medalhas e partículas): resultado do Canva ainda não foi validado.
- Quatro fundos e trilha foram otimizados em ambiente de processamento, mas ainda não estão versionados no Git nem conectados ao runtime.
- Testes visuais, de áudio e de PWA em dispositivos reais.

## Privacidade infantil

Não incorporar fotos pessoais ou rostos de familiares nos assets enviados a serviços externos. Qualquer recurso personalizado com imagem de criança deve permanecer local e opcional, com controle parental de ativação e exclusão. Não criar reconhecimento facial, embeddings ou telemetria de imagem.

## Pipeline de referência

Canvas de produção: [Higgsfield — Little Dash Adventure](https://higgsfield.ai/canvas/53986a3d-3e67-4301-9f90-a214e0253303).
