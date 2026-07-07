import { Directive, ElementRef, inject, input, OnDestroy, OnInit } from '@angular/core';

@Directive({
  selector: '[appScrollReveal]',
  standalone: true,
})
export class ScrollRevealDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);

  readonly revealDelay = input(0);

  private observer?: IntersectionObserver;

  ngOnInit() {
    const node = this.el.nativeElement;
    node.classList.add('scroll-reveal');

    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        const delay = this.revealDelay();
        window.setTimeout(() => node.classList.add('scroll-reveal-visible'), delay);
        this.observer?.unobserve(node);
      },
      { threshold: 0.12, rootMargin: '0px 0px -48px 0px' }
    );
    this.observer.observe(node);
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }
}
