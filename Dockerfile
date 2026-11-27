# Sobe o serviço da bilheteria: docker build -t bilheteria . && docker run -p 3000:3000 bilheteria
FROM node:22-slim

WORKDIR /app

# Instala as dependências primeiro para aproveitar o cache das camadas.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 3000
CMD ["npm", "start"]
