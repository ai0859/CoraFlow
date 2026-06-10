/**
 * 测试工作流导入功能
 */
const fs = require('fs');

// 读取工作流文件
const workflowContent = fs.readFileSync('d:/AI/AI项目/游戏自动化工作流/game_automation/scripts/旅人-副本中.json', 'utf-8');
const workflow = JSON.parse(workflowContent);

console.log('=== 工作流文件内容 ===');
console.log('工作流名称:', workflow.name);
console.log('节点数量:', workflow.nodes.length);
console.log('边数量:', workflow.edges.length);
console.log('');
console.log('节点列表:');
workflow.nodes.forEach(node => {
    console.log(`  - ${node.id}: ${node.type} (${node.data?.name || '未命名'})`);
});

// 验证节点格式
console.log('');
console.log('=== 验证节点格式 ===');
let valid = true;
workflow.nodes.forEach((node, index) => {
    if (!node.id) {
        console.log(`❌ 节点 ${index} 缺少 id`);
        valid = false;
    }
    if (!node.type) {
        console.log(`❌ 节点 ${node.id} 缺少 type`);
        valid = false;
    }
    if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
        console.log(`❌ 节点 ${node.id} 位置不正确`);
        valid = false;
    }
});

if (valid) {
    console.log('✅ 所有节点格式正确');
}

// 验证边格式
console.log('');
console.log('=== 验证边格式 ===');
valid = true;
workflow.edges.forEach((edge, index) => {
    if (!edge.source) {
        console.log(`❌ 边 ${index} 缺少 source`);
        valid = false;
    }
    if (!edge.target) {
        console.log(`❌ 边 ${index} 缺少 target`);
        valid = false;
    }
});

if (valid) {
    console.log('✅ 所有边格式正确');
}