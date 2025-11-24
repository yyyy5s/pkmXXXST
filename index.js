(function () {
    const TARGET_URL = "https://yyyy5s.github.io/pkmXXXX/";

    const init = () => {
        // 清理旧元素
        $('#pixel-pet-float-btn').remove();
        $('#pixel-pet-overlay').remove();

        // 1. 创建悬浮球
        const $btn = $(`<div id="pixel-pet-float-btn">🐱</div>`);
        
        // 2. 创建弹窗结构
        // 修改点：iframe 标签增加了 scrolling="no" 和 style="overflow:hidden"
        const $overlay = $(`
            <div id="pixel-pet-overlay">
                <div id="pixel-pet-container">
                    <iframe id="pixel-pet-iframe" 
                            src=""
                            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                            allow="autoplay; fullscreen"
                            scrolling="no"
                            style="overflow:hidden; height:100%; width:100%;"
                            frameborder="0">
                    </iframe>
                </div>
            </div>
        `);

        $('body').append($btn).append($overlay);

        // --- 拖拽交互逻辑 ---
        let isDragging = false;
        let hasMoved = false;
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
        };

        const onMove = (e) => {
            if (!isDragging) return;
            if (e.type === 'touchmove') e.preventDefault();

            const coords = getCoords(e);
            const dx = coords.clientX - startX;
            const dy = coords.clientY - startY;

            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                hasMoved = true;
                $btn.css({
                    left: startLeft + dx,
                    top: startTop + dy,
                    bottom: 'auto',
                    right: 'auto'
                });
            }
        };

        const onEnd = () => {
            if (!isDragging) return;
            isDragging = false;

            if (!hasMoved) {
                toggleWebview();
            }
        };

        $btn.on('mousedown touchstart', onStart);
        $(document).on('mousemove touchmove', onMove);
        $(document).on('mouseup touchend', onEnd);

        // --- 窗口开关逻辑 ---
        const toggleWebview = () => {
            const $iframe = $('#pixel-pet-iframe');
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