// Plugin: Pixel Pet
// Author: DC熙
// Repo: https://github.com/yyyy5s/pkmXXXST

jQuery(document).ready(function () {
    // ⚠️ 如果你的网页部署地址变了，请修改这里
    const TARGET_URL = "https://yyyy5s.github.io/pkmXXXX/";
    
    // 1. 注入 HTML 结构
    const ballHtml = `<div id="floating-webview-ball" title="Pixel Pet"></div>`;
    const containerHtml = `
        <div id="floating-webview-container">
            <div id="floating-webview-header">
                <span id="floating-webview-close">✕ Close</span>
            </div>
            <iframe id="floating-webview-iframe" src=""></iframe>
        </div>
    `;

    // 防止重复注入
    if ($('#floating-webview-ball').length === 0) {
        $('body').append(ballHtml);
        $('body').append(containerHtml);
    }

    const $ball = $('#floating-webview-ball');
    const $container = $('#floating-webview-container');
    const $iframe = $('#floating-webview-iframe');
    const $closeBtn = $('#floating-webview-close');

    // 2. 拖拽逻辑
    const ballElement = document.getElementById('floating-webview-ball');
    let isDragging = false;
    let hasMoved = false;
    let startX, startY, initialLeft, initialTop;

    ballElement.addEventListener('mousedown', function(e) {
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

    // 3. 点击逻辑
    $ball.on('click', function() {
        if (hasMoved) return;
        if ($iframe.attr('src') === "") {
            $iframe.attr('src', TARGET_URL);
        }
        $container.css('display', 'flex');
    });

    // 4. 关闭逻辑
    $closeBtn.on('click', function() {
        $container.hide();
    });
});