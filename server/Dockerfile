FROM node:18-alpine

WORKDIR /app

# 复制 package.json
COPY package.json ./

# 安装依赖（仅生产依赖）
RUN npm install --omit=dev

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 3002

# 启动应用
CMD ["node", "index.js"]
