// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 클라이언트에 정적 파일(public 폴더) 제공
app.use(express.static('public'));

// 클라이언트 연결 시 이벤트 처리
io.on('connection', (socket) => {
  console.log('사용자가 연결되었습니다.');

  // 클라이언트가 채널(룸)에 참여하는 이벤트
  socket.on('join channel', (channel) => {
    socket.join(channel);
    console.log(`사용자가 ${channel} 채널에 참여했습니다.`);
  });

  // 채팅 메시지 수신 및 해당 채널에 메시지 전송
  socket.on('chat message', (data) => {
    // data: { channel: 'general', user: 'You', text: '메시지 내용' }
    // 같은 채널의 모든 사용자에게 메시지 브로드캐스트 (보낸 사용자 포함 혹은 제외 가능)
    io.to(data.channel).emit('chat message', data);
    console.log(`[${data.channel}] ${data.user}: ${data.text}`);
  });

  socket.on('disconnect', () => {
    console.log('사용자가 연결을 끊었습니다.');
  });
});

// 서버 실행
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
