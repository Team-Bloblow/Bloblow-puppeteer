FROM ghcr.io/puppeteer/puppeteer:23.8.0

# 작업 디렉토리 설정
WORKDIR /usr/src/app

# 애플리케이션 의존성 복사
COPY package.json package-lock.json ./

# 의존성 설치
RUN npm install

# 애플리케이션 코드 복사
COPY . .

# 포트 설정
EXPOSE 4000

# 실행 명령
CMD ["npm", "start"]
