FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json ./client/package.json
COPY server/package.json ./server/package.json
RUN npm ci
COPY server ./server
RUN npx prisma generate --schema=server/prisma/schema.prisma
RUN npm run build -w server
EXPOSE 3001
CMD ["sh", "-c", "npx prisma db push --schema=server/prisma/schema.prisma && npm run start -w server"]