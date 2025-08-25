export function renderTimeRegularityPlot(container, data) {
    // 清除可能存在的旧观察者
    if (container.resizeObserver) {
        container.resizeObserver.disconnect();
    }

    if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-6">无有效导航时间数据</p>';
        return;
    }

    // 数据预处理：解析时间并提取关键信息
    const processedData = data.map(item => {
        const start = new Date(item.start_time);
        return {
            start,
            date: start.toISOString().split('T')[0], // 提取日期（yyyy-mm-dd）
            hour: start.getHours() + start.getMinutes() / 60, // 转换为小时（含分钟）
            duration: item.duration,
            poi: item.poi
        };
    });

    // 提取唯一日期（纵向轴）并排序
    const dates = [...new Set(processedData.map(d => d.date))].sort((a, b) => new Date(a) - new Date(b));
    // 时间段范围（横向轴：0-24小时）
    const hourRange = [0, 24];

    // 绘制图表的函数（响应式核心）
    function drawChart() {
        // 清空容器
        d3.select(container).html('');

        // 获取当前容器尺寸
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight || 600;
        
        // 计算基础尺寸比例（用于响应式缩放）
        const baseSize = Math.min(containerWidth, containerHeight);
        const scaleFactor = baseSize / 800; // 以800px为基准比例
        
        // 动态计算边距（基于容器尺寸），右侧留出更多空间给图例
        const margin = { 
            top: Math.max(40, scaleFactor * 40), 
            right: Math.max(150, scaleFactor * 180), // 增加右侧边距
            bottom: Math.max(100, scaleFactor * 100), 
            left: Math.max(100, scaleFactor * 100)
        };

        const width = containerWidth - margin.left - margin.right;
        const height = containerHeight - margin.top - margin.bottom;

        // 创建SVG
        const svg = d3.select(container)
            .append("svg")
            .attr("width", containerWidth)
            .attr("height", containerHeight)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        // 创建比例尺
        // X轴：时间段（0-24小时）
        const xScale = d3.scaleLinear()
            .domain(hourRange)
            .range([0, width]);

        // Y轴：日期
        const yScale = d3.scaleBand()
            .domain(dates)
            .range([0, height])
            .padding(0.2);

        // 绘制X轴
        const xAxis = svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(xScale)
                .ticks(Math.max(6, Math.floor(width / 100))) // 动态调整刻度数量
                .tickFormat(d => `${d}:00`));
        
        xAxis.selectAll("text")
            .style("text-anchor", "end")
            .attr("transform", "rotate(-45)")
            .style("font-size", `${Math.max(10, scaleFactor * 12)}px`); // 响应式字体

        // 绘制Y轴 - 只显示最上、最下和中间三个日期
        const yAxisTicks = dates.length <= 3 
            ? dates 
            : [dates[0], dates[Math.floor(dates.length / 2)], dates[dates.length - 1]];
        
        const yAxis = svg.append("g")
            .call(d3.axisLeft(yScale)
                .tickValues(yAxisTicks)
                .tickFormat(d => {
                    // 格式化日期为 MM-DD 形式
                    const parts = d.split('-');
                    return `${parts[1]}-${parts[2]}`;
                }));
        
        yAxis.selectAll("text")
            .style("font-size", `${Math.max(10, scaleFactor * 12)}px`); // 响应式字体

        // 添加网格线（横向）
        svg.append("g")
            .attr("class", "grid")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(xScale)
                .ticks(24)
                .tickSize(-height)
                .tickFormat(""))
            .selectAll("line")
            .style("stroke", "#e0e0e0");

        // 为不同目的地分配颜色
        const uniquePois = [...new Set(processedData.map(d => d.poi))];
        const colorScale = d3.scaleOrdinal()
            .domain(uniquePois)
            .range(d3.schemeCategory10);

        // 绘制数据点（开始导航时间）- 响应式大小
        const pointRadius = Math.max(3, scaleFactor * 6);
        const points = svg.selectAll(".time-point")
            .data(processedData)
            .enter()
            .append("circle")
            .attr("class", "time-point")
            .attr("cx", d => xScale(d.hour))
            .attr("cy", d => yScale(d.date) + yScale.bandwidth() / 2) // 居中显示在日期行
            .attr("r", pointRadius)
            .attr("fill", d => colorScale(d.poi))
            .attr("stroke", "white")
            .attr("stroke-width", Math.max(1, scaleFactor * 1.5))
            .style("cursor", "pointer")
            .on("mouseover", function(event, d) {
                // 创建悬停提示框
                const tooltip = d3.select(container)
                    .append("div")
                    .attr("class", "time-tooltip")
                    .style("position", "absolute")
                    .style("background", "rgba(0, 0, 0, 0.8)")
                    .style("color", "white")
                    .style("padding", `${scaleFactor * 8}px ${scaleFactor * 12}px`)
                    .style("border-radius", `${scaleFactor * 4}px`)
                    .style("font-size", `${Math.max(12, scaleFactor * 14)}px`)
                    .style("pointer-events", "none")
                    .style("z-index", "100")
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px");

                // 格式化显示内容（时长转换为分钟+秒）
                const minutes = Math.floor(d.duration / 60);
                const seconds = d.duration % 60;
                const durationStr = seconds > 0 
                    ? `${minutes}分${seconds}秒` 
                    : `${minutes}分钟`;

                tooltip.html(`
                    <div><strong>开始时间:</strong> ${d.start.toLocaleString()}</div>
                    <div><strong>预计导航时间:</strong> ${durationStr}</div>
                    <div><strong>目的地:</strong> ${d.poi}</div>
                `);
            })
            .on("mousemove", function(event) {
                // 跟随鼠标移动
                d3.select(".time-tooltip")
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", function() {
                // 移除提示框
                d3.select(".time-tooltip").remove();
            });

        // 计算图例所需宽度
        const maxLegendTextLength = Math.max(...uniquePois.map(poi => poi.length));
        const estimatedLegendWidth = maxLegendTextLength * scaleFactor * 8 + 30; // 估算文本宽度
        
        // 确定图例位置 - 根据可用空间自动调整
        let legendX, legendY, columns = 1;
        
        // 如果宽度足够，放在右侧；否则放在底部
        if (width > estimatedLegendWidth + 50) {
            legendX = width + scaleFactor * 10;
            legendY = 0;
        } else {
            // 放在底部，可能需要多列显示
            legendX = 0;
            legendY = height + scaleFactor * 30;
            columns = Math.max(1, Math.floor(width / estimatedLegendWidth));
        }

        // 添加图例 - 响应式位置和大小，支持多列
        const legend = svg.append("g")
            .attr("transform", `translate(${legendX}, ${legendY})`);

        uniquePois.forEach((poi, index) => {
            // 计算行列位置
            const col = index % columns;
            const row = Math.floor(index / columns);
            
            const legendItem = legend.append("g")
                .attr("transform", `translate(${col * estimatedLegendWidth}, ${row * scaleFactor * 30})`);

            legendItem.append("circle")
                .attr("r", pointRadius)
                .attr("fill", colorScale(poi))
                .attr("stroke", "white")
                .attr("stroke-width", Math.max(1, scaleFactor * 1.5));

            legendItem.append("text")
                .attr("x", scaleFactor * 15)
                .attr("y", scaleFactor * 5)
                .style("font-size", `${Math.max(10, scaleFactor * 12)}px`)
                .style("max-width", `${estimatedLegendWidth - 30}px`) // 限制最大宽度
                .style("white-space", "nowrap") // 不换行
                .style("text-overflow", "ellipsis") // 超出显示省略号
                .style("overflow", "hidden")
                .attr("title", poi) // 鼠标悬停显示完整文本
                .text(poi);
        });

        // 添加轴标签 - 响应式字体
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", `${Math.max(12, scaleFactor * 14)}px`)
            .text("时间段（小时）");

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left + margin.left / 3)
            .attr("x", -height / 2)
            .attr("text-anchor", "middle")
            .style("font-size", `${Math.max(12, scaleFactor * 14)}px`)
            .text("日期");

        // 添加标题 - 响应式字体
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -margin.top / 4)
            .attr("text-anchor", "middle")
            .style("font-size", `${Math.max(14, scaleFactor * 16)}px`)
            .style("font-weight", "bold")
            .text("导航开始时间分布");

        return svg.node();
    }

    // 初始绘制
    drawChart();

    // 监听容器尺寸变化，实现响应式
    const resizeObserver = new ResizeObserver(entries => {
        // 避免容器尺寸过小时的无效重绘
        if (entries[0].contentRect.width > 100 && entries[0].contentRect.height > 100) {
            drawChart();
        }
    });
    
    resizeObserver.observe(container);
    container.resizeObserver = resizeObserver;
}
    