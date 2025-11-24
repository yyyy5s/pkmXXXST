// Plugin: Pixel Pet
// Author: DC熙
// Repo: https://github.com/yyyy5s/pkmXXXST

jQuery(document).ready(function () {
    const TARGET_URL = "https://yyyy5s.github.io/pkmXXXX/";
    
    // ============================
    // 0. 在设置面板添加按钮
    // ============================
    function addSettingsButton() {
        // 等待ST界面加载完成
        function tryAddButton() {
            // 尝试找到设置面板 - 常见的选择器
            const settingsSelectors = [
                '#settings_panel',
                '.settings_panel',
                '#right_panel',
                '.right_panel',
                '.settings-container',
                '[id*="settings"]',
                '[class*="settings"]'
            ];
            
            let settingsPanel = null;
            for (const selector of settingsSelectors) {
                settingsPanel = document.querySelector(selector);
                if (settingsPanel) {
                    console.log('Found settings panel:', selector);
                    break;
                }
            }
            
            // 如果找不到设置面板，尝试在聊天输入框附近添加按钮
            if (!settingsPanel) {
                // 尝试在聊天输入框上方或旁边添加按钮
                const chatInput = document.querySelector('#send_textarea, textarea[placeholder*="输入"], .chat-input, [id*="input"]');
                if (chatInput) {
                    const inputContainer = chatInput.closest('.chat-input-container, .input-container, .chat-container') || chatInput.parentElement;
                    if (inputContainer) {
                        // 在输入框上方添加按钮
                        const buttonContainer = document.createElement('div');
                        buttonContainer.id = 'pixel-pet-button-container';
                        buttonContainer.style.cssText = 'padding: 8px; text-align: center;';
                        inputContainer.insertBefore(buttonContainer, chatInput);
                        settingsPanel = buttonContainer;
                    }
                }
            }
            
            // 如果还是找不到，在body顶部添加一个浮动按钮
            if (!settingsPanel) {
                const floatingButton = document.createElement('button');
                floatingButton.id = 'pixel-pet-floating-btn';
                floatingButton.innerHTML = '🐾 召唤宠物';
                floatingButton.style.cssText = `
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    z-index: 10000;
                    padding: 10px 15px;
                    background: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 14px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                `;
                floatingButton.onclick = function() {
                    showBall();
                    openPetWindow();
                };
                document.body.appendChild(floatingButton);
                console.log('Added floating button');
                return true;
            }
            
            // 在设置面板中添加按钮
            if (settingsPanel && !document.getElementById('pixel-pet-settings-btn')) {
                const button = document.createElement('button');
                button.id = 'pixel-pet-settings-btn';
                button.innerHTML = '🐾 召唤宠物';
                button.className = 'pixel-pet-settings-button';
                button.onclick = function() {
                    showBall();
                    openPetWindow();
                };
                
                // 尝试找到合适的位置插入按钮
                const firstChild = settingsPanel.firstElementChild;
                if (firstChild) {
                    settingsPanel.insertBefore(button, firstChild);
                } else {
                    settingsPanel.appendChild(button);
                }
                
                console.log('Added settings button');
                return true;
            }
            
            return false;
        }
        
        // 多次尝试，直到找到设置面板
        let attempts = 0;
        const maxAttempts = 20;
        const interval = setInterval(() => {
            if (tryAddButton() || attempts >= maxAttempts) {
                clearInterval(interval);
                if (attempts >= maxAttempts) {
                    console.warn('Could not find settings panel, using floating button');
                    tryAddButton(); // 最后一次尝试，会创建浮动按钮
                }
            }
            attempts++;
        }, 500);
    }
    
    // 页面加载完成后添加按钮
    setTimeout(addSettingsButton, 2000);

    // ============================
    // 1. 注入 HTML (含遮罩层)
    // ============================
    const overlayHtml = `<div id="floating-webview-overlay"></div>`;
    const ballHtml = `<div id="floating-webview-ball" title="Long press to hide"></div>`;
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
    // 功能函数
    // ============================
    function openPetWindow() {
        if ($iframe.attr('src') === "") {
            $iframe.attr('src', TARGET_URL);
            // 等待iframe加载完成后，调整内容以填满容器
            $iframe.on('load', function() {
                try {
                    const iframeDoc = this.contentDocument || this.contentWindow.document;
                    const iframeBody = iframeDoc.body;
                    const phoneFrame = iframeDoc.querySelector('.phone-frame');
                    
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
                        iframeBody.style.alignItems = 'stretch'; // 改为stretch而不是center
                        iframeBody.style.justifyContent = 'stretch'; // 改为stretch而不是center
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
                    // 这种情况下，只能依赖CSS来调整
                    console.log('无法访问iframe内容（可能是跨域限制），将使用CSS方案:', e);
                }
            });
        }
        $overlay.show();
        $container.fadeIn(200);
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