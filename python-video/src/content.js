// =====================================================================
//  CONTEÚDO DO VÍDEO — "PYTHON: DO ZERO AO PRIMEIRO JOGO"
//  Cada missão = um tópico. Pontos (explicação) + exemplos de código
//  com saída real (verificada executando o Python) + dica pro.
//  Na saída, o trecho entre ⟦ ⟧ representa o que o usuário digitou.
// =====================================================================

export const COURSE = {
  title: 'PYTHON',
  subtitle: 'DO ZERO AO PRIMEIRO JOGO',
  tagline: 'O guia definitivo para iniciantes · variáveis, tipos, lógica, loops, funções e muito mais',
};

export const MISSIONS = [
  {
    key: 'oque', hero: 'core', file: 'ola_mundo.py', xp: 100,
    title: 'O que é Python?',
    badge: 'Primeiro Contato',
    intro: 'Uma linguagem de programação simples de ler, poderosa e usada no mundo inteiro.',
    points: [
      { h: 'Alto nível e legível', t: 'O código parece quase inglês. Você foca no problema, não em detalhes da máquina.' },
      { h: 'Interpretada', t: 'O interpretador lê e executa o programa linha por linha, de cima para baixo.' },
      { h: 'Serve para tudo', t: 'Sites, automação, ciência de dados, inteligência artificial e até jogos com Pygame.' },
      { h: 'Como começar', t: 'Instale em python.org, abra o VS Code e rode `python arquivo.py` no terminal.' },
    ],
    examples: [
      {
        label: 'Seu primeiro programa',
        code: `print("Olá, mundo!")
print("Bem-vindo ao Python!")`,
        out: `Olá, mundo!
Bem-vindo ao Python!`,
      },
    ],
    tip: 'Teste ideias no modo interativo: digite `python` no terminal e use o prompt `>>>` para executar comandos na hora.',
  },
  {
    key: 'print', hero: 'monitor', file: 'saida.py', xp: 120,
    title: 'print() e comentários',
    badge: 'Comunicador',
    intro: 'A função print() é a voz do seu programa: ela mostra informações na tela.',
    points: [
      { h: 'Texto entre aspas', t: 'Textos ficam entre aspas duplas ou simples: `"Olá"` ou `\'Olá\'`.' },
      { h: 'Vários valores', t: 'Separe por vírgula. O print coloca um espaço entre eles automaticamente.' },
      { h: 'sep e end', t: '`sep` troca o separador. `end` troca o que vem no final (o padrão é pular linha).' },
      { h: 'Comentários com #', t: 'Tudo depois de `#` é ignorado pelo Python. Use para explicar o seu código.' },
    ],
    examples: [
      {
        label: 'Mostrando informações',
        code: `# Meu primeiro HUD de jogo
print("Bem-vindo, jogador!")
print("Nível", 1, "iniciado")
print("A", "B", "C", sep="-")
print("Carregando", end="...")
print("pronto!")`,
        out: `Bem-vindo, jogador!
Nível 1 iniciado
A-B-C
Carregando...pronto!`,
      },
    ],
    tip: 'Comente o PORQUÊ, não o óbvio. `# dano dobra no modo difícil` ajuda muito mais que `# multiplica por 2`.',
  },
  {
    key: 'variaveis', hero: 'crate', file: 'variaveis.py', xp: 200,
    title: 'Variáveis',
    badge: 'Guardião da Memória',
    intro: 'Uma variável é um nome que guarda um valor na memória — como um baú com uma etiqueta.',
    points: [
      { h: 'Criando', t: '`nome = valor`. O sinal `=` significa atribuição: "guarde este valor neste nome".' },
      { h: 'Tipagem dinâmica', t: 'Você não declara o tipo. O Python descobre sozinho pelo valor guardado.' },
      { h: 'O valor pode mudar', t: 'Basta atribuir de novo. `vida = vida - 25` calcula e guarda o novo valor.' },
      { h: 'Regras de nome', t: 'Letras, números e `_`. Não pode começar com número nem ter espaços. `Vida` ≠ `vida`.' },
      { h: 'Boas práticas', t: 'Use snake_case e nomes descritivos: `pontos_totais`, `tempo_restante`.' },
    ],
    examples: [
      {
        label: 'Criando e alterando variáveis',
        code: `nome = "Kira"
vida = 100
nivel = 1
print(nome, "tem", vida, "de vida")

vida = vida - 25      # tomou dano!
nivel += 1            # o mesmo que nivel = nivel + 1
print("Vida:", vida, "| Nível:", nivel)`,
        out: `Kira tem 100 de vida
Vida: 75 | Nível: 2`,
      },
      {
        label: 'Atribuição múltipla e troca',
        code: `pontos_totais = 0      # válido: snake_case
x, y = 10, 20          # atribuição múltipla
x, y = y, x            # troca os valores!
print(x, y)
# 2vidas = 3   -> inválido: começa com número`,
        out: `20 10`,
      },
    ],
    tip: 'Nomes claros valem ouro: `tempo_restante` explica muito mais do que `t`. Seu "eu do futuro" agradece.',
  },
  {
    key: 'tipos', hero: 'crystals', file: 'tipos.py', xp: 200,
    title: 'Tipos de dados',
    badge: 'Alquimista de Dados',
    intro: 'Todo valor tem um tipo. O tipo define o que você pode fazer com ele.',
    points: [
      { h: 'int', t: 'Números inteiros, positivos ou negativos: `42`, `-7`, `0`.' },
      { h: 'float', t: 'Números com casas decimais, sempre com ponto: `3.14`, `7.5`.' },
      { h: 'str', t: 'Textos (strings) entre aspas: `"Mago"`, `\'Python\'`.' },
      { h: 'bool', t: 'Verdadeiro ou falso: `True` e `False` (com inicial maiúscula).' },
      { h: 'None', t: 'Representa a ausência de valor. Use `type()` para descobrir o tipo de algo.' },
    ],
    examples: [
      {
        label: 'Descobrindo tipos com type()',
        code: `moedas = 250          # int
velocidade = 7.5      # float
classe = "Mago"       # str
online = True         # bool
arma = None           # NoneType

print(type(moedas))
print(type(velocidade))
print(type(classe))
print(type(online))
print(type(arma))`,
        out: `<class 'int'>
<class 'float'>
<class 'str'>
<class 'bool'>
<class 'NoneType'>`,
      },
    ],
    tip: 'Atenção: `"10"` (texto) é diferente de `10` (número). Somar `"10" + 5` gera erro!',
  },
  {
    key: 'operadores', hero: 'operators', file: 'operadores.py', xp: 180,
    title: 'Operadores aritméticos',
    badge: 'Calculadora Viva',
    intro: 'O Python é uma calculadora poderosa. Conheça os operadores matemáticos.',
    points: [
      { h: '+  -  *  /', t: 'Soma, subtração, multiplicação e divisão. A divisão `/` sempre resulta em float.' },
      { h: '//  e  %', t: '`//` é a divisão inteira (descarta decimais). `%` devolve o resto da divisão.' },
      { h: '**', t: 'Potência: `2 ** 10` é 2 elevado a 10.' },
      { h: 'Precedência', t: 'Parênteses primeiro, depois `**`, depois `* / // %`, por último `+ -`.' },
      { h: 'Atribuição composta', t: '`+=`, `-=`, `*=`, `/=` atualizam a variável: `xp += 50`.' },
    ],
    examples: [
      {
        label: 'Todas as operações',
        code: `a, b = 17, 5
print(a + b)       # soma
print(a - b)       # subtração
print(a * b)       # multiplicação
print(a / b)       # divisão
print(a // b)      # divisão inteira
print(a % b)       # resto
print(2 ** 10)     # potência
print((2 + 3) * 4) # parênteses primeiro`,
        out: `22
12
85
3.4
3
2
1024
20`,
      },
    ],
    tip: 'O operador `%` é ótimo para saber se um número é par: `numero % 2 == 0` significa par.',
  },
  {
    key: 'strings', hero: 'letters', file: 'strings.py', xp: 220,
    title: 'Strings (textos)',
    badge: 'Mestre das Palavras',
    intro: 'Strings são sequências de caracteres. Cada letra tem uma posição (índice).',
    points: [
      { h: 'Índices', t: 'Começam em 0. Índices negativos contam do fim: `texto[-1]` é o último caractere.' },
      { h: 'Fatiamento', t: '`texto[inicio:fim]` pega um pedaço. O índice `fim` não entra no resultado.' },
      { h: 'Métodos úteis', t: '`.upper()`, `.lower()`, `.strip()`, `.replace()`, `.split()` e `len()`.' },
      { h: 'f-strings', t: 'Coloque `f` antes das aspas e variáveis entre `{ }`: `f"Olá, {nome}"`.' },
      { h: 'Imutáveis', t: 'Métodos não alteram a string original: eles devolvem uma string nova.' },
    ],
    examples: [
      {
        label: 'Índices, fatias e métodos',
        code: `jogo = "Python Quest"
print(len(jogo))
print(jogo[0], jogo[-1])
print(jogo[0:6])
print(jogo.upper())
print(jogo.replace("Quest", "Arena"))`,
        out: `12
P t
Python
PYTHON QUEST
Python Arena`,
      },
      {
        label: 'f-strings: textos dinâmicos',
        code: `heroi = "Kira"
pontos = 1500
tempo = 83.4567
print(f"{heroi} fez {pontos} pontos!")
print(f"Dobro: {pontos * 2}")
print(f"Tempo: {tempo:.2f}s")`,
        out: `Kira fez 1500 pontos!
Dobro: 3000
Tempo: 83.46s`,
      },
    ],
    tip: 'Use f-strings sempre que misturar texto e variáveis. `:.2f` formata com 2 casas decimais.',
  },
  {
    key: 'input', hero: 'portal', file: 'entrada.py', xp: 200,
    title: 'input() e conversão de tipos',
    badge: 'Tradutor Universal',
    intro: 'Com input() o programa conversa com o usuário. Com conversões, transformamos tipos.',
    points: [
      { h: 'input()', t: 'Mostra uma mensagem e espera o usuário digitar e apertar Enter.' },
      { h: 'Sempre texto', t: 'O input() SEMPRE devolve uma `str`, mesmo que a pessoa digite um número.' },
      { h: 'Convertendo', t: '`int()`, `float()` e `str()` transformam um valor em outro tipo.' },
      { h: 'Cuidado', t: 'Converter algo inválido, como `int("abc")`, gera um `ValueError`.' },
    ],
    examples: [
      {
        label: 'Conversando com o usuário',
        code: `nome = input("Seu nome: ")
idade = int(input("Sua idade: "))
print(f"Olá, {nome}!")
print(f"Ano que vem você terá {idade + 1} anos.")`,
        out: `Seu nome: ⟦Ana⟧
Sua idade: ⟦17⟧
Olá, Ana!
Ano que vem você terá 18 anos.`,
      },
      {
        label: 'Texto x número',
        code: `print("5" + "5")            # junta textos
print(int("5") + int("5"))  # soma números
print(float("2.5") * 2)
print(str(99) + " vidas")`,
        out: `55
10
5.0
99 vidas`,
      },
    ],
    tip: 'Esqueceu o int()? `"17" + 1` gera TypeError: o Python não soma texto com número.',
  },
  {
    key: 'logica', hero: 'logic', file: 'logica.py', xp: 200,
    title: 'Comparações e lógica',
    badge: 'Juiz Binário',
    intro: 'Comparações respondem perguntas com True ou False. A lógica combina respostas.',
    points: [
      { h: 'Comparadores', t: '`==` igual, `!=` diferente, `>` maior, `<` menor, `>=` e `<=`.' },
      { h: 'and', t: 'Verdadeiro somente se AS DUAS condições forem verdadeiras.' },
      { h: 'or', t: 'Verdadeiro se PELO MENOS UMA das condições for verdadeira.' },
      { h: 'not', t: 'Inverte o valor: `not True` vira `False`.' },
      { h: '=  vs  ==', t: '`=` guarda um valor. `==` compara dois valores. Não confunda!' },
    ],
    examples: [
      {
        label: 'Testando condições',
        code: `vida = 30
tem_pocao = True

print(vida == 30)
print(vida > 50)
print(vida != 0)
print(vida < 50 and tem_pocao)
print(vida > 50 or tem_pocao)
print(not tem_pocao)
print(0 < vida <= 100)   # comparação encadeada`,
        out: `True
False
True
True
True
False
True`,
      },
    ],
    tip: 'O Python permite comparações encadeadas como `0 < vida <= 100`, exatamente como na matemática.',
  },
  {
    key: 'condicionais', hero: 'branches', file: 'decisoes.py', xp: 250,
    title: 'Condicionais: if / elif / else',
    badge: 'Estrategista',
    intro: 'Condicionais permitem que o programa tome decisões e siga caminhos diferentes.',
    points: [
      { h: 'if', t: 'Executa o bloco somente se a condição for verdadeira. Termine a linha com `:`.' },
      { h: 'elif', t: 'Testa outra condição, caso as anteriores tenham sido falsas.' },
      { h: 'else', t: 'Executa quando nenhuma condição anterior foi verdadeira.' },
      { h: 'Indentação', t: 'Os 4 espaços no início da linha definem o bloco. No Python, isso é obrigatório!' },
    ],
    examples: [
      {
        label: 'Escolhendo caminhos',
        code: `vida = 35

if vida <= 0:
    print("GAME OVER")
elif vida < 40:
    print("Cuidado! Vida baixa")
else:
    print("Tudo certo, siga em frente")

print("Fim do turno")`,
        out: `Cuidado! Vida baixa
Fim do turno`,
      },
      {
        label: 'Condição em uma linha',
        code: `pontos = 820
rank = "Ouro" if pontos >= 800 else "Prata"
print("Rank:", rank)`,
        out: `Rank: Ouro`,
      },
    ],
    tip: 'IndentationError é o erro nº 1 dos iniciantes. Configure seu editor para usar sempre 4 espaços.',
  },
  {
    key: 'listas', hero: 'slots', file: 'listas.py', xp: 250,
    title: 'Listas',
    badge: 'Colecionador',
    intro: 'Uma lista guarda vários valores em ordem, dentro de colchetes [ ]. Como um inventário!',
    points: [
      { h: 'Criando', t: '`itens = ["espada", "escudo"]`. Pode misturar tipos diferentes.' },
      { h: 'Acessando', t: 'Pelo índice, que começa em 0: `itens[0]`. E `itens[-1]` é o último.' },
      { h: 'Modificando', t: '`.append()` adiciona, `.insert()` insere, `.remove()` e `.pop()` removem.' },
      { h: 'Mutáveis', t: 'Você pode trocar um item: `itens[0] = "machado"`.' },
      { h: 'Ferramentas', t: '`len()`, `in`, `.sort()`, `sum()`, `max()` e `min()`.' },
    ],
    examples: [
      {
        label: 'Gerenciando o inventário',
        code: `inventario = ["espada", "escudo", "poção"]
print(inventario[0])
inventario.append("mapa")
inventario.remove("escudo")
print(inventario)
print(len(inventario))
print("poção" in inventario)
inventario[0] = "espada lendária"
print(inventario)`,
        out: `espada
['espada', 'poção', 'mapa']
3
True
['espada lendária', 'poção', 'mapa']`,
      },
      {
        label: 'Ranking de pontuações',
        code: `pontuacoes = [450, 980, 720, 310]
pontuacoes.sort(reverse=True)
print(pontuacoes)
print(max(pontuacoes), min(pontuacoes))
print(sum(pontuacoes) / len(pontuacoes))`,
        out: `[980, 720, 450, 310]
980 310
615.0`,
      },
    ],
    tip: 'Fatiamento também funciona em listas: `ranking[:3]` devolve o top 3.',
  },
  {
    key: 'tuplas', hero: 'tupleset', file: 'tuplas_sets.py', xp: 180,
    title: 'Tuplas e conjuntos',
    badge: 'Arquiteto',
    intro: 'Duas coleções especiais: tuplas são imutáveis e conjuntos não aceitam repetidos.',
    points: [
      { h: 'Tupla ( )', t: 'Como uma lista, mas não pode ser alterada. Ideal para dados fixos, como coordenadas.' },
      { h: 'Desempacotamento', t: '`x, y = posicao` distribui os valores da tupla em variáveis.' },
      { h: 'Conjunto { }', t: 'O `set` guarda valores únicos e sem ordem garantida.' },
      { h: 'Operações', t: '`|` união, `&` interseção, `-` diferença. Perfeito para comparar grupos.' },
    ],
    examples: [
      {
        label: 'Tuplas e sets na prática',
        code: `posicao = (10, 25)
x, y = posicao
print(f"x={x}, y={y}")

conquistas = {"primeiro_boss", "speedrun"}
conquistas.add("speedrun")    # repetido: ignorado
conquistas.add("sem_dano")
print(len(conquistas))
print("speedrun" in conquistas)`,
        out: `x=10, y=25
3
True`,
      },
    ],
    tip: 'Para remover itens duplicados de uma lista, use `list(set(lista))`.',
  },
  {
    key: 'dicionarios', hero: 'keyvalue', file: 'dicionarios.py', xp: 260,
    title: 'Dicionários',
    badge: 'Bibliotecário',
    intro: 'Um dicionário guarda pares chave: valor. Você acessa pelo nome, não pela posição.',
    points: [
      { h: 'Criando', t: '`{"nome": "Kira", "vida": 100}`. Cada chave aponta para um valor.' },
      { h: 'Acessando', t: '`jogador["nome"]`. Se a chave não existir, gera um `KeyError`.' },
      { h: '.get()', t: '`jogador.get("mana", 0)` devolve um valor padrão quando a chave não existe.' },
      { h: 'Alterando', t: 'Atribua pela chave: `jogador["ouro"] = 50` cria ou atualiza.' },
      { h: 'Explorando', t: '`.keys()`, `.values()` e `.items()` listam chaves, valores e pares.' },
    ],
    examples: [
      {
        label: 'A ficha do jogador',
        code: `jogador = {
    "nome": "Kira",
    "classe": "Arqueira",
    "vida": 100,
}
print(jogador["nome"])
jogador["vida"] -= 20
jogador["ouro"] = 50
print(jogador.get("mana", 0))
print(jogador)
print(list(jogador.keys()))`,
        out: `Kira
0
{'nome': 'Kira', 'classe': 'Arqueira', 'vida': 80, 'ouro': 50}
['nome', 'classe', 'vida', 'ouro']`,
      },
    ],
    tip: 'Dicionários são perfeitos para representar "coisas" do mundo real: jogadores, itens, configurações.',
  },
  {
    key: 'for', hero: 'ring', file: 'laco_for.py', xp: 260,
    title: 'Laço for e range()',
    badge: 'Mestre da Repetição',
    intro: 'O for repete um bloco de código para cada item de uma sequência.',
    points: [
      { h: 'for item in sequência', t: 'Percorre listas, strings, dicionários... um item por vez.' },
      { h: 'range(n)', t: 'Gera números de 0 até n-1. `range(3)` produz 0, 1, 2.' },
      { h: 'range(início, fim, passo)', t: '`range(10, 0, -3)` conta para trás: 10, 7, 4, 1.' },
      { h: 'enumerate()', t: 'Entrega a posição e o item ao mesmo tempo.' },
      { h: 'Acumuladores', t: 'Some valores dentro do laço: `total += preco`.' },
    ],
    examples: [
      {
        label: 'Repetindo com for',
        code: `for i in range(3):
    print("Rodada", i + 1)

herois = ["Kira", "Thor", "Luna"]
for posicao, heroi in enumerate(herois, start=1):
    print(f"{posicao}º {heroi}")

for n in range(10, 0, -3):
    print(n, end=" ")`,
        out: `Rodada 1
Rodada 2
Rodada 3
1º Kira
2º Thor
3º Luna
10 7 4 1`,
      },
      {
        label: 'Percorrendo um dicionário',
        code: `loja = {"poção": 30, "flecha": 5, "elmo": 120}
total = 0
for item, preco in loja.items():
    print(f"{item:<8}{preco:>4} moedas")
    total += preco
print("Total:", total)`,
        out: `poção     30 moedas
flecha     5 moedas
elmo     120 moedas
Total: 155`,
      },
    ],
    tip: 'Use o for quando você sabe QUANTAS vezes repetir, ou quando vai percorrer uma coleção.',
  },
  {
    key: 'while', hero: 'loop', file: 'laco_while.py', xp: 260,
    title: 'Laço while, break e continue',
    badge: 'Game Loop',
    intro: 'O while repete enquanto uma condição for verdadeira. É o coração de todo jogo!',
    points: [
      { h: 'while condição:', t: 'Antes de cada volta, a condição é testada. Se for False, o laço termina.' },
      { h: 'Loop infinito', t: 'Se a condição nunca ficar falsa, o laço nunca para. Atualize as variáveis!' },
      { h: 'break', t: 'Sai do laço imediatamente, mesmo que a condição ainda seja verdadeira.' },
      { h: 'continue', t: 'Pula o resto da volta atual e vai direto para a próxima.' },
    ],
    examples: [
      {
        label: 'Repetindo com while',
        code: `energia = 3
while energia > 0:
    print("Atacando! Energia:", energia)
    energia -= 1
print("Sem energia. Descanse!")`,
        out: `Atacando! Energia: 3
Atacando! Energia: 2
Atacando! Energia: 1
Sem energia. Descanse!`,
      },
      {
        label: 'Controlando com break e continue',
        code: `for n in range(1, 10):
    if n % 2 == 0:
        continue     # pula os pares
    if n > 7:
        break        # encerra o laço
    print(n)`,
        out: `1
3
5
7`,
      },
    ],
    tip: 'Todo jogo roda um "game loop": `while rodando:` ler controles → atualizar → desenhar a tela.',
  },
  {
    key: 'funcoes', hero: 'machine', file: 'funcoes.py', xp: 300,
    title: 'Funções',
    badge: 'Engenheiro',
    intro: 'Funções são blocos de código com nome, que você cria uma vez e reutiliza sempre.',
    points: [
      { h: 'def', t: '`def nome(parametros):` cria a função. O bloco indentado é o corpo dela.' },
      { h: 'Parâmetros', t: 'São as entradas da função. Podem ter valor padrão: `critico=False`.' },
      { h: 'return', t: 'Devolve um resultado para quem chamou. Sem return, a função devolve `None`.' },
      { h: 'Chamando', t: 'Use o nome com parênteses: `calcular_dano(50, 20)`.' },
      { h: 'DRY', t: '"Don\'t Repeat Yourself": se você copiou código, provavelmente precisa de uma função.' },
    ],
    examples: [
      {
        label: 'Criando uma função de dano',
        code: `def calcular_dano(ataque, defesa, critico=False):
    """Retorna o dano final do golpe."""
    dano = max(ataque - defesa, 1)
    if critico:
        dano *= 2
    return dano

print(calcular_dano(50, 20))
print(calcular_dano(50, 20, critico=True))
print(calcular_dano(10, 30))`,
        out: `30
60
1`,
      },
      {
        label: 'Parâmetro com valor padrão',
        code: `def saudacao(nome="viajante"):
    return f"Saudações, {nome}!"

print(saudacao())
print(saudacao("Luna"))`,
        out: `Saudações, viajante!
Saudações, Luna!`,
      },
    ],
    tip: 'Variáveis criadas dentro de uma função só existem lá dentro. Isso se chama escopo local.',
  },
  {
    key: 'erros', hero: 'shield', file: 'erros.py', xp: 260,
    title: 'Erros e try / except',
    badge: 'Escudo de Energia',
    intro: 'Erros acontecem com todo mundo. O segredo é entendê-los e tratá-los.',
    points: [
      { h: 'Leia o erro', t: 'A última linha do traceback diz o tipo do erro e o motivo. Comece por ela!' },
      { h: 'Erros comuns', t: '`SyntaxError`, `NameError`, `TypeError`, `ValueError`, `IndexError`, `ZeroDivisionError`.' },
      { h: 'try / except', t: 'Coloque o código arriscado no `try`. Se der erro, o `except` assume o controle.' },
      { h: 'finally', t: 'O bloco `finally` sempre executa, com ou sem erro.' },
    ],
    examples: [
      {
        label: 'Tratando erros',
        code: `try:
    numero = int("dez")
except ValueError:
    print("Isso não é um número!")

try:
    print(100 / 0)
except ZeroDivisionError as erro:
    print("Erro:", erro)
finally:
    print("O programa continua rodando")`,
        out: `Isso não é um número!
Erro: division by zero
O programa continua rodando`,
      },
    ],
    tip: 'Capture erros específicos (ValueError, KeyError...). Um `except:` genérico esconde bugs de verdade.',
  },
  {
    key: 'modulos', hero: 'modules', file: 'modulos.py', xp: 220,
    title: 'Módulos e bibliotecas',
    badge: 'Colecionador de Poderes',
    intro: 'Módulos são arquivos com código pronto. Importe e ganhe superpoderes!',
    points: [
      { h: 'import', t: '`import math` traz o módulo inteiro. Use com ponto: `math.sqrt(16)`.' },
      { h: 'from ... import', t: '`from random import randint` traz só o que você precisa.' },
      { h: 'Biblioteca padrão', t: '`math`, `random`, `time`, `datetime`, `os`, `json`... já vêm com o Python.' },
      { h: 'pip install', t: 'Instale pacotes externos: `pip install pygame` para criar jogos 2D.' },
      { h: 'Seus módulos', t: 'Todo arquivo `.py` é um módulo. Você pode importar o seu próprio código.' },
    ],
    examples: [
      {
        label: 'Usando módulos prontos',
        code: `import math
import random
from datetime import date

print(math.sqrt(144))
print(math.pi)
print(random.randint(1, 6))    # dado de 6 lados
print(random.choice(["pedra", "papel", "tesoura"]))
print(date(2026, 12, 25).year)`,
        out: `12.0
3.141592653589793
4
papel
2026`,
      },
    ],
    tip: 'Os valores de random mudam a cada execução. Rode o código várias vezes e veja!',
  },
  {
    key: 'projeto', hero: 'd20', file: 'adivinhe.py', xp: 500,
    title: 'Projeto: Adivinhe o Número',
    badge: 'Primeiro Jogo Criado',
    intro: 'Hora de juntar tudo e criar um jogo completo, do zero!',
    points: [
      { h: 'Módulos', t: '`random.randint` sorteia o número secreto.' },
      { h: 'Variáveis + input', t: 'Guardamos o segredo, as tentativas e o palpite convertido com `int()`.' },
      { h: 'while + break', t: 'O jogo repete até o jogador acertar. Aí o `break` encerra o laço.' },
      { h: 'if / elif / else', t: 'Dá dicas: mais alto, mais baixo ou vitória!' },
      { h: 'Desafio extra', t: 'Limite a 5 tentativas, trate entradas inválidas com try/except e crie uma função `jogar()`.' },
    ],
    examples: [
      {
        label: 'O jogo completo',
        code: `import random

segredo = random.randint(1, 20)
tentativas = 0
print("Adivinhe o número de 1 a 20!")

while True:
    palpite = int(input("Seu palpite: "))
    tentativas += 1
    if palpite < segredo:
        print("Mais alto!")
    elif palpite > segredo:
        print("Mais baixo!")
    else:
        print(f"Acertou em {tentativas} tentativas!")
        break`,
        out: `Adivinhe o número de 1 a 20!
Seu palpite: ⟦10⟧
Mais alto!
Seu palpite: ⟦15⟧
Mais baixo!
Seu palpite: ⟦13⟧
Acertou em 3 tentativas!`,
      },
    ],
    tip: 'Programar se aprende programando. Modifique este jogo, quebre, conserte e invente novas regras!',
  },
];

export const FINALE = {
  title: 'MISSÃO CONCLUÍDA',
  subtitle: 'Você desbloqueou os fundamentos do Python',
  next: [
    { h: 'Orientação a Objetos', t: 'Classes e objetos para modelar personagens, inimigos e itens.' },
    { h: 'Arquivos e JSON', t: 'Salve o progresso do jogo e carregue configurações.' },
    { h: 'Pygame', t: 'Gráficos, sons e controles: crie jogos 2D de verdade.' },
    { h: 'Projetos diários', t: 'Calculadora, jogo da forca, pedra-papel-tesoura, quiz...' },
  ],
};
