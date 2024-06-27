import { NgOptimizedImage } from '@angular/common';
import { Component } from '@angular/core'

@Component({
  selector: 'app-hero-image',
  standalone: true,
  imports: [NgOptimizedImage],
  template: `
    <picture class="hero">
      <source media="(min-width:1440px)" srcset="/images/hero.jpg" />
      <source media="(min-width:768px)" srcset="/images/hero-low.jpg" />
      <img
        class="hero__img"
        ngSrc="/images/hero.jpg"
        alt="Decorative image for login page"
        fill="true"
        priority="true"
      />
    </picture>
  `,
  styles: `
  :host{
    position: relative;
    display: block;

    .hero {      
      position: absolute;      
      top:0;
      left: 0;
      width: 100%;
      height: 100%;

      display: block;

      &__img {
        height: 100%;
        width: 100%;
        object-fit: cover;
      }
    }
  }
    
  `
})
export class HeroImageComponent {
  
}
