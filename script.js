const CHAVE_USUARIO = 'avisaai-usuario';
const CHAVE_AVISOS = 'avisaai-avisos';

const CANAIS = [
  { id: 'geral', nome: 'Turma geral', sigla: 'TG' },
  { id: 'web', nome: 'Programação Web', sigla: 'PW' },
  { id: 'bd', nome: 'Banco de Dados', sigla: 'BD' }
];

const AVISOS_INICIAIS = [
  {
    canal: 'geral',
    categoria: 'Prova',
    titulo: 'Prova de Banco de Dados',
    mensagem: 'Sexta, às 19h, no laboratório 2. Conteúdo: modelagem e SQL básico.',
    autor: 'Prof. Marcelo',
    data: 'hoje, 14:20',
    lido: false
  },
  {
    canal: 'geral',
    categoria: 'Evento',
    titulo: 'Feira de Aplicativos',
    mensagem: 'Cada equipe apresenta o app em até 5 minutos. Traga o projeto pronto para demonstrar.',
    autor: 'Coordenação',
    data: 'segunda, 09:40',
    lido: false
  },
  {
    canal: 'web',
    categoria: 'Trabalho',
    titulo: 'Entrega do projeto integrador',
    mensagem: 'O prazo foi para a próxima segunda. Enviar o link pelo portal.',
    autor: 'Prof. Fabiano',
    data: 'ontem, 18:05',
    lido: false
  }
];

const ROTAS_PROTEGIDAS = ['#canais', '#avisos', '#novo', '#confirmacao'];
const ROTAS_DE_CANAL = ['#avisos', '#novo', '#confirmacao'];

let usuario = carregar(CHAVE_USUARIO, null);
let avisos = carregar(CHAVE_AVISOS, AVISOS_INICIAIS);
let canalAtual = null;
let filtro = 'Todos';

const $ = (id) => document.getElementById(id);

function carregar(chave, padrao) {
  try {
    const salvo = localStorage.getItem(chave);
    return salvo ? JSON.parse(salvo) : padrao;
  } catch (erro) {
    console.warn(erro);
    return padrao;
  }
}

function salvar(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch (erro) {
    console.warn(erro);
  }
}

function criar(tag, classe, texto) {
  const elemento = document.createElement(tag);
  if (classe) elemento.className = classe;
  if (texto) elemento.textContent = texto;
  return elemento;
}

function agora() {
  const data = new Date();
  const dia = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${dia}, ${hora}`;
}

function renderCanais() {
  $('saudacao').textContent = `Olá, ${usuario.nome} • ${usuario.perfil} • ${usuario.turma}`;
  const lista = $('lista-canais');
  lista.replaceChildren();

  CANAIS.forEach((canal) => {
    const doCanal = avisos.filter((aviso) => aviso.canal === canal.id);
    const naoLidos = doCanal.filter((aviso) => !aviso.lido).length;
    const ultimo = doCanal[0];

    const link = criar('a', 'canal');
    link.href = '#avisos';
    link.addEventListener('click', () => abrirCanal(canal));

    const info = criar('div', 'canal-info');
    info.append(
      criar('strong', '', canal.nome),
      criar('span', '', ultimo ? ultimo.titulo : 'Sem avisos')
    );

    link.append(criar('div', 'avatar', canal.sigla), info);
    if (naoLidos > 0) link.append(criar('span', 'contador', naoLidos));
    lista.append(link);
  });
}

function abrirCanal(canal) {
  canalAtual = canal;
  filtro = 'Todos';
  renderAvisos();
}

function criarCartao(aviso) {
  const cartao = criar('article', `aviso ${aviso.categoria.toLowerCase()}`);
  if (!aviso.lido) cartao.classList.add('nao-lido');

  cartao.append(
    criar('span', 'tag', aviso.categoria),
    criar('h3', '', aviso.titulo),
    criar('p', '', aviso.mensagem),
    criar('small', '', `${aviso.autor} • ${aviso.data}`)
  );

  if (!aviso.lido) {
    const botao = criar('button', 'lido-btn', 'Marcar como lido');
    botao.type = 'button';
    botao.addEventListener('click', () => {
      aviso.lido = true;
      salvar(CHAVE_AVISOS, avisos);
      renderAvisos();
    });
    cartao.append(botao);
  }

  return cartao;
}

function renderAvisos() {
  $('titulo-canal').textContent = canalAtual.nome;
  $('btn-novo').hidden = usuario.perfil !== 'Professor';

  document.querySelectorAll('.chip').forEach((chip) => {
    chip.classList.toggle('ativo', chip.dataset.categoria === filtro);
  });

  const lista = $('lista-avisos');
  lista.replaceChildren();

  const visiveis = avisos.filter(
    (aviso) =>
      aviso.canal === canalAtual.id &&
      (filtro === 'Todos' || aviso.categoria === filtro)
  );

  if (visiveis.length === 0) {
    lista.append(criar('p', 'vazio', 'Nenhum aviso encontrado.'));
    return;
  }

  visiveis.forEach((aviso) => lista.append(criarCartao(aviso)));
}

function proteger() {
  const hash = location.hash;
  if (!usuario && ROTAS_PROTEGIDAS.includes(hash)) {
    location.hash = '#identificacao';
  } else if (!canalAtual && ROTAS_DE_CANAL.includes(hash)) {
    location.hash = '#canais';
  }
}

$('btn-entrar').addEventListener('click', (evento) => {
  const nome = $('nome').value.trim();
  if (!nome) {
    evento.preventDefault();
    $('erro-nome').textContent = 'Digite seu nome para entrar.';
    $('nome').focus();
    return;
  }
  $('erro-nome').textContent = '';
  usuario = { nome, turma: $('turma').value, perfil: $('perfil').value };
  salvar(CHAVE_USUARIO, usuario);
});

$('btn-sair').addEventListener('click', () => {
  usuario = null;
  canalAtual = null;
  localStorage.removeItem(CHAVE_USUARIO);
  $('nome').value = '';
  $('erro-nome').textContent = '';
});

$('btn-publicar').addEventListener('click', (evento) => {
  const titulo = $('titulo').value.trim();
  const mensagem = $('mensagem').value.trim();

  if (!titulo || !mensagem) {
    evento.preventDefault();
    $('erro-aviso').textContent = 'Preencha o título e a mensagem.';
    return;
  }

  avisos.unshift({
    canal: canalAtual.id,
    categoria: $('categoria').value,
    titulo,
    mensagem,
    autor: usuario.nome,
    data: agora(),
    lido: false
  });
  salvar(CHAVE_AVISOS, avisos);

  $('erro-aviso').textContent = '';
  $('titulo').value = '';
  $('mensagem').value = '';
  renderAvisos();
});

document.querySelectorAll('.chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    filtro = chip.dataset.categoria;
    renderAvisos();
  });
});

window.addEventListener('hashchange', () => {
  proteger();
  if (usuario && location.hash === '#canais') renderCanais();
});

if (usuario) {
  renderCanais();
  if (!location.hash) location.hash = '#canais';
}
proteger();