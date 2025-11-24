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
    
    // 延迟执行以确保酒馆系统加载完毕
    setTimeout(function() {
        if (window.slash_commands) {
            // 1. 创建一个叫 "Pixel Pet" 的按钮集 (如果存在会覆盖/更新)
            // 引用自手册: /qr-set-create
            window.slash_commands.runSlashCommand(`/qr-set-create ${QR_SET_NAME}`);
            
            // 2. 在该集下创建按钮，点击执行 /pixelpet
            // 引用自手册: /qr-create
            // 延时一点点确保集合已创建
            setTimeout(() => {
                window.slash_commands.runSlashCommand(`/qr-create set="${QR_SET_NAME}" label="${QR_BUTTON_LABEL}" /pixelpet`);
                // 强制刷新一下 QR 栏的显示 (可选，部分版本需要)
                if (window.eventSource) window.eventSource.emit('qr_sets_updated');
            }, 500);
            
            console.log("Pixel Pet QR button created.");
        }
    }, 2000); // 2秒后执行，避免刚进网页卡顿

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
    if (window.slash_commands) {
        window.slash_commands.registerSlashCommand('pixelpet', function(args, value) {
            showBall();       // 呼出小球
            openPetWindow();  // 直接打开窗口
        }, [], 'Open the Pixel Pet window', true, true);
    }

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