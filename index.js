// Plugin: Pixel Pet
// Author: DC熙
// Repo: https://github.com/yyyy5s/pkmXXXST

jQuery(document).ready(function () {
    const TARGET_URL = "https://yyyy5s.github.io/pkmXXXX/";
    
    // ============================
    // 0. 自动创建 QR 按钮 (核心新增)
    // ============================
    const QR_SET_NAME = "Pixel Pet";
    const QR_BUTTON_LABEL = "召唤宠物";
    
    // 创建QR按钮的函数 - 尝试多种方法
    function createQRButton() {
        console.log('Attempting to create QR button...');
        console.log('Available objects:', {
            slash_commands: !!window.slash_commands,
            quickReplyManager: !!window.quickReplyManager,
            quick_reply_manager: !!window.quick_reply_manager,
            eventSource: !!window.eventSource
        });
        
        try {
            // 方法1: 尝试直接执行命令字符串（最可能有效的方法）
            if (window.slash_commands) {
                // 检查是否有执行命令的方法
                const methods = ['execute', 'run', 'handleCommand', 'executeCommand', 'runSlashCommand', 'processCommand'];
                for (const method of methods) {
                    if (typeof window.slash_commands[method] === 'function') {
                        console.log(`Trying method: ${method}`);
                        try {
                            // 执行创建QR集的命令
                            window.slash_commands[method](`/qr-set-create ${QR_SET_NAME}`);
                            setTimeout(() => {
                                // 执行创建QR按钮的命令
                                window.slash_commands[method](`/qr-create set="${QR_SET_NAME}" label="${QR_BUTTON_LABEL}" /pixelpet`);
                                console.log(`Pixel Pet QR button created via ${method} method.`);
                            }, 500);
                            return true;
                        } catch (e) {
                            console.warn(`Method ${method} failed:`, e);
                        }
                    }
                }
            }
            
            // 方法2: 尝试通过QR Manager API
            const qrManager = window.quickReplyManager || window.quick_reply_manager;
            if (qrManager) {
                console.log('Trying QR Manager API...');
                if (qrManager.createSet && qrManager.createButton) {
                    try {
                        qrManager.createSet(QR_SET_NAME, {
                            nosend: false,
                            before: false,
                            inject: false
                        });
                        setTimeout(() => {
                            qrManager.createButton(QR_SET_NAME, {
                                label: QR_BUTTON_LABEL,
                                text: '/pixelpet'
                            });
                            console.log("Pixel Pet QR button created via QR Manager API.");
                        }, 300);
                        return true;
                    } catch (e) {
                        console.warn('QR Manager API failed:', e);
                    }
                }
            }
            
            // 如果所有方法都失败，给出提示
            console.error("❌ 无法自动创建QR按钮！");
            console.warn("请手动在ST的聊天框中执行以下命令来创建QR按钮：");
            console.warn(`1. /qr-set-create ${QR_SET_NAME}`);
            console.warn(`2. /qr-create set="${QR_SET_NAME}" label="${QR_BUTTON_LABEL}" /pixelpet`);
            return false;
        } catch (e) {
            console.error("创建QR按钮时出错:", e);
            console.warn("请手动在ST的聊天框中执行以下命令：");
            console.warn(`1. /qr-set-create ${QR_SET_NAME}`);
            console.warn(`2. /qr-create set="${QR_SET_NAME}" label="${QR_BUTTON_LABEL}" /pixelpet`);
            return false;
        }
    }
    
    // 延迟执行以确保酒馆系统加载完毕
    // 尝试多次，因为系统可能加载较慢
    let retryCount = 0;
    const maxRetries = 15;
    const retryInterval = 500;
    
    function tryCreateQRButton() {
        // 检查必要的对象是否已加载
        if (window.slash_commands || window.quickReplyManager || window.quick_reply_manager || window.eventSource) {
            createQRButton();
        } else if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(tryCreateQRButton, retryInterval);
        } else {
            console.warn("多次尝试后仍无法创建QR按钮。请手动在ST中执行以下命令：");
            console.warn(`1. /qr-set-create ${QR_SET_NAME}`);
            console.warn(`2. /qr-create set="${QR_SET_NAME}" label="${QR_BUTTON_LABEL}" /pixelpet`);
        }
    }
    
    // 页面加载完成后开始尝试
    setTimeout(tryCreateQRButton, 1500);

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
            toastr.info(`宠物已隐藏，点击 QR 栏的【${QR_BUTTON_LABEL}】可召回。`);
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