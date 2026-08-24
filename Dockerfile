FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages packages
COPY services services
COPY supabase supabase

RUN npm ci

ENV HOST=0.0.0.0
ENV PORT=8787

EXPOSE 8787

CMD ["npm", "run", "start"]
