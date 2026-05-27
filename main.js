// =============================================
//  CONFIGURAÇÃO DO FIREBASE
//  Substitua pelos dados do seu projeto Firebase
// =============================================

const firebaseConfig = {
  apiKey: "AIzaSyDMwDMR1K8oddW88U4pwJyGYsdl78HxbsM",
  authDomain: "siteage-6d53b.firebaseapp.com",
  projectId: "siteage-6d53b",
  databaseURL: "https://siteage-6d53b-default-rtdb.firebaseio.com",
  storageBucket: "siteage-6d53b.firebasestorage.app",
  messagingSenderId: "108429899895",
  appId: "1:108429899895:web:eaeb5802432ec0f5fb2e72"
};

// Importa Firebase via CDN (módulos ESM via skypack)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, push, get, child } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

// =============================================
//  REFERÊNCIAS DO DOM
// =============================================
const inputNome     = document.getElementById('nome');
const inputData     = document.getElementById('data');
const selectServico = document.getElementById('servico');
const selectHorario = document.getElementById('horarios');
const form          = document.getElementById('form-agendamento');
const feedbackEl    = document.getElementById('feedback');

// =============================================
//  BLOQUEAR FINS DE SEMANA NA DATA
// =============================================
function configurarInputData() {
  const hoje = new Date();
  // Mínimo = hoje
  const minDate = hoje.toISOString().split('T')[0];
  inputData.setAttribute('min', minDate);

  inputData.addEventListener('input', () => {
    const [ano, mes, dia] = inputData.value.split('-').map(Number);
    // new Date com UTC para evitar fuso
    const dataSelecionada = new Date(Date.UTC(ano, mes - 1, dia));
    const diaSemana = dataSelecionada.getUTCDay(); // 0=Dom, 6=Sab

    if (diaSemana === 0 || diaSemana === 6) {
      mostrarFeedback('⚠️ Selecione um dia de semana (segunda a sexta).', 'aviso');
      inputData.value = '';
      selectHorario.innerHTML = '<option value="">Escolha uma data primeiro</option>';
    } else {
      feedbackEl.style.display = 'none';
      carregarHorarios(inputData.value);
    }
  });
}

// =============================================
//  PULL — Busca horários disponíveis no Firebase
//  Estrutura esperada no Realtime DB:
//  horarios_disponiveis/
//    "08:00": true
//    "09:00": true
//    "10:00": false   ← desativado pelo admin
//  agendamentos/
//    -Nabc123/
//      data: "2025-06-10"
//      horario: "09:00"
//      ...
// =============================================
async function carregarHorarios(dataSelecionada) {
  selectHorario.innerHTML = '<option value="">Carregando horários...</option>';

  try {
    const dbRef = ref(db);

    // Busca todos os horários configurados
    const snapHorarios = await get(child(dbRef, 'horarios_disponiveis'));
    // Busca agendamentos já existentes para a data
    const snapAgendamentos = await get(child(dbRef, 'agendamentos'));

    if (!snapHorarios.exists()) {
      selectHorario.innerHTML = '<option value="">Nenhum horário cadastrado</option>';
      return;
    }

    // Monta set de horários já ocupados na data selecionada
    const ocupados = new Set();
    if (snapAgendamentos.exists()) {
      snapAgendamentos.forEach(item => {
        const ag = item.val();
        if (ag.data === dataSelecionada) {
          ocupados.add(ag.horario);
        }
      });
    }

    // Filtra horários ativos e disponíveis
    const horariosDisponiveis = [];
    snapHorarios.forEach(item => {
      const horario = item.key;   // ex: "08:00"
      const ativo   = item.val(); // true ou false
      if (ativo && !ocupados.has(horario)) {
        horariosDisponiveis.push(horario);
      }
    });

    if (horariosDisponiveis.length === 0) {
      selectHorario.innerHTML = '<option value="">Sem horários disponíveis neste dia</option>';
      return;
    }

    selectHorario.innerHTML = '<option value="">Selecione um horário</option>';
    horariosDisponiveis.sort().forEach(horario => {
      const opt = document.createElement('option');
      opt.value       = horario;
      opt.textContent = horario;
      selectHorario.appendChild(opt);
    });

  } catch (error) {
    selectHorario.innerHTML = '<option value="">Erro ao carregar horários</option>';
    console.error('Erro ao buscar horários no Firebase:', error);
  }
}

// =============================================
//  PUSH — Salva agendamento no Firebase
// =============================================
async function salvarAgendamento(e) {
  e.preventDefault();

  const nome    = inputNome.value.trim();
  const data    = inputData.value;
  const servico = selectServico.value;
  const horario = selectHorario.value;

  // Validações básicas
  if (!nome || !data || !servico || !horario) {
    mostrarFeedback('⚠️ Preencha todos os campos.', 'aviso');
    return;
  }

  const btnSubmit = form.querySelector('button[type="submit"]');
  btnSubmit.disabled    = true;
  btnSubmit.textContent = 'Agendando...';

  try {
    await push(ref(db, 'agendamentos'), {
      nome,
      data,
      servico,
      horario,
      criadoEm: new Date().toISOString()
    });

    mostrarFeedback(`✅ Agendamento confirmado! ${nome}, te esperamos no dia ${formatarData(data)} às ${horario}.`, 'sucesso');
    form.reset();
    selectHorario.innerHTML = '<option value="">Escolha uma data primeiro</option>';

  } catch (error) {
    mostrarFeedback('❌ Erro ao agendar. Tente novamente.', 'erro');
    console.error('Erro ao salvar agendamento no Firebase:', error);
  } finally {
    btnSubmit.disabled    = false;
    btnSubmit.textContent = 'Agendar';
  }
}

// =============================================
//  UTILITÁRIOS
// =============================================
function mostrarFeedback(mensagem, tipo) {
  feedbackEl.textContent    = mensagem;
  feedbackEl.className      = `feedback ${tipo}`;
  feedbackEl.style.display  = 'block';
  feedbackEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function formatarData(dataISO) {
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

// =============================================
//  INICIALIZAÇÃO
// =============================================
configurarInputData();
form.addEventListener('submit', salvarAgendamento);

console.log(firebase)
