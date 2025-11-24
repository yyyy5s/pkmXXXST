// Plugin: Pixel Pet
// Author: DC熙
// Repo: https://github.com/yyyy5s/pkmXXXST

jQuery(document).ready(function () {
    const TARGET_URL = "https://yyyy5s.github.io/pkmXXXX/";
    
    // ============================
    // 0. 在输入框旁边的按钮组添加按钮
    // ============================
    function addInputButton() {
        function tryAddButton() {
            // 查找输入框和按钮组
            // ST的输入框通常在 #send_textarea 或类似的元素
            // 按钮组通常在输入框旁边，包含发送按钮、附件按钮等
            const inputSelectors = [
                '#send_textarea',
                'textarea[placeholder*="输入"]',
                'textarea[placeholder*="Type"]',
                '.chat-input textarea',
                '[id*="send"]',
                '[id*="input"]'
            ];
            
            let chatInput = null;
            for (const selector of inputSelectors) {
                chatInput = document.querySelector(selector);
                if (chatInput) {
                    console.log('Found chat input:', selector);
                    break;
                }
            }
            
            if (!chatInput) {
                return false;
            }
            
            // 查找按钮组 - 通常在输入框的父容器或兄弟元素中
            const inputContainer = chatInput.closest('.chat-input-container, .input-container, .chat-input, [class*="input"], [class*="chat"]');
            if (!inputContainer) {
                return false;
            }
            
            // 查找按钮组 - 通常包含发送按钮、附件按钮等
            const buttonGroup = inputContainer.querySelector('.button-group, .input-buttons, .chat-buttons, [class*="button"], [class*="btn"]');
            
            // 如果找不到按钮组，尝试在输入框后面添加
            let targetContainer = buttonGroup || inputContainer;
            
            // 检查是否已经添加过按钮
            if (document.getElementById('pixel-pet-input-btn')) {
                return true;
            }
            
            // 创建按钮
            const button = document.createElement('button');
            button.id = 'pixel-pet-input-btn';
            button.className = 'pixel-pet-input-button';
            button.innerHTML = '🐾';
            button.title = '召唤宠物';
            button.type = 'button';
            button.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                showBall();
                openPetWindow();
            };
            
            // 尝试插入到按钮组中，如果没有按钮组则插入到输入框后面
            if (buttonGroup) {
                buttonGroup.appendChild(button);
                console.log('Added button to button group');
            } else {
                // 在输入框后面插入
                chatInput.parentNode.insertBefore(button, chatInput.nextSibling);
                console.log('Added button after input');
            }
            
            return true;
        }
        
        // 多次尝试
        let attempts = 0;
        const maxAttempts = 20;
        const interval = setInterval(() => {
            if (tryAddButton() || attempts >= maxAttempts) {
                clearInterval(interval);
                if (attempts >= maxAttempts) {
                    console.warn('Could not find input area to add button');
                }
            }
            attempts++;
        }, 500);
    }
    
    // 页面加载完成后添加按钮
    setTimeout(addInputButton, 2000);

    // ============================
    // 1. 注入 HTML (含遮罩层)
    // ============================
    const overlayHtml = `<div id="floating-webview-overlay"></div>`;
    // 悬浮球改为emoji样式，只在PC端显示
    const ballHtml = `<div id="floating-webview-ball" title="长按隐藏">🐾</div>`;
    const containerHtml = `
        <div id="floating-webview-container">
            <iframe id="floating-webview-iframe" src=""></iframe>
        </div>
    `;

    if ($('#floating-webview-ball').length === 0) {
        $('body').append(overlayHtml);
        $('body').append(ballHtml);
        $('body').append(containerHtml);
    }

    const $ball = $('#floating-webview-ball');
    const $container = $('#floating-webview-container');
    const $iframe = $('#floating-webview-iframe');
    const $overlay = $('#floating-webview-overlay');

    // ============================
    // 持久化存储管理
    // ============================
    const STORAGE_KEY = 'pixel_pet_save_data';
    
    // 保存存档数据到插件 localStorage
    function savePetData(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            console.log('Pet save data backed up to plugin storage');
        } catch (e) {
            console.error('Failed to save pet data:', e);
        }
    }
    
    // 从插件 localStorage 读取存档数据
    function loadPetData() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Failed to load pet data:', e);
            return null;
        }
    }
    
    // 监听来自 iframe 的消息（存档同步）
    window.addEventListener('message', function(event) {
        // 安全检查：只接受来自目标 URL 的消息
        try {
            const targetOrigin = new URL(TARGET_URL).origin;
            if (event.origin !== targetOrigin) {
                return;
            }
        } catch (e) {
            // 如果 URL 解析失败，允许所有来源（开发环境）
            console.warn('Could not verify message origin:', e);
        }
        
        // 处理存档数据同步
        if (event.data && event.data.type === 'PIXEL_PET_SAVE') {
            console.log('Received save data from iframe');
            savePetData(event.data.data);
        }
        
        // 处理存档数据请求
        if (event.data && event.data.type === 'PIXEL_PET_REQUEST_SAVE') {
            console.log('Iframe requested save data');
            const savedData = loadPetData();
            if (savedData && $iframe[0] && $iframe[0].contentWindow) {
                try {
                    $iframe[0].contentWindow.postMessage({
                        type: 'PIXEL_PET_RESTORE_SAVE',
                        data: savedData
                    }, TARGET_URL);
                } catch (e) {
                    console.error('Failed to send restore message:', e);
                }
            }
        }
    });
    
    // ============================
    // 功能函数
    // ============================
    function openPetWindow() {
        // 如果 iframe 还没有 src，设置它
        if ($iframe.attr('src') === "" || $iframe.attr('src') !== TARGET_URL) {
            // 先尝试恢复存档数据
            const savedData = loadPetData();
            if (savedData) {
                console.log('Found saved pet data, will restore after iframe loads');
            }
            
            $iframe.attr('src', TARGET_URL);
            // 等待iframe加载完成后，调整内容以填满容器并注入持久化脚本
            $iframe.on('load', function() {
                try {
                    const iframeDoc = this.contentDocument || this.contentWindow.document;
                    const iframeBody = iframeDoc.body;
                    const phoneFrame = iframeDoc.querySelector('.phone-frame');
                    
                    // 注入持久化脚本
                    const script = iframeDoc.createElement('script');
                    script.textContent = `
                        (function() {
                            console.log('Pixel Pet persistence script injected');
                            
                            // 持久化存储管理器
                            const STORAGE_KEYS = ['petSaveData', 'petGameData', 'petSettings'];
                            
                            // 保存所有存档相关的 localStorage 数据
                            function syncAllSaveData() {
                                try {
                                    const allData = {};
                                    // 检查所有可能的存档 key
                                    for (let i = 0; i < localStorage.length; i++) {
                                        const key = localStorage.key(i);
                                        if (key) {
                                            // 检查是否是存档相关的 key
                                            const isSaveKey = STORAGE_KEYS.some(sk => key === sk || key.includes('pet') || key.includes('save') || key.includes('game'));
                                            if (isSaveKey) {
                                                try {
                                                    const value = localStorage.getItem(key);
                                                    allData[key] = JSON.parse(value);
                                                } catch (e) {
                                                    allData[key] = localStorage.getItem(key);
                                                }
                                            }
                                        }
                                    }
                                    
                                    // 如果有数据，发送到父页面
                                    if (Object.keys(allData).length > 0) {
                                        window.parent.postMessage({
                                            type: 'PIXEL_PET_SAVE',
                                            data: allData
                                        }, '*');
                                        console.log('Synced save data to parent:', Object.keys(allData));
                                    }
                                } catch (e) {
                                    console.error('Failed to sync save data:', e);
                                }
                            }
                            
                            // 拦截 localStorage 的 setItem 方法
                            const originalSetItem = Storage.prototype.setItem;
                            Storage.prototype.setItem = function(key, value) {
                                originalSetItem.apply(this, arguments);
                                
                                // 如果是存档相关的 key，立即同步
                                const isSaveKey = STORAGE_KEYS.some(sk => key === sk || key.includes('pet') || key.includes('save') || key.includes('game'));
                                if (isSaveKey) {
                                    setTimeout(syncAllSaveData, 100);
                                }
                            };
                            
                            // 拦截 localStorage 的 removeItem 方法
                            const originalRemoveItem = Storage.prototype.removeItem;
                            Storage.prototype.removeItem = function(key) {
                                originalRemoveItem.apply(this, arguments);
                                const isSaveKey = STORAGE_KEYS.some(sk => key === sk || key.includes('pet') || key.includes('save') || key.includes('game'));
                                if (isSaveKey) {
                                    setTimeout(syncAllSaveData, 100);
                                }
                            };
                            
                            // 监听父页面的恢复消息
                            window.addEventListener('message', function(event) {
                                if (event.data && event.data.type === 'PIXEL_PET_RESTORE_SAVE') {
                                    const savedData = event.data.data;
                                    if (savedData) {
                                        try {
                                            console.log('Restoring save data from parent...');
                                            // 恢复所有 localStorage 数据
                                            if (typeof savedData === 'object') {
                                                for (const key in savedData) {
                                                    if (savedData.hasOwnProperty(key)) {
                                                        const value = savedData[key];
                                                        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
                                                    }
                                                }
                                                console.log('Save data restored:', Object.keys(savedData));
                                                
                                                // 触发自定义事件，通知游戏恢复存档
                                                window.dispatchEvent(new CustomEvent('petSaveRestored', { detail: savedData }));
                                            }
                                        } catch (e) {
                                            console.error('Failed to restore save data:', e);
                                        }
                                    }
                                }
                            });
                            
                            // 页面加载时，请求父页面恢复存档
                            if (document.readyState === 'loading') {
                                document.addEventListener('DOMContentLoaded', function() {
                                    setTimeout(function() {
                                        window.parent.postMessage({
                                            type: 'PIXEL_PET_REQUEST_SAVE'
                                        }, '*');
                                    }, 500);
                                });
                            } else {
                                setTimeout(function() {
                                    window.parent.postMessage({
                                        type: 'PIXEL_PET_REQUEST_SAVE'
                                    }, '*');
                                }, 500);
                            }
                            
                            // 定期同步所有存档相关的 localStorage（每5秒）
                            setInterval(syncAllSaveData, 5000);
                            
                            // 页面卸载前同步一次
                            window.addEventListener('beforeunload', function() {
                                syncAllSaveData();
                            });
                        })();
                    `;
                    iframeDoc.head.appendChild(script);
                    
                    if (phoneFrame && iframeBody) {
                        // 获取容器的实际尺寸
                        const containerWidth = $container.width();
                        const containerHeight = $container.height();
                        
                        // 修改body样式，确保内容填满iframe
                        iframeBody.style.width = '100%';
                        iframeBody.style.height = '100%';
                        iframeBody.style.margin = '0';
                        iframeBody.style.padding = '0';
                        iframeBody.style.display = 'flex';
                        iframeBody.style.alignItems = 'stretch';
                        iframeBody.style.justifyContent = 'stretch';
                        iframeBody.style.overflow = 'hidden';
                        
                        // 确保phone-frame填满可用空间
                        phoneFrame.style.width = '100%';
                        phoneFrame.style.height = '100%';
                        phoneFrame.style.maxWidth = '100%';
                        phoneFrame.style.maxHeight = '100%';
                        phoneFrame.style.margin = '0';
                        
                        // 获取phone-frame的期望尺寸（从CSS变量）
                        const computedStyle = iframeDoc.defaultView.getComputedStyle(phoneFrame);
                        const rootStyle = iframeDoc.documentElement.style;
                        
                        // 如果phone-frame有CSS变量定义的尺寸，更新它们以匹配容器
                        if (rootStyle.getPropertyValue('--phone-width')) {
                            rootStyle.setProperty('--phone-width', containerWidth + 'px');
                        }
                        if (rootStyle.getPropertyValue('--phone-height')) {
                            rootStyle.setProperty('--phone-height', containerHeight + 'px');
                        }
                        
                        // 强制phone-frame使用容器的尺寸
                        phoneFrame.style.setProperty('--phone-width', containerWidth + 'px', 'important');
                        phoneFrame.style.setProperty('--phone-height', containerHeight + 'px', 'important');
                    }
                } catch (e) {
                    // 跨域限制，无法访问iframe内容
                    console.log('无法访问iframe内容（可能是跨域限制），将使用postMessage方案:', e);
                    // 即使跨域，postMessage 仍然可以工作
                }
            });
        }
        $overlay.show();
        // 使用flexbox居中显示
        $container.css({
            'display': 'flex',
            'align-items': 'center',
            'justify-content': 'center'
        }).fadeIn(200);
    }

    function closePetWindow() {
        $container.fadeOut(200);
        $overlay.hide();
    }

    function showBall() {
        $ball.fadeIn(200);
    }

    function hideBall() {
        $ball.fadeOut(200);
    }

    // ============================
    // 注册斜杠命令 /pixelpet
    // ============================
    function registerPixelPetCommand() {
        if (window.slash_commands) {
            try {
                // 尝试注册命令
                if (typeof window.slash_commands.registerSlashCommand === 'function') {
                    window.slash_commands.registerSlashCommand('pixelpet', function(args, value) {
                        console.log('Pixel Pet command executed');
                        showBall();       // 呼出小球
                        openPetWindow();  // 直接打开窗口
                    }, [], 'Open the Pixel Pet window', true, true);
                    console.log('Pixel Pet command registered successfully');
                    return true;
                } else {
                    console.warn('registerSlashCommand method not found');
                    return false;
                }
            } catch (e) {
                console.error('Error registering Pixel Pet command:', e);
                return false;
            }
        } else {
            console.warn('window.slash_commands not available');
            return false;
        }
    }
    
    // 延迟注册命令，确保系统已加载
    let commandRetryCount = 0;
    const maxCommandRetries = 10;
    function tryRegisterCommand() {
        if (registerPixelPetCommand() || commandRetryCount >= maxCommandRetries) {
            if (commandRetryCount >= maxCommandRetries) {
                console.error('Failed to register Pixel Pet command after multiple attempts');
            }
        } else {
            commandRetryCount++;
            setTimeout(tryRegisterCommand, 500);
        }
    }
    setTimeout(tryRegisterCommand, 1000);

    // ============================
    // 事件绑定
    // ============================
    let pressTimer;
    let isLongPress = false;

    // 长按隐藏
    $ball.on('mousedown touchstart', function(e) {
        if(e.button !== 0 && e.type !== 'touchstart') return; // 忽略右键
        isLongPress = false;
        pressTimer = setTimeout(function() {
            isLongPress = true;
            hideBall();
            // 提示用户
            if (typeof toastr !== 'undefined') {
                toastr.info('宠物已隐藏，点击设置中的【召唤宠物】按钮可召回。');
            }
        }, 800);
    });

    $ball.on('mouseup touchend mouseleave', function(e) {
        clearTimeout(pressTimer);
    });

    // 拖拽逻辑
    const ballElement = document.getElementById('floating-webview-ball');
    let isDragging = false;
    let hasMoved = false;
    let startX, startY, initialLeft, initialTop;

    ballElement.addEventListener('mousedown', function(e) {
        if(e.button !== 0) return;
        isDragging = true;
        hasMoved = false;
        startX = e.clientX;
        startY = e.clientY;
        const rect = ballElement.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;
        e.preventDefault();
    });

    window.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            hasMoved = true;
        }
        ballElement.style.left = `${initialLeft + dx}px`;
        ballElement.style.top = `${initialTop + dy}px`;
        ballElement.style.right = 'auto';
        ballElement.style.bottom = 'auto';
    });

    window.addEventListener('mouseup', function() {
        isDragging = false;
    });

    // 点击小球打开
    $ball.on('click', function() {
        if (!hasMoved && !isLongPress) {
            openPetWindow();
        }
    });

    // 点击外部关闭
    $overlay.on('click', function() {
        closePetWindow();
    });
});