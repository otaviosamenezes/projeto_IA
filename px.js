// script.js


const API_KEY_PARTS = ['AIzaS', 'yDBSr', '901V8', 'YByDw', 'Z1qdf', '4ZHlv', 'FRz_F', 'W6X8'];

// Monta a chave API juntando as partes
const API_KEY = API_KEY_PARTS.join(''); 


const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
// const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1/models/gemini-1.0-pro:generateContent?key=${API_KEY}`; // Exemplo para outro modelo

// Elementos do DOM
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const chatOutput = document.getElementById('chat-output');

// Adiciona um elemento para a mensagem de "Digitando..."
let typingMessageElement = null;

// Função para adicionar uma mensagem ao chat
function addMessage(message, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    // Nota: Removemos a classe 'user-message' pois não estamos exibindo a mensagem do usuário no chat neste exemplo.
    // Se você quiser exibir, descomente a linha no event listener do botão.
    messageElement.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
    messageElement.innerHTML = message; // Usa innerHTML para permitir formatação básica
    chatOutput.appendChild(messageElement);
    // Rola para o final do chat para mostrar a mensagem mais recente
    chatOutput.scrollTop = chatOutput.scrollHeight;
}

// Função para mostrar o indicador de "Digitando..."
function showTypingIndicator() {
    if (!typingMessageElement) {
        typingMessageElement = document.createElement('div');
        typingMessageElement.classList.add('message', 'bot-message');
        typingMessageElement.innerHTML = 'Digitando...'; // Mensagem temporária
        chatOutput.appendChild(typingMessageElement);
        chatOutput.scrollTop = chatOutput.scrollHeight;
    }
}

// Função para remover o indicador de "Digitando..."
function removeTypingIndicator() {
    if (typingMessageElement && chatOutput.contains(typingMessageElement)) {
        chatOutput.removeChild(typingMessageElement);
        typingMessageElement = null;
    }
}


// Função para enviar a mensagem para a API do Google AI Studio
async function sendMessageToAPI(prompt) {
    console.log('Enviando prompt para a API:', prompt); // Log para ver o prompt enviado
    showTypingIndicator(); // Mostra o indicador de digitando

    try {
        const response = await fetch(API_ENDPOINT, { // <-- Chamada direta para a API do Google
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        console.log('Resposta bruta da API recebida:', response); // Log da resposta bruta

        if (!response.ok) {
            // Se a resposta não for OK (status 400, 500, etc.)
            const errorData = await response.json();
            console.error('Erro na API:', response.status, errorData); // Log do erro da API
            removeTypingIndicator(); // Remove o indicador
            addMessage(`Erro ao comunicar com a IA: ${errorData.error.message || 'Erro desconhecido'} (Status: ${response.status})`, 'bot');
            return; // Sai da função
        }

        const data = await response.json();
        console.log('Dados JSON da API:', data); // Log dos dados recebidos

        // Processa a resposta da API
        let botResponse = 'Não foi possível obter uma resposta.'; // Mensagem padrão de fallback

        // Verifica se a resposta contém conteúdo e partes de texto
        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
             // Junta todas as partes de texto em uma única string
            botResponse = data.candidates[0].content.parts.map(part => part.text).join('');
        } else {
             // Se não houver conteúdo, pode haver um bloqueio de segurança ou outro problema
             if (data.promptFeedback && data.promptFeedback.blockReason) {
                 botResponse = `Sua solicitação foi bloqueada devido a: ${data.promptFeedback.blockReason}. Por favor, tente reformular.`;
             } else {
                 botResponse = 'Não foi possível gerar uma resposta. A resposta da IA estava vazia ou incompleta.';
             }
             console.warn('Resposta da API sem conteúdo de texto ou bloqueada:', data); // Aviso se não houver conteúdo
        }

        removeTypingIndicator(); // Remove o indicador antes de adicionar a resposta final
        addMessage(botResponse, 'bot'); // Adiciona a resposta real do bot

    } catch (error) {
        console.error('Erro ao enviar mensagem para a API ou processar resposta:', error); // Log de erros gerais (rede, parsing, etc.)
        removeTypingIndicator(); // Remove o indicador
        addMessage(`Ocorreu um erro: ${error.message}`, 'bot');
    }
}

// Event Listener para o botão de Enviar
sendButton.addEventListener('click', () => {
    const message = userInput.value.trim(); // Pega o valor do input e remove espaços em branco extras
    console.log('----------- INÍCIO DO PROCESSAMENTO DA MENSAGEM -----------');
    console.log('1. Mensagem original do usuário (após trim):', message);

    const lowerCaseMessage = message.toLowerCase();
    console.log('2. Mensagem em minúsculas (para comparação):', lowerCaseMessage);
    console.log('3. Tamanho da mensagem em minúsculas:', lowerCaseMessage.length);
    console.log('4. Caracteres da mensagem em minúsculas (com códigos Unicode):', Array.from(lowerCaseMessage).map(char => `${char} (${char.charCodeAt(0)})`).join(' '));


    if (message) { // Verifica se a mensagem não está vazia
        // addMessage(message, 'user'); // Opcional: Adicionar a mensagem do usuário no chat (descomente se quiser)
        userInput.value = ''; // Limpa o input

        let promptText = '';

        if (lowerCaseMessage.startsWith('resumir:')) {
            const textToSummarize = message.substring('resumir:'.length).trim();
            promptText = `Por favor, resuma o seguinte texto de forma concisa e clara:\n\n${textToSummarize}`;
            console.log('5. Condição "Resumir:" ATENDIDA. Prompt gerado:', promptText);
        }
        else if (lowerCaseMessage.startsWith('explicar:')) {
            const conceptToExplain = message.substring('explicar:'.length).trim();
            promptText = `Por favor, explique o seguinte conceito de forma simples e fácil de entender, como se estivesse explicando para alguém sem conhecimento prévio: ${conceptToExplain}`;
            console.log('5. Condição "Explicar:" ATENDIDA. Prompt gerado:', promptText);
        }
        else {
            // Se não começar com "Resumir:" ou "Explicar:", pode dar uma instrução ou tentar um resumo padrão
            addMessage('Por favor, comece sua mensagem com "Resumir:" ou "Explicar:".', 'bot');
            console.log('5. Nenhuma das condições ("Resumir:" ou "Explicar:") foi atendida. Mensagem padrão exibida.');
            console.log('----------- FIM DO PROCESSAMENTO DA MENSAGEM -----------');
            return; // Sai da função se o formato for inválido
        }

        // Se uma das condições foi atendida, envia o prompt formatado para a API
        sendMessageToAPI(promptText);
        console.log('----------- FIM DO PROCESSAMENTO DA MENSAGEM -----------');

    } else {
        console.log('Mensagem do usuário vazia. Nenhuma ação tomada.');
        console.log('----------- FIM DO PROCESSAMENTO DA MENSAGEM -----------');
    }
});

// Opcional: Permite enviar a mensagem pressionando Enter no textarea
userInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) { // Verifica se é Enter e não Shift+Enter
        event.preventDefault(); // Evita a quebra de linha padrão do Enter no textarea
        sendButton.click(); // Simula o clique no botão
    }
});

// Mensagem inicial de boas-vindas (já está no HTML, mas pode adicionar via JS se preferir)
// addMessage('Olá! Cole um texto para resumir ou pergunte algo para simplificar um conceito.', 'bot');
