// JavaScript to make the .crypto-widget draggable
const widget = document.querySelector('.crypto-widget');

let isDragging = false;
let offsetX = 0;
let offsetY = 0;

widget.addEventListener('mousedown', (e) => {
  // Only start dragging if mouse button is pressed
  isDragging = true;
  
  // Calculate the initial offset of the mouse
  offsetX = e.clientX - widget.getBoundingClientRect().left;
  offsetY = e.clientY - widget.getBoundingClientRect().top;

  // Disable text selection while dragging
  document.body.style.userSelect = 'none';
});

document.addEventListener('mousemove', (e) => {
  if (isDragging) {
    // Move the widget to the new mouse position
    widget.style.left = `${e.clientX - offsetX}px`;
    widget.style.top = `${e.clientY - offsetY}px`;
  }
});

document.addEventListener('mouseup', () => {
  isDragging = false;
  document.body.style.userSelect = ''; // Re-enable text selection
});
