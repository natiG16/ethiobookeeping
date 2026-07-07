let lockCount = 0;
let savedScrollY = 0;

/** Prevent background scroll while a modal is open (incl. mobile Safari). */
export function lockBodyScroll(doc: Document): void {
  if (lockCount === 0) {
    savedScrollY = window.scrollY;
    doc.body.classList.add('modal-scroll-lock');
    doc.body.style.top = `-${savedScrollY}px`;
  }
  lockCount += 1;
}

export function unlockBodyScroll(doc: Document): void {
  if (lockCount <= 0) {
    return;
  }
  lockCount -= 1;
  if (lockCount > 0) {
    return;
  }
  doc.body.classList.remove('modal-scroll-lock');
  doc.body.style.top = '';
  window.scrollTo(0, savedScrollY);
}
