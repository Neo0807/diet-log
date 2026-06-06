let logs = JSON.parse(localStorage.getItem('dietLogs')) || [];

// 常用中餐食物热量数据库 (每100g 或标准份参考值)
const foodDatabase = {
  "米饭": 116,
  "白米饭": 116,
  "面条": 131,
  "馒头": 223,
  "包子(肉)": 250,
  "饺子(猪肉)": 280,
  "炒饭": 180,
  "鸡蛋": 143,
  "煎蛋": 180,
  "牛奶": 60,
  "豆浆": 45,
  "鸡胸肉": 110,
  "牛肉": 250,
  "猪肉": 395,
  "鱼": 120,
  "虾": 99,
  "西兰花": 34,
  "青菜": 25,
  "番茄": 18,
  "黄瓜": 16,
  "苹果": 52,
  "香蕉": 89,
  "橙子": 47,
  "酸奶": 80,
  "面包": 265,
  "燕麦": 389,
  "鸡腿": 240,
  "红烧肉": 400,
  "宫保鸡丁": 320,
  "鱼香肉丝": 280,
  "麻婆豆腐": 180,
  "炒青菜": 80,
  "蛋炒饭": 200,
  "拉面": 350,
  "火锅": 300,
  "烧烤": 450,
  "可乐": 42,
  "咖啡(黑)": 2,
  "跑步": 600,   // 每30分钟参考
  "快走": 250,
  "游泳": 500,
  "健身": 400,
  "骑行": 350,
  "瑜伽": 200
};

// 填充食物下拉列表
function populateFoodList() {
  const datalist = document.getElementById('foodList');
  datalist.innerHTML = '';
  
  Object.keys(foodDatabase).forEach(food => {
    const option = document.createElement('option');
    option.value = food;
    datalist.appendChild(option);
  });
}

// 食物选择后自动填充热量
document.getElementById('food').addEventListener('input', function() {
  const foodName = this.value.trim();
  if (foodDatabase[foodName]) {
    document.getElementById('calories').value = foodDatabase[foodName];
  }
});

// 渲染列表
function renderLogs() {
  const container = document.getElementById('logsList');
  container.innerHTML = '';

  if (logs.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-center py-8">还没有记录，开始添加吧～</p>';
    return;
  }

  // 按日期倒序
  const sortedLogs = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));

  sortedLogs.forEach((log, index) => {
    const isExercise = log.meal === '运动';
    const div = document.createElement('div');
    div.className = 'bg-gray-50 p-4 rounded-2xl flex justify-between items-center hover:bg-gray-100 transition';
    div.innerHTML = `
      <div>
        <div class="font-medium">${log.date} · ${log.meal}</div>
        <div class="text-gray-700">${log.food} ${log.quantity ? `(${log.quantity})` : ''}</div>
      </div>
      <div class="text-right">
        <div class="text-2xl font-bold ${isExercise ? 'text-orange-600' : 'text-green-600'}">
          ${isExercise ? '-' : ''}${log.calories} <span class="text-sm">kcal</span>
        </div>
        <button onclick="deleteLog(${index})" class="text-red-500 text-sm mt-1 hover:underline">删除</button>
      </div>
    `;
    container.appendChild(div);
  });
}

// 添加记录
document.getElementById('logForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const newLog = {
    date: document.getElementById('date').value || new Date().toISOString().split('T')[0],
    meal: document.getElementById('meal').value,
    food: document.getElementById('food').value.trim(),
    quantity: document.getElementById('quantity').value.trim(),
    calories: parseInt(document.getElementById('calories').value) || 0
  };

  if (!newLog.food) {
    alert('请输入食物名称或运动项目');
    return;
  }

  if (newLog.calories <= 0) {
    alert('请输入热量值');
    return;
  }

  logs.unshift(newLog); // 新记录放最前面
  localStorage.setItem('dietLogs', JSON.stringify(logs));
  
  this.reset();
  document.getElementById('date').value = new Date().toISOString().split('T')[0];
  renderLogs();
  updateTodaySummary();
});

// 删除记录
window.deleteLog = function(index) {
  if (confirm('确定删除这条记录吗？')) {
    logs.splice(index, 1);
    localStorage.setItem('dietLogs', JSON.stringify(logs));
    renderLogs();
    updateTodaySummary();
  }
};

// 今日总结 + 能量占比
function updateTodaySummary() {
  const today = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter(log => log.date === today);
  
  const summaryDiv = document.getElementById('todaySummary');
  const content = document.getElementById('summaryContent');
  
  if (todayLogs.length === 0) {
    summaryDiv.classList.add('hidden');
    return;
  }
  
  const totalCal = todayLogs.reduce((sum, log) => sum + (log.calories || 0), 0);
  
  // 按餐次统计
  const mealStats = {};
  todayLogs.forEach(log => {
    if (!mealStats[log.meal]) mealStats[log.meal] = 0;
    mealStats[log.meal] += log.calories || 0;
  });

  let summaryHTML = `
    <div class="col-span-2 text-center mb-4">
      <div class="text-5xl font-bold text-green-600">${totalCal}</div>
      <div class="text-sm text-gray-500">今日总摄入/消耗 (kcal)</div>
    </div>
  `;

  // 占比
  Object.keys(mealStats).forEach(meal => {
    const percent = totalCal > 0 ? Math.round((mealStats[meal] / totalCal) * 100) : 0;
    const color = meal === '运动' ? 'text-orange-600' : 'text-green-600';
    summaryHTML += `
      <div class="text-center bg-gray-50 p-3 rounded-2xl">
        <div class="text-xl font-semibold ${color}">${meal}</div>
        <div class="text-3xl font-bold">${mealStats[meal]}</div>
        <div class="text-xs text-gray-500">${percent}%</div>
      </div>
    `;
  });

  content.innerHTML = summaryHTML;
  summaryDiv.classList.remove('hidden');
}

// 导出数据
window.exportData = function() {
  const dataStr = JSON.stringify(logs, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  const exportFileDefaultName = `dietlog_backup_${new Date().toISOString().split('T')[0]}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

// 初始化
document.getElementById('date').value = new Date().toISOString().split('T')[0];
populateFoodList();
renderLogs();
updateTodaySummary();