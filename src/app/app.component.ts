import {Component, HostListener} from "@angular/core";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent {

  greetingMessage = "";

  @HostListener('document:contextmenu', ['$event'])
  documentClick(event: MouseEvent){    
    event.preventDefault();
  }
}
