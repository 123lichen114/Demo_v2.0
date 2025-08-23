// /static/js/special_type/poiTypeFanDiagram.js
export function renderPoiTypeFanDiagram(container, data) {
    // 设置尺寸（自适应容器高度）
    const containerRect = container.getBoundingClientRect();
    const size = Math.min(containerRect.width, containerRect.height);
    const radius = size / 2;
    
    // 创建SVG容器
    const svg = d3.select(container)
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", `0 0 ${size} ${size}`)
        .append("g")
        .attr("transform", `translate(${size/2}, ${size/2})`);
    
    // 从层级数据中提取各层数据（保持和原绘图逻辑兼容的格式）
    const bigData = data.map(big => ({  // 外层：大类
        name: big.name,
        value: big.value
    }));
    
    const midData = [];  // 中层：所有中类
    data.forEach(big => {
        big.mid_categories.forEach(mid => {
            midData.push({
                name: mid.name,
                value: mid.value,
                parent: big.name  // 记录父级大类，便于后续扩展（如联动高亮）
            });
        });
    });
    
    const subData = [];  // 内层：所有小类
    data.forEach(big => {
        big.mid_categories.forEach(mid => {
            mid.sub_categories.forEach(sub => {
                subData.push({
                    name: sub.name,
                    value: sub.value,
                    parent: mid.name  // 记录父级中类
                });
            });
        });
    });
    
    // 计算百分比（基于各层总数量）
    const calculatePercentages = (categories) => {
        const total = categories.reduce((sum, item) => sum + item.value, 0);
        return categories.map(item => ({
            ...item,
            percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : 0
        }));
    };
    
    const processedBigData = calculatePercentages(bigData);
    const processedMidData = calculatePercentages(midData);
    const processedSubData = calculatePercentages(subData);
    
    // 饼图布局和圆弧生成器（保持原逻辑）
    const pie = d3.pie().value(d => d.value);
    const arcGenerators = {
        outer: d3.arc().innerRadius(radius * 0.7).outerRadius(radius),    // 大类（外层）
        middle: d3.arc().innerRadius(radius * 0.4).outerRadius(radius * 0.65),  // 中类（中层）
        inner: d3.arc().innerRadius(0).outerRadius(radius * 0.35)       // 小类（内层）
    };
    
    // 颜色比例尺（可按父级关联颜色，增强层级感）
    const bigColor = d3.scaleOrdinal(d3.schemeCategory10);
    // 为中类生成基于父级大类的衍生色
    const getMidColor = (midItem) => {
        const parentColor = bigColor(midItem.parent);
        return d3.color(parentColor).darker(0.3).toString();  // 比父级深一些
    };
    // 为小类生成基于父级中类的衍生色
    const getSubColor = (subItem, midData) => {
        const parentMid = midData.find(mid => mid.name === subItem.parent);
        if (parentMid) {
            const midColor = getMidColor(parentMid);
            return d3.color(midColor).darker(0.3).toString();  // 比中类深一些
        }
        return "#ccc";
    };
    
    // 绘制扇形区域的通用函数（增加父级关联逻辑）
    const drawArcs = (data, arcGenerator, className, colorAccessor) => {
        const arcs = svg.append("g")
            .attr("class", className)
            .selectAll("path")
            .data(pie(data))
            .enter()
            .append("path")
            .attr("d", arcGenerator)
            .attr("fill", d => colorAccessor(d.data))  // 使用传入的颜色访问器
            .attr("stroke", "white")
            .style("stroke-width", "2px")
            .style("opacity", 0.8)
            .on("mouseover", function(event, d) {
                // 鼠标悬停时高亮当前扇形及关联层级（增强层级感知）
                d3.select(this)
                    .style("opacity", 1)
                    .style("stroke", "#fff")
                    .style("stroke-width", "4px")
                    .style("cursor", "pointer");
                
                // 显示包含层级关系的tooltip
                const hierarchyInfo = d.data.parent 
                    ? `${d.data.parent} > ${d.data.name}` 
                    : d.data.name;
                showTooltip(event, `${hierarchyInfo}: ${d.data.percentage}%`);
            })
            .on("mouseout", function() {
                d3.select(this)
                    .style("opacity", 0.8)
                    .style("stroke-width", "2px");
                hideTooltip();
            });
        
        // 标签显示（仅显示占比较大的项）
        arcs.filter(d => d.data.percentage > 5)
            .append("title")
            .text(d => {
                const hierarchyInfo = d.data.parent 
                    ? `${d.data.parent} > ${d.data.name}` 
                    : d.data.name;
                return `${hierarchyInfo}: ${d.data.percentage}%`;
            });
    };
    
    // 绘制三层扇形（使用新的颜色逻辑）
    drawArcs(processedBigData, arcGenerators.outer, "outer-arcs", d => bigColor(d.name));
    drawArcs(processedMidData, arcGenerators.middle, "middle-arcs", d => getMidColor(d));
    drawArcs(processedSubData, arcGenerators.inner, "inner-arcs", d => getSubColor(d, processedMidData));
    
    // Tooltip 实现（保持原逻辑）
    function showTooltip(event, content) {
        let tooltip = d3.select(container).select(".poi-tooltip");
        if (tooltip.empty()) {
            tooltip = d3.select(container)
                .append("div")
                .attr("class", "poi-tooltip")
                .style("position", "absolute")
                .style("background", "rgba(0,0,0,0.8)")
                .style("color", "white")
                .style("padding", "6px 10px")
                .style("border-radius", "4px")
                .style("font-size", "12px")
                .style("pointer-events", "none")
                .style("z-index", "100");
        }
        
        tooltip.html(content)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 20) + "px")
            .style("opacity", 0)
            .transition()
            .duration(200)
            .style("opacity", 1);
    }
    
    function hideTooltip() {
        d3.select(container).select(".poi-tooltip")
            .transition()
            .duration(200)
            .style("opacity", 0);
    }
    
    return svg.node();
}