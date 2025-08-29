export function initVinSelection() {
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