// Portfolio RAG Chatbot — floating widget
// Talks to the Cloudflare Worker in chatbot/worker.js.
(function () {
  // ---- EDIT THIS: your deployed Worker URL --------------------------
     var WORKER_URL = 'https://mute-dew-8908.gnanaprakash04.workers.dev';
  // ---------------------------------------------------------------------

  var GREETING = "Hi! I'm here to answer questions about Gnanaprakash's background, skills, and experience. What would you like to know?";

  function el(tag, props, children) {
    var node = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (key) {
        if (key === 'class') node.className = props[key];
        else if (key === 'text') node.textContent = props[key];
        else node.setAttribute(key, props[key]);
      });
    }
    (children || []).forEach(function (child) { node.appendChild(child); });
    return node;
  }

  var toggleBtn = el('button', { class: 'chatbot-toggle', 'aria-label': 'Open chat', type: 'button' });
  toggleBtn.innerHTML =
    '<svg class="chatbot-icon-chat" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<path d="M4 5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H9.4L5.6 19.4A1 1 0 0 1 4 18.6V16a3 3 0 0 1-2-2.83V8" ' +
        'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M8 9.5h8M8 13h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
    '</svg>' +
    '<svg class="chatbot-icon-close" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>' +
    '</svg>';

  var messagesEl = el('div', { class: 'chatbot-messages' });

  var input = el('input', {
    class: 'chatbot-input',
    type: 'text',
    placeholder: 'Ask about experience, skills…',
    'aria-label': 'Your question',
  });
  var sendBtn = el('button', { class: 'chatbot-send', type: 'submit', 'aria-label': 'Send' });
  sendBtn.textContent = '➤';
  var form = el('form', { class: 'chatbot-form' }, [input, sendBtn]);

  var panel = el('div', { class: 'chatbot-panel' }, [
    el('div', { class: 'chatbot-header' }, [
      el('div', {}, [
        document.createTextNode('Ask about my work'),
        el('span', { class: 'chatbot-subtitle', text: 'Answers are based on this site' }),
      ]),
      (function () {
        var closeBtn = el('button', { class: 'chatbot-close', type: 'button', 'aria-label': 'Close chat' });
        closeBtn.textContent = '✕';
        return closeBtn;
      })(),
    ]),
    messagesEl,
    form,
  ]);

  document.body.appendChild(toggleBtn);
  document.body.appendChild(panel);

  function addMessage(text, sender) {
    var msg = el('div', { class: 'chatbot-msg ' + sender, text: text });
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return msg;
  }

  var greeted = false;
  function openPanel() {
    panel.classList.add('is-open');
    toggleBtn.classList.add('is-open');
    if (!greeted) {
      addMessage(GREETING, 'bot');
      greeted = true;
    }
    input.focus();
  }
  function closePanel() {
    panel.classList.remove('is-open');
    toggleBtn.classList.remove('is-open');
  }

  toggleBtn.addEventListener('click', function () {
    panel.classList.contains('is-open') ? closePanel() : openPanel();
  });
  panel.querySelector('.chatbot-close').addEventListener('click', closePanel);

  var isSending = false;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var question = input.value.trim();
    if (!question || isSending) return;

    addMessage(question, 'user');
    input.value = '';
    isSending = true;
    sendBtn.disabled = true;
    var typingMsg = addMessage('Thinking…', 'bot typing');

    fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: question }),
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        typingMsg.remove();
        addMessage(data.answer || data.error || 'Sorry, something went wrong.', 'bot');
      })
      .catch(function () {
        typingMsg.remove();
        addMessage("Sorry, I'm having trouble connecting right now. Please try again in a moment.", 'bot');
      })
      .finally(function () {
        isSending = false;
        sendBtn.disabled = false;
      });
  });
})();
