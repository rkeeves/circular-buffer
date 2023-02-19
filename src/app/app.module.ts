import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { CircularBufferComponent } from './circular-buffer/circular-buffer.component';

@NgModule({
  declarations: [
    AppComponent,
    CircularBufferComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
