export function renderPoiTypeFanDiagram(container, data, options = {}) {
    // 清除可能存在的旧观察者
    if (container.resizeObserver) {
        container.resizeObserver.disconnect();
    }

    // 默认配置 - 新增阈值控制选项
    const defaultOptions = {
        useThresholds: false, // 是否启用阈值过滤
        thresholds: {
            big: {
                minPercentage: 1,    // 调小：从3→1
                minAngleDegrees: 5,  // 调小：从15→5
                minSectorWidth: 20   // 调小：从30→20
            },
            mid: {
                minPercentage: 0.5,  // 调小：从2→0.5
                minAngleDegrees: 3,  // 调小：从10→3
                minSectorWidth: 15   // 调小：从20→15
            },
            sub: {
                minPercentage: 0.1,  // 调小：从1→0.1
                minAngleDegrees: 2,  // 调小：从8→2
                minSectorWidth: 10   // 调小：从15→10
            }
        }
    };

    // 合并配置
    const config = { ...defaultOptions, ...options };

    // 绘制图表的函数（响应式核心）
    function drawChart() {
        // 获取容器尺寸
        const containerRect = container.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;
        const size = Math.min(containerWidth, containerHeight);
        const radius = size / 2;
        
        // 计算缩放因子（用于响应式调整）
        const baseSize = 600; // 基准尺寸
        const scaleFactor = Math.min(size / baseSize, 1.2); // 限制最大缩放
        
        // 清空容器
        d3.select(container).html('');
        
        // 创建SVG容器
        const svg = d3.select(container)
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", `0 0 ${size} ${size}`)
            .append("g")
            .attr("transform", `translate(${size/2}, ${size/2})`);
        
        // 计算总体总值（用于计算占总体的比例）
        const calculateTotalValue = (categories) => {
            return categories.reduce((sum, item) => sum + item.value, 0);
        };
        
        // 计算总体总值
        const overallTotal = calculateTotalValue(data);
        
        // 处理大类数据并计算角度范围
        const processedBigData = data.map((big, index) => {
            const percentage = overallTotal > 0 ? (big.value / overallTotal) * 100 : 0;
            return {
                ...big,
                percentage,
                index
            };
        });
        
        // 创建大类饼图布局
        const bigPie = d3.pie().value(d => d.value);
        const bigArcs = bigPie(processedBigData);
        
        // 为每个大类添加角度信息
        processedBigData.forEach((big, i) => {
            big.startAngle = bigArcs[i].startAngle;
            big.endAngle = bigArcs[i].endAngle;
        });
        
        // 处理中类数据，基于父类角度范围计算自身角度，并计算占总体的比例
        const processedMidData = [];
        processedBigData.forEach(big => {
            const midTotal = calculateTotalValue(big.mid_categories);
            const midPie = d3.pie().value(d => d.value);
            const midArcs = midPie(big.mid_categories);
            
            big.mid_categories.forEach((mid, i) => {
                // 计算中类在大类角度范围内的占比
                const angleRange = big.endAngle - big.startAngle;
                const midStartAngle = big.startAngle + (midArcs[i].startAngle / (2 * Math.PI)) * angleRange;
                const midEndAngle = big.startAngle + (midArcs[i].endAngle / (2 * Math.PI)) * angleRange;
                
                // 计算占总体的百分比
                const percentage = overallTotal > 0 ? (mid.value / overallTotal) * 100 : 0;
                
                processedMidData.push({
                    ...mid,
                    parent: big.name,
                    parentIndex: big.index,
                    percentage,
                    startAngle: midStartAngle,
                    endAngle: midEndAngle
                });
            });
        });
        
        // 处理小类数据，基于父类(中类)角度范围计算自身角度，并计算占总体的比例
        const processedSubData = [];
        processedBigData.forEach(big => {
            big.mid_categories.forEach(mid => {
                const subTotal = calculateTotalValue(mid.sub_categories);
                if (subTotal === 0) return;
                
                // 找到对应的中类处理后的数据
                const processedMid = processedMidData.find(m => m.name === mid.name && m.parent === big.name);
                if (!processedMid) return;
                
                const subPie = d3.pie().value(d => d.value);
                const subArcs = subPie(mid.sub_categories);
                
                mid.sub_categories.forEach((sub, i) => {
                    // 计算小类在中类角度范围内的占比
                    const angleRange = processedMid.endAngle - processedMid.startAngle;
                    const subStartAngle = processedMid.startAngle + (subArcs[i].startAngle / (2 * Math.PI)) * angleRange;
                    const subEndAngle = processedMid.startAngle + (subArcs[i].endAngle / (2 * Math.PI)) * angleRange;
                    
                    // 计算占总体的百分比
                    const percentage = overallTotal > 0 ? (sub.value / overallTotal) * 100 : 0;
                    
                    processedSubData.push({
                        ...sub,
                        parent: mid.name,
                        grandparent: big.name,
                        grandparentIndex: big.index,
                        percentage,
                        startAngle: subStartAngle,
                        endAngle: subEndAngle
                    });
                });
            });
        });
        
        // 圆弧生成器
        const arcGenerators = {
            outer: d3.arc().innerRadius(radius * 0.7).outerRadius(radius),    // 大类（外层）
            middle: d3.arc().innerRadius(radius * 0.4).outerRadius(radius * 0.65),  // 中类（中层）
            inner: d3.arc().innerRadius(0).outerRadius(radius * 0.35)       // 小类（内层）
        };
        
        // 颜色比例尺
        const bigColor = d3.scaleOrdinal(d3.schemeCategory10);
        
        // 为中类生成基于父级大类的衍生色
        const getMidColor = (midItem) => {
            const parentColor = bigColor(midItem.parentIndex);
            return d3.color(parentColor).darker(0.3).toString();
        };
        
        // 为小类生成基于父级中类的衍生色
        const getSubColor = (subItem) => {
            const parentMid = processedMidData.find(mid => mid.name === subItem.parent && mid.parentIndex === subItem.grandparentIndex);
            if (parentMid) {
                const midColor = getMidColor(parentMid);
                return d3.color(midColor).darker(0.3).toString();
            }
            return "#ccc";
        };

        // 获取文字颜色（与扇形颜色对比）
        const getTextColor = (bgColor) => {
            const color = d3.color(bgColor);
            // 计算亮度，决定文字颜色
            const luminance = (0.299 * color.r + 0.587 * color.g + 0.114 * color.b) / 255;
            return luminance > 0.5 ? "#333" : "#fff";
        };
        
        // 计算扇区角度大小（弧度）
        const getSectorAngleSize = (d) => {
            return d.endAngle - d.startAngle;
        };
        
        // 计算扇区可用宽度（环的宽度）
        const getSectorWidth = (arcGenerator) => {
            return arcGenerator.outerRadius() - arcGenerator.innerRadius();
        };
        
        // 检查扇区是否足够大以显示文字（新增阈值控制逻辑）
        const isSectorLargeEnough = (d, arcGenerator, textOptions) => {
            // 如果禁用阈值，直接返回true
            if (!config.useThresholds) return true;
            
            const angleSize = getSectorAngleSize(d);
            const sectorWidth = getSectorWidth(arcGenerator);
            
            // 应用阈值检查
            return angleSize > (textOptions.minAngleDegrees * Math.PI / 180) &&
                   sectorWidth > textOptions.minSectorWidth * scaleFactor;
        };
        
        // 分割文本为适合扇区宽度的多行
        const wrapText = (text, maxWidth, fontSize) => {
            const words = text.split(/\s+/);
            const lines = [];
            let currentLine = words[0];
            
            for (let i = 1; i < words.length; i++) {
                const word = words[i];
                const testLine = currentLine + " " + word;
                // 估算文本宽度
                const testWidth = testLine.length * fontSize * 0.5; // 粗略估算
                
                if (testWidth > maxWidth) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            }
            
            lines.push(currentLine);
            return lines;
        };
        
        // 绘制扇形区域的通用函数
        const drawArcs = (data, arcGenerator, className, colorAccessor, textOptions) => {
            const arcs = svg.append("g")
                .attr("class", className)
                .selectAll("path")
                .data(data)
                .enter()
                .append("path")
                .attr("d", d => arcGenerator({
                    startAngle: d.startAngle,
                    endAngle: d.endAngle,
                    innerRadius: arcGenerator.innerRadius(),
                    outerRadius: arcGenerator.outerRadius()
                }))
                .attr("fill", d => colorAccessor(d))
                .attr("stroke", "white")
                .style("stroke-width", `${Math.max(1, scaleFactor * 2)}px`)
                .style("opacity", 0.8)
                .on("mouseover", function(event, d) {
                    d3.select(this)
                        .style("opacity", 1)
                        .style("stroke", "#fff")
                        .style("stroke-width", `${Math.max(2, scaleFactor * 4)}px`)
                        .style("cursor", "pointer");
                    
                    // 显示包含层级关系的tooltip
                    let hierarchyInfo = d.name;
                    if (d.grandparent) {
                        hierarchyInfo = `${d.grandparent} > ${d.parent} > ${d.name}`;
                    } else if (d.parent) {
                        hierarchyInfo = `${d.parent} > ${d.name}`;
                    }
                    showTooltip(event, `${hierarchyInfo}: ${d.percentage.toFixed(1)}%`);
                })
                .on("mouseout", function() {
                    d3.select(this)
                        .style("opacity", 0.8)
                        .style("stroke-width", `${Math.max(1, scaleFactor * 2)}px`);
                    hideTooltip();
                });

            // 绘制弧形文字标签（垂直于半径方向）
            const textGroup = svg.append("g")
                .attr("class", `${className}-labels`);
                
            textGroup.selectAll("g.text-container")
                .data(data)
                .enter()
                // 阈值控制逻辑：根据配置决定是否应用过滤
                .filter(d => {
                    if (!config.useThresholds) {
                        // 禁用阈值时，只过滤掉百分比为0的情况
                        return d.percentage > 0;
                    }
                    // 启用阈值时，应用完整过滤条件
                    return d.percentage > textOptions.minPercentage && 
                           isSectorLargeEnough(d, arcGenerator, textOptions);
                })
                .append("g")
                .attr("class", "text-container")
                .attr("transform", d => {
                    // 计算弧的中心角度
                    const midAngle = (d.startAngle + d.endAngle) / 2;
                    // 计算文本位置（在弧的中间）
                    const pos = arcGenerator.centroid({
                        startAngle: d.startAngle,
                        endAngle: d.endAngle
                    });
                    
                    // 计算垂直于半径的旋转角度（弧度转角度）
                    const rotation = (midAngle * 180 / Math.PI);
                    
                    return `translate(${pos}) rotate(${rotation})`;
                })
                .each(function(d) {
                    const textContainer = d3.select(this);
                    const midAngle = (d.startAngle + d.endAngle) / 2;
                    const sectorWidth = getSectorWidth(arcGenerator);
                    const maxTextWidth = sectorWidth * 0.8; // 最大文本宽度为扇区宽度的80%
                    
                    // 创建完整文本
                    const fullText = `${d.name} ${d.percentage.toFixed(1)}%`;
                    
                    // 分割文本为多行
                    const lines = wrapText(fullText, maxTextWidth, textOptions.fontSize);
                    
                    // 计算文本定位（根据扇区位置调整）
                    const isRightHalf = midAngle < Math.PI;
                    const textAnchor = isRightHalf ? "start" : "end";
                    const lineHeight = textOptions.fontSize * 1.2 * scaleFactor;
                    const yOffset = -(lines.length - 1) * lineHeight / 2; // 垂直居中
                    
                    // 添加多行文本
                    lines.forEach((line, i) => {
                        textContainer.append("text")
                            .attr("dy", `${yOffset + i * lineHeight}px`)
                            .attr("text-anchor", textAnchor)
                            .style("font-size", `${textOptions.fontSize * scaleFactor}px`)
                            .style("fill", d => textOptions.colorAccessor(d))
                            .style("pointer-events", "none")
                            .text(line);
                    });
                });
            
            return arcs;
        };
        
        // 绘制三层扇形并添加文字标签
        // 大类配置（使用新的阈值配置）
        const bigTextOptions = {
            fontSize: 14,
            ...config.thresholds.big,
            colorAccessor: d => getTextColor(bigColor(d.index))
        };
        drawArcs(processedBigData, arcGenerators.outer, "outer-arcs", d => bigColor(d.index), bigTextOptions);
        
        // 中类配置
        const midTextOptions = {
            fontSize: 12,
            ...config.thresholds.mid,
            colorAccessor: d => getTextColor(getMidColor(d))
        };
        drawArcs(processedMidData, arcGenerators.middle, "middle-arcs", d => getMidColor(d), midTextOptions);
        
        // 小类配置
        const subTextOptions = {
            fontSize: 10,
            ...config.thresholds.sub,
            colorAccessor: d => getTextColor(getSubColor(d))
        };
        drawArcs(processedSubData, arcGenerators.inner, "inner-arcs", d => getSubColor(d), subTextOptions);
        
        // Tooltip 实现
        function showTooltip(event, content) {
            let tooltip = d3.select(container).select(".poi-tooltip");
            if (tooltip.empty()) {
                tooltip = d3.select(container)
                    .append("div")
                    .attr("class", "poi-tooltip")
                    .style("position", "absolute")
                    .style("background", "rgba(0,0,0,0.8)")
                    .style("color", "white")
                    .style("padding", `${scaleFactor * 6}px ${scaleFactor * 10}px`)
                    .style("border-radius", `${scaleFactor * 4}px`)
                    .style("font-size", `${Math.max(12, scaleFactor * 12)}px`)
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

    // 初始绘制
    drawChart();

    // 添加响应式支持
    const resizeObserver = new ResizeObserver(entries => {
        if (entries[0].contentRect.width > 100 && entries[0].contentRect.height > 100) {
            drawChart();
        }
    });
    
    resizeObserver.observe(container);
    container.resizeObserver = resizeObserver;

    // 暴露API用于动态控制阈值（新增）
    return {
        // 启用阈值过滤
        enableThresholds() {
            config.useThresholds = true;
            drawChart();
        },
        // 禁用阈值过滤（显示所有可能的文字）
        disableThresholds() {
            config.useThresholds = false;
            drawChart();
        },
        // 动态更新阈值设置
        updateThresholds(newThresholds) {
            config.thresholds = { ...config.thresholds, ...newThresholds };
            drawChart();
        }
    };
}
    