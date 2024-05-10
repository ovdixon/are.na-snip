function initSnip() {
    document.body.style.cursor = 'crosshair';
    document.querySelectorAll('*').forEach(el => {
        el.style.cssText += 'cursor: crosshair !important;';
    });
    document.body.style.userSelect = 'none';

    let snipBox = null;
    let startX, startY;

    document.addEventListener('mousedown', (e) => {
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
    });

    document.addEventListener('mousemove', (e) => {
        if (!snipBox) return;

        let width = Math.abs(e.clientX - startX);
        let height = Math.abs(e.clientY - startY);
        let left = (e.clientX - startX < 0) ? e.clientX : startX;
        let top = (e.clientY - startY < 0) ? e.clientY : startY;

        snipBox.style.width = `${width}px`;
        snipBox.style.height = `${height}px`;
        snipBox.style.left = `${left}px`;
        snipBox.style.top = `${top}px`;
    });

    document.addEventListener('mouseup', () => {
        if (snipBox) {
            chrome.runtime.sendMessage('capture', (response) => {
                if (response.screenshotUrl) {
                    console.log('Screenshot URL:', response.screenshotUrl);
                }
            });

            document.body.removeChild(snipBox);
            snipBox = null;
            document.body.style.userSelect = '';
            document.body.style.cursor = 'initial'
            document.querySelectorAll('*').forEach(el => {
                el.style.cssText = el.style.cssText.replace('cursor: crosshair !important;', 'cursor: initial !important;');
            });
        }
    });
}


initSnip();
