document.addEventListener('DOMContentLoaded', async () => {
	console.log('페이지 로드됨, 데이터셋 초기화 시작...');
	const messageInput = document.getElementById('message-input');
	const sendButton = document.getElementById('send-button');
	const messagesContainer = document.getElementById('slack-messages');
	const channelTitle = document.querySelector('.channel-title');
	const channelLinks = document.querySelectorAll('.channel-list a');
	const directMessageLinks = document.querySelectorAll('.dm-list a');

	let currentChannel = 'general';
	let gptEnabled = false;
	// Array of possible "users" for random chatting
	const randomUsers = ['Alice', 'Bob', 'Charlie', 'David', 'Eve'];
	const randomAdjectives = ['Happy', 'Sad', 'Excited', 'Calm', 'Energetic'];

	// 폴백용 기본 대화 데이터셋
	const fallbackDataset = {
		default: [
			"죄송합니다. 잠시 문제가 발생했습니다.",
			"잠시 후 다시 시도해 주시겠어요?",
			"현재 서버와 연결이 원활하지 않습니다."
		]
	};

	// 실제 존재하는 한국어 대화 데이터셋 URL
	const DATASET_URL = "https://raw.githubusercontent.com/songys/Chatbot_data/master/ChatbotData.csv";

	// 대화 데이터를 저장할 배열
	let chatDataset = [];

	// 데이터셋 로드 및 초기화
	async function initializeChatDataset() {
		try {
			console.log('데이터셋 로드 시작...');
			const response = await fetch(DATASET_URL);
			
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			
			const csvText = await response.text();
			console.log('CSV 데이터 로드 완료. 데이터 길이:', csvText.length);
			console.log('CSV 데이터 샘플:', csvText.slice(0, 200));

			// CSV 파싱 (개선된 버전)
			const rows = csvText.split('\n').slice(1); // 헤더 제외
			chatDataset = [];

			for (const row of rows) {
				try {
					// CSV 행 파싱 (쌍따옴표와 이스케이프 문자 처리)
					const matches = row.match(/(?:^|,)("(?:[^"]*(?:""[^"]*)*)"|[^,]*)/g);
					
					if (matches && matches.length >= 2) {
						const question = matches[0].replace(/^,?"?|"?$/g, '').replace(/""/g, '"').trim();
						const answer = matches[1].replace(/^,?"?|"?$/g, '').replace(/""/g, '"').trim();
						
						if (question && answer) {
							chatDataset.push({ question, answer });
						}
					}
				} catch (parseError) {
					console.error('행 파싱 오류:', row, parseError);
				}
			}

			console.log('파싱된 데이터셋 크기:', chatDataset.length);
			console.log('파싱된 데이터 샘플:', chatDataset.slice(0, 3));

			if (chatDataset.length === 0) {
				throw new Error('파싱된 데이터가 없습니다.');
			}

		} catch (error) {
			console.error('데이터셋 로드/파싱 실패:', error);
			console.log('기본 데이터셋으로 전환...');
			
			// 기본 대화 데이터로 폴백
			chatDataset = [
				{ question: "안녕", answer: "안녕하세요! 반갑습니다." },
				{ question: "안녕하세요", answer: "안녕하세요! 무엇을 도와드릴까요?" },
				{ question: "너는 누구니", answer: "저는 AI 챗봇 어시스턴트입니다." },
				{ question: "뭐해", answer: "사용자분들과 대화하고 있어요." },
				{ question: "날씨", answer: "죄송하지만 실시간 날씨 정보는 제공하지 못합니다." },
				{ question: "기분이 어때", answer: "저는 항상 긍정적이고 도움이 되고자 노력하고 있어요!" },
				{ question: "이름이 뭐야", answer: "저는 AI 챗봇입니다." },
				{ question: "몇 살이야", answer: "저는 나이를 셀 수 없는 AI 프로그램입니다." },
				{ question: "배고파", answer: "맛있는 음식을 추천해드릴까요?" },
				{ question: "심심해", answer: "재미있는 이야기를 나눠볼까요?" }
			];
			
			console.log('기본 데이터셋 크기:', chatDataset.length);
		}
	}
	

	// Function to display messages for a channel
	function displayMessages(channel) {
		// Clear existing messages
		messagesContainer.innerHTML = '';

		// Retrieve messages from localStorage instead of localStorage
		let messages = JSON.parse(localStorage.getItem(`messages-${channel}`)) || [];

		if (messages) {
			messages.forEach(message => {
				const messageDiv = document.createElement('div');
				messageDiv.classList.add('message');
				messageDiv.innerHTML = `<span class="message-user">${message.user}:</span> <span class="message-text">${message.text}</span>`;
				messagesContainer.appendChild(messageDiv);
			});
		}
		// Scroll to bottom after new messages are added
		messagesContainer.scrollTop = messagesContainer.scrollHeight;
	}

	// Function to send a new message
	async function sendMessage() {
		const messageText = messageInput.value.trim();
		console.log('전송된 메시지:', messageText);

		if (messageText === '') {
			console.log('메시지가 비어있습니다.');
			return;
		}

		// Create new message element
		const messageDiv = createMessageElement('You', messageText);
		messagesContainer.appendChild(messageDiv);

		// Save message to localStorage
		saveMessage('You', messageText, currentChannel);

		// Clear input
		messageInput.value = '';

		// Scroll to bottom after sending
		messagesContainer.scrollTop = messagesContainer.scrollHeight;

		if (gptEnabled) {
			try {
				const gptResponse = await getGPTResponse(messageText);
				console.log('GPT 응답:', gptResponse);

				const gptMessageDiv = createMessageElement('GPT', gptResponse);
				messagesContainer.appendChild(gptMessageDiv);
				
				saveMessage('GPT', gptResponse, currentChannel);
				messagesContainer.scrollTop = messagesContainer.scrollHeight;
			} catch (error) {
				console.error('GPT 응답 생성 중 오류:', error);
			}
		} else {
			try {
				const randomUserResponse = await getRandomMessage(messageText);
				console.log('랜덤 유저 응답:', randomUserResponse);

				const randomUserMessageDiv = createMessageElement(randomUserResponse.user, randomUserResponse.text);
				messagesContainer.appendChild(randomUserMessageDiv);
				
				saveMessage(randomUserResponse.user, randomUserResponse.text, currentChannel);
				messagesContainer.scrollTop = messagesContainer.scrollHeight;
			} catch (error) {
				console.error('랜덤 유저 응답 생성 중 오류:', error);
			}
		}
	}

	function saveMessage(user, text, channel) {
		let messages = JSON.parse(localStorage.getItem(`messages-${channel}`)) || [];
		messages.push({ user: user, text: text, channel: channel });
		localStorage.setItem(`messages-${channel}`, JSON.stringify(messages));
	}

	function calculateSimilarity(a, b) {
		// 문자열을 정규화하고 단어로 분리
		function normalize(str) {
			return str
				.toLowerCase()
				.replace(/[^\wㄱ-ㅎㅏ-ㅣ가-힣\s]/g, '')
				.trim()
				.split(/\s+/)
				.filter(word => word.length > 0);
		}

		const wordsA = normalize(a);
		const wordsB = normalize(b);

		// 단어 집합 생성
		const setA = new Set(wordsA);
		const setB = new Set(wordsB);

		// 교집합 계산
		const intersection = new Set([...setA].filter(x => setB.has(x)));
		
		// 합집합 계산
		const union = new Set([...setA, ...setB]);

		// Jaccard 유사도 계산
		const similarity = intersection.size / union.size;

		console.log('유사도 계산:', {
			입력A: a,
			입력B: b,
			단어A: wordsA,
			단어B: wordsB,
			교집합: [...intersection],
			합집합: [...union],
			유사도: similarity.toFixed(2)
		});

		return similarity;
	}
	
	function findBestResponse(userMessage) {
		console.log('=== 응답 검색 시작 ===');
		console.log('현재 데이터셋 크기:', chatDataset.length);
		console.log('사용자 입력:', userMessage);

		// 입력이 공백인 경우만 체크
		if (!userMessage || userMessage.trim().length === 0) {
			console.log('입력이 비어있습니다.');
			return getDefaultResponse();
		}

		let bestMatch = null;
		let bestSimilarity = 0;

		// 처음 5개의 데이터셋 항목 출력 (디버깅용)
		console.log('데이터셋 샘플:', chatDataset.slice(0, 5));

		for (const data of chatDataset) {
			const similarity = calculateSimilarity(userMessage, data.question);
			
			// 유사도가 0.1 이상인 경우만 로그 출력
			if (similarity > 0.1) {
				console.log('매칭 후보:', {
					질문: data.question,
					유사도: similarity.toFixed(2),
					응답: data.answer
				});
			}

			if (similarity > bestSimilarity) {
				bestSimilarity = similarity;
				bestMatch = data;
			}
		}

		console.log('최종 선택:', {
			유사도: bestSimilarity.toFixed(2),
			질문: bestMatch?.question,
			응답: bestMatch?.answer
		});

		// 유사도 임계값을 0.1로 낮춤
		const similarityThreshold = 0.1;
		
		if (bestSimilarity < similarityThreshold || !bestMatch) {
			console.log('유사도가 너무 낮음:', bestSimilarity);
			return getDefaultResponse();
		}

		return bestMatch.answer;
	}

	// 기본 응답 생성 함수 개선
	function getDefaultResponse() {
		const defaultResponses = [
			"죄송합니다. 질문을 이해하지 못했어요. 다른 방식으로 질문해 주시겠어요?",
			"말씀하신 내용을 정확히 이해하지 못했습니다. 조금 더 구체적으로 설명해 주시겠어요?",
			"죄송하지만, 그 질문에 대한 적절한 답변을 찾지 못했어요. 다른 질문을 해주시겠어요?",
			"질문의 의도를 정확히 파악하지 못했습니다. 다른 방식으로 여쭤봐 주시겠어요?"
		];
		return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
	}

	// GPT 응답 함수 수정
	async function getGPTResponse(message) {
		try {
			// 데이터셋이 비어있으면 초기화
			if (chatDataset.length === 0) {
				await initializeChatDataset();
			}
			
			const response = findBestResponse(message);
			await new Promise(resolve => setTimeout(resolve, 500)); // 자연스러운 응답 시간 시뮬레이션
			return response;
		} catch (error) {
			console.error("응답 생성 오류:", error);
			return getDefaultResponse();
		}
	}

	// getRandomMessage 함수 수정
	async function getRandomMessage(userMessage) {
		const randomUser = randomUsers[Math.floor(Math.random() * randomUsers.length)];
		const response = await findBestResponse(userMessage); // 사용자 메시지 전달
		return { user: randomUser, text: response };
	}

	// Event listeners
	sendButton.addEventListener('click', sendMessage);
	
	messageInput.addEventListener('keydown', (event) => {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	});

	// Event listeners for channel links
	channelLinks.forEach(link => {
		link.addEventListener('click', (event) => {
			event.preventDefault();
			const channel = link.dataset.channel;
			currentChannel = channel;
			channelTitle.textContent = `#${channel}`;
			displayMessages(channel);
			gptEnabled = channel === 'gpt';
		});
	});

	// Event listeners for DM links
	directMessageLinks.forEach(link => {
		link.addEventListener('click', (event) => {
			event.preventDefault();
			const user = link.dataset.user;
			channelTitle.textContent = `@${user}`;
			messagesContainer.innerHTML = `<div class="message">Direct messages with ${user} are not yet implemented.</div>`;
		});
	});

	// Initialize dataset and display messages
	await initializeChatDataset();
	console.log('초기화 완료된 데이터셋 크기:', chatDataset.length);
	displayMessages(currentChannel);

	// 모바일 메뉴 토글 기능
	const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
	const mobileCloseBtn = document.getElementById('mobile-close-btn');
	const sidebar = document.getElementById('slack-sidebar');
	const mainContent = document.querySelector('.slack-main');

	// 사이드바 토글 함수
	function toggleSidebar() {
		sidebar.classList.toggle('show');
	}

	// 사이드바 닫기 함수
	function closeSidebar() {
		sidebar.classList.remove('show');
	}

	// 토글 버튼 클릭 이벤트
	mobileMenuToggle.addEventListener('click', toggleSidebar);
	
	// 닫기 버튼 클릭 이벤트
	mobileCloseBtn.addEventListener('click', closeSidebar);

	// 메인 컨텐츠 영역 클릭시 사이드바 닫기
	mainContent.addEventListener('click', (e) => {
		if (sidebar.classList.contains('show')) {
			closeSidebar();
		}
	});

	// 채널이나 DM 클릭시 사이드바 닫기
	const channelLinksMobile = document.querySelectorAll('.channel-list a, .dm-list a');
	channelLinksMobile.forEach(link => {
		link.addEventListener('click', () => {
			if (window.innerWidth <= 768) {
				closeSidebar();
			}
		});
	});

	function createMessageElement(user, text) {
		const now = new Date();
		const timeString = now.toLocaleTimeString('ko-KR', { 
			hour: 'numeric', 
			minute: '2-digit',
			hour12: true 
		});

		const messageDiv = document.createElement('div');
		messageDiv.classList.add('message');
		messageDiv.innerHTML = `
			<div class="message-profile">
				<div class="profile-icon">
					<i class="fas fa-user-circle"></i>
				</div>
			</div>
			<div class="message-content">
				<div class="message-header">
					<span class="message-user">${user}</span>
					<span class="message-time">
						<i class="far fa-clock"></i>
						${timeString}
					</span>
				</div>
				<div class="message-text">${text}</div>
			</div>
		`;
		return messageDiv;
	}
	// ... existing code ...
});