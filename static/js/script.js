// 1. 基础数据模型（前端固定的标签结构）
const profileData = {
    topLevel: {
        title: "用户画像",
        description: "包含用户所有特征维度的综合描述"
    },
    categories: [
        {id: "basic", title: "基础信息", subtitle: "用户基本属性", description: "用户的基本个人属性", icon: "user-circle"},
        {id: "time", title: "时间规律", subtitle: "用户时间偏好", description: "用户在不同时间段的行为模式", icon: "clock-o"},
        {id: "space", title: "空间范围", subtitle: "活动空间特征", description: "用户活动的地理空间特征", icon: "map-marker"},
        {id: "destination", title: "目的地偏好", subtitle: "偏好场所类型", description: "用户对不同类型目的地的偏好", icon: "heart"},
        {id: "commute-basic", title: "通勤基础", subtitle: "日常通勤特征", description: "用户日常通勤的基本特征", icon: "car"},
        {id: "commute-space", title: "通勤空间", subtitle: "通勤地理特征", description: "用户通勤行为的空间特征", icon: "road"},
        {id: "work-habit", title: "工作习惯", subtitle: "工作行为模式", description: "用户的工作相关行为模式", icon: "briefcase"}
    ],
    tags: [
        {category: "basic", title: "居住地", subtitle: "用户主要居住地点", description: "用户长期居住的地理位置"},
        {category: "basic", title: "工作地", subtitle: "用户主要工作地点", description: "用户主要工作的地理位置"},
        {category: "time", title: "出行周期偏好", subtitle: "用户偏好的出行周期", description: "用户在每周/每月的出行频率"},
        {category: "time", title: "出行时段偏好", subtitle: "用户偏好的出行时间段", description: "用户在一天中偏好的出行时间"},
        {category: "time", title: "高峰出行模式", subtitle: "高峰期出行特征", description: "用户在交通高峰期的出行习惯"},
        {category: "space", title: "单次出行距离", subtitle: "单次出行的平均距离", description: "用户每次出行的平均距离"},
        {category: "space", title: "活动区域", subtitle: "主要活动地理范围", description: "用户日常活动的主要地理区域"},
        {category: "destination", title: "高频目的地类型", subtitle: "常去的场所类型", description: "用户经常前往的目的地类型"},
        {category: "commute-basic", title: "规律性行程", subtitle: "固定路线的行程", description: "用户具有规律性的固定路线行程"},
        {category: "commute-basic", title: "规律行程距离", subtitle: "固定行程的距离", description: "用户规律性行程的距离长度"},
        {category: "commute-basic", title: "规律行程耗时", subtitle: "固定行程的时间", description: "用户完成规律性行程的时间"},
        {category: "commute-space", title: "通勤方向", subtitle: "日常通勤的方向", description: "用户日常通勤的主要方向"},
        {category: "work-habit", title: "工作时长", subtitle: "日常工作时间长度", description: "用户每天的工作时间长度"}
    ]
};

// 2. 调试用：在控制台打印数据，确认是否接收到（打开F12可查看）
console.log("后端传递的数据：", window.processedData);
console.log("原始标签数据：", profileData.tags);

// 3. 合并数据：将后端的value值合并到前端标签中
window.processedData.tags.forEach(processedTag => {
    // 找到前端标签中对应的标签（通过category和title匹配）
    const targetTag = profileData.tags.find(
        tag => tag.category === processedTag.category && tag.title === processedTag.title
    );
    if (targetTag) {
        targetTag.value = processedTag.value; // 赋值后端处理的结果
        console.log(`已匹配标签：${targetTag.title} = ${targetTag.value}`);
    } else {
        console.warn(`未找到匹配的标签：${processedTag.category} - ${processedTag.title}`);
    }
});

// 4. 渲染工具类（确保标签值被正确显示）
const RenderUtils = {
    createTooltipComponent(options) {
        const { type, content, title, description } = options;
        const wrapperClasses = {
            top: 'relative group mb-10',
            category: 'relative group',
            tag: 'relative group'
        };
        
        return `
            <div class="${wrapperClasses[type]}">
                ${content}
                <div class="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all-300 z-50 bottom-full mb-4 left-1/2 transform -translate-x-1/2 w-64 bg-dark/95 text-white p-4 rounded-xl tooltip-arrow text-sm">
                    <h4 class="font-semibold mb-1">${title}</h4>
                    <p>${description}</p>
                </div>
            </div>
        `;
    },
    
    createTopLevel(data) {
        const content = `
            <div class="bg-primary text-white rounded-2xl p-8 shadow-elegant transition-all-300 hover:shadow-hover transform hover:-translate-y-1">
                <h2 class="text-[clamp(1.5rem,3vw,2rem)] font-bold text-center">${data.title}</h2>
            </div>
        `;
        return this.createTooltipComponent({
            type: 'top', content, title: `${data.title}总览`, description: data.description
        });
    },
    
    createCategory(category) {
        const content = `
            <div class="bg-secondary text-white rounded-xl p-5 shadow-elegant transition-all-300 hover:shadow-hover cursor-pointer transform hover:-translate-y-1">
                <h3 class="font-bold text-lg">${category.title}</h3>
                <p class="text-sm text-white/80 mt-1">${category.subtitle}</p>
            </div>
        `;
        return this.createTooltipComponent({
            type: 'category', content, title: category.title, description: category.description
        });
    },
    
    // 关键：渲染标签时显示value值
    createTag(tag) {
        // 显示后端传递的标签值（如果有）
        const valueDisplay = tag.value ? 
            `<div class="mt-2 text-primary font-medium">${tag.value}</div>` :  // 有值时显示
            `<div class="mt-2 text-gray-400 text-sm">无数据</div>`;  // 无值时提示
        
        const content = `
            <div class="bg-tertiary rounded-xl p-4 shadow-elegant transition-all-300 hover:shadow-hover cursor-pointer transform hover:-translate-y-1 border-l-4 border-primary">
                <h5 class="font-medium">${tag.title}</h5>
                <p class="text-sm text-gray-600 mt-1">${tag.subtitle}</p>
                ${valueDisplay}  <!-- 插入标签值 -->
            </div>
        `;
        
        return this.createTooltipComponent({
            type: 'tag', content, title: tag.title, description: tag.description
        });
    },

    // 新增：渲染自定义模块数据
    renderCustomData(data, category) {
        if (!data) {
            return `<div class="text-gray-400 text-center py-6">暂无自定义数据</div>`;
        }
        
        // 根据数据类型渲染不同内容
        if (data.type === 'image') {
            // 图片类型
            return `<div class="rounded-lg overflow-hidden">
                        <img src="${data.url}" alt="${category}分析图" class="w-full h-auto">
                    </div>`;
        } else if (data.type === 'table') {
            // 表格类型
            let tableHtml = `<table class="min-w-full bg-white border border-gray-200 rounded-lg">
                                <thead>
                                    <tr class="bg-gray-50">
                                        ${data.headers.map(header => `<th class="py-2 px-4 border-b">${header}</th>`).join('')}
                                    </tr>
                                </thead>
                                <tbody>`;
            
            data.rows.forEach(row => {
                tableHtml += `<tr class="hover:bg-gray-50">
                                ${row.map(cell => `<td class="py-2 px-4 border-b">${cell}</td>`).join('')}
                            </tr>`;
            });
            
            tableHtml += `</tbody></table>`;
            return tableHtml;
        } else if (data.type === 'json') {
            // JSON数据类型，格式化显示
            return `<pre class="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">${JSON.stringify(data.content, null, 2)}</pre>`;
        } else if (data.type === 'chart') {
            // 图表类型（可与Chart.js等库集成）
            const canvasId = `chart-${category}-${Date.now()}`;
            setTimeout(() => {
                // 这里可以初始化图表
                console.log(`初始化图表: ${canvasId}`, data);
                // 示例：new Chart(document.getElementById(canvasId), data.config);
            }, 0);
            return `<canvas id="${canvasId}" class="w-full h-64"></canvas>`;
        } else {
            // 默认文本类型
            return `<div class="p-4 bg-gray-50 rounded-lg">${data.content}</div>`;
        }
    }
};

// 5. 渲染页面
function renderProfile() {
    const container = document.getElementById('profile-container');
    let html = '';
    
    // 渲染顶层
    html += RenderUtils.createTopLevel(profileData.topLevel);
    
    // 渲染标签类别
    html += `
        <div class="space-y-2">
            <h3 class="text-gray-600 font-medium ml-2">标签类别</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                ${profileData.categories.map(cat => RenderUtils.createCategory(cat)).join('')}
            </div>
        </div>
    `;
    
    // 渲染具体标签（按类别分组）
    html += `<div class="space-y-8"><h3 class="text-gray-600 font-medium ml-2">详细标签</h3>`;
    profileData.categories.forEach(category => {
        const categoryTags = profileData.tags.filter(tag => tag.category === category.id);
        if (categoryTags.length) {
            // 获取该分类对应的自定义数据
            const customData = window.processedData.custom_data ? window.processedData.custom_data[category.id] : null;
            
            html += `
                <div class="bg-white rounded-xl shadow-elegant overflow-hidden">
                    <!-- 分类标题栏 -->
                    <div class="bg-secondary text-white p-4">
                        <h4 class="text-primary font-semibold flex items-center">
                            <i class="fa fa-${category.icon} mr-2"></i>${category.title}
                        </h4>
                        <p class="text-sm text-white/80">${category.description}</p>
                    </div>
                    
                    <!-- 左右布局内容区 -->
                    <div class="p-4 md:flex">
                        <!-- 左侧：原有标签信息 -->
                        <div class="md:w-1/2 md:pr-4 mb-4 md:mb-0">
                            <h5 class="text-gray-600 font-medium mb-3">特征标签</h5>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                ${categoryTags.map(tag => RenderUtils.createTag(tag)).join('')}
                            </div>
                        </div>
                        
                        <!-- 右侧：自定义模块数据 -->
                        <div class="md:w-1/2 md:pl-4 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0">
                            <h5 class="text-gray-600 font-medium mb-3">标签来源</h5>
                            ${RenderUtils.renderCustomData(customData, category.id)}
                        </div>
                    </div>
                </div>
            `;
        }
    });
    html += `</div>`;
    
    container.innerHTML = html;
}

// 页面加载后渲染
document.addEventListener('DOMContentLoaded', renderProfile);