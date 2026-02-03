const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');

// My덤벙이 전용 아이콘 - 사랑스럽고 독특한 디자인
// 핑크/코랄 그라데이션 배경 + 두 개의 하트 (커플/연인 테마)
const iconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF6B9D"/>
      <stop offset="100%" style="stop-color:#FF8E72"/>
    </linearGradient>
    <linearGradient id="heartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#FFFFFF;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#FFFFFF;stop-opacity:0.85"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.2"/>
    </filter>
  </defs>
  <!-- 둥근 사각형 배경 -->
  <rect width="1024" height="1024" fill="url(#bgGrad)" rx="220" ry="220"/>
  <!-- 왼쪽 하트 (커다란 하트) -->
  <path d="M 340 380 
           C 340 300, 400 260, 460 300 
           C 512 330, 512 400, 512 400 
           C 512 400, 512 330, 564 300 
           C 624 260, 684 300, 684 380 
           C 684 480, 512 580, 512 580 
           C 512 580, 340 480, 340 380 Z" 
        fill="url(#heartGrad)" 
        filter="url(#shadow)"
        transform="translate(0, 0) scale(0.9) translate(60, 50)"/>
  <!-- 오른쪽 작은 하트 (겹쳐보이는 효과) -->
  <path d="M 580 480 
           C 580 440, 610 415, 645 435 
           C 670 448, 670 480, 670 480 
           C 670 480, 670 448, 695 435 
           C 730 415, 760 440, 760 480 
           C 760 530, 670 580, 670 580 
           C 670 580, 580 530, 580 480 Z" 
        fill="rgba(255,255,255,0.95)" 
        filter="url(#shadow)"
        transform="translate(0, 0) scale(0.55) translate(420, 320)"/>
</svg>
`;

async function generateIcons() {
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  try {
    // 아이콘 생성 (1024x1024) - Android/iOS 앱 아이콘
    await sharp(Buffer.from(iconSvg))
      .resize(1024, 1024)
      .png()
      .toFile(path.join(assetsDir, 'icon.png'));
    console.log('  ✓ icon.png (1024x1024)');

    // 스플래시 화면 (아이콘을 중앙에 배치한 큰 이미지)
    const splashSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="2048" height="2048" viewBox="0 0 2048 2048">
      <defs>
        <linearGradient id="bgGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#FF6B9D"/>
          <stop offset="100%" style="stop-color:#FF8E72"/>
        </linearGradient>
        <linearGradient id="heartGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#FFFFFF;stop-opacity:1"/>
          <stop offset="100%" style="stop-color:#FFFFFF;stop-opacity:0.85"/>
        </linearGradient>
        <filter id="shadow2" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="16" flood-opacity="0.25"/>
        </filter>
      </defs>
      <rect width="2048" height="2048" fill="url(#bgGrad2)" rx="100" ry="100"/>
      <g transform="translate(1024, 1024) scale(1.8) translate(-512, -512)">
        <path d="M 340 380 C 340 300, 400 260, 460 300 C 512 330, 512 400, 512 400 C 512 400, 512 330, 564 300 C 624 260, 684 300, 684 380 C 684 480, 512 580, 512 580 C 512 580, 340 480, 340 380 Z" fill="url(#heartGrad2)" filter="url(#shadow2)"/>
        <path d="M 580 480 C 580 440, 610 415, 645 435 C 670 448, 670 480, 670 480 C 670 480, 670 448, 695 435 C 730 415, 760 440, 760 480 C 760 530, 670 580, 670 580 C 670 580, 580 530, 580 480 Z" fill="rgba(255,255,255,0.95)" filter="url(#shadow2)" transform="scale(0.55) translate(420, 320)"/>
      </g>
    </svg>`;
    
    await sharp(Buffer.from(splashSvg))
      .resize(2048, 2048)
      .png()
      .toFile(path.join(assetsDir, 'splash.png'));
    console.log('  ✓ splash.png (2048x2048)');

    // Android adaptive icon (1024x1024) - 포그라운드 전용, 배경은 backgroundColor 사용
    await sharp(Buffer.from(iconSvg))
      .resize(1024, 1024)
      .png()
      .toFile(path.join(assetsDir, 'adaptive-icon.png'));
    console.log('  ✓ adaptive-icon.png (1024x1024)');

    console.log('\n✅ My덤벙이 아이콘 생성 완료!');
  } catch (error) {
    console.error('❌ 아이콘 생성 실패:', error);
    process.exit(1);
  }
}

generateIcons();
