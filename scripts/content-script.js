(function() {
    let startX, startY, endX, endY;
    let selectionDiv = null;
    let dimDiv = null;

    // Immediately enable selection upon script injection
    enableSelection();

    function enableSelection() {
        document.body.style.userSelect = 'none'; // Disable text selection

        // Create and append the dimming div
        dimDiv = document.createElement('div');
        dimDiv.style.position = 'fixed';
        dimDiv.style.top = '0';
        dimDiv.style.left = '0';
        dimDiv.style.width = '100%';
        dimDiv.style.height = '100%';
        dimDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Semi-transparent black
        dimDiv.style.zIndex = '9998'; // Below the selectionDiv
        document.body.appendChild(dimDiv);

        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mouseup', handleMouseUp);
    }

    function handleMouseDown(event) {
        startX = event.clientX;
        startY = event.clientY;

        selectionDiv = document.createElement('div');
        selectionDiv.style.position = 'absolute';
        selectionDiv.style.border = '2px dashed red';
        selectionDiv.style.zIndex = '9999'; // Above the dimDiv
        selectionDiv.style.left = `${startX}px`;
        selectionDiv.style.top = `${startY}px`;

        document.body.appendChild(selectionDiv);

        document.addEventListener('mousemove', handleMouseMove);
    }

    function handleMouseMove(event) {
        endX = event.clientX;
        endY = event.clientY;

        const width = Math.abs(endX - startX);
        const height = Math.abs(endY - startY);

        // Adjust position if dragging left/upward
        selectionDiv.style.left = `${Math.min(startX, endX)}px`;
        selectionDiv.style.top = `${Math.min(startY, endY)}px`;

        selectionDiv.style.width = `${width}px`;
        selectionDiv.style.height = `${height}px`;
    }

    function handleMouseUp() {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mouseup', handleMouseUp);

        // Notify background script of the selected area
        chrome.runtime.sendMessage({
            action: 'capture',
            selection: {
                x: Math.min(startX, endX),
                y: Math.min(startY, endY),
                width: Math.abs(endX - startX),
                height: Math.abs(endY - startY)
            }
        });

        // Clean up
        document.body.style.userSelect = '';
        if (selectionDiv) {
            selectionDiv.remove();
        }
        if (dimDiv) {
            dimDiv.remove();
        }
    }

    // Rest of your content.js code
})();
