// Platform Game - Pure JavaScript with PROPERLY SIZED Sprite
        // Improved UI and Controls

        // Setup Canvas
        const canvas = document.getElementById('gameCanvas');
        canvas.width = 1000;
        canvas.height = 800;

        const ctx = canvas.getContext('2d');

        // UI Elements
        const pauseBtn = document.getElementById('pauseBtn');
        const restartBtn = document.getElementById('restartBtn');
        const pauseIcon = document.getElementById('pauseIcon');
        const pauseText = document.getElementById('pauseText');
        const gameStatus = document.getElementById('gameStatus');
        const gameInfo = document.getElementById('gameInfo');
        const pauseOverlay = document.getElementById('pauseOverlay');

        // Assets - Images
        const assets = {
            sky: null,
            ground: null,
            star: null,
            dude: null
        };

        // Loading status
        let assetsLoaded = false;
        let loadedCount = 0;
        const totalAssets = 4;

        // Game variables
        let score = 0;
        let gameRunning = false;
        let isPaused = false;
        let instructionStartTime = null;

        let gameOver = false;
        let gameOverTime = null;

        let enemies = [];

        // Player object - UKURAN DIPERBESAR AGAR TIDAK TERPOTONG
        const player = {
            x: 100,
            y: 400,
            width: 52,
            height: 64,
            velocityX: 0,
            velocityY: 0,
            onGround: false,
            speed: 170,
            jumpPower: 330,
            bounce: 0.2,
            currentFrame: 0,
            animationTimer: 0,
            facing: 'right'
        };

        // Platforms
        const platforms = [
            // Ground utama
            { x: 0, y: 730, width: 200, height: 70, type: 'ground' },
            { x: 200, y: 730, width: 200, height: 70, type: 'ground' },
            { x: 400, y: 730, width: 200, height: 70, type: 'ground' },
            { x: 600, y: 730, width: 200, height: 70, type: 'ground' },
            { x: 700, y: 730, width: 200, height: 70, type: 'ground' },
            { x: 800, y: 730, width: 200, height: 70, type: 'ground' },
            
            // Platform melayang
            { x: 150, y: 450, width: 120, height: 60, type: 'platform' },
            { x: 350, y: 350, width: 120, height: 60, type: 'platform' },
            { x: 350, y: 550, width: 120, height: 60, type: 'platform' },
            { x: 550, y: 250, width: 120, height: 60, type: 'platform' },
            { x: 650, y: 550, width: 120, height: 60, type: 'platform' },
            { x: 850, y: 200, width: 120, height: 60, type: 'platform' },
            { x: 50, y: 200, width: 120, height: 60, type: 'platform' }
        ];

        // Stars array
        let stars = [];

        // Input handling
        const keys = {};
        document.addEventListener('keydown', (e) => {
            keys[e.code] = true;
            
            // Space bar untuk pause/resume
            if (e.code === 'Space' && gameRunning) {
                e.preventDefault();
                togglePause();
            }
        });

        document.addEventListener('keyup', (e) => {
            keys[e.code] = false;
        });

        // Physics constants
        const gravity = 300;
        const deltaTime = 1/60;

        // UI Functions
        function updateGameStatus() {
            if (!assetsLoaded) {
                gameStatus.textContent = 'Loading Assets...';
                gameInfo.textContent = `Loading: ${loadedCount}/${totalAssets}`;
            } else if (gameOver) {
                gameStatus.textContent = '💀 GAME OVER!';
                gameInfo.textContent = 'Click Restart to play again | Press R to restart';
            } else if (isPaused) {
                gameStatus.textContent = 'Game Paused';
                gameInfo.textContent = `Score: ${score} | Press SPACE or click Resume`;
            } else if (gameRunning) {
                gameStatus.textContent = `Score: ${score}`;
                gameInfo.textContent = 'Use ← → to move, ↑ to jump | Collect all stars!';
            } else {
                gameStatus.textContent = 'Ready to Play!';
                gameInfo.textContent = 'Game will start once assets are loaded...';
            }
        }

        function togglePause() {
            if (!gameRunning || !assetsLoaded) return;
            
            isPaused = !isPaused;
            
            if (isPaused) {
                pauseIcon.textContent = '▶️';
                pauseText.textContent = 'Resume';
                pauseBtn.classList.add('paused');
                pauseOverlay.classList.add('active');
            } else {
                pauseIcon.textContent = '⏸️';
                pauseText.textContent = 'Pause';
                pauseBtn.classList.remove('paused');
                pauseOverlay.classList.remove('active');
            }
            
            updateGameStatus();
        }

        function restartGame() {
            // Reset game state
            score = 0;
            isPaused = false;
            gameOver = false;
            gameOverTime = null;
            instructionStartTime = null;
            
            // Reset player
            player.x = 100;
            player.y = 400;
            player.velocityX = 0;
            player.velocityY = 0;
            player.onGround = false;
            player.currentFrame = 0;
            player.animationTimer = 0;
            player.facing = 'right';
            
            // Reset UI
            pauseIcon.textContent = '⏸️';
            pauseText.textContent = 'Pause';
            pauseBtn.classList.remove('paused');
            pauseOverlay.classList.remove('active');
            
            // Recreate stars and enemies
            createStars();
            createEnemies();
            
            // Restart game
            gameRunning = true;
            
            updateGameStatus();
            
            console.log('Game restarted!');
        }

        // Event Listeners
        pauseBtn.addEventListener('click', togglePause);
        restartBtn.addEventListener('click', restartGame);

        document.addEventListener('keydown', (e) => {
            keys[e.code] = true;
            
            // Space bar untuk pause/resume
            if (e.code === 'Space' && gameRunning && !gameOver) {
                e.preventDefault();
                togglePause();
            }
            
            // R key untuk restart saat game over
            if (e.code === 'KeyR' && gameOver) {
                e.preventDefault();
                restartGame();
            }
        });

        function triggerGameOver() {
            gameOver = true;
            gameRunning = false;
            gameOverTime = performance.now();
            
            // Stop player movement
            player.velocityX = 0;
            player.velocityY = 0;
            
            updateGameStatus();
            
            console.log('Game Over! Press R to restart.');
        }

        // Asset loading function
        function loadAssets() {
            console.log('Loading assets...');
            updateGameStatus();
            
            // Load sky background
            assets.sky = new Image();
            assets.sky.onload = () => {
                loadedCount++;
                updateGameStatus();
                checkAllAssetsLoaded();
            };
            assets.sky.onerror = () => {
                console.log('Sky asset not found, using fallback');
                loadedCount++;
                updateGameStatus();
                checkAllAssetsLoaded();
            };
            assets.sky.src = 'assets/sky.png';

            // Load ground/platform
            assets.ground = new Image();
            assets.ground.onload = () => {
                loadedCount++;
                updateGameStatus();
                checkAllAssetsLoaded();
            };
            assets.ground.onerror = () => {
                console.log('Ground asset not found, using fallback');
                loadedCount++;
                updateGameStatus();
                checkAllAssetsLoaded();
            };
            assets.ground.src = 'assets/platform.png';

            // Load star
            assets.star = new Image();
            assets.star.onload = () => {
                loadedCount++;
                updateGameStatus();
                checkAllAssetsLoaded();
            };
            assets.star.onerror = () => {
                console.log('Star asset not found, using fallback');
                loadedCount++;
                updateGameStatus();
                checkAllAssetsLoaded();
            };
            assets.star.src = 'assets/star.png';

            // Load player sprite - DENGAN DETEKSI OTOMATIS UKURAN
            assets.dude = new Image();
            assets.dude.onload = () => {
                loadedCount++;
                console.log('Dude sprite loaded - Actual size:', assets.dude.width, 'x', assets.dude.height);
                
                // Deteksi otomatis ukuran frame berdasarkan sprite sheet
                const detectedFrameWidth = assets.dude.width / 9; // Asumsi 9 frame horizontal
                const detectedFrameHeight = assets.dude.height; // Asumsi 1 baris
                
                console.log('Auto-detected frame size:', detectedFrameWidth, 'x', detectedFrameHeight);
                console.log('Player will be scaled to fit properly');
                
                updateGameStatus();
                checkAllAssetsLoaded();
            };
            assets.dude.onerror = () => {
                console.log('Dude asset not found, using fallback');
                loadedCount++;
                updateGameStatus();
                checkAllAssetsLoaded();
            };
            assets.dude.src = 'assets/dude.png';
        }

        function checkAllAssetsLoaded() {
            if (loadedCount >= totalAssets) {
                assetsLoaded = true;
                gameRunning = true;
                console.log('All assets loaded, starting game...');
                updateGameStatus();
                init();
            }
        }

        // Initialize stars
        function createStars() {
            stars = [];
            for (let i = 0; i < 15; i++) {
                stars.push({
                    x: 12 + i * 65,
                    y: 0,
                    width: 50,
                    height: 37,
                    velocityY: 0,
                    collected: false,
                    bounce: Math.random() * 0.4 + 0.4
                });
            }
        }

        // Collision detection
        function isColliding(rect1, rect2) {
            return rect1.x < rect2.x + rect2.width &&
                   rect1.x + rect1.width > rect2.x &&
                   rect1.y < rect2.y + rect2.height &&
                   rect1.y + rect1.height > rect2.y;
        }

        // Update player with fixed animations
        function updatePlayer() {
            // Input dan animasi
            if (keys['ArrowLeft']) {
                player.velocityX = -player.speed;
                player.facing = 'left';
                player.animationTimer++;
                if (player.animationTimer > 8) {
                    player.currentFrame = (player.currentFrame + 1) % 4;
                    player.animationTimer = 0;
                }
            } else if (keys['ArrowRight']) {
                player.velocityX = player.speed;
                player.facing = 'right';
                player.animationTimer++;
                if (player.animationTimer > 8) {
                    player.currentFrame = (player.currentFrame + 1) % 4;
                    player.animationTimer = 0;
                }
            } else {
                player.velocityX = 0;
                player.currentFrame = 0;
                player.animationTimer = 0;
            }

            if (keys['ArrowUp'] && player.onGround) {
                player.velocityY = -player.jumpPower;
                player.onGround = false;
            }

            // Fisika
            player.velocityY += gravity * deltaTime;

            // Update posisi
            player.x += player.velocityX * deltaTime;
            player.y += player.velocityY * deltaTime;

            // Batas kiri-kanan
            if (player.x < 0) {
                player.x = 0;
                player.velocityX = 0;
            }
            if (player.x + player.width > canvas.width) {
                player.x = canvas.width - player.width;
                player.velocityX = 0;
            }

            // Batas atas (penting!)
            if (player.y < 0) {
                player.y = 0;
                player.velocityY = 0;
            }

            // Collision dengan platform
            player.onGround = false;
            for (let platform of platforms) {
                if (isColliding(player, platform)) {
                    if (player.velocityY > 0 && player.y < platform.y) {
                        player.y = platform.y - player.height;
                        player.velocityY = -player.velocityY * player.bounce;
                        player.onGround = true;
                    }
                }
            }

            // Batas bawah
            if (player.y + player.height > canvas.height) {
                player.y = canvas.height - player.height;
                player.velocityY = 0;
                player.onGround = true;
            }
        }

        // Update stars
        function updateStars() {
            for (let star of stars) {
                if (!star.collected) {
                    star.velocityY += gravity * deltaTime * 0.5;
                    star.y += star.velocityY * deltaTime;

                    for (let platform of platforms) {
                        if (isColliding(star, platform) && star.velocityY > 0) {
                            star.y = platform.y - star.height;
                            star.velocityY = -star.velocityY * star.bounce;
                        }
                    }

                    if (star.y + star.height > canvas.height) {
                        star.y = canvas.height - star.height;
                        star.velocityY = -star.velocityY * star.bounce;
                    }

                    if (isColliding(player, star)) {
                        collectStar(star);
                    }
                }
            }
        }

        function collectStar(star) {
            star.collected = true;
            score += 10;
            updateGameStatus();
            
            let activeStars = stars.filter(s => !s.collected).length;
            if (activeStars === 0) {
                stars.forEach(function(star) {
                    star.collected = false;
                    star.y = 0;
                    star.velocityY = 0;
                });
            }
        }

        // Drawing functions
        function drawBackground() {
            if (assets.sky && assets.sky.complete && assets.sky.naturalHeight !== 0) {
                ctx.drawImage(assets.sky, 0, 0, canvas.width, canvas.height);
            } else {
                // Fallback gradient background
                const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, '#87CEEB');
                gradient.addColorStop(0.7, '#98FB98');
                gradient.addColorStop(1, '#228B22');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }

        function drawPlatforms() {
            for (let platform of platforms) {
                if (assets.ground && assets.ground.complete && assets.ground.naturalHeight !== 0) {
                    ctx.drawImage(assets.ground, 
                        platform.x, platform.y, 
                        platform.width, platform.height);
                } else {
                    // Fallback platform
                    if (platform.type === 'ground') {
                        ctx.fillStyle = '#8B4513';
                        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                        ctx.fillStyle = '#228B22';
                        ctx.fillRect(platform.x, platform.y, platform.width, 8);
                        ctx.strokeStyle = '#654321';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
                    } else {
                        ctx.fillStyle = '#CD853F';
                        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                        ctx.fillStyle = '#32CD32';
                        ctx.fillRect(platform.x, platform.y, platform.width, 6);
                        ctx.strokeStyle = '#8B7355';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
                    }
                }
            }
        }

        // FUNGSI DRAW PLAYER DENGAN UKURAN YANG BENAR
        function drawPlayer() {
            if (assets.dude && assets.dude.complete && assets.dude.naturalHeight !== 0) {
                // DETEKSI OTOMATIS UKURAN FRAME DARI SPRITE SHEET
                const spriteWidth = assets.dude.width;
                const spriteHeight = assets.dude.height;
                
                // Asumsi format sprite sheet standar (9 frame horizontal untuk dude.png)
                const totalFrames = 9;
                const frameWidth = Math.floor(spriteWidth / totalFrames);
                const frameHeight = spriteHeight;
                
                let frameX = 0;
                let frameY = 0;
                
                // Logika frame yang diperbaiki
                if (player.velocityX === 0) {
                    // Idle frame (frame 4 biasanya untuk idle di sprite dude.png)
                    frameX = 4 * frameWidth;
                    frameY = 0;
                } else {
                    // Walking animation
                    if (player.facing === 'left') {
                        // Frame 0-3 untuk animasi kiri
                        frameX = player.currentFrame * frameWidth;
                        frameY = 0;
                    } else {
                        // Frame 5-8 untuk animasi kanan
                        frameX = (5 + player.currentFrame) * frameWidth;
                        frameY = 0;
                    }
                }
                
                // Pastikan tidak keluar batas
                if (frameX >= spriteWidth) {
                    frameX = 4 * frameWidth; // Default ke idle frame
                }
                
                try {
                    // Gambar sprite dengan ukuran yang diperbesar dan proporsional
                    ctx.drawImage(
                        assets.dude,
                        frameX, frameY,
                        frameWidth, frameHeight,
                        player.x, player.y,
                        player.width, player.height
                    );
                    
                } catch (error) {
                    console.error('Error drawing sprite:', error);
                    drawFallbackPlayer();
                }
            } else {
                drawFallbackPlayer();
            }
        }

        // Fungsi fallback untuk player yang lebih detail dan menarik
        function drawFallbackPlayer() {
            const x = player.x;
            const y = player.y;
            const w = player.width;
            const h = player.height;
            
            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.ellipse(x + w/2, y + h + 2, w/2, 6, 0, 0, 2 * Math.PI);
            ctx.fill();
            
            // Animasi bounce untuk kaki
            const bounce = player.onGround ? 0 : Math.sin(Date.now() * 0.01) * 2;
            const walkBounce = (player.velocityX !== 0 && player.onGround) ? Math.sin(Date.now() * 0.02) * 1 : 0;
            
            // Kaki
            ctx.fillStyle = '#2B2B2B';
            ctx.fillRect(x + 10, y + h - 16 + bounce, 8, 16);
            ctx.fillRect(x + w - 18, y + h - 16 + bounce + walkBounce, 8, 16);
            
            // Sepatu
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(x + 8, y + h - 6 + bounce, 12, 6);
            ctx.fillRect(x + w - 20, y + h - 6 + bounce + walkBounce, 12, 6);
            
            // Body utama (baju)
            ctx.fillStyle = '#FF4444';
            ctx.roundRect(x + 4, y + 24, w - 8, 28, 4);
            ctx.fill();
            
            // Detail baju (garis-garis)
            ctx.fillStyle = '#CC3333';
            ctx.fillRect(x + 6, y + 28, w - 12, 2);
            ctx.fillRect(x + 6, y + 36, w - 12, 2);
            ctx.fillRect(x + 6, y + 44, w - 12, 2);
            
            // Lengan
            ctx.fillStyle = '#FFE4B5';
            // Lengan kiri
            const leftArmSwing = (player.velocityX !== 0) ? Math.sin(Date.now() * 0.015) * 3 : 0;
            ctx.save();
            ctx.translate(x + 8, y + 30);
            ctx.rotate(leftArmSwing * 0.1);
            ctx.fillRect(-4, 0, 8, 18);
            ctx.restore();
            
            // Lengan kanan  
            const rightArmSwing = (player.velocityX !== 0) ? -Math.sin(Date.now() * 0.015) * 3 : 0;
            ctx.save();
            ctx.translate(x + w - 8, y + 30);
            ctx.rotate(rightArmSwing * 0.1);
            ctx.fillRect(-4, 0, 8, 18);
            ctx.restore();
            
            // Tangan
            ctx.fillStyle = '#FFE4B5';
            ctx.beginPath();
            ctx.arc(x + 8 + leftArmSwing, y + 48, 5, 0, 2 * Math.PI);
            ctx.arc(x + w - 8 + rightArmSwing, y + 48, 5, 0, 2 * Math.PI);
            ctx.fill();
            
            // Kepala
            ctx.fillStyle = '#FFE4B5';
            ctx.beginPath();
            ctx.arc(x + w/2, y + 16, 14, 0, 2 * Math.PI);
            ctx.fill();
            
            // Rambut
            ctx.fillStyle = '#8B4513';
            ctx.beginPath();
            ctx.arc(x + w/2, y + 12, 16, Math.PI, 2 * Math.PI);
            ctx.fill();
            
            // Detail rambut
            ctx.fillStyle = '#654321';
            for (let i = 0; i < 5; i++) {
                const hairX = x + w/2 - 12 + i * 6;
                ctx.fillRect(hairX, y + 6, 2, 8);
            }
            
            // Mata
            ctx.fillStyle = '#FFF';
            if (player.facing === 'left') {
                ctx.fillRect(x + 14, y + 14, 6, 4);
                ctx.fillRect(x + 22, y + 14, 6, 4);
                // Pupil
                ctx.fillStyle = '#000';
                ctx.fillRect(x + 15, y + 15, 3, 2);
                ctx.fillRect(x + 23, y + 15, 3, 2);
            } else {
                ctx.fillRect(x + w - 28, y + 14, 6, 4);
                ctx.fillRect(x + w - 20, y + 14, 6, 4);
                // Pupil
                ctx.fillStyle = '#000';
                ctx.fillRect(x + w - 26, y + 15, 3, 2);
                ctx.fillRect(x + w - 18, y + 15, 3, 2);
            }
            
            // Hidung
            ctx.fillStyle = '#FFB6C1';
            ctx.fillRect(x + w/2 - 1, y + 18, 2, 2);
            
            // Mulut (senyum saat bergerak)
            ctx.fillStyle = '#000';
            if (player.velocityX !== 0) {
                // Senyum
                ctx.beginPath();
                ctx.arc(x + w/2, y + 21, 3, 0, Math.PI);
                ctx.stroke();
            } else {
                // Netral
                ctx.fillRect(x + w/2 - 2, y + 22, 4, 1);
            }
            
            // Efek gerakan (motion lines)
            if (Math.abs(player.velocityX) > 50) {
                ctx.strokeStyle = 'rgba(255,255,255,0.6)';
                ctx.lineWidth = 2;
                for (let i = 0; i < 3; i++) {
                    const lineX = player.facing === 'right' ? x - 10 - i * 8 : x + w + 10 + i * 8;
                    ctx.beginPath();
                    ctx.moveTo(lineX, y + 20 + i * 8);
                    ctx.lineTo(lineX - (player.facing === 'right' ? 6 : -6), y + 26 + i * 8);
                    ctx.stroke();
                }
            }
        }
        function drawStars() {
            for (let star of stars) {
                if (!star.collected) {
                    if (assets.star && assets.star.complete && assets.star.naturalHeight !== 0) {
                        ctx.drawImage(assets.star, star.x, star.y, star.width, star.height);
                    } else {
                        // Fallback star
                        ctx.fillStyle = '#FFD700';
                        ctx.beginPath();
                        let centerX = star.x + star.width / 2;
                        let centerY = star.y + star.height / 2;
                        let radius = star.width / 3;
                        
                        for (let i = 0; i < 5; i++) {
                            let angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                            let x = centerX + Math.cos(angle) * radius;
                            let y = centerY + Math.sin(angle) * radius;
                            if (i === 0) ctx.moveTo(x, y);
                            else ctx.lineTo(x, y);
                        }
                        
                        ctx.closePath();
                        ctx.fill();
                        ctx.strokeStyle = '#FFA500';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            }
        }

        function drawScore() {
            ctx.fillStyle = '#000';
            ctx.font = '32px Arial';
            ctx.fillText('Score: ' + score, 16, 48);
            
            ctx.fillStyle = '#FFF';
            ctx.fillText('Score: ' + score, 14, 46);
        }

        function drawLoadingScreen() {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#FFF';
            ctx.font = '32px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Loading Assets...', canvas.width / 2, canvas.height / 2);
            
            const barWidth = 200;
            const barHeight = 20;
            const barX = (canvas.width - barWidth) / 2;
            const barY = canvas.height / 2 + 50;
            
            ctx.strokeStyle = '#FFF';
            ctx.strokeRect(barX, barY, barWidth, barHeight);
            
            ctx.fillStyle = '#0F0';
            const progress = loadedCount / totalAssets;
            ctx.fillRect(barX, barY, barWidth * progress, barHeight);
            
            ctx.textAlign = 'left';
        }

        function drawInstructions() {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillRect(canvas.width - 240, 10, 220, 160);

            ctx.fillStyle = '#000';
            ctx.font = '14px Arial';
            ctx.fillText('← → : Bergerak', canvas.width - 230, 30);
            ctx.fillText('↑ : Melompat', canvas.width - 230, 50);
            ctx.fillText('SPACE : Pause/Resume', canvas.width - 230, 70);
            ctx.fillText('⭐ : Kumpulkan bintang!', canvas.width - 230, 90);
            ctx.fillText('', canvas.width - 230, 110);
            ctx.fillText('Sprite Info:', canvas.width - 230, 130);
            ctx.fillText(`Player: ${player.width}x${player.height}`, canvas.width - 230, 150);
        }

        function createEnemies() {
            enemies = [
                {
                    x: 300,
                    y: 670,
                    width: 48,
                    height: 64,
                    velocityX: 60,
                    direction: 1, // 1 untuk kanan, -1 untuk kiri
                    patrolDistance: 200,
                    startX: 300,
                    type: 'ground'
                },
                {
                    x: 600,
                    y: 200,
                    width: 48,
                    height: 64,
                    velocityX: 80,
                    direction: -1,
                    patrolDistance: 150,
                    startX: 600,
                    type: 'flying'
                }
            ];
        }

        // [Kode yang sama sampai fungsi updatePlayer()]

        // Fungsi untuk update musuh
        function updateEnemies() {
            for (let enemy of enemies) {
                // Gerakan patroli untuk musuh darat
                if (enemy.type === 'ground') {
                    enemy.x += enemy.velocityX * deltaTime * enemy.direction;
                    
                    // Balik arah jika mencapai batas patroli
                    if (Math.abs(enemy.x - enemy.startX) > enemy.patrolDistance) {
                        enemy.direction *= -1;
                    }
                    
                    // Terapkan gravitasi untuk musuh darat
                    enemy.velocityY += gravity * deltaTime;
                    enemy.y += enemy.velocityY * deltaTime;
                    
                    // Deteksi tabrakan dengan platform
                    for (let platform of platforms) {
                        if (isColliding(enemy, platform) && enemy.velocityY > 0) {
                            enemy.y = platform.y - enemy.height;
                            enemy.velocityY = 0;
                        }
                    }
                }
                
                // Gerakan untuk musuh terbang
                if (enemy.type === 'flying') {
                    enemy.x += enemy.velocityX * deltaTime * enemy.direction;
                    
                    // Balik arah jika mencapai batas patroli
                    if (Math.abs(enemy.x - enemy.startX) > enemy.patrolDistance) {
                        enemy.direction *= -1;
                    }
                    
                    // Gerakan vertikal sinusoidal untuk musuh terbang
                    enemy.y += Math.sin(Date.now() * 0.003) * 0.5;
                }
                
                // Deteksi tabrakan dengan player
                if (isColliding(player, enemy)) {
                    // Jika player menyerang dari atas (sedang jatuh)
                    if (player.velocityY > 0 && player.y + player.height < enemy.y + enemy.height/2) {
                        // Musuh dikalahkan
                        const index = enemies.indexOf(enemy);
                        if (index > -1) {
                            enemies.splice(index, 1);
                            player.velocityY = -player.jumpPower * 0.7; // Pantulan kecil
                            score += 50; // Bonus score untuk mengalahkan musuh
                            updateGameStatus();
                        }
                    } else {
                        // Player terkena musuh - GAME OVER
                        triggerGameOver();
                        return; // Keluar dari loop
                    }
                }
            }
        }

        // [Kode yang sama sampai fungsi drawPlayer()]

        // Fungsi untuk menggambar musuh
        function drawEnemies() {
            for (let enemy of enemies) {
                // Warna berbeda berdasarkan jenis musuh
                if (enemy.type === 'ground') {
                    ctx.fillStyle = '#8B0000'; // Merah tua untuk musuh darat
                } else {
                    ctx.fillStyle = '#4B0082'; // Ungu untuk musuh terbang
                }
                
                // Badan musuh
                ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
                
                // Mata musuh (menghadap sesuai arah gerakan)
                ctx.fillStyle = '#FFF';
                if (enemy.direction > 0) { // Menghadap kanan
                    ctx.fillRect(enemy.x + enemy.width - 15, enemy.y + 15, 8, 8);
                    ctx.fillRect(enemy.x + enemy.width - 30, enemy.y + 15, 8, 8);
                } else { // Menghadap kiri
                    ctx.fillRect(enemy.x + 7, enemy.y + 15, 8, 8);
                    ctx.fillRect(enemy.x + 22, enemy.y + 15, 8, 8);
                }
                
                // Mulut musuh
                ctx.fillStyle = '#000';
                ctx.fillRect(enemy.x + enemy.width/2 - 5, enemy.y + 35, 10, 3);
            }
        }

        function drawGameOverScreen() {
            // Overlay gelap
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Game Over text dengan efek
            const time = performance.now() - gameOverTime;
            const pulse = 1 + Math.sin(time * 0.005) * 0.1;
            
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2 - 100);
            ctx.scale(pulse, pulse);
            
            // Shadow
            ctx.fillStyle = '#000';
            ctx.font = 'bold 64px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', 3, 3);
            
            // Main text
            ctx.fillStyle = '#FF0000';
            ctx.fillText('GAME OVER', 0, 0);
            
            ctx.restore();
            
            // Score
            ctx.fillStyle = '#FFF';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 - 20);
            
            // Instructions
            ctx.font = '18px Arial';
            ctx.fillText('Press R to Restart or Click Restart Button', canvas.width / 2, canvas.height / 2 + 20);
            
            // Skull emoji animation
            const skullBounce = Math.sin(time * 0.008) * 10;
            ctx.font = '48px Arial';
            ctx.fillText('💀', canvas.width / 2, canvas.height / 2 + 80 + skullBounce);
            
            ctx.textAlign = 'left';
        }


        function gameLoop() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (!instructionStartTime) {
                instructionStartTime = performance.now();
            }

            if (!assetsLoaded) {
                drawLoadingScreen();
                requestAnimationFrame(gameLoop);
                return;
            }

            // Draw game background dan objects
            drawBackground();
            drawPlatforms();
            drawStars();
            drawPlayer();
            drawEnemies();
            drawScore();

            // Update game hanya jika tidak paused dan tidak game over
            if (gameRunning && !isPaused && !gameOver) {
                updatePlayer();
                updateStars();
                updateEnemies();
                
                // Tampilkan instruksi hanya selama 8 detik pertama
                if (performance.now() - instructionStartTime < 8000) {
                    drawInstructions();
                }
            }

            // Draw overlays
            if (gameOver) {
                drawGameOverScreen();
            }

            requestAnimationFrame(gameLoop);
        }

        function init() {
            createStars();
            createEnemies();
            updateGameStatus();
            console.log('Game initialized with improved UI controls!');
        }
// Start loading
console.log('=== PLATFORM GAME - FIXED SPRITE SIZE ===');
console.log('');
console.log('PERBAIKAN UKURAN SPRITE:');
console.log('1. ✅ Player size: 48x64 (diperbesar dari 32x48)');
console.log('2. ✅ Auto-detection untuk ukuran frame sprite sheet');
console.log('3. ✅ Proper scaling untuk sprite rendering');
console.log('4. ✅ Fallback player yang lebih besar dan detail');
console.log('5. ✅ Debug info untuk tracking ukuran');
console.log('');
console.log('SPRITE COMPATIBILITY:');
console.log('- Mendukung sprite sheet format standar dude.png (9 frames)');
console.log('- Auto-detect ukuran frame berdasarkan total width');
console.log('- Frame 0-3: Walking left');
console.log('- Frame 4: Idle/standing');
console.log('- Frame 5-8: Walking right');
console.log('');
console.log('KONTROL:');
console.log('- ← → : Bergerak kiri/kanan');
console.log('- ↑ : Melompat');
console.log('- Kumpulkan semua bintang!');

loadAssets();
gameLoop();