# Catálogo de arte — Little Dash Adventure

> Estado: **arte gerada; integração no runtime pendente**. Este documento registra as entregas do pipeline visual e os critérios obrigatórios antes de ativá-las no jogo.

## Identidade visual

Direção: jogo infantil original, alegre, acolhedor e legível em telas pequenas. Formas arredondadas, cores vivas equilibradas, contraste suficiente e ausência de elementos assustadores. Os quatro mundos são Reino dos Doces, Ilha dos Dinossauros, Fundo do Mar e Aventura Espacial.

## Assets gerados

Os links abaixo apontam para os arquivos de origem hospedados no CDN do serviço de geração. Ainda não são arquivos versionados no Git. Antes da integração, baixar, validar e armazenar cópias locais em `public/assets/`.

| Asset | Original PNG | WebP otimizado | Estado / validação |
|---|---|---|---|
| Reino dos Doces | [PNG](https://d8j0ntlcm91z4.cloudfront.net/user_3JEBvIBbBxFXhwnFWwMOJeZAkLe/hf_20261105_230025_ac0682e6-59ec-4130-ba3b-eabe20d45214.png) | [WebP](https://d8j0ntlcm91z4.cloudfront.net/user_3JEBvIBbBxFXhwnFWwMOJeZAkLe/hf_20261105_230025_ac0682e6-59ec-4130-ba3b-eabe20d45214_min.webp) | Gerado; validar composição e recorte |
| Ilha dos Dinossauros | [PNG](https://d8j0ntlcm91z4.cloudfront.net/user_3JEBvIBbBxFXhwnFWwMOJeZAkLe/hf_20261105_222844_1c90f0bc-79d5-4227-90ca-fdf86d765e03.png) | [WebP](https://d8j0ntlcm91z4.cloudfront.net/user_3JEBvIBbBxFXhwnFWwMOJeZAkLe/hf_20261105_222844_1c90f0bc-79d5-4227-90ca-fdf86d765e03_min.webp) | Gerado; validar composição e recorte |
| Fundo do Mar | [PNG](https://d8j0ntlcm91z4.cloudfront.net/user_3JEBvIBbBxFXhwnFWwMOJeZAkLe/hf_20261105_222844_37d4843a-e85c-40fb-be6f-d789805c90a8.png) | [WebP](https://d8j0ntlcm91z4.cloudfront.net/user_3JEBvIBbBxFXhwnFWwMOJeZAkLe/hf_20261105_222844_37d4843a-e85c-40fb-be6f-d789805c90a8_min.webp) | Gerado; validar composição e recorte |
| Aventura Espacial | [PNG](https://d8j0ntlcm91z4.cloudfront.net/user_3JEBvIBbBxFXhwnFWwMOJeZAkLe/hf_20261105_222845_4ff9d8bb-13a3-4f2a-a6e1-3c9751e01e74.png) | [WebP](https://d8j0ntlcm91z4.cloudfront.net/user_3JEBvIBbBxFXhwnFWwMOJeZAkLe/hf_20261105_222845_4ff9d8bb-13a3-4f2a-a6e1-3c9751e01e74_min.webp) | Gerado; validar composição e recorte |
| Atlas Cubinho, Dino, Estrelinha e Foguetinho | [PNG](https://d8j0ntlcm91z4.cloudfront.net/user_3JEBvIBbBxFXhwnFWwMOJeZAkLe/hf_20261105_222846_b8c5e3b0-4ff2-4520-b732-2035a326c487.png) | [WebP](https://d8j0ntlcm91z4.cloudfront.net/user_3JEBvIBbBxFXhwnFWwMOJeZAkLe/hf_20261105_222846_b8c5e3b0-4ff2-4520-b732-2035a326c487_min.webp) | Gerado; validar canal alpha, margens e divisão dos sprites |

## Critérios de integração

1. Baixar os arquivos e versioná-los localmente; não depender do CDN de geração em produção.
2. Inspecionar dimensões, perfil de cor, transparência, artefatos e legibilidade em escala mobile.
3. Os cenários foram solicitados em proporção widescreen, mas a configuração efetiva da geração foi 1:1. **Não esticar**: adaptar com crop/panning ou composição em camadas, preservando os elementos importantes.
4. O atlas de personagens não deve ser usado como spritesheet até validar alpha, limites de cada sprite e sequência de animação. Se necessário, separar os personagens em arquivos individuais.
5. Converter/otimizar imagens para WebP/AVIF conforme suporte do pipeline, preservando PNG de origem.
6. Atualizar o cache versionado do service worker somente depois que os arquivos finais estiverem no repositório.
7. Registrar dimensões finais, tamanho em bytes, licença/origem e checksum no inventário técnico.

## Pendências não bloqueantes para o catálogo

- Arte de interface (botões, pausa, som, configurações parentais, medalhas e partículas): geração no Canva iniciada anteriormente; arquivo final ainda não validado.
- Trilha musical original em loop: solicitação enviada; arquivo final ainda não validado.
- Testes visuais e de desempenho em dispositivos móveis reais.

## Privacidade infantil

Não incorporar fotos pessoais ou rostos de familiares nos assets enviados a serviços externos. Qualquer recurso personalizado com imagem de criança deve permanecer local e opcional, com controle parental de ativação e exclusão. Não criar reconhecimento facial, embeddings ou telemetria de imagem.

## Pipeline de referência

Canvas de produção: [Higgsfield — Little Dash Adventure](https://higgsfield.ai/canvas/53986a3d-3e67-4301-9f90-a214e0253303).
