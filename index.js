(function () {
    // 建议：如果安卓太卡，可以尝试国内镜像源，或者检查该网页是否包含大量未压缩素材
    const TARGET_URL = "https://yyyy5s.github.io/pkmXXXX/"; 

    const init = () => {
        // 清理旧元素
        $('#pixel-pet-float-btn').remove();
        $('#pixel-pet-overlay').remove();

        // 1. 创建悬浮球 (添加提示)
        const $btn = $(`<div id="pixel-pet-float-btn" title="点击打开，长按关闭">🐱</div>`);
        
        // 2. 创建弹窗结构
        // 针对安卓不显示立绘：添加 loading="eager"
        // 针对iPhone存档：添加 allow-storage-access-by-user-activation
        const $overlay = $(`
            <div id="pixel-pet-overlay">
                <div id="pixel-pet-container">
                    <iframe id="pixel-pet-iframe" 
                            src=""
                            loading="eager"
                            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads allow-storage-access-by-user-activation"
                            allow="autoplay; fullscreen; clipboard-read; clipboard-write"
                            frameborder="0">
                    </iframe>
                </div>
            </div>
        `);

        $('body').append($btn).append($overlay);

        // --- 拖拽与长按逻辑 ---
        let isDragging = false;
        let hasMoved = false;
        let longPressTimer = null;
        let startX, startY, startLeft, startTop;

        const getCoords = (e) => {
            const ev = e.originalEvent || e;
            return ev.touches ? ev.touches[0] : ev;
        };

        const onStart = (e) => {
            if (e.type === 'mousedown' && e.which !== 1) return;
            
            isDragging = true;
            hasMoved = false;
            
            const coords = getCoords(e);
            startX = coords.clientX;
            startY = coords.clientY;

            const offset = $btn.offset(); 
            startLeft = offset.left - $(window).scrollLeft();
            startTop = offset.top - $(window).scrollTop();

            // 长按计时开始 (1.5秒)
            longPressTimer = setTimeout(() => {
                if (!hasMoved) {
                    $btn.fadeOut(300, function() { $(this).remove(); }); // 移除按钮
                    isDragging = false; // 停止拖拽逻辑
                    // 可以选择在这里加个 /echo 提示已关闭
                }
            }, 1500); 
        };

        const onMove = (e) => {
            if (!isDragging) return;

            const coords = getCoords(e);
            const dx = coords.clientX - startX;
            const dy = coords.clientY - startY;

            // 只有移动超过 5px 才视为拖拽，避免手抖误触
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                hasMoved = true;
                clearTimeout(longPressTimer); // 移动了就取消长按判定
                
                // iPhone 触摸优化：防止页面随拖拽滚动
                if (e.type === 'touchmove') e.preventDefault(); 

                $btn.css({
                    left: startLeft + dx,
                    top: startTop + dy,
                    bottom: 'auto',
                    right: 'auto'
                });
            }
        };

        const onEnd = () => {
            clearTimeout(longPressTimer); // 松手清除计时器
            if (!isDragging) return;
            isDragging = false;

            // 只有没移动、且元素还存在时，才触发打开
            if (!hasMoved && document.body.contains($btn[0])) {
                toggleWebview();
            }
        };

        $btn.on('mousedown touchstart', onStart);
        $(document).on('mousemove touchmove', onMove);
        $(document).on('mouseup touchend', onEnd);

        // --- 窗口开关逻辑 ---
        const toggleWebview = () => {
            const $iframe = $('#pixel-pet-iframe');
            // 每次打开检查 src，利用浏览器缓存，但确保加载
            if (!$iframe.attr('src')) {
                $iframe.attr('src', TARGET_URL);
            }
            $overlay.fadeIn(200).css('display', 'flex');
        };

        $overlay.on('click', function(e) {
            if (e.target.id === 'pixel-pet-overlay') {
                $(this).fadeOut(200);
            }
        });
    };

    $(document).ready(init);
})();