// 导入分离的渲染函数
import { renderPoiTypeFanDiagram } from '/static/js/special_type/poiTypeFanDiagram.js';
import { renderTimeRegularityPlot } from '/static/js/special_type/timeRegularityPlot.js';
import { renderLocPoiHeatmap } from '/static/js/special_type/locPoiHeatmap.js';  // 热力图渲染函数
export const RenderUtils = {
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