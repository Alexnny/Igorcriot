# PYTHON: do zero ao primeiro jogo 🎮🐍

Vídeo-aula **3D, futurista e interativa** de Python para iniciantes, com ~20 minutos e 18 missões em estilo gamer. O visual tem cidade neon, grid synthwave, objetos holográficos em PBR cromado, bloom e HUD de jogo. Toda a trilha sonora é sintetizada.

Ela existe em dois formatos:

| Formato | Arquivo | Uso |
|---|---|---|
| **Vídeo MP4** (1920×1080, 24 fps, com capítulos) | `python-do-zero.mp4` | Assistir, enviar ou postar |
| **Player interativo 3D** | `index.html` | Abrir no navegador: o 3D roda ao vivo e acompanha o mouse. Tem capítulos, velocidade e um botão para copiar o código |

## Conteúdo (18 missões)

1. O que é Python?
2. `print()` e comentários
3. Variáveis: atribuição, tipagem dinâmica, regras de nome, troca de valores
4. Tipos de dados: `int`, `float`, `str`, `bool`, `None`, `type()`
5. Operadores aritméticos e precedência
6. Strings: índices, fatiamento, métodos e f-strings
7. `input()` e conversão de tipos
8. Comparações e lógica: `and`, `or`, `not`
9. Condicionais: `if` / `elif` / `else` e indentação
10. Listas
11. Tuplas e conjuntos
12. Dicionários
13. Laço `for`, `range()` e `enumerate()`
14. Laço `while`, `break` e `continue` (o *game loop*)
15. Funções: `def`, parâmetros, `return` e valores padrão
16. Erros e `try` / `except` / `finally`
17. Módulos e bibliotecas: `import`, `random`, `math`, `pip`
18. **Projeto final:** jogo "Adivinhe o Número"

Cada missão tem um cartão de título e explicação em tópicos. Depois vêm exemplos de código digitados ao vivo, com realce de sintaxe e a saída no terminal, uma **Dica Pro** e uma conquista com XP. Todas as saídas mostradas foram conferidas executando o código no Python.

## Como abrir o player interativo

O player precisa ser servido por HTTP. Abrir o arquivo direto com duplo clique não funciona, porque os módulos ES não carregam por `file://`.

```bash
cd python-video
python3 -m http.server 8000
# abra http://localhost:8000
```

Atalhos: `Espaço` play/pause · `←`/`→` ±5 s · `N`/`P` próximo/anterior capítulo · `F` tela cheia · `M` som.
Para começar em um ponto específico, use `?t=segundos`.

## Estrutura

```
src/content.js     conteúdo didático (tópicos, exemplos, dicas)
src/timeline.js    motor de tempo determinístico (tudo é função de t)
src/world.js       mundo 3D: cidade, grid, partículas, pós-processamento
src/heroes.js      objetos 3D de cada missão
src/overlay.js     HUD, painéis, editor com digitação, conquistas
src/main.js        player interativo + modo de exportação (?render=1)
audio/make_soundtrack.py   trilha synthwave + efeitos sonoros (numpy)
render/render.mjs  exporta o vídeo quadro a quadro (Playwright + ffmpeg)
render/finalize.sh junta os blocos, o áudio e os capítulos no MP4
```

## Recriar o vídeo

```bash
npm install && npm run build
python3 -m http.server 8765 &
node render/export-events.mjs audio/events.json
python3 audio/make_soundtrack.py audio/events.json build/soundtrack.wav
node render/render.mjs --fps 24 --workers 4 --gl 0.6 --out build   # pode interromper e retomar
bash render/finalize.sh build python-do-zero.mp4
```

Para mudar o conteúdo, edite `src/content.js`. A duração de cada cena é recalculada sozinha a partir do tamanho dos textos e do código.
