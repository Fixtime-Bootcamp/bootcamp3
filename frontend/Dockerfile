FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

FROM build AS test
CMD ["npm", "run", "test:coverage", "--", "--coverage.clean=false"]

FROM build AS package
RUN npm run build

FROM nginx:alpine
COPY --from=package /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
