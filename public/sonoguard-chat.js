
import { tr, getLanguage } from './sonoguard-i18n.js';
import { firebaseConfig } from './firebase-config.js';
import { consultarSonoGuardIA } from './sonoguard-ai-client.js';
import { getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';

const app = getApps().find(a => a.name === '[DEFAULT]') ||
  initializeApp(firebaseConfig);

const auth = getAuth(app);
const $ = id => document.getElementById(id);

const root = $('sgChatRoot');
const fab = $('sgChatFab');
const panel = $('sgChatPanel');
const messages = $('sgChatMessages');
const input = $('sgChatInput');
const form = $('sgChatForm');
const send = $('sgChatSend');

let user = null;
let working = false;
let history = [];
let conversationVersion = 0;

// ======================================
// AGREGAR MENSAJES
// ======================================

function addMessage(message, kind = 'assistant') {
  const el = document.createElement('div');

  el.className = 'sgChatBubble ' + (
    kind === 'user' ? 'sgChatUser' :
    kind === 'system' ? 'sgChatSystem' :
    'sgChatAssistant'
  );

  el.textContent = message;
  messages.append(el);
  messages.scrollTop = messages.scrollHeight;

  return el;
}

// ======================================
// BIENVENIDA BILINGUE
// ======================================

function welcome() {
  conversationVersion++;
  history = [];
  messages.replaceChildren();

  addMessage(tr(
    '¡Hola! 👋 Soy SonoGuard IA. ¿En qué puedo ayudarte? Puedo explicarte las mediciones, orientarte para tomar una foto o preparar un aviso informativo sobre un problema de ruido en tu zona.'
  ));

  const quick = document.createElement('div');
  quick.className = 'sgChatQuick';

  for (const question of [
    '¿Qué significa dBFS?',
    '¿Cómo tomo una evidencia?',
    '¿Cómo funciona el historial?'
  ]) {
    const btn = document.createElement('button');

    btn.type = 'button';
    btn.textContent = tr(question);

    btn.addEventListener('click', () => {
      input.value = btn.textContent;
      input.focus();
    });

    quick.append(btn);
  }

  messages.append(quick);
}

// ======================================
// ABRIR Y CERRAR CHAT
// ======================================

function openChat(open) {
  if (!user) return;

  panel.hidden = !open;

  fab.setAttribute(
    'aria-expanded',
    String(open)
  );

  if (open) {
    if (!messages.children.length) {
      welcome();
    }

    input.focus();
  } else {
    fab.focus();
  }
}

// ======================================
// MENSAJES DE ERROR
// ======================================

function friendlyError(error) {
  return tr(
    error?.message ||
    'No pude comunicarme con el asistente. Revisa el Worker y sus configuraciones.'
  );
}

// ======================================
// ENVIAR PREGUNTAS A OPENAI
// ======================================

async function submitChat(event) {
  event.preventDefault();

  if (!user || working) return;

  const question = input.value.trim();

  if (!question || question.length > 500) {
    if (question.length > 500) {
      addMessage(
        getLanguage() === 'en'
          ? 'Please keep your question under 500 characters.'
          : 'Escribe una pregunta de hasta 500 caracteres.',
        'system'
      );
    }

    return;
  }

  const languageAtRequest = getLanguage();
  const versionAtRequest = conversationVersion;
  const previous = history.slice(-6);

  input.value = '';
  addMessage(question, 'user');

  working = true;
  send.disabled = true;
  send.textContent = '…';

  const waiting = addMessage(
    tr('Pensando…'),
    'system'
  );

  // CORRECCION: ESTE TRY FALTABA
  try {
    const result = await consultarSonoGuardIA(
      auth,
      'chat',
      {
        message: question,
        history: previous,
        language: languageAtRequest
      }
    );

    if (versionAtRequest !== conversationVersion) {
      return;
    }

    const answer =
      result?.answer || tr('No recibí respuesta.');

    waiting.remove();
    addMessage(answer);

    history = [
      ...history,
      {
        role: 'user',
        content: question
      },
      {
        role: 'assistant',
        content: answer
      }
    ].slice(-6);

  } catch (err) {
    if (versionAtRequest !== conversationVersion) {
      return;
    }

    waiting.remove();

    addMessage(
      friendlyError(err),
      'system'
    );

  } finally {
    working = false;
    send.disabled = false;
    send.textContent = tr('Enviar');
    input.focus();
  }
}

// ======================================
// BOTON FLOTANTE
// ======================================

fab.addEventListener('click', () => {
  openChat(panel.hidden);
});

// ======================================
// CERRAR CHAT
// ======================================

$('sgChatClose').addEventListener(
  'click',
  () => openChat(false)
);

// ======================================
// FORMULARIO
// ======================================

form.addEventListener(
  'submit',
  submitChat
);

// ======================================
// CERRAR CON ESC
// ======================================

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !panel.hidden) {
    openChat(false);
  }
});

// ======================================
// AUTENTICACION FIREBASE
// ======================================

onAuthStateChanged(auth, currentUser => {
  const changed =
    user?.uid !== currentUser?.uid;

  user = currentUser;

  // Mostrar la burbuja a cualquier
  // usuario que haya iniciado sesion.
  root.hidden = !currentUser;

  if (!currentUser) {
    conversationVersion++;
    panel.hidden = true;

    fab.setAttribute(
      'aria-expanded',
      'false'
    );

    history = [];
    messages.replaceChildren();

  } else if (changed) {
    welcome();
  }
});

// ======================================
// CAMBIO DE IDIOMA ES / EN
// ======================================

document.addEventListener(
  'sonoguard:language-change',
  () => {
    if (user) {
      welcome();
    }
  }
);
