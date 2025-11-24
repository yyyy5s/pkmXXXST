(function () {
    // 你的链接 (保持不变)
    const TARGET_URL = "https://yyyy5s.github.io/pkmXXXX/index.html"; 

    const init = () => {
        // 1. 清理旧元素
        $('#pixel-pet-float-btn').remove();
        $('#pixel-pet-overlay').remove();

        // 2. 创建悬浮球
        const $btn = $(`<div id="pixel-pet-float-btn">🐱</div>`);
        
        // 3. 创建弹窗结构
        const $overlay = $(`
            <div id="pixel-pet-overlay">
                <div id="pixel-pet-container">
                    <iframe id="pixel-pet-iframe" 
                            src=""
                            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                            allow="autoplay; fullscreen"
                            scrolling="no"
                            style="overflow:hidden; height:100%; width:100%; background: white;" 
                            frameborder="0">
                    </iframe>
                </div>
            </div>
        `);

        $('body').append($btn).append($overlay);

        // --- 拖拽逻辑 (保持不变) ---
        let isDragging = false, hasMoved = false;
        let startX, startY, startLeft, startTop;
        const getCoords = (e) => { const ev = e.originalEvent || e; return ev.touches ? ev.touches[0] : ev; };
        const onStart = (e) => { if (e.type === 'mousedown' && e.which !== 1) return; isDragging = true; hasMoved = false; const coords = getCoords(e); startX = coords.clientX; startY = coords.clientY; const offset = $btn.offset(); startLeft = offset.left - $(window).scrollLeft(); startTop = offset.top - $(window).scrollTop(); };
        const onMove = (e) => { if (!isDragging) return; if (e.type === 'touchmove') e.preventDefault(); const coords = getCoords(e); const dx = coords.clientX - startX; const dy = coords.clientY - startY; if (Math.abs(dx) > 5 || Math.abs(dy) > 5) { hasMoved = true; $btn.css({ left: startLeft + dx, top: startTop + dy, bottom: 'auto', right: 'auto' }); } };
        const onEnd = () => { if (!isDragging) return; isDragging = false; if (!hasMoved) toggleWebview(); };
        $btn.on('mousedown touchstart', onStart); $(document).on('mousemove touchmove', onMove); $(document).on('mouseup touchend', onEnd);

        // --- 窗口开关逻辑 ---
        const toggleWebview = () => {
            const $iframe = $('#pixel-pet-iframe');
            if ($iframe.attr('src') !== TARGET_URL) {
                $iframe.attr('src', TARGET_URL);
            }
            $('#pixel-pet-overlay').css({ 'display': 'flex', 'visibility': 'visible', 'opacity': '1', 'z-index': '2147483647' });
        };
        window.togglePixelPet = toggleWebview;
        $overlay.on('click', function(e) { if (e.target.id === 'pixel-pet-overlay') $(this).hide(); });

        // --- 🔴 核心修改：死磕注册逻辑 ---
        let retryCount = 0;
        const registerCommand = () => {
            // 检查解析器是否存在
            if (window.SlashCommandParser && window.SlashCommandParser.commands) {
                
                // 定义命令逻辑
                const petCommand = {
                    name: 'pet',
                    helpString: '打开 Pixel Pet 宠物窗口',
                    function: (args) => {
                        toggleWebview();
                        return "";
                    }
                };

                // 强制写入/覆盖命令
                window.SlashCommandParser.commands['pet'] = petCommand;
                
                console.log("[PixelPet] ✅ 命令 /pet 注册成功！");
                
                // 弹出绿色提示，告诉你成功了 (只弹一次)
                if (window.toastr) {
                    toastr.success("宠物命令已就绪", "Pixel Pet", { timeOut: 3000 });
                }
            } else {
                // 如果解析器还没加载，每秒试一次，试到天荒地老（直到加载出来）
                retryCount++;
                console.log(`[PixelPet] 等待命令解析器... (${retryCount})`);
                setTimeout(registerCommand, 1000);
            }
        };

        // 立即开始尝试注册
        registerCommand();
    };

    $(document).ready(init);
})();