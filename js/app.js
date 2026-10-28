(() => {
  "use strict";
  const config = window.MUNDO_DAS_COPAS_CONFIG || {};
  const apiBase = String(config.API_BASE_URL || "").replace(/\/+$/, "");
  const form = document.getElementById("chat-form");
  const input = document.getElementById("message-input");
  const sendButton = document.getElementById("send-button");
  const messages = document.getElementById("messages");
  const suggestions = document.getElementById("suggestions");
  const clearButton = document.getElementById("clear-chat");
  const charCount = document.getElementById("char-count");
  let history = [];
  let busy = false;

  function scrollToBottom() { messages.scrollTop = messages.scrollHeight; }
  function appendMessage(role, text) {
    const article = document.createElement("article");
    article.className = `message ${role === "user" ? "user-message" : "assistant-message"}`;
    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = role === "user" ? "👤" : "⚽";
    const wrap = document.createElement("div");
    wrap.className = "bubble-wrap";
    const speaker = document.createElement("span");
    speaker.className = "speaker";
    speaker.textContent = role === "user" ? "VOCÊ" : "MUNDO DAS COPAS";
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = text;
    wrap.append(speaker, bubble);
    article.append(avatar, wrap);
    messages.append(article);
    scrollToBottom();
    return article;
  }
  function setBusy(value) {
    busy = value;
    sendButton.disabled = value;
    input.disabled = value;
    sendButton.querySelector("span").textContent = value ? "Enviando" : "Enviar";
  }
  function addTyping() {
    const node = appendMessage("assistant", "");
    node.querySelector(".bubble").classList.add("typing");
    node.querySelector(".bubble").replaceChildren(...[0,1,2].map(() => {
      const dot = document.createElement("span");
      return dot;
    }));
    return node;
  }
  async function sendMessage(raw) {
    const message = String(raw || "").trim();
    if (!message || busy) return;
    appendMessage("user", message);
    input.value = "";
    charCount.textContent = "0 / 1200";
    input.style.height = "auto";
    suggestions.hidden = true;
    setBusy(true);
    const typing = addTyping();
    try {
      if (!apiBase) throw new Error("A URL do backend não está configurada.");
      const response = await fetch(`${apiBase}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      });
      let data;
      try { data = await response.json(); } catch (_) { throw new Error("O servidor retornou uma resposta inválida."); }
      if (!response.ok) throw new Error(data.error || "Não foi possível processar sua pergunta.");
      if (!data.reply || typeof data.reply !== "string") throw new Error("O servidor não retornou uma resposta válida.");
      typing.remove();
      appendMessage("assistant", data.reply);
      history.push({ role: "user", content: message }, { role: "assistant", content: data.reply });
      history = history.slice(-12);
    } catch (error) {
      typing.remove();
      const messageText = error instanceof TypeError
        ? "Não consegui conectar ao servidor. Confira se o backend está ativo e se a URL da API está correta."
        : (error.message || "Ocorreu um erro inesperado. Tente novamente.");
      appendMessage("assistant", `⚠️ ${messageText}`);
    } finally {
      setBusy(false);
      input.focus();
    }
  }
  form.addEventListener("submit", event => {
    event.preventDefault();
    sendMessage(input.value);
  });
  input.addEventListener("input", () => {
    charCount.textContent = `${input.value.length} / 1200`;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 130)}px`;
  });
  input.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });
  suggestions.addEventListener("click", event => {
    const button = event.target.closest("button.suggestion");
    if (button) sendMessage(button.textContent.replace(/^[^A-Za-zÀ-ÿ0-9]+/, "").trim());
  });
  clearButton.addEventListener("click", () => {
    if (busy) return;
    history = [];
    messages.replaceChildren();
    appendMessage("assistant", "Conversa reiniciada! 🌍⚽ Pergunte algo sobre a história, os campeões ou as curiosidades das Copas do Mundo.");
    suggestions.hidden = false;
    input.focus();
  });
})();
