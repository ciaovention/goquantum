const express = require('express');
const path = require('path');
const app = express();

// 静态文件服务
app.use(express.static(path.join(__dirname, 'dist')));

// 所有路由返回 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});