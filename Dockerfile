FROM ghcr.io/puppeteer/puppeteer:23.8.0

# 작업 디렉토리 설정
WORKDIR /usr/src/app

# 사용자 권한 설정
USER root

# 애플리케이션 의존성 복사
COPY package.json package-lock.json ./

# 권한 수정
RUN chown -R pptruser:pptruser /usr/src/app

# 비-루트 사용자로 전환
USER pptruser

# 의존성 설치
RUN npm install

# 애플리케이션 코드 복사
COPY . .

# 포트 설정
EXPOSE 4000

# 실행 명령
CMD ["npm", "start"]
