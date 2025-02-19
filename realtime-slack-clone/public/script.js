document.addEventListener('DOMContentLoaded', () => {
	const messageInput = document.getElementById('message-input');
	const sendButton = document.getElementById('send-button');
	const messagesContainer = document.getElementById('slack-messages');
	const channelTitle = document.querySelector('.channel-title');
	const channelLinks = document.querySelectorAll('.channel-list a');
	const directMessageLinks = document.querySelectorAll('.dm-list a');
  
	// Socket.IO 클라이언트 연결
	const socket = io();
  
	let currentChannel = 'general';
	let gptEnabled = false;
  
	// 기본 채널 참여 (서버의 룸에 join)
	socket.emit('join channel', currentChannel);
  
	// 기존 localStorage 기반의 메시지 저장 대신 서버로부터 메시지 수신
	socket.on('chat message', (data) => {
	  // data: { channel, user, text }
	  // 현재 보고 있는 채널에 해당하는 메시지만 표시
	  if (data.channel === currentChannel) {
		const messageDiv = document.createElement('div');
		messageDiv.classList.add('message');
		messageDiv.innerHTML = `<span class="message-user">${data.user}:</span> <span class="message-text">${data.text}</span>`;
		messagesContainer.appendChild(messageDiv);
		messagesContainer.scrollTop = messagesContainer.scrollHeight;
	  }
	});
  
	// 메시지 전송 함수
	async function sendMessage() {
		const messageText = messageInput.value.trim();
		if (messageText !== '') {
		  // 사용자가 입력한 메시지를 서버에 전송
		  const messageData = {
			channel: currentChannel,
			user: 'YourName', // 실제 서비스에서는 로그인 정보나 사용자 입력을 사용합니다.
			text: messageText
		  };
		  socket.emit('chat message', messageData);
	  
		  // 입력 필드 초기화
		  messageInput.value = '';
		  messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}
	  }
	  
  
	// GPT 응답 시뮬레이션 함수 (예제)
	async function getGPTResponse(message) {
	  await new Promise(resolve => setTimeout(resolve, 500));
	  return `${message}? That's an interesting question!`;
	}
  
	// 랜덤 메시지 생성 함수
	function getRandomMessage() {
	  const randomUsers = ['Alice', 'Bob', 'Charlie', 'David', 'Eve'];
	  const randomAdjectives = ['Happy', 'Sad', 'Excited', 'Calm', 'Energetic'];
	  const randomUser = randomUsers[Math.floor(Math.random() * randomUsers.length)];
	  const randomAdjective = randomAdjectives[Math.floor(Math.random() * randomAdjectives.length)];
	  const randomNumber = Math.floor(Math.random() * 100);
	  const randomMessageText = `Hello from ${randomAdjective} ${randomNumber}!`;
	  return { user: randomUser, text: randomMessageText };
	}
  
	// 이벤트 리스너 설정
	sendButton.addEventListener('click', sendMessage);
	messageInput.addEventListener('keydown', (event) => {
	  if (event.key === 'Enter') {
		sendMessage();
	  }
	});
  
	// 채널 전환 이벤트
	channelLinks.forEach(link => {
	  link.addEventListener('click', (event) => {
		event.preventDefault();
		const channel = link.dataset.channel;
		// 채널 전환 시 현재 채널을 업데이트하고, 해당 채널 룸에 join
		currentChannel = channel;
		channelTitle.textContent = `#${channel}`;
		messagesContainer.innerHTML = ''; // 채널 변경 시 기존 메시지 초기화
		socket.emit('join channel', channel);
		gptEnabled = channel === 'gpt';
	  });
	});
  
	// DM 링크 이벤트 (추후 구현)
	directMessageLinks.forEach(link => {
	  link.addEventListener('click', (event) => {
		event.preventDefault();
		const user = link.dataset.user;
		channelTitle.textContent = `@${user}`;
		messagesContainer.innerHTML = `<div class="message">Direct messages with ${user} are not yet implemented.</div>`;
	  });
	});
  });
  