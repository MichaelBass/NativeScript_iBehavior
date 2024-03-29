import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core'
import { NativeScriptModule, NativeScriptFormsModule } from '@nativescript/angular'


import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'

import { ItemsComponent } from './forms/items.component'
import { ItemDetailComponent } from './formdetails/item-detail.component'
import { ItemDetail2Component } from './formdetails2/item-detail2.component'
import { UsersComponent } from "./users/users.component";

import { SituationComponent } from "./situation/situation.component";
import { SplashScreenComponent } from "./splashscreen/splashscreen.component";
import { CacheDataComponent } from "./cachedata/cachedata.component";

import { ItemService } from "./server/item.service";
import { CacheService } from "./server/cache.service";

import { HintComponent } from "./hint/hints.component";

import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  bootstrap: [AppComponent],
  imports: [NativeScriptModule, NativeScriptFormsModule, AppRoutingModule, HttpClientModule, ReactiveFormsModule],
  declarations: [AppComponent, ItemsComponent, ItemDetailComponent, ItemDetail2Component, HintComponent, SituationComponent, SplashScreenComponent, CacheDataComponent, UsersComponent],
  providers: [ItemService, CacheService],
  schemas: [NO_ERRORS_SCHEMA],
  entryComponents: [HintComponent]
})
export class AppModule {}
