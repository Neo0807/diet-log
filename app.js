let logs = JSON.parse(localStorage.getItem('dietLogs')) || [];

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
    const div = document.createElement('div');
    div.className = 'bg-gray-50 p-4 rounded-2xl flex justify-between items-center hover:bg-gray-100 transition';
    div.innerHTML = `
      <div>
        <div class="font-medium">${log.date} · ${log.meal}</div>
        <div class="text-gray-700">${log.food} ${log.quantity ? `(${log.quantity})` : ''}</div>
      </div>
      <div class="text-right">
        <div class="text-2xl font-bold text-green-600">${log.calories} <span class="text-sm">kcal</span></div>
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
    alert('请输入食物名称');
    return;
  }

  logs.unshift(newLog);
  localStorage.setItem('dietLogs', JSON.stringify(logs));
  
  this.reset();
  document.getElementById('date').value = new Date().toISOString().split('T')[0];
  renderLogs();
  updateTodaySummary();
});

// 删除
window.deleteLog = function(globalIndex) {
  if (confirm('确定删除这条记录吗？')) {
    logs.splice(globalIndex, 1);
    localStorage.setItem('dietLogs', JSON.stringify(logs));
    renderLogs();
    updateTodaySummary();
  }
};

// 今日总结
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
  
  content.innerHTML = `
    <div class="text-center">
      <div class="text-4xl font-bold text-green-600">${totalCal}</div>
      <div class="text-sm text-gray-500">今日总热量 (kcal)</div>
    </div>
    <div class="text-center">
      <div class="text-4xl font-bold">${todayLogs.length}</div>
      <div class="text-sm text-gray-500">记录条数</div>
    </div>
  `;
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
renderLogs();
updateTodaySummary();