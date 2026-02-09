const express = require('express');
const cors = require('cors');
const { buildDag, getFilteredDag, getTaskGroups, getCatalogTree } = require('./dag-builder');

const app = express();
const port = 3000;

// 详细CORS配置
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// API路由
app.get('/api/dag', async (req, res) => {
  try {
    const dag = await buildDag();
    console.log(`Returning DAG with ${dag.nodes.length} nodes and ${dag.edges.length} edges`);
    res.json(dag);
  } catch (error) {
    console.error('Error building DAG:', error);
    res.status(500).json({ 
      error: 'Failed to build DAG',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.get('/api/dag/filtered', async (req, res) => {
  const { groupId } = req.query;
  if (!groupId) {
    return res.status(400).json({ error: 'groupId is required' });
  }
  
  try {
    const dag = await getFilteredDag(groupId);
    res.json(dag);
  } catch (error) {
    console.error('Error building filtered DAG:', error);
    res.status(500).json({ error: 'Failed to build filtered DAG' });
  }
});

app.get('/api/task-groups', async (req, res) => {
  try {
    const groups = await getTaskGroups();
    res.json(groups);
  } catch (error) {
    console.error('Error fetching task groups:', error);
    res.status(500).json({ error: 'Failed to fetch task groups' });
  }
});

app.get('/api/catalog', async (req, res) => {
  try {
    const catalog = await getCatalogTree();
    res.json(catalog);
  } catch (error) {
    console.error('Error fetching catalog:', error);
    res.status(500).json({ error: 'Failed to fetch catalog' });
  }
});

// 添加一个简单的根路径响应
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>ETL DAG Visualizer API</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 40px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            .container {
                background: white;
                padding: 40px;
                border-radius: 10px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                text-align: center;
                max-width: 600px;
            }
            h1 {
                color: #333;
                margin-bottom: 20px;
            }
            p {
                color: #666;
                line-height: 1.6;
                margin-bottom: 20px;
            }
            .links {
                display: flex;
                gap: 20px;
                justify-content: center;
                margin-top: 30px;
                flex-wrap: wrap;
            }
            .btn {
                padding: 12px 24px;
                background: #667eea;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                transition: background 0.3s;
                display: inline-block;
            }
            .btn:hover {
                background: #5a67d8;
            }
            .btn-api {
                background: #764ba2;
            }
            .btn-api:hover {
                background: #6b4390;
            }
            .api-list {
                text-align: left;
                background: #f8f9fa;
                padding: 20px;
                border-radius: 5px;
                margin-top: 20px;
            }
            .api-item {
                margin-bottom: 10px;
                padding: 8px;
                background: white;
                border-left: 4px solid #667eea;
                padding-left: 12px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>ETL调度任务依赖关系图系统</h1>
            <p>后端API服务正在运行，请访问前端应用来使用完整功能。</p>
            
            <div class="links">
                <a href="http://localhost:5173" class="btn">访问前端应用</a>
                <a href="/api/dag" class="btn btn-api">测试API接口</a>
            </div>
            
            <div class="api-list">
                <h3>可用API端点：</h3>
                <div class="api-item">
                    <strong>GET /api/dag</strong> - 获取完整DAG图
                </div>
                <div class="api-item">
                    <strong>GET /api/dag/filtered?groupId=xxx</strong> - 获取筛选后的DAG图
                </div>
                <div class="api-item">
                    <strong>GET /api/task-groups</strong> - 获取任务组列表
                </div>
                <div class="api-item">
                    <strong>GET /api/catalog</strong> - 获取目录树
                </div>
                <div class="api-item">
                    <strong>GET /health</strong> - 健康检查
                </div>
            </div>
        </div>
    </body>
    </html>
  `);
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(port, () => {
  console.log(`=================================`);
  console.log(`后端服务运行在: http://localhost:${port}`);
  console.log(`前端服务运行在: http://localhost:5173`);
  console.log(`=================================`);
  console.log(`API端点:`);
  console.log(`  GET /api/dag - 获取DAG数据`);
  console.log(`  GET /api/dag/filtered - 获取筛选的DAG数据`);
  console.log(`  GET /api/task-groups - 获取任务组列表`);
  console.log(`  GET /api/catalog - 获取目录树`);
  console.log(`  GET /health - 健康检查`);
  console.log(`=================================`);
});