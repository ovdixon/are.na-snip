function initSnip() {
    let startX, startY, endX, endY;
    let snipOverlay = null;
    let isDragging = false;

    document.body.style.cursor = 'crosshair';
    document.body.style.userSelect = 'none';

    snipOverlay = document.createElement('div');
    snipOverlay.style.position = 'fixed';
    snipOverlay.style.left = '0';
    snipOverlay.style.top = '0';
    snipOverlay.style.width = '100vw';
    snipOverlay.style.height = '100vh';
    snipOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    snipOverlay.style.zIndex = '9998';
    document.body.appendChild(snipOverlay);

    function updateClipPath() {
        let width = Math.abs(endX - startX);
        let height = Math.abs(endY - startY);
        let left = Math.min(startX, endX);
        let top = Math.min(startY, endY);

        snipOverlay.style.clipPath = `polygon(
            0 0, 0 100vh, ${left}px 100vh, ${left}px ${top}px,
            ${left + width}px ${top}px, ${left + width}px ${top + height}px,
            ${left}px ${top + height}px, ${left}px 100vh,
            100vw 100vh, 100vw 0
        )`;
    }

    function handleMouseMove(e) {
        if (!isDragging) return;

        endX = e.clientX;
        endY = e.clientY;

        updateClipPath();
    }

    function handleMouseDown(e) {
        e.preventDefault();
        startX = e.clientX;
        startY = e.clientY;
        isDragging = true;
    }

    function cropImage(img, rect) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.src = img;
            image.onload = function() {
                const canvas = document.createElement("canvas");
                const scale = window.devicePixelRatio;

                canvas.width = rect.width * scale;
                canvas.height = rect.height * scale;
                const ctx = canvas.getContext("2d");

                ctx.drawImage(
                    image,
                    rect.left * scale,
                    rect.top * scale,
                    rect.width * scale,
                    rect.height * scale,
                    0,
                    0,
                    rect.width * scale,
                    rect.height * scale
                );

                const croppedImage = canvas.toDataURL();
                resolve(croppedImage);
            };
            image.onerror = reject;
        });
    }

    function handleMouseUp() {
        if (!isDragging) return;
        

        const snipRect = {
            left: Math.min(startX, endX),
            top: Math.min(startY, endY),
            width: Math.abs(endX - startX),
            height: Math.abs(endY - startY)
        };

        isDragging = false;
        document.removeEventListener('mousemove', handleMouseMove);
        cleanupAfterSnip();

        chrome.runtime.sendMessage({message: 'capture', rect: snipRect}, async (response) => {
            if (response.imgSrc) {
                let screenshotUrl = await cropImage(response.imgSrc, snipRect);
                chrome.runtime.sendMessage({message: 'crop', img: screenshotUrl}, (response) => {
                    console.log(response);
                });
            }
        });
    }

    function cleanupAfterSnip() {
        if (snipOverlay) {
            document.body.removeChild(snipOverlay);
            snipOverlay = null;
        }
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';

        document.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mousemove', handleMouseMove);
    }

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);

}

initSnip();
