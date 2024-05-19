function initSnip() {
    console.log("Init snip")
    let snipBox = null;
    let startX, startY;
    let screenshotUrl = null;


    document.body.style.cursor = 'crosshair';
    document.querySelectorAll('*').forEach(el => {
        el.style.cssText += 'cursor: crosshair !important;';
    });
    document.body.style.userSelect = 'none';

    function handleMouseMove(e) {
        if (!snipBox) return;

        let width = Math.abs(e.clientX - startX);
        let height = Math.abs(e.clientY - startY);
        let left = (e.clientX - startX < 0) ? e.clientX : startX;
        let top = (e.clientY - startY < 0) ? e.clientY : startY;

        snipBox.style.width = `${width}px`;
        snipBox.style.height = `${height}px`;
        snipBox.style.left = `${left}px`;
        snipBox.style.top = `${top}px`;
    }

    function cropImage(img, rect) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.src = img;
            image.onload = function () {
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
        console.log('Mouse up')
        if (!snipBox) return;
        const snipRect = {
            left: parseInt(snipBox.style.left),
            top: parseInt(snipBox.style.top),
            width: parseInt(snipBox.style.width),
            height: parseInt(snipBox.style.height)
        };
        document.body.removeChild(snipBox);

        chrome.runtime.sendMessage({message: 'capture', rect: snipRect}, async (response) => {
            if (response.imgSrc) {
                let screenshotUrl = await cropImage(response.imgSrc, snipRect);
                console.log(screenshotUrl)
                chrome.runtime.sendMessage({message: 'crop', img: screenshotUrl}, (response) => {
                    console.log(response)
                })
            }
        });

        snipBox = null;
        cleanupAfterSnip();

    }

    function handleMouseDown(e) {
        e.preventDefault()

        startX = e.clientX;
        startY = e.clientY;

        snipBox = document.createElement('div');
        snipBox.style.position = 'fixed';
        snipBox.style.left = `${startX}px`;
        snipBox.style.top = `${startY}px`;
        snipBox.style.width = '0';
        snipBox.style.height = '0';
        snipBox.style.border = '2px solid white';
        snipBox.style.backgroundColor = 'rgba(200,200,200,0.5)';
        snipBox.style.zIndex = '9999';
        snipBox.style.boxSizing = 'border-box';
        document.body.appendChild(snipBox);


    }

    function cleanupAfterSnip() {
        console.log('Cleanup after snip')
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = 'initial';
        document.querySelectorAll('*').forEach(el => {
            el.style.cssText = el.style.cssText.replace('cursor: crosshair !important;', '');
        });
    }

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
}

initSnip();
