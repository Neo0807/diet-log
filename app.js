// Supabase 配置
const SUPABASE_URL = 'https://wgnvgmkgiztqeozmffbl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_13EouLY7ZfwYOq0Y5uxtTw_OOk1G50y';

let logs = [];
let supabaseClient = null;

// 初始化 Supabase
async function initSupabase() {
  if (!window.supabase) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = () => {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      loadLogs();
    };
    document.head.appendChild(script);
  } else {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    loadLogs();
  }
}

// 加载所有记录
async function loadLogs() {
  if (!supabaseClient) return;
  
  try {
    const { data, error } = await supabaseClient
      .from('diet_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('加载数据失败:', error);
      if (error.message.includes('relation "diet_logs" does not exist')) {
        alert('首次使用：请在 Supabase 后台手动创建表 diet_logs');
      }
      return;
    }
    
    logs = data || [];
    renderLogs();
    updateTodaySummary();
  } catch (err) {
    console.error(err);
  }
}

// 添加记录
async function addLog(newLog) {
  if (!supabaseClient) return false;
  
  try {
    const { data, error } = await supabaseClient
      .from('diet_logs')
      .insert([newLog])
      .select();

    if (error) throw error;
    
    logs.unshift(data[0]);
    return true;
  } catch (err) {
    console.error('添加失败:', err);
    alert('保存失败: ' + err.message);
    return false;
  }
}

// 删除记录
async function deleteLog(id) {
  if (!supabaseClient || !confirm('确定删除这条记录吗？')) return;
  
  try {
    const { error } = await supabaseClient
      .from('diet_logs')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    logs = logs.filter(log => log.id !== id);
    renderLogs();
    updateTodaySummary();
  } catch (err) {
    console.error(err);
    alert('删除失败');
  }
}

// 常用中餐食物热量数据库
const foodDatabase = {
  "米饭": 116, "白米饭": 116, "面条": 131, "馒头": 223, "包子(肉)": 250,
  "饺子(猪肉)": 280, "炒饭": 180, "鸡蛋": 143, "煎蛋": 180, "牛奶": 60,
  "豆浆": 45, "鸡胸肉": 110, "牛肉": 250, "猪肉": 395, "鱼": 120,
  "虾": 99, "西兰花": 34, "青菜": 25, "番茄": 18, "黄瓜": 16,
  "苹果": 52, "香蕉": 89, "橙子": 47, "酸奶": 80, "面包": 265,
  "燕麦": 389, "鸡腿": 240, "红烧肉": 400, "宫保鸡丁": 320,
  "鱼香肉丝": 280, "麻婆豆腐": 180, "炒青菜": 80, "蛋炒饭": 200,
  "拉面": 350, "火锅": 300, "烧烤": 450, "可乐": 42, "咖啡(黑)": 2,
  "跑步": 600, "快走": 250, "游泳": 500, "健身": 400, "骑行": 350, "瑜伽": 200
};

// 填充食物列表
function populateFoodList() {
  const datalist = document.getElementById('foodList');
  datalist.innerHTML = '';
  Object.keys(foodDatabase).forEach(food => {
    const option = document.createElement('option');
    option.value = food;
    datalist.appendChild(option);
  });
}

// 自动填充热量
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

  logs.forEach((log) => {
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
        <button onclick="deleteLog('${log.id}')" class="text-red-500 text-sm mt-1 hover:underline">删除</button>
      </div>
    `;
    container.appendChild(div);
  });
}

// 表单提交
document.getElementById('logForm').addEventListener('submit', async function(e) {
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

  const success = await addLog(newLog);
  if (success) {
    this.reset();
    document.getElementById('date').value = new Date().toISOString().split('T')[0];
    renderLogs();
    updateTodaySummary();
  }
});

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
initSupabase();