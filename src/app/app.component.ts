import {Component, OnInit} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {MatButtonModule} from "@angular/material/button";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatButtonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit{
  title = 'lista-2024';

  ngOnInit() {
    const cssEl = document.getElementById('app-theme') as HTMLLinkElement
    setTimeout(() => {
        cssEl.href = 'theme-dark.css'
    },5000)

  }
}
