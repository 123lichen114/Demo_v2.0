/**
 * 绘制出发点区域与目的地导航频率热力图
 * @param {HTMLElement} container - 容器元素
 * @param {Object} data - 热力图数据，包含grid_labels, destinations, frequency_matrix, grid_size
 */
export function renderLocPoiHeatmap(container, data) {
    // 直接使用传入的容器元素
    if (!container) {
        console.error('热力图容器元素不存在');
        return;
    }
    
    // 清空容器
    container.innerHTML = '';
    
    // 提取数据
    const { grid_labels, destinations, frequency_matrix, grid_size } = data || {};
    if (!grid_labels || !destinations || !frequency_matrix) {
        container.innerHTML = '<div class="text-center py-8 text-gray-500">没有可用的热力图数据</div>';
        return;
    }
    
    // 计算容器可用高度（减去标题高度）
    const containerHeight = container.clientHeight;
    const titleHeight = 40; // 标题大约高度
    const availableHeight = containerHeight - titleHeight;
    
    // 计算单元格大小 - 动态调整，项少则大，项多则小
    const maxCellWidth = 150;
    const minCellWidth = 60;
    const maxCellHeight = 80;
    const minCellHeight = 40;
    
    // 根据目的地数量计算单元格宽度
    const cellWidth = Math.max(
        minCellWidth, 
        Math.min(maxCellWidth, Math.floor(container.clientWidth / destinations.length))
    );
    
    // 根据起点区域数量计算单元格高度（确保总高度不超过可用高度）
    const cellHeight = Math.max(
        minCellHeight, 
        Math.min(
            maxCellHeight, 
            Math.floor(availableHeight / grid_labels.length) // 基于可用高度计算
        )
    );
    
    // 创建图表容器 - 限制最大高度并添加滚动
    const chartContainer = document.createElement('div');
    chartContainer.className = 'heatmap-container w-full overflow-auto relative'; // 添加relative定位
    chartContainer.style.maxHeight = `${containerHeight}px`; // 不超过容器高度
    container.appendChild(chartContainer);
    
    // 添加自定义tooltip样式 - 优化过渡效果
    const style = document.createElement('style');
    style.textContent = `
        .custom-tooltip {
            position: absolute;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            pointer-events: none;
            z-index: 1000;
            opacity: 0;
            transform: translateY(5px);
            transition: opacity 0.2s ease, transform 0.2s ease;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            line-height: 1.5; /* 增加行高，让多行更清晰 */
        }
        .custom-tooltip.visible {
            opacity: 1;
            transform: translateY(0);
        }
    `;
    chartContainer.appendChild(style);
    
    // 创建自定义tooltip元素
    const tooltip = document.createElement('div');
    tooltip.className = 'custom-tooltip';
    chartContainer.appendChild(tooltip);
    
    // 创建表格
    const table = document.createElement('table');
    table.className = 'border-collapse mx-auto'; // 居中显示表格
    
    // 创建表头行（空单元格 + 目的地列）
    const headerRow = document.createElement('tr');
    
    // 左上角空单元格
    const cornerCell = document.createElement('th');
    cornerCell.className = 'border border-gray-300 bg-gray-100 p-2 font-bold text-left';
    cornerCell.style.minWidth = '180px';
    cornerCell.style.maxWidth = '250px';
    cornerCell.textContent = `出发点区域（${grid_size}米×${grid_size}米）`;
    headerRow.appendChild(cornerCell);
    
    // 目的地列标题 - 不使用斜体，保持水平显示
    destinations.forEach(dest => {
        const th = document.createElement('th');
        th.className = 'border border-gray-300 bg-gray-100 p-2 font-bold text-center';
        th.style.width = `${cellWidth}px`;
        th.style.minWidth = `${cellWidth}px`;
        th.style.maxWidth = `${cellWidth}px`;
        th.style.whiteSpace = 'nowrap';
        th.style.overflow = 'hidden';
        th.style.textOverflow = 'ellipsis';
        th.title = dest; // 原生提示备份
        th.textContent = dest;
        headerRow.appendChild(th);
    });
    
    table.appendChild(headerRow);
    
    // 创建数据行
    frequency_matrix.forEach((row, rowIndex) => {
        const tr = document.createElement('tr');
        
        // 行标签（起点网格）
        const rowLabel = document.createElement('th');
        rowLabel.className = 'border border-gray-300 bg-gray-100 p-2 font-medium text-left';
        rowLabel.style.height = `${cellHeight}px`;
        rowLabel.style.whiteSpace = 'nowrap';
        rowLabel.style.overflow = 'hidden';
        rowLabel.style.textOverflow = 'ellipsis';
        rowLabel.title = grid_labels[rowIndex];
        rowLabel.textContent = grid_labels[rowIndex];
        tr.appendChild(rowLabel);
        
        // 数据单元格
        row.forEach((value, colIndex) => {
            const td = document.createElement('td');
            td.className = 'border border-gray-300 p-1 text-center relative transition-all duration-200 hover:shadow-lg cursor-pointer';
            td.style.width = `${cellWidth}px`;
            td.style.height = `${cellHeight}px`;
            
            // 根据值计算颜色强度
            const maxValue = Math.max(...frequency_matrix.flat());
            const intensity = maxValue > 0 ? value / maxValue : 0;
            const color = getColor(intensity);
            
            td.style.backgroundColor = color;
            td.style.color = intensity > 0.5 ? 'white' : 'black';
            td.style.fontWeight = value > 0 ? 'bold' : 'normal';
            td.style.fontSize = `${Math.max(12, Math.min(16, cellWidth / 8))}px`; // 字体大小随单元格调整
            
            // 显示数值
            td.textContent = value > 0 ? value : '';
            
            // 悬停提示信息 - 分三行显示
            const area = grid_labels[rowIndex];
            const destination = destinations[colIndex];
            const tooltipHtml = `
                从区域${area}<br>
                到目的地：${destination}<br>
                ${value}次
            `;
            
            // 鼠标事件 - 优化tooltip显示逻辑
            td.addEventListener('mouseenter', (e) => {
                // 清除可能存在的隐藏定时器
                if (tooltip.hideTimer) {
                    clearTimeout(tooltip.hideTimer);
                    tooltip.hideTimer = null;
                }
                
                // 设置内容和位置
                tooltip.innerHTML = tooltipHtml; // 使用innerHTML支持HTML格式
                updateTooltipPosition(e);
                
                // 显示tooltip
                tooltip.classList.add('visible');
            });
            
            td.addEventListener('mousemove', updateTooltipPosition);
            
            td.addEventListener('mouseleave', () => {
                // 移除显示类
                tooltip.classList.remove('visible');
                
                // 延迟隐藏，避免快速移动时的闪烁
                tooltip.hideTimer = setTimeout(() => {
                    tooltip.innerHTML = ''; // 清空内容
                }, 200);
            });
            
            tr.appendChild(td);
        });
        
        table.appendChild(tr);
    });
    
    // 添加标题
    const title = document.createElement('h3');
    title.className = 'text-xl font-bold mb-4 text-center';
    title.textContent = `出发点区域（${grid_size}米×${grid_size}米）到目的地的导航频率热力图`;
    title.style.height = `${titleHeight}px`; // 固定标题高度
    title.style.boxSizing = 'border-box';
    
    chartContainer.appendChild(title);
    chartContainer.appendChild(table);
    
    // 更新tooltip位置的函数 - 考虑容器滚动偏移
    function updateTooltipPosition(e) {
        // 获取容器的位置和滚动状态，确保tooltip在容器内正确定位
        const containerRect = chartContainer.getBoundingClientRect();
        const scrollLeft = chartContainer.scrollLeft;
        const scrollTop = chartContainer.scrollTop;
        const tooltipRect = tooltip.getBoundingClientRect();
        
        // 计算位置（相对于容器，考虑滚动偏移）
        let left = (e.clientX - containerRect.left) + scrollLeft + 10;
        let top = (e.clientY - containerRect.top) + scrollTop + 10;
        
        // 防止tooltip超出右侧边界
        if (left + tooltipRect.width > containerRect.width + scrollLeft) {
            left = (e.clientX - containerRect.left) + scrollLeft - tooltipRect.width - 10;
        }
        
        // 防止tooltip超出底部边界
        if (top + tooltipRect.height > containerRect.height + scrollTop) {
            top = (e.clientY - containerRect.top) + scrollTop - tooltipRect.height - 10;
        }
        
        // 设置位置
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    }
    
    // 添加响应式处理
    const handleResize = () => {
        // 移除旧的事件监听避免重复绑定
        if (container.cleanup) container.cleanup();
        renderLocPoiHeatmap(container, data);
    };
    
    // 监听窗口大小变化，重新渲染
    window.addEventListener('resize', handleResize);
    
    // 清理函数
    container.cleanup = () => {
        window.removeEventListener('resize', handleResize);
    };
}

/**
 * 根据强度获取热力图颜色（从浅黄到深红）
 * @param {number} intensity - 0到1之间的强度值
 */
function getColor(intensity) {
    // 颜色映射：低强度-浅黄色，高强度-深红色
    const r = Math.round(255 * intensity);
    const g = Math.round(255 * (1 - intensity * 0.5));
    const b = Math.round(100 * (1 - intensity));
    return `rgb(${r}, ${g}, ${b})`;
}
    