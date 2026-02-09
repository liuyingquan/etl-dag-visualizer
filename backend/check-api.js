const axios = require('axios');

async function testApis() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('Testing API endpoints...\n');
  
  try {
    // 测试健康检查
    console.log('1. Testing health endpoint...');
    const healthRes = await axios.get(`${baseUrl}/health`);
    console.log('   ✓ Health check:', healthRes.data);
    
    // 测试任务组列表
    console.log('\n2. Testing task groups endpoint...');
    const groupsRes = await axios.get(`${baseUrl}/api/task-groups`);
    console.log(`   ✓ Found ${groupsRes.data.length} task groups`);
    if (groupsRes.data.length > 0) {
      console.log('   Sample:', groupsRes.data[0]);
    }
    
    // 测试DAG数据
    console.log('\n3. Testing DAG endpoint...');
    const dagRes = await axios.get(`${baseUrl}/api/dag`);
    console.log(`   ✓ Found ${dagRes.data.nodes.length} nodes and ${dagRes.data.edges.length} edges`);
    
    if (dagRes.data.nodes.length > 0) {
      console.log('   Sample node:', {
        id: dagRes.data.nodes[0].id,
        label: dagRes.data.nodes[0].label,
        layer: dagRes.data.nodes[0].layer
      });
    }
    
    // 测试目录树
    console.log('\n4. Testing catalog endpoint...');
    const catalogRes = await axios.get(`${baseUrl}/api/catalog`);
    console.log(`   ✓ Found ${catalogRes.data.length} catalog items`);
    
    console.log('\n✅ All API tests passed!');
    
  } catch (error) {
    console.error('\n❌ API test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

testApis();