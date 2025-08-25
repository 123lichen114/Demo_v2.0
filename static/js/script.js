// 导入分离的渲染函数
import { renderPoiTypeFanDiagram } from '/static/js/special_type/poiTypeFanDiagram.js';
import { renderTimeRegularityPlot } from '/static/js/special_type/timeRegularityPlot.js';
import { renderLocPoiHeatmap } from '/static/js/special_type/locPoiHeatmap.js';  // 热力图渲染函数

// 初始化Tailwind配置
tailwind.config = {
    theme: {
        extend: {
            colors: {
                primary: '#F3EEFA',
                secondary: '#F3EEF8',
                tertiary: '#F3EEF8',
                dark: '#1E293B'
            },
            boxShadow: {
                'elegant': '0 4px 20px rgba(0, 0, 0, 0.08)',
                'hover': '0 8px 30px rgba(0, 0, 0, 0.12)',
            }
        },
    }
}

// 页面加载完成后初始化所有功能
document.addEventListener('DOMContentLoaded', function() {
    // 初始化VIN选择器（依赖processedData中的vinList）
    initVinSelection();
    
    // 初始化用户画像渲染（如果有数据）
    if (typeof renderProfile === 'function') {
        renderProfile();
    } else {
        console.warn('renderProfile函数未定义，用户画像可能无法正常显示');
    }
});

// VIN选择器初始化函数（从processedData中获取VIN列表）
function initVinSelection() {
    // 获取DOM元素
    const vinInput = document.getElementById('vinInput');
    const vinDropdown = document.getElementById('vinDropdown');
    const dropdownContent = vinDropdown ? vinDropdown.querySelector('div') : null;

    // 容错处理：检查必要元素是否存在
    if (!vinInput || !vinDropdown || !dropdownContent) {
        console.error('VIN选择器必要元素缺失，初始化失败');
        return;
    }

    // 从processedData中获取VIN列表（适配新结构）
    const getVinList = () => {
        // 检查processedData是否存在且包含vinList数组
        if (window.processedData && Array.isArray(window.processedData.vinList)) {
            return window.processedData.vinList;
        }
        return []; // 默认为空数组避免报错
    };

    // 渲染VIN选项列表（支持搜索过滤）
    function renderVinOptions(filter = '') {
        // 清空现有选项
        dropdownContent.innerHTML = '';
        
        // 获取VIN列表（从processedData中）
        const vinList = getVinList();

        // 过滤VIN（不区分大小写）
        const filteredVins = vinList.filter(vin => 
            vin.toLowerCase().includes(filter.toLowerCase().trim())
        );

        // 渲染过滤后的选项
        if (filteredVins.length === 0) {
            dropdownContent.innerHTML = '<div class="px-3 py-2 text-gray-500">无匹配结果</div>';
        } else {
            filteredVins.forEach(vin => {
                const vinElement = document.createElement('div');
                vinElement.className = 'px-3 py-2 rounded hover:bg-blue-50 cursor-pointer transition-colors text-sm';
                vinElement.textContent = vin;
                
                // 点击选项时选中VIN
                vinElement.addEventListener('click', () => {
                    vinInput.value = vin;
                    selectVin(vin); // 触发VIN选择逻辑
                    vinDropdown.classList.add('hidden'); // 关闭下拉框
                });
                
                dropdownContent.appendChild(vinElement);
            });
        }
    }

    // 输入框实时过滤逻辑
    vinInput.addEventListener('input', (e) => {
        const filterText = e.target.value;
        renderVinOptions(filterText);
        vinDropdown.classList.remove('hidden'); // 显示下拉框
    });

    // 点击输入框显示全部选项
    vinInput.addEventListener('focus', () => {
        renderVinOptions();
        vinDropdown.classList.remove('hidden');
    });

    // 点击外部关闭下拉框
    document.addEventListener('click', (e) => {
        if (!vinInput.contains(e.target) && !vinDropdown.contains(e.target)) {
            vinDropdown.classList.add('hidden');
        }
    });

    // 初始化选中的VIN（从processedData中获取）
    if (window.processedData && window.processedData.selectedVin) {
        vinInput.value = window.processedData.selectedVin;
    }

    // 初始渲染所有VIN
    renderVinOptions();
}

// VIN选择处理函数
function selectVin(vin) {
    // 显示加载状态
    const vinInput = document.getElementById('vinInput');
    if (vinInput) {
        vinInput.disabled = true;
        vinInput.placeholder = `加载 ${vin} 数据中...`;
    }

    // 发送请求获取对应VIN的数据页面
    fetch(`/?vin=${encodeURIComponent(vin)}&t=${new Date().getTime()}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`请求失败 (状态码: ${response.status})`);
            }
            return response.text();
        })
        .then(html => {
            // 解析HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // 1. 提取新的processedData脚本内容（关键修改）
            let processedDataScript = null;
            const scripts = doc.querySelectorAll('script');
            scripts.forEach(script => {
                if (script.textContent.includes('window.processedData =')) {
                    processedDataScript = script.textContent;
                }
            });

            // 2. 执行脚本更新数据（避免dataScript未定义）
            if (processedDataScript) {
                // 直接执行脚本内容，更新window.processedData
                eval(processedDataScript);
            } else {
                console.warn('未找到包含window.processedData的脚本');
            }
            
            // 3. 局部更新页面内容（只更新需要变化的区域）
            const newProfileContainer = doc.getElementById('profile-container');
            const newAnalysisResults = doc.querySelector('.mt-12');
            
            if (newProfileContainer) {
                document.getElementById('profile-container').innerHTML = newProfileContainer.innerHTML;
            }
            if (newAnalysisResults) {
                document.querySelector('.mt-12').innerHTML = newAnalysisResults.innerHTML;
            }

            // 4. 重新初始化相关功能
            initVinSelection();
            if (typeof renderProfile === 'function') {
                renderProfile();
            }
        })
        .catch(error => {
            console.error('VIN选择失败:', error);
            alert(`加载失败: ${error.message}\n请重试或选择其他VIN`);
        })
        .finally(() => {
            if (vinInput) {
                vinInput.disabled = false;
                vinInput.placeholder = '输入VIN码搜索...';
            }
        });
}

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
if (window.processedData && Array.isArray(window.processedData.tags)) {
    window.processedData.tags.forEach(processedTag => {
        // 找到前端标签中对应的标签（通过category和title匹配）
        const targetTag = profileData.tags.find(
            tag => tag.category === processedTag.category && tag.title === processedTag.title
        );
        if (targetTag) {
            targetTag.value = processedTag.value; // 赋值后端处理的结果
        } else {
            console.warn(`未找到匹配的标签：${processedTag.category} - ${processedTag.title}`);
        }
    });
} else {
    console.warn('window.processedData.tags 不存在或不是数组');
}

// 4. 渲染工具类（确保标签值被正确显示）
const RenderUtils = {
    // 响应式渲染通用函数 - 抽取统一逻辑
    createResponsiveRenderer(containerId, renderFunction, data) {
        // 创建容器HTML
        const containerHtml = `<div id="${containerId}" class="w-full h-full min-h-[300px]"></div>`;
        
        // 初始化渲染和响应式处理
        setTimeout(() => {
            const container = document.getElementById(containerId);
            if (container) {
                // 定义渲染函数
                const render = () => renderFunction(container, data);
                
                // 初始渲染
                render();
                
                // 监听容器尺寸变化，重新渲染
                const handleResize = () => render();
                container.addEventListener('resize', handleResize);
                
                // 监听窗口尺寸变化，重新渲染
                window.addEventListener('resize', handleResize);
                
                // 清理函数 - 在需要时可以调用
                container.cleanup = () => {
                    container.removeEventListener('resize', handleResize);
                    window.removeEventListener('resize', handleResize);
                };
            }
        }, 0);
        
        return containerHtml;
    },
    
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
                <!-- 修改提示框样式：显示在下方，白色背景，黑色字体 -->
                <div class="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 z-50 top-full mt-2 left-1/2 transform -translate-x-1/2 w-64 bg-white text-gray-900 p-4 rounded-xl shadow-lg border border-gray-200 text-sm">
                    <h4 class="font-semibold mb-1">${title}</h4>
                    <p>${description}</p>
                    <!-- 添加小三角指示符 -->
                    <div class="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-t border-l border-gray-200 rotate-45"></div>
                </div>
            </div>
        `;
    },
    
    createTopLevel(data) {
        const content = `
            <div class="bg-primary text-gray-900 rounded-2xl p-8 shadow-elegant transition-all-300 hover:shadow-hover transform hover:-translate-y-1">
                <h2 class="text-[clamp(1.5rem,3vw,2rem)] font-bold text-center">${data.title}</h2>
            </div>
        `;
        return this.createTooltipComponent({
            type: 'top', content, title: `${data.title}总览`, description: data.description
        });
    },
    
    createCategory(category) {
        const content = `
            <div class="bg-secondary text-gray-900 rounded-xl p-5 shadow-elegant transition-all-300 hover:shadow-hover cursor-pointer transform hover:-translate-y-1">
                <h3 class="font-bold text-lg">${category.title}</h3>
                <p class="text-sm text-gray-900/80 mt-1">${category.subtitle}</p>
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
            `<div class="mt-2 text-gray-900 font-medium">${tag.value}</div>` :  // 有值时显示
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

    // 新增：渲染自定义模块数据，使用统一的响应式处理逻辑
    renderCustomData(data, category) {
        if (!data) {
            return `<div class="text-gray-400 text-center py-6">暂无自定义数据</div>`;
        }
        
        // 生成唯一容器ID
        const baseId = `container-${category}-${Date.now()}`;
        
        // 根据数据类型渲染不同内容，统一使用响应式渲染函数
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
            return this.createResponsiveRenderer(
                `chart-${baseId}`,
                (container, chartData) => {
                    // 这里可以初始化图表
                    console.log(`初始化图表: ${container.id}`, chartData);
                    // 示例：new Chart(container, chartData.config);
                },
                data
            );
        } else if (data.type === 'poi_type_fan_diagram') {
            // POI扇形图容器（使用统一响应式逻辑）
            return this.createResponsiveRenderer(
                `poi-fan-${baseId}`,
                renderPoiTypeFanDiagram,
                data.data
            );
        } else if (data.type === 'time_regularity_plot') {
            // 时间规律图容器（使用统一响应式逻辑）
            return this.createResponsiveRenderer(
                `time-regularity-${baseId}`,
                renderTimeRegularityPlot,
                data.data
            );
        } else if (data.type === 'loc_poi_heatmap') {
            // 热力图容器（使用统一响应式逻辑）
            return this.createResponsiveRenderer(
                `loc-poi-heatmap-${baseId}`,
                renderLocPoiHeatmap,
                data.data
            );
        } else {
            // 默认文本类型
            return `<div class="p-4 bg-gray-50 rounded-lg">${data.content}</div>`;
        }
    }
};

// 5. 渲染页面
function renderProfile() {
    const container = document.getElementById('profile-container');
    if (!container) {
        console.error('未找到profile-container元素');
        return;
    }
    
    let html = '';

    // 添加顶层标题
    html += RenderUtils.createTopLevel(profileData.topLevel);
    console.log(`renderProfile window.processedData:`, window.processedData);
    
    // 遍历每个分类
    profileData.categories.forEach(category => {
        // 筛选该分类下的标签
        const categoryTags = profileData.tags.filter(tag => tag.category === category.id);
        const customData = window.processedData && window.processedData.custom_data 
            ? window.processedData.custom_data[category.id] 
            : null;
        
        // 为每个分类创建带可滑动分割线的容器
        html += `
        <div class="bg-white rounded-2xl shadow-elegant overflow-hidden transition-all-300 hover:shadow-hover">
            <div class="p-6 border-b border-gray-100">
                ${RenderUtils.createCategory(category)}
            </div>
            
            <!-- 带滑动分割线的左右布局 -->
            <div class="flex" style="min-height: 400px;">
                <!-- 左侧标签区域 -->
                <div class="split-left overflow-auto" style="width: 50%; min-width: 250px;">
                    <div class="p-4">
                        <h5 class="text-gray-600 font-medium mb-3">特征标签</h5>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            ${categoryTags.map(tag => RenderUtils.createTag(tag)).join('')}
                        </div>
                    </div>
                </div>
                
                <!-- 分割线 -->
                <div class="split-resizer cursor-col-resize bg-gray-300" style="width: 4px;"></div>
                
                <!-- 右侧图表区域 -->
                <div class="split-right overflow-auto" style="flex: 1; min-width: 250px;">
                    <div class="p-4 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0">
                        <h5 class="text-gray-600 font-medium mb-3">标签来源</h5>
                        <div id="custom-data-${category.id}" class="w-full h-full">
                            ${RenderUtils.renderCustomData(customData, category.id)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    });

    container.innerHTML = html;

    // 初始化分割线功能
    initSplitResizers();
}

// 添加分割线拖动功能
function initSplitResizers() {
    const resizers = document.querySelectorAll('.split-resizer');
    
    resizers.forEach(resizer => {
        const container = resizer.parentElement;
        const left = resizer.previousElementSibling;
        const right = resizer.nextElementSibling;

        let startX, startLeftWidth, startRightWidth;

        // 鼠标按下事件
        resizer.addEventListener('mousedown', (e) => {
            startX = e.pageX;
            startLeftWidth = left.getBoundingClientRect().width;
            startRightWidth = right.getBoundingClientRect().width;
            container.style.userSelect = 'none'; // 防止拖动时选中文本
            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResize);
        });

        // 拖动调整大小
        function resize(e) {
            const dx = e.pageX - startX;
            const newLeftWidth = Math.max(250, startLeftWidth + dx); // 最小宽度限制
            const containerWidth = container.getBoundingClientRect().width;
            const newRightWidth = containerWidth - newLeftWidth - 4; // 减去分割线宽度

            if (newRightWidth >= 250) { // 右侧最小宽度限制
                left.style.width = `${newLeftWidth}px`;
                right.style.width = `${newRightWidth}px`;
                right.style.flex = 'none'; // 取消flex增长，使用固定宽度

                // 触发右侧图表容器的尺寸变化事件
                const event = new Event('resize');
                right.dispatchEvent(event);
                
                // 触发所有子容器的尺寸变化事件
                right.querySelectorAll('div[id^="container-"]').forEach(container => {
                    container.dispatchEvent(new Event('resize'));
                });
            }
        }

        // 停止拖动
        function stopResize() {
            container.style.userSelect = '';
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
        }
    });
}
    